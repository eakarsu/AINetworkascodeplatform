const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');

router.use(auth);

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function callAnomalyAI(ruleData, triggeredRows) {
  const userMessage = `Anomaly rule triggered:\nRule: metric="${ruleData.metric}", operator="${ruleData.operator}", threshold=${ruleData.threshold}\n\nTriggered data:\n${JSON.stringify(triggeredRows, null, 2)}\n\nProvide a concise root-cause analysis (2-4 sentences).`;
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': '5G Network-as-Code Platform',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'You are a 5G network anomaly analysis expert. Provide concise root-cause analysis.' },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 500,
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

// Ensure anomaly_rules table exists at startup
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS anomaly_rules (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      metric VARCHAR(255) NOT NULL,
      operator VARCHAR(20) NOT NULL CHECK (operator IN ('>', '<', '>=', '<=', '=')),
      threshold NUMERIC NOT NULL,
      action VARCHAR(255) NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
ensureTable().catch(err => console.error('Failed to ensure anomaly_rules table:', err));

// GET /api/anomaly-rules — list all rules (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM anomaly_rules');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM anomaly_rules ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Error fetching anomaly rules:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/anomaly-rules/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM anomaly_rules WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Anomaly rule not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching anomaly rule:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/anomaly-rules — create rule
router.post('/', async (req, res) => {
  try {
    const { name, metric, operator, threshold, action, enabled } = req.body;
    if (!name || !metric || !operator || threshold === undefined || !action) {
      return res.status(400).json({ error: 'name, metric, operator, threshold, and action are required.' });
    }
    if (!['>', '<', '>=', '<=', '='].includes(operator)) {
      return res.status(400).json({ error: 'operator must be one of: >, <, >=, <=, =' });
    }
    const result = await pool.query(
      `INSERT INTO anomaly_rules (name, metric, operator, threshold, action, enabled)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, metric, operator, threshold, action, enabled !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating anomaly rule:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/anomaly-rules/:id — update rule
router.put('/:id', async (req, res) => {
  try {
    const { name, metric, operator, threshold, action, enabled } = req.body;
    const result = await pool.query(
      `UPDATE anomaly_rules SET
         name = COALESCE($1, name),
         metric = COALESCE($2, metric),
         operator = COALESCE($3, operator),
         threshold = COALESCE($4, threshold),
         action = COALESCE($5, action),
         enabled = COALESCE($6, enabled),
         updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [name, metric, operator, threshold, action, enabled, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Anomaly rule not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating anomaly rule:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/anomaly-rules/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM anomaly_rules WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Anomaly rule not found.' });
    res.json({ message: 'Anomaly rule deleted successfully.' });
  } catch (err) {
    console.error('Error deleting anomaly rule:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/anomaly-rules/:id/evaluate — evaluate rule against recent usage_analytics
router.post('/:id/evaluate', async (req, res) => {
  try {
    const ruleResult = await pool.query('SELECT * FROM anomaly_rules WHERE id = $1', [req.params.id]);
    if (ruleResult.rows.length === 0) return res.status(404).json({ error: 'Anomaly rule not found.' });
    const rule = ruleResult.rows[0];

    // Fetch recent usage_analytics rows for this metric
    const analyticsResult = await pool.query(
      `SELECT * FROM usage_analytics
       WHERE metric_name = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [rule.metric]
    );
    const rows = analyticsResult.rows;

    // Evaluate threshold condition
    const operatorFn = {
      '>':  (a, b) => a > b,
      '<':  (a, b) => a < b,
      '>=': (a, b) => a >= b,
      '<=': (a, b) => a <= b,
      '=':  (a, b) => a === b,
    }[rule.operator];

    const triggeredRows = rows.filter(r => operatorFn && operatorFn(parseFloat(r.value), parseFloat(rule.threshold)));

    if (triggeredRows.length === 0) {
      return res.json({
        ruleId: rule.id,
        triggered: false,
        message: 'Rule evaluated — no violations found.',
        checkedRows: rows.length,
      });
    }

    // Get AI root-cause analysis
    let aiRootCause = null;
    try {
      aiRootCause = await callAnomalyAI(rule, triggeredRows.slice(0, 10));
    } catch (aiErr) {
      console.error('AI root-cause error:', aiErr.message);
      aiRootCause = 'AI analysis unavailable.';
    }

    // Create a network_events row for the trigger
    const eventResult = await pool.query(
      `INSERT INTO network_events (type, severity, title, description, source, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        'anomaly-rule-trigger',
        'high',
        `Anomaly rule triggered: ${rule.name}`,
        `Rule [${rule.metric} ${rule.operator} ${rule.threshold}] triggered on ${triggeredRows.length} data point(s). AI root-cause: ${aiRootCause}`,
        `anomaly-rule:${rule.id}`,
        'active',
      ]
    );

    res.json({
      ruleId: rule.id,
      triggered: true,
      triggeredCount: triggeredRows.length,
      checkedRows: rows.length,
      aiRootCause,
      event: eventResult.rows[0],
      triggeredSamples: triggeredRows.slice(0, 5),
    });
  } catch (err) {
    console.error('Error evaluating anomaly rule:', err);
    res.status(500).json({ error: 'Failed to evaluate anomaly rule.', details: err.message });
  }
});

module.exports = router;
