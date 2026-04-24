const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM latency_profiles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching latency profiles:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM latency_profiles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Latency profile not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching latency profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, target_latency, current_latency, jitter, packet_loss, route, optimization, status, description } = req.body;
    const result = await pool.query(
      `INSERT INTO latency_profiles (name, target_latency, current_latency, jitter, packet_loss, route, optimization, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, target_latency, current_latency, jitter, packet_loss, route, optimization, status || 'active', description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating latency profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, target_latency, current_latency, jitter, packet_loss, route, optimization, status, description } = req.body;
    const result = await pool.query(
      `UPDATE latency_profiles SET name = COALESCE($1, name), target_latency = COALESCE($2, target_latency),
       current_latency = COALESCE($3, current_latency), jitter = COALESCE($4, jitter),
       packet_loss = COALESCE($5, packet_loss), route = COALESCE($6, route),
       optimization = COALESCE($7, optimization), status = COALESCE($8, status),
       description = COALESCE($9, description) WHERE id = $10 RETURNING *`,
      [name, target_latency, current_latency, jitter, packet_loss, route, optimization, status, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Latency profile not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating latency profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM latency_profiles WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Latency profile not found.' });
    res.json({ message: 'Latency profile deleted successfully.' });
  } catch (err) {
    console.error('Error deleting latency profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
