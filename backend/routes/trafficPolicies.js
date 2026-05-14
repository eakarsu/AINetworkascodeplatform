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
    const countResult = await pool.query('SELECT COUNT(*) FROM traffic_policies');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM traffic_policies ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching traffic policies:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM traffic_policies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Traffic policy not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching traffic policy:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, priority, source, destination, action, bandwidth_limit, status, description } = req.body;
    const result = await pool.query(
      `INSERT INTO traffic_policies (name, type, priority, source, destination, action, bandwidth_limit, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, type, priority, source, destination, action, bandwidth_limit, status || 'active', description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating traffic policy:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, type, priority, source, destination, action, bandwidth_limit, status, description } = req.body;
    const result = await pool.query(
      `UPDATE traffic_policies SET name = COALESCE($1, name), type = COALESCE($2, type),
       priority = COALESCE($3, priority), source = COALESCE($4, source),
       destination = COALESCE($5, destination), action = COALESCE($6, action),
       bandwidth_limit = COALESCE($7, bandwidth_limit), status = COALESCE($8, status),
       description = COALESCE($9, description) WHERE id = $10 RETURNING *`,
      [name, type, priority, source, destination, action, bandwidth_limit, status, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Traffic policy not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating traffic policy:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM traffic_policies WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Traffic policy not found.' });
    res.json({ message: 'Traffic policy deleted successfully.' });
  } catch (err) {
    console.error('Error deleting traffic policy:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
