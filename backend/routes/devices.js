const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM connected_devices ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching devices:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM connected_devices WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Device not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching device:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, device_type, imei, ip_address, status, network_slice, location, data_usage, last_seen, description } = req.body;
    const result = await pool.query(
      `INSERT INTO connected_devices (name, device_type, imei, ip_address, status, network_slice, location, data_usage, last_seen, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, device_type, imei, ip_address, status || 'active', network_slice, location, data_usage, last_seen || new Date(), description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating device:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, device_type, imei, ip_address, status, network_slice, location, data_usage, last_seen, description } = req.body;
    const result = await pool.query(
      `UPDATE connected_devices SET name = COALESCE($1, name), device_type = COALESCE($2, device_type),
       imei = COALESCE($3, imei), ip_address = COALESCE($4, ip_address), status = COALESCE($5, status),
       network_slice = COALESCE($6, network_slice), location = COALESCE($7, location),
       data_usage = COALESCE($8, data_usage), last_seen = COALESCE($9, last_seen),
       description = COALESCE($10, description) WHERE id = $11 RETURNING *`,
      [name, device_type, imei, ip_address, status, network_slice, location, data_usage, last_seen, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Device not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating device:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM connected_devices WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Device not found.' });
    res.json({ message: 'Device deleted successfully.' });
  } catch (err) {
    console.error('Error deleting device:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
