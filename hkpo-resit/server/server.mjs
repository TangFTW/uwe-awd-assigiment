import express from 'express'
import mysql from 'mysql2/promise';

const server = express();
server.use(express.json());

// Define reusable error templates
const RESPONSES = {
	MISSING_FIELDS: { success: false, err_code: 400, message: 'Missing required fields.' },
	EMPTY_SEARCH: { success: false, err_code: 400, message: 'Please enter at least one search value.' },
	INVALID_ID: { success: false, err_code: 400, message: 'Invalid ID format.' },
	NO_UPDATE: { success: false, err_code: 400, message: 'No Update Required.' },
	NOT_FOUND: { success: false, err_code: 404, message: 'Record not found matching.' },
	SERVER_ERROR: { success: false, err_code: 500, message: 'Db operation failed.' }
};

// Create a connection pool to database
const pool = mysql.createPool({
host: 'localhost',
user: 'root',
password: '', // adjust if needed
database: 'hkpo_mobile',
connectionLimit: 10,
charset: 'utf8mb4_general_ci'
});

//create post
server.post('/mobilepost', async (req, res) => {

const {
mobileCode, dayOfWeekCode, seq,
nameEN, districtEN, locationEN, addressEN,
// Trad Chinese data
nameTC, districtTC, locationTC, addressTC,
// Simplified Chinese data
nameSC, districtSC, locationSC, addressSC,
// Geographical data like open and close hour, latitude and longitude
openHour, closeHour, latitude, longitude
} = req.body;
// check are coulmns present.
	if (!mobileCode || dayOfWeekCode == null || seq == null || nameEN ==null) {
const missing = [];
if (!mobileCode) missing.push('mobileCode');
if (dayOfWeekCode == null) missing.push('dayOfWeekCode');
if (seq == null) missing.push('seq');
if (nameEN == null) missing.push('nameEN');
	return res.status(400).json({ ...RESPONSES.MISSING_FIELDS, message: `Missing required fields: ${missing.join(', ')}` });
}
// Insert SQL script (? are for prevent SQL injection)
const sql = `INSERT INTO mobilepost (
mobileCode, dayOfWeekCode, seq,
nameEN, districtEN, locationEN, addressEN,
nameTC, districtTC, locationTC, addressTC,
nameSC, districtSC, locationSC, addressSC,
openHour, closeHour, latitude, longitude
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const params = [
mobileCode, dayOfWeekCode, seq ,
nameEN, districtEN || '', locationEN || '', addressEN || '',
nameTC || '', districtTC || '', locationTC || '', addressTC || '',
nameSC || '', districtSC || '', locationSC || '', addressSC || '',
openHour || '00:00' , closeHour || '00:00' , latitude || 0 , longitude || 0];

try {
const [ result ] = await pool.query(sql, params);
console.log('New mobile post created.')
res.status(201).json({ success: true, id: result.insertId });
}
// If err, returns 500 with message.
catch (error) {
console.error("Database error:", error);
	res.status(500).json(RESPONSES.SERVER_ERROR);
}
})

//View Post(get)
server.get('/mobilepost', async (req, res) => {

const {id, districtEN, dayOfWeekCode, mobileCode, nameEN ,addressEN ,openHour, closeHour, seq } = req.query
const where = [];
const params = [];

if (
id === '' || String(id).trim() === '' ||
districtEN === '' || String(districtEN).trim() === '' ||
dayOfWeekCode === '' || String(dayOfWeekCode).trim() === '' ||
mobileCode === '' || String(mobileCode).trim() === '' ||
nameEN === '' || String(nameEN).trim() === '' ||
seq === '' || String(seq).trim() === '' ||
addressEN === '' || String(addressEN).trim() === '' ||
openHour === '' || String(openHour).trim() === '' ||
closeHour === '' || String(closeHour).trim() === ''
) {
	return res.status(400).json(RESPONSES.EMPTY_SEARCH);
}
//check id(please test before adding more)
if (id) {
where.push('id = ?'); // Add the filter rule to our 'where' array
params.push(Number(id)); // Add the actual number of the id to our 'params' array
}
// 2. Check if 'districtEN' was typed into the search
if (districtEN) {
// use sql LIKE in giving data to where so users can type "Sha" to find "Sha Tin"
where.push('districtEN LIKE ?');
params.push(`%${districtEN}%`);
}
if (nameEN) {
where.push('nameEN LIKE ?');
params.push(`%${nameEN}%`);
}

if (seq) {
where.push('seq = ?');
params.push(seq);
}

if (dayOfWeekCode) {
where.push('dayOfWeekCode = ?'); 
params.push(dayOfWeekCode); 
}

if (mobileCode) {
where.push('mobileCode = ?');
params.push(mobileCode);
}
if (addressEN) {
where.push('addressEN LIKE ?');
params.push(`%${addressEN}%`);
}
if (openHour) {
where.push('openHour <= ?');
params.push(openHour);
}
if (closeHour) {
where.push('closeHour >= ?');
params.push(closeHour);
}
let sql = 'SELECT * FROM mobilepost';
if (where.length > 0){

sql += ' WHERE ' + where.join(' AND ');
}

try{
const [ rows ] = await pool.query(sql, params)
	if (rows.length === 0) {
	return res.status(404).json(RESPONSES.NOT_FOUND);
	}

// if data found, send it back.
res.json({ success: true, data: rows });
console.log('Apeened a recored due to a search.')
	}
// when errror found
catch (error) {
	console.error("Update error:", error);
	res.status(500).json(RESPONSES.SERVER_ERROR);
}
}
)


//Update POST (PUT)
server.put('/mobilepost/:id', async (req, res) => {
// you are now requesting url again, so requesting params insead of body(body is for strings.)
const id = req.params.id;
// Gets Id from the URL
const recordId = Number(id);
if (!Number.isInteger(recordId) || recordId <= 0){
return res.status(400).json(RESPONSES.INVALID_ID);
}
const {
mobileCode, dayOfWeekCode, seq,
nameEN, districtEN, locationEN, addressEN,
// Trad Chinese data
nameTC, districtTC, locationTC, addressTC,
// Simplified Chinese data
nameSC, districtSC, locationSC, addressSC,
// Geographical data like open and close hour, latitude and longitude
openHour, closeHour, latitude, longitude} = req.body;

if (Object.keys(req.body).length === 0){
return res.status(400).json(RESPONSES.NO_UPDATE);}
const sets = []
const params = []
// If mobileCode was sent, add it to db update list
if (mobileCode !== undefined) {
sets.push('mobileCode = ?');
params.push(mobileCode);
}
// If dayOfWeekCode was sent, add it to db update list
if (dayOfWeekCode !== undefined) {
sets.push('dayOfWeekCode = ?');
params.push(dayOfWeekCode);

}

if (seq !== undefined) {
sets.push('seq = ?');
params.push(seq);
}

if (nameEN !== undefined) {
sets.push('nameEN = ?');
params.push(nameEN);
}


if (districtEN !== undefined) {
sets.push('districtEN = ?');
params.push(districtEN);
}

if (locationEN !== undefined) {
sets.push('locationEN = ?');
params.push(locationEN);
}

if (addressEN !== undefined) {
sets.push('addressEN = ?');
params.push(addressEN);
}

if (nameTC !== undefined) {
sets.push('nameTC = ?');
params.push(nameTC);
}

if (districtTC !== undefined) {
sets.push('districtTC = ?');
params.push(districtTC);
}

if (locationTC !== undefined) {
sets.push('locationTC = ?');
params.push(locationTC);
}

if (addressTC !== undefined) {
sets.push('addressTC = ?');
params.push(addressTC);
}
// simp chises data.

if (nameSC !== undefined) {
sets.push('nameSC = ?');
params.push(nameSC);
}

if (districtSC !== undefined) {
sets.push('districtSC = ?');
params.push(districtSC);
}

if (locationSC !== undefined) {
sets.push('locationSC = ?');
params.push(locationSC);
}

if (addressSC !== undefined) {
sets.push('addressSC = ?');
params.push(addressSC);
}
// time and geo data
if (openHour !== undefined) {
sets.push('openHour = ?');
params.push(openHour);
}
if (closeHour !== undefined) {
sets.push('closeHour = ?');
params.push(closeHour);
}

if (latitude !== undefined) {
sets.push('latitude = ?');
params.push(latitude);
}

if (longitude !== undefined) {
sets.push('longitude = ?');
params.push(longitude);
}
//update record SQL
const sql = `UPDATE mobilepost SET ${sets.join(', ')} WHERE id = ?`;
params.push(recordId);

try{
const [ result ] = await pool.query(sql, params)
if (result.affectedRows === 0) {
	return res.status(404).json(RESPONSES.NOT_FOUND);
}
console.log(`Record with ID ${recordId} updated.`);
res.json({ success: true, message: 'Record updated successfully' });
}

catch (error) {
console.error("Update error:", error);
	res.status(500).json(RESPONSES.SERVER_ERROR);
}
}
)

//DELETE POST 
server.delete('/mobilepost/:id', async (req, res) => {
// your are now requesting url, so requesting params insead of body(body is for strings.)
const id = req.params.id;
const recordId = Number(id);
if (!Number.isInteger(recordId) || recordId <= 0) {
return res.status(400).json(RESPONSES.INVALID_ID);
}

const sql = 'DELETE FROM mobilepost WHERE ID = ?';

try{
const [ result ] = await pool.query(sql, [recordId])
if (result.affectedRows === 0) {
return res.status(404).json(RESPONSES.NOT_FOUND);
}
console.log(`Record with ID ${recordId} deleted.`);
res.json({ success: true, message: 'Record deleted successfully' });
}

// If err, returns 500 with message.
catch (error) {
console.error("Delete error:", error);
	res.status(500).json(RESPONSES.SERVER_ERROR);
}
})

// Start server
server.listen(3001, () => {
console.log('Server started at 3001, welcome to the HKPO Mobile Post API');
});

//health status.
server.get('/health', (req, res) => {

res.status(200).json({ status: 'ok', message: 'Server is healthy' });
console.log('Health check performed.');
});