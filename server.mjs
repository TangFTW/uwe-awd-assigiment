import express from 'express';
import mysql from 'mysql2/promise';

const server = express();
server.use(express.json());

// Create a connection pool to database
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // adjust if needed
  database: 'hkpo_mobile',
  connectionLimit: 10,
  charset: 'utf8mb4_general_ci'
});

const ERROR_CODES = {
  // Validation Errors (01xx)
  INVALID_ID: { code: '0100', message: 'Invalid ID format' },
  INVALID_DAY_OF_WEEK: { code: '0101', message: 'dayOfWeekCode must be between 1 and 7' },
  INVALID_TIME_FORMAT: { code: '0102', message: 'Invalid time format (use HH:MM)' },
  INVALID_FIELD: { code: '0103', message: 'Invalid or disallowed field' },
  INVALID_DATA: { code: '0104', message: 'Invalid data format' },
  
  // Missing/Required Field Errors (02xx)
  MISSING_REQUIRED_FIELDS: { code: '0200', message: 'Missing required fields' },
  NO_FIELDS_TO_UPDATE: { code: '0201', message: 'No valid fields provided for update' },
  
  // Search/Query Errors (03xx)
  NOT_FOUND: { code: '0300', message: 'Record not found' },
  NO_RESULTS: { code: '0301', message: 'No results found for search criteria' },
  WRONG_CRITERIA: { code: '0302', message: 'Wrong criteria, please check your input' },
  
  // Server/Database Errors (05xx)
  DATABASE_ERROR: { code: '0500', message: 'Database operation failed' },
  SQL_EXECUTION_ERROR: { code: '0501', message: 'SQL execution error' },
  DUPLICATE_ENTRY: { code: '0502', message: 'Duplicate entry detected' },
  INSERT_ERROR: { code: '0503', message: 'Insert operation failed' },
  UPDATE_ERROR: { code: '0504', message: 'Update operation failed' },
  DELETE_ERROR: { code: '0505', message: 'Delete operation failed' }
};

// Helper function to create error response
function createErrorResponse(errorCode, customMessage = null) {
  return {
    success: false,
    errcode: errorCode.code,
    errmsg: customMessage || errorCode.message
  };
}

