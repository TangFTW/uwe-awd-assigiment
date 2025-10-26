import express from 'express';
import mysql from 'mysql2/promise';

const server = express();
server.use(express.json());

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // adjust if needed
  database: 'hkpo_mobile',
  connectionLimit: 10,
  charset: 'utf8mb4_general_ci'
});

// Helper to normalize HH:MM strings; returns null if invalid
function normHHMM(v) {
  if (v == null) return null;
  const s = String(v).replace('.', ':').trim();
  if (!/^\d{1,2}:\d{2}$/.test(s)) return null;
  const [h, m] = s.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}


server.get('/', async (_req, res) => {
  console.log('Welcome to the HKPO Mobile Post API');
  try {
    const [rows] = await pool.query('SELECT * FROM mobilepost');
    res.json({
      message: 'Hello World',
      count: rows.length,
      data: rows
    });
  } catch (err) {
    console.error('SQL execution error:', err);
    res.status(500).send('Database error');
  }
});

// Shared search handler
async function handleMobilepostSearch(req, res) {
  const { districtEN, dayOfWeekCode, mobileCode, openAt } = req.query;
  if (districtEN) {
    console.log('Get records by district', districtEN);
  } else {
    console.log( 'Search mobilepost', req.query);
  }
  const where = [];
  const params = [];

  if (districtEN) {
    where.push('districtEN = ?');
    params.push(districtEN);
  }
  if (dayOfWeekCode !== undefined) {
    const d = Number(dayOfWeekCode);
    if (!Number.isInteger(d) || d < 1 || d > 7) {
      res.status(400).send('dayOfWeekCode must be 1..7');
      return;
    }
    where.push('dayOfWeekCode = ?');
    params.push(d);
  }
  if (mobileCode) {
    where.push('mobileCode = ?');
    params.push(mobileCode);
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
    SELECT id, mobileCode, nameEN, districtEN, locationEN, addressEN,
           dayOfWeekCode, openHour, closeHour, latitude, longitude
    FROM mobilepost
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY dayOfWeekCode, mobileCode, seq
    LIMIT 500
  `;

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('SQL execution error:', err);
    res.status(500).send('Database error');
  }
}


server.get('/mobilepost/search', handleMobilepostSearch);
server.get('/mobilepost', handleMobilepostSearch);

server.get('/mobilepost/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).send('Invalid ID');
    return;
  }
  try {
    const [rows] = await pool.query('SELECT * FROM mobilepost WHERE id = ?', [id]);
    if (rows.length === 0) res.status(404).send('Not found');
    else res.json(rows[0]);
  } catch (err) {
    console.error('SQL execution error:', err);
    res.status(500).send('Database error');
  }
});


// new record
server.post('/mobilepost', async (req, res) => {
  console.log('POST /mobilepost - creating record', req.body);
  const {
    mobileCode, dayOfWeekCode, seq,
    nameEN, districtEN, locationEN, addressEN,
    openHour, closeHour
  } = req.body || {};

  if (!mobileCode || dayOfWeekCode == null || seq == null) {
    res.status(400).send('Missing required fields: mobileCode, dayOfWeekCode, seq');
    return;
  }

  const sql = `
    INSERT INTO mobilepost (
      mobileCode, dayOfWeekCode, seq,
      nameEN, districtEN, locationEN, addressEN, openHour, closeHour
    ) VALUES (?,?,?,?,?,?,?,?,?)
  `;
  const params = [
    mobileCode,
    Number(dayOfWeekCode),
    Number(seq),
    nameEN ?? null,
    districtEN ?? null,
    locationEN ?? null,
    addressEN ?? null,
    openHour ?? null,
    closeHour ?? null
  ];

  try {
    const [result] = await pool.query(sql, params);
    console.log('POST /mobilepost - inserted id', result.insertId);
    res.json({ message: 'Record inserted', id: result.insertId });
  } catch (err) {
    console.error('Insert error:', err);
    if (String(err.message).includes('Duplicate')) {
      res.status(409).send('Duplicate (mobileCode, dayOfWeekCode, seq)');
    } else {
      res.status(500).send('Insert error');
    }
  }
});

server.put('/mobilepost/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).send('Invalid ID');
    return;
  }

  const allowed = new Set([
    'locationTC','locationSC','addressTC','nameSC','districtSC','addressSC',
    'closeHour','nameTC','districtTC','latitude','openHour',
    'nameEN','districtEN','locationEN','addressEN','longitude'
  ]);

  const sets = [];
  const params = [];

  for (const [k, v] of Object.entries(req.body || {})) {
    if (!allowed.has(k)) continue;
    if (k === 'openHour' || k === 'closeHour') {
      const t = v == null ? null : normHHMM(v);
      if (v != null && !t) {
        res.status(400).send(`Invalid ${k} (use HH:MM)`);
        return;
      }
      sets.push(`${k} = ?`);
      params.push(t);
    } else {
      sets.push(`${k} = ?`);
      params.push(v ?? null);
    }
  }

  if (sets.length === 0) {
    res.status(400).send('No valid fields to update');
    return;
  }

  try {
    const [result] = await pool.query(
      `UPDATE mobilepost SET ${sets.join(', ')} WHERE id = ?`,
      [...params, id]
    );
    if (result.affectedRows === 0) res.status(404).send('Not found');
    else res.json({ message: 'Record updated', id });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).send('Update error');
  }
});

// DELETE
server.delete('/mobilepost/:id', async (req, res) => {
  const id = Number(req.params.id);
  console.log('DELETE /mobilepost/:id - request', { id });
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).send('Invalid ID');
    return;
  }
  try {
    const [result] = await pool.query('DELETE FROM mobilepost WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      console.log('DELETE /mobilepost/:id - not found', { id });
      res.status(404).send('Not found');
    } else {
      console.log('DELETE /mobilepost/:id - deleted', { id });
      res.json({ message: 'Record deleted', id });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).send('Delete error');
  }
});

// Start server
server.listen(3001, () => {
  console.log('Server started.');
});

