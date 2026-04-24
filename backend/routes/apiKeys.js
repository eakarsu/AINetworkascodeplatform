const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM api_keys ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching API keys:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM api_keys WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'API key not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching API key:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, key_prefix, developer, permissions, rate_limit, calls_today, status, expires_at } = req.body;
    const result = await pool.query(
      `INSERT INTO api_keys (name, key_prefix, developer, permissions, rate_limit, calls_today, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, key_prefix, developer, permissions, rate_limit || 1000, calls_today || 0, status || 'active', expires_at]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating API key:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, key_prefix, developer, permissions, rate_limit, calls_today, status, expires_at } = req.body;
    const result = await pool.query(
      `UPDATE api_keys SET name = COALESCE($1, name), key_prefix = COALESCE($2, key_prefix),
       developer = COALESCE($3, developer), permissions = COALESCE($4, permissions),
       rate_limit = COALESCE($5, rate_limit), calls_today = COALESCE($6, calls_today),
       status = COALESCE($7, status), expires_at = COALESCE($8, expires_at)
       WHERE id = $9 RETURNING *`,
      [name, key_prefix, developer, permissions, rate_limit, calls_today, status, expires_at, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'API key not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating API key:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM api_keys WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'API key not found.' });
    res.json({ message: 'API key deleted successfully.' });
  } catch (err) {
    console.error('Error deleting API key:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
