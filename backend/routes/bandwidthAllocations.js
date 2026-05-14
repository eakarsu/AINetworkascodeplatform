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
    const countResult = await pool.query('SELECT COUNT(*) FROM bandwidth_allocations');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM bandwidth_allocations ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching bandwidth allocations:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bandwidth_allocations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bandwidth allocation not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching bandwidth allocation:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, allocated_bandwidth, used_bandwidth, utilization, network_slice, priority, status, description } = req.body;
    const result = await pool.query(
      `INSERT INTO bandwidth_allocations (name, allocated_bandwidth, used_bandwidth, utilization, network_slice, priority, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, allocated_bandwidth, used_bandwidth, utilization, network_slice, priority, status || 'active', description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating bandwidth allocation:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, allocated_bandwidth, used_bandwidth, utilization, network_slice, priority, status, description } = req.body;
    const result = await pool.query(
      `UPDATE bandwidth_allocations SET name = COALESCE($1, name), allocated_bandwidth = COALESCE($2, allocated_bandwidth),
       used_bandwidth = COALESCE($3, used_bandwidth), utilization = COALESCE($4, utilization),
       network_slice = COALESCE($5, network_slice), priority = COALESCE($6, priority),
       status = COALESCE($7, status), description = COALESCE($8, description)
       WHERE id = $9 RETURNING *`,
      [name, allocated_bandwidth, used_bandwidth, utilization, network_slice, priority, status, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bandwidth allocation not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating bandwidth allocation:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM bandwidth_allocations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Bandwidth allocation not found.' });
    res.json({ message: 'Bandwidth allocation deleted successfully.' });
  } catch (err) {
    console.error('Error deleting bandwidth allocation:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
