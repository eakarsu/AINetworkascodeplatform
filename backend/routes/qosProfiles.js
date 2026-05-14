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
    const countResult = await pool.query('SELECT COUNT(*) FROM qos_profiles');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM qos_profiles ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching QoS profiles:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM qos_profiles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'QoS profile not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching QoS profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, priority, max_bandwidth, min_bandwidth, max_latency, jitter, packet_loss, status, description } = req.body;
    const result = await pool.query(
      `INSERT INTO qos_profiles (name, priority, max_bandwidth, min_bandwidth, max_latency, jitter, packet_loss, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, priority, max_bandwidth, min_bandwidth, max_latency, jitter, packet_loss, status || 'active', description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating QoS profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, priority, max_bandwidth, min_bandwidth, max_latency, jitter, packet_loss, status, description } = req.body;
    const result = await pool.query(
      `UPDATE qos_profiles SET name = COALESCE($1, name), priority = COALESCE($2, priority),
       max_bandwidth = COALESCE($3, max_bandwidth), min_bandwidth = COALESCE($4, min_bandwidth),
       max_latency = COALESCE($5, max_latency), jitter = COALESCE($6, jitter),
       packet_loss = COALESCE($7, packet_loss), status = COALESCE($8, status),
       description = COALESCE($9, description) WHERE id = $10 RETURNING *`,
      [name, priority, max_bandwidth, min_bandwidth, max_latency, jitter, packet_loss, status, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'QoS profile not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating QoS profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM qos_profiles WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'QoS profile not found.' });
    res.json({ message: 'QoS profile deleted successfully.' });
  } catch (err) {
    console.error('Error deleting QoS profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
