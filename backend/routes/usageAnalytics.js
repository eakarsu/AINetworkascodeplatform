const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usage_analytics ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching usage analytics:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usage_analytics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usage analytics record not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching usage analytics:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { metric_name, category, value, unit, period, trend, change_percent, details } = req.body;
    const result = await pool.query(
      `INSERT INTO usage_analytics (metric_name, category, value, unit, period, trend, change_percent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [metric_name, category, value, unit, period, trend, change_percent, details]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating usage analytics:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { metric_name, category, value, unit, period, trend, change_percent, details } = req.body;
    const result = await pool.query(
      `UPDATE usage_analytics SET metric_name = COALESCE($1, metric_name), category = COALESCE($2, category),
       value = COALESCE($3, value), unit = COALESCE($4, unit), period = COALESCE($5, period),
       trend = COALESCE($6, trend), change_percent = COALESCE($7, change_percent),
       details = COALESCE($8, details) WHERE id = $9 RETURNING *`,
      [metric_name, category, value, unit, period, trend, change_percent, details, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usage analytics record not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating usage analytics:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM usage_analytics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usage analytics record not found.' });
    res.json({ message: 'Usage analytics record deleted successfully.' });
  } catch (err) {
    console.error('Error deleting usage analytics:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