// Helper to normalize HH:MM strings; returns null if invalid
function normHHMM(v) {
  if (v == null) return null;
  const s = String(v).replace('.', ':').trim();
  if (!/^\d{1,2}:\d{2}$/.test(s)) return null;
  const [h, m] = s.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Helper to check if a value is a non-empty string
function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// Shared search handler
async function handleMobilepostSearch(req, res) {
  console.log('GET /mobilepost/search - Processing query:', req.query);
  const { id, districtEN, dayOfWeekCode, mobileCode, openAt, addressEN, locationEN, addressTC, addressSC, addressZH } = req.query;
  
  // Validate that if string params are provided, they must not be empty
  const stringParams = { districtEN, mobileCode, addressEN, locationEN, addressTC, addressSC, addressZH };
  for (const [key, value] of Object.entries(stringParams)) {
    if (value !== undefined && !isNonEmptyString(value)) {
      const errorResponse = createErrorResponse(
        ERROR_CODES.WRONG_CRITERIA, 
        `${key} cannot be empty. Please provide a valid value.`
      );
      return res.status(400).json(errorResponse);
    }
  }
  
  const where = [];
  const params = [];

  // Search by ID
  if (id !== undefined) {
    const recordId = Number(id);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      const errorResponse = createErrorResponse(ERROR_CODES.INVALID_ID);
      return res.status(400).json(errorResponse);
    }
    where.push('id = ?');
    params.push(recordId);
  }
  
  if (isNonEmptyString(districtEN)) {
    where.push('districtEN = ?');
    params.push(districtEN);
  }
  if (dayOfWeekCode !== undefined) {
    const d = Number(dayOfWeekCode);
    if (!Number.isInteger(d) || d < 1 || d > 7) {
      const errorResponse = createErrorResponse(ERROR_CODES.INVALID_DAY_OF_WEEK);
      return res.status(400).json(errorResponse);
    }
    where.push('dayOfWeekCode = ?');
    params.push(d);
  }
  if (isNonEmptyString(mobileCode)) {
    where.push('mobileCode = ?');
    params.push(mobileCode);
  }
  // English address/location substring filters
  if (isNonEmptyString(addressEN)) {
    where.push('addressEN LIKE ?');
    params.push(`%${addressEN}%`);
  }
  if (isNonEmptyString(locationEN)) {
    where.push('locationEN LIKE ?');
    params.push(`%${locationEN}%`);
  }
  // Chinese TC/SC address substring filters
  if (isNonEmptyString(addressTC)) {
    where.push('addressTC LIKE ?');
    params.push(`%${addressTC}%`);
  }
  if (isNonEmptyString(addressSC)) {
    where.push('addressSC LIKE ?');
    params.push(`%${addressSC}%`);
  }
  // addressZH matches either TC or SC
  if (isNonEmptyString(addressZH)) {
    where.push('(addressTC LIKE ? OR addressSC LIKE ?)');
    params.push(`%${addressZH}%`, `%${addressZH}%`);
  }
  if (openAt) {
    const hhmm = normHHMM(openAt);
    if (hhmm) {
      where.push('openHour <= ?');
      params.push(hhmm);
      where.push('closeHour > ?');
      params.push(hhmm);
    }
  }

  const sql = `
    SELECT id, mobileCode, seq, nameEN, nameTC, nameSC,
           districtEN, districtTC, districtSC,
           locationEN, locationTC, locationSC,
           addressEN, addressTC, addressSC,
           dayOfWeekCode, openHour, closeHour, latitude, longitude
    FROM mobilepost
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY dayOfWeekCode, mobileCode, seq
    LIMIT 500
  `;

  try {
    const [rows] = await pool.query(sql, params);
    if (rows.length === 0) {
      const errorResponse = createErrorResponse(ERROR_CODES.NO_RESULTS, 'No results found, please check your input criteria');
      return res.status(404).json(errorResponse);
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Search error: ' + err.message + ' (Code: ' + err.code + ')');
    const errorResponse = createErrorResponse(ERROR_CODES.SQL_EXECUTION_ERROR, 'SQL execution failed');
    res.status(500).json(errorResponse);
  }
}


server.get('/mobilepost/search', handleMobilepostSearch);
server.get('/mobilepost', handleMobilepostSearch);

server.get('/mobilepost/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    const errorResponse = createErrorResponse(ERROR_CODES.INVALID_ID);
    return res.status(400).json(errorResponse);
  }
  try {
    const [rows] = await pool.query('SELECT * FROM mobilepost WHERE id = ?', [id]);
    if (rows.length === 0) {
      const errorResponse = createErrorResponse(ERROR_CODES.NOT_FOUND, `Record with ID ${id} not found`);
      return res.status(404).json(errorResponse);
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Get ID error: ' + err.message + ' (Code: ' + err.code + ')');
    const errorResponse = createErrorResponse(ERROR_CODES.SQL_EXECUTION_ERROR, 'SQL execution failed');
    res.status(500).json(errorResponse);
  }
});


