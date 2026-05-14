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
    const countResult = await pool.query('SELECT COUNT(*) FROM developer_apps');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM developer_apps ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching developer apps:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM developer_apps WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Developer app not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching developer app:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, developer, app_type, api_calls_today, api_calls_limit, status, network_slice, sdk_version, description } = req.body;
    const result = await pool.query(
      `INSERT INTO developer_apps (name, developer, app_type, api_calls_today, api_calls_limit, status, network_slice, sdk_version, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, developer, app_type, api_calls_today || 0, api_calls_limit || 10000, status || 'active', network_slice, sdk_version, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating developer app:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, developer, app_type, api_calls_today, api_calls_limit, status, network_slice, sdk_version, description } = req.body;
    const result = await pool.query(
      `UPDATE developer_apps SET name = COALESCE($1, name), developer = COALESCE($2, developer),
       app_type = COALESCE($3, app_type), api_calls_today = COALESCE($4, api_calls_today),
       api_calls_limit = COALESCE($5, api_calls_limit), status = COALESCE($6, status),
       network_slice = COALESCE($7, network_slice), sdk_version = COALESCE($8, sdk_version),
       description = COALESCE($9, description) WHERE id = $10 RETURNING *`,
      [name, developer, app_type, api_calls_today, api_calls_limit, status, network_slice, sdk_version, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Developer app not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating developer app:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM developer_apps WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Developer app not found.' });
    res.json({ message: 'Developer app deleted successfully.' });
  } catch (err) {
    console.error('Error deleting developer app:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
