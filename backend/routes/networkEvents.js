const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM network_events ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching network events:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM network_events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Network event not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching network event:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { event_type, severity, source, message, details, resolved } = req.body;
    const result = await pool.query(
      `INSERT INTO network_events (event_type, severity, source, message, details, resolved)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [event_type, severity, source, message, details, resolved || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating network event:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { event_type, severity, source, message, details, resolved } = req.body;
    const result = await pool.query(
      `UPDATE network_events SET event_type = COALESCE($1, event_type), severity = COALESCE($2, severity),
       source = COALESCE($3, source), message = COALESCE($4, message),
       details = COALESCE($5, details), resolved = COALESCE($6, resolved)
       WHERE id = $7 RETURNING *`,
      [event_type, severity, source, message, details, resolved, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Network event not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating network event:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM network_events WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Network event not found.' });
    res.json({ message: 'Network event deleted successfully.' });
  } catch (err) {
    console.error('Error deleting network event:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
