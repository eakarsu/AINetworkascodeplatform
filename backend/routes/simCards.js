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
    const countResult = await pool.query('SELECT COUNT(*) FROM sim_cards');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM sim_cards ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching SIM cards:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sim_cards WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'SIM card not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching SIM card:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { iccid, imsi, msisdn, status, network_slice, device, data_plan, data_used, apn, description } = req.body;
    const result = await pool.query(
      `INSERT INTO sim_cards (iccid, imsi, msisdn, status, network_slice, device, data_plan, data_used, apn, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [iccid, imsi, msisdn, status || 'active', network_slice, device, data_plan, data_used, apn, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating SIM card:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { iccid, imsi, msisdn, status, network_slice, device, data_plan, data_used, apn, description } = req.body;
    const result = await pool.query(
      `UPDATE sim_cards SET iccid = COALESCE($1, iccid), imsi = COALESCE($2, imsi),
       msisdn = COALESCE($3, msisdn), status = COALESCE($4, status),
       network_slice = COALESCE($5, network_slice), device = COALESCE($6, device),
       data_plan = COALESCE($7, data_plan), data_used = COALESCE($8, data_used),
       apn = COALESCE($9, apn), description = COALESCE($10, description)
       WHERE id = $11 RETURNING *`,
      [iccid, imsi, msisdn, status, network_slice, device, data_plan, data_used, apn, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'SIM card not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating SIM card:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sim_cards WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'SIM card not found.' });
    res.json({ message: 'SIM card deleted successfully.' });
  } catch (err) {
    console.error('Error deleting SIM card:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
