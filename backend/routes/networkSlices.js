const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// GET / - list all (paginated)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM network_slices');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM network_slices ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching network slices:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /:id - get one
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM network_slices WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Network slice not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching network slice:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST / - create
router.post('/', async (req, res) => {
  try {
    const { name, type, status, max_bandwidth, latency, connected_devices, description } = req.body;
    const result = await pool.query(
      `INSERT INTO network_slices (name, type, status, max_bandwidth, latency, connected_devices, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, type, status || 'active', max_bandwidth, latency, connected_devices || 0, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating network slice:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /:id - update
router.put('/:id', async (req, res) => {
  try {
    const { name, type, status, max_bandwidth, latency, connected_devices, description } = req.body;
    const result = await pool.query(
      `UPDATE network_slices SET name = COALESCE($1, name), type = COALESCE($2, type), status = COALESCE($3, status),
       max_bandwidth = COALESCE($4, max_bandwidth), latency = COALESCE($5, latency),
       connected_devices = COALESCE($6, connected_devices), description = COALESCE($7, description),
       updated_at = NOW() WHERE id = $8 RETURNING *`,
      [name, type, status, max_bandwidth, latency, connected_devices, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Network slice not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating network slice:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM network_slices WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Network slice not found.' });
    res.json({ message: 'Network slice deleted successfully.' });
  } catch (err) {
    console.error('Error deleting network slice:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
