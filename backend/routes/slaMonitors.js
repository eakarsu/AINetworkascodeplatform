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
    const countResult = await pool.query('SELECT COUNT(*) FROM sla_monitors');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM sla_monitors ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching SLA monitors:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sla_monitors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'SLA monitor not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching SLA monitor:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, service, target_uptime, current_uptime, target_latency, current_latency, target_bandwidth, current_bandwidth, status, description } = req.body;
    const result = await pool.query(
      `INSERT INTO sla_monitors (name, service, target_uptime, current_uptime, target_latency, current_latency, target_bandwidth, current_bandwidth, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, service, target_uptime, current_uptime, target_latency, current_latency, target_bandwidth, current_bandwidth, status || 'active', description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating SLA monitor:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, service, target_uptime, current_uptime, target_latency, current_latency, target_bandwidth, current_bandwidth, status, description } = req.body;
    const result = await pool.query(
      `UPDATE sla_monitors SET name = COALESCE($1, name), service = COALESCE($2, service),
       target_uptime = COALESCE($3, target_uptime), current_uptime = COALESCE($4, current_uptime),
       target_latency = COALESCE($5, target_latency), current_latency = COALESCE($6, current_latency),
       target_bandwidth = COALESCE($7, target_bandwidth), current_bandwidth = COALESCE($8, current_bandwidth),
       status = COALESCE($9, status), description = COALESCE($10, description)
       WHERE id = $11 RETURNING *`,
      [name, service, target_uptime, current_uptime, target_latency, current_latency, target_bandwidth, current_bandwidth, status, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'SLA monitor not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating SLA monitor:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sla_monitors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'SLA monitor not found.' });
    res.json({ message: 'SLA monitor deleted successfully.' });
  } catch (err) {
    console.error('Error deleting SLA monitor:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