// new record
server.post('/mobilepost', async (req, res) => {
  console.log('POST /mobilepost - creating record', req.body);
  const {
    mobileCode, dayOfWeekCode, seq,
    nameEN, nameTC, nameSC,
    districtEN, districtTC, districtSC,
    locationEN, locationTC, locationSC,
    addressEN, addressTC, addressSC,
    openHour, closeHour,
    latitude, longitude
  } = req.body || {};

  if (!mobileCode || dayOfWeekCode == null || seq == null) {
    const errorResponse = createErrorResponse(
      ERROR_CODES.MISSING_REQUIRED_FIELDS, 
      'Missing required fields: mobileCode, dayOfWeekCode, seq'
    );
    return res.status(400).json(errorResponse);
  }

  const sql = `
    INSERT INTO mobilepost (
      mobileCode, dayOfWeekCode, seq,
      nameEN, nameTC, nameSC,
      districtEN, districtTC, districtSC,
      locationEN, locationTC, locationSC,
      addressEN, addressTC, addressSC,
      openHour, closeHour, latitude, longitude
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;
  const params = [
    mobileCode,
    Number(dayOfWeekCode),
    Number(seq),
    nameEN || '',
    nameTC || '',
    nameSC || '',
    districtEN || '',
    districtTC || '',
    districtSC || '',
    locationEN || '',
    locationTC || '',
    locationSC || '',
    addressEN || '',
    addressTC || '',
    addressSC || '',
    openHour || '00:00',
    closeHour || '00:00',
    latitude || 0,
    longitude || 0
  ];

  try {
    const [result] = await pool.query(sql, params);
    if (!result.insertId) {
      console.error('POST /mobilepost - insert failed, no insertId returned');
      const errorResponse = createErrorResponse(
        ERROR_CODES.INSERT_ERROR, 
        'Database operation failed'
      );
      return res.status(500).json(errorResponse);
    }
    console.log('POST /mobilepost - inserted id', result.insertId);
    res.status(201).json({ 
      success: true,
      message: 'Record created successfully', 
      id: result.insertId 
    });
  } catch (err) {
    console.error('Insert error: ' + err.message + ' (Code: ' + err.code + ')');
    if (String(err.message).includes('Duplicate') || err.code === 'ER_DUP_ENTRY') {
      const errorResponse = createErrorResponse(
        ERROR_CODES.DUPLICATE_ENTRY, 
        `Failed to create record. A record with mobileCode "${mobileCode}", dayOfWeekCode ${dayOfWeekCode}, and seq ${seq} already exists.`
      );
      return res.status(409).json(errorResponse);
    } else if (err.code === 'ER_BAD_NULL_ERROR' || err.code === 'ER_NO_DEFAULT_FOR_FIELD') {
      const errorResponse = createErrorResponse(
        ERROR_CODES.MISSING_REQUIRED_FIELDS, 
        `Failed to create record. Missing required fields: ${err.message}`
      );
      return res.status(400).json(errorResponse);
    } else if (err.code === 'ER_DATA_TOO_LONG' || err.code === 'ER_TRUNCATED_WRONG_VALUE') {
      const errorResponse = createErrorResponse(
        ERROR_CODES.INVALID_DATA, 
        `Failed to create record. Invalid data format: ${err.message}`
      );
      return res.status(400).json(errorResponse);
    } else {
      const errorResponse = createErrorResponse(
        ERROR_CODES.INSERT_ERROR, 
        'Database operation failed'
      );
      return res.status(500).json(errorResponse);
    }
  }
});

server.put('/mobilepost/:id', async (req, res) => {
  const id = Number(req.params.id);
  console.log('PUT /mobilepost/:id - updating record', { id, updates: req.body });
  
  if (!Number.isInteger(id) || id <= 0) {
    const errorResponse = createErrorResponse(ERROR_CODES.INVALID_ID);
    return res.status(400).json(errorResponse);
  }

  const allowed = new Set([
    'locationTC','locationSC','addressTC','nameSC','districtSC','addressSC',
    'closeHour','nameTC','districtTC','latitude','openHour',
    'nameEN','districtEN','locationEN','addressEN','longitude'
  ]);

  const sets = [];
  const params = [];
  const updatedFields = [];

  for (const [k, v] of Object.entries(req.body || {})) {
    if (!allowed.has(k)) continue;
    if (k === 'openHour' || k === 'closeHour') {
      const t = v == null ? null : normHHMM(v);
      if (v != null && !t) {
        const errorResponse = createErrorResponse(
          ERROR_CODES.INVALID_TIME_FORMAT, 
          `Invalid ${k} (use HH:MM)`
        );
        return res.status(400).json(errorResponse);
      }
      sets.push(`${k} = ?`);
      params.push(t);
      updatedFields.push({ field: k, value: t });
    } else {
      sets.push(`${k} = ?`);
      params.push(v ?? null);
      updatedFields.push({ field: k, value: v ?? null });
    }
  }

  if (sets.length === 0) {
    const errorResponse = createErrorResponse(ERROR_CODES.NO_FIELDS_TO_UPDATE);
    return res.status(400).json(errorResponse);
  }

  try {
    const [result] = await pool.query(
      `UPDATE mobilepost SET ${sets.join(', ')} WHERE id = ?`,
      [...params, id]
    );
    if (result.affectedRows === 0) {
      const errorResponse = createErrorResponse(
        ERROR_CODES.NOT_FOUND, 
        `Failed to update record. Record with ID ${id} not found.`
      );
      return res.status(404).json(errorResponse);
    } else if (result.changedRows === 0) {
      console.log('PUT /mobilepost/:id - no changes detected', { id });
      res.json({ 
        success: true, 
        message: 'No changes detected. The record already has these values.', 
        id 
      });
    } else {
      console.log('PUT /mobilepost/:id - updated successfully', { id, updatedFields });
      res.json({ 
        success: true, 
        message: 'Record updated successfully', 
        id,
        updatedFields: updatedFields.map(f => f.field)
      });
    }
  } catch (err) {
    console.error('Update error: ' + err.message + ' (Code: ' + err.code + ')');
    if (err.code === 'ER_DATA_TOO_LONG' || err.code === 'ER_TRUNCATED_WRONG_VALUE') {
      const errorResponse = createErrorResponse(
        ERROR_CODES.INVALID_DATA, 
        `Failed to update record. Invalid data format: ${err.message}`
      );
      return res.status(400).json(errorResponse);
    } else if (err.code === 'ER_BAD_NULL_ERROR') {
      const errorResponse = createErrorResponse(
        ERROR_CODES.INVALID_DATA, 
        `Failed to update record. Cannot set required field to null: ${err.message}`
      );
      return res.status(400).json(errorResponse);
    } else {
      const errorResponse = createErrorResponse(
        ERROR_CODES.UPDATE_ERROR, 
        'Database operation failed'
      );
      return res.status(500).json(errorResponse);
    }
  }
});

// DELETE
server.delete('/mobilepost/:id', async (req, res) => {
  const id = Number(req.params.id);
  console.log('DELETE /mobilepost/:id - request', { id });
  if (!Number.isInteger(id) || id <= 0) {
    const errorResponse = createErrorResponse(ERROR_CODES.INVALID_ID);
    return res.status(400).json(errorResponse);
  }
  try {
    const [result] = await pool.query('DELETE FROM mobilepost WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      const errorResponse = createErrorResponse(
        ERROR_CODES.NOT_FOUND, 
        `Failed to delete record. Record with ID ${id} not found.`
      );
      return res.status(404).json(errorResponse);
    } else {
      console.log('DELETE /mobilepost/:id - deleted successfully', { id });
      res.json({ 
        success: true, 
        message: 'Record deleted successfully', 
        id 
      });
    }
  } catch (err) {
    console.error('Delete error: ' + err.message + ' (Code: ' + err.code + ')');
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      const errorResponse = createErrorResponse(
        ERROR_CODES.DELETE_ERROR, 
        `Failed to delete record. Record with ID ${id} is referenced by other records and cannot be deleted.`
      );
      return res.status(409).json(errorResponse);
    } else {
      const errorResponse = createErrorResponse(
        ERROR_CODES.DELETE_ERROR, 
        'Database operation failed'
      );
      return res.status(500).json(errorResponse);
    }
  }
});

// Start server
server.listen(3001, () => {
  console.log('Server started at 3001, welcome to the HKPO Mobile Post API');
});
