const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM edge_locations');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM edge_locations ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching edge locations:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM edge_locations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Edge location not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching edge location:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, region, city, status, capacity, current_load, latency, ip_address, description } = req.body;
    const result = await pool.query(
      `INSERT INTO edge_locations (name, region, city, status, capacity, current_load, latency, ip_address, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, region, city, status || 'active', capacity, current_load || 0, latency, ip_address, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating edge location:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, region, city, status, capacity, current_load, latency, ip_address, description } = req.body;
    const result = await pool.query(
      `UPDATE edge_locations SET name = COALESCE($1, name), region = COALESCE($2, region),
       city = COALESCE($3, city), status = COALESCE($4, status), capacity = COALESCE($5, capacity),
       current_load = COALESCE($6, current_load), latency = COALESCE($7, latency),
       ip_address = COALESCE($8, ip_address), description = COALESCE($9, description)
       WHERE id = $10 RETURNING *`,
      [name, region, city, status, capacity, current_load, latency, ip_address, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Edge location not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating edge location:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM edge_locations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Edge location not found.' });
    res.json({ message: 'Edge location deleted successfully.' });
  } catch (err) {
    console.error('Error deleting edge location:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
