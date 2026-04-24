const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(systemPrompt, userMessage, model) {
  const startTime = Date.now();
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': '5G Network-as-Code Platform',
    },
    body: JSON.stringify({
      model: model || process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const duration = Date.now() - startTime;
  return { content: data.choices[0].message.content, duration };
}

// POST /api/ai/network-optimizer
router.post('/network-optimizer', async (req, res) => {
  try {
    const inputData = req.body.input || req.body.network_data || '';
    const title = req.body.title || 'Network Optimization Analysis';

    const systemPrompt = `You are a 5G network optimization expert. You analyze network slice configurations, bandwidth allocations, and QoS profiles to provide actionable optimization recommendations. Focus on:
- Network slice efficiency and resource utilization
- Bandwidth allocation optimization
- Latency reduction strategies
- Load balancing recommendations
- Cost optimization while maintaining SLA compliance
- Capacity planning suggestions
Provide specific, actionable recommendations with expected performance improvements. Format your response with clear sections using ## headers and bullet points.`;

    const userMessage = typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2);
    const { content: result, duration } = await callOpenRouter(systemPrompt, `Analyze the following 5G network configuration and provide optimization recommendations:\n\n${userMessage}`);

    const dbResult = await pool.query(
      `INSERT INTO ai_analyses (type, title, input_data, result, status, model)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['network-optimizer', title, userMessage, result, 'completed', process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5']
    );

    const row = dbResult.rows[0];
    row.processing_time = duration;
    res.json(row);
  } catch (err) {
    console.error('Network optimizer error:', err);
    try {
      await pool.query(
        `INSERT INTO ai_analyses (type, title, input_data, result, status, model)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['network-optimizer', req.body.title || 'Network Optimization Analysis', String(req.body.input || ''), err.message, 'failed', process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5']
      );
    } catch (dbErr) {
      console.error('Failed to store error analysis:', dbErr);
    }
    res.status(500).json({ error: 'Failed to run network optimization analysis.', details: err.message });
  }
});

// POST /api/ai/traffic-analyzer
router.post('/traffic-analyzer', async (req, res) => {
  try {
    const inputData = req.body.input || req.body.traffic_data || '';
    const title = req.body.title || 'Traffic Analysis';

    const systemPrompt = `You are a 5G network traffic analysis expert. You analyze network traffic patterns, throughput data, and usage metrics to provide deep insights. Focus on:
- Traffic pattern identification (peak hours, trending usage)
- Bandwidth utilization analysis per slice and application
- Anomalous traffic pattern detection
- Quality of Experience (QoE) assessment
- Congestion prediction and prevention strategies
- Application-level traffic classification insights
Provide detailed analysis with data-driven insights and visualizable metrics. Format your response with clear sections using ## headers, statistics, and actionable findings.`;

    const userMessage = typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2);
    const { content: result, duration } = await callOpenRouter(systemPrompt, `Analyze the following 5G network traffic data and provide insights:\n\n${userMessage}`);

    const dbResult = await pool.query(
      `INSERT INTO ai_analyses (type, title, input_data, result, status, model)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['traffic-analyzer', title, userMessage, result, 'completed', process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5']
    );

    const row = dbResult.rows[0];
    row.processing_time = duration;
    res.json(row);
  } catch (err) {
    console.error('Traffic analyzer error:', err);
    try {
      await pool.query(
        `INSERT INTO ai_analyses (type, title, input_data, result, status, model)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['traffic-analyzer', req.body.title || 'Traffic Analysis', String(req.body.input || ''), err.message, 'failed', process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5']
      );
    } catch (dbErr) {
      console.error('Failed to store error analysis:', dbErr);
    }
    res.status(500).json({ error: 'Failed to run traffic analysis.', details: err.message });
  }
});

// POST /api/ai/anomaly-detector
router.post('/anomaly-detector', async (req, res) => {
  try {
    const inputData = req.body.input || req.body.metrics_data || '';
    const title = req.body.title || 'Anomaly Detection Analysis';

    const systemPrompt = `You are a 5G network security and anomaly detection expert. You analyze network metrics, performance data, and event logs to identify potential anomalies, security threats, and performance degradations. Focus on:
- Unusual traffic spikes or drops
- Latency anomalies and jitter irregularities
- Potential DDoS or security threats
- Device behavior anomalies
- SLA violation risks
- Network slice isolation breaches
- Resource exhaustion warnings
Provide severity ratings (critical/high/medium/low) for each finding, root cause analysis, and recommended mitigation steps. Format your response clearly with ## headers and prioritized findings.`;

    const userMessage = typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2);
    const { content: result, duration } = await callOpenRouter(systemPrompt, `Analyze the following 5G network metrics for anomalies and security issues:\n\n${userMessage}`);

    const dbResult = await pool.query(
      `INSERT INTO ai_analyses (type, title, input_data, result, status, model)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['anomaly-detector', title, userMessage, result, 'completed', process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5']
    );

    const row = dbResult.rows[0];
    row.processing_time = duration;
    res.json(row);
  } catch (err) {
    console.error('Anomaly detector error:', err);
    try {
      await pool.query(
        `INSERT INTO ai_analyses (type, title, input_data, result, status, model)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['anomaly-detector', req.body.title || 'Anomaly Detection Analysis', String(req.body.input || ''), err.message, 'failed', process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5']
      );
    } catch (dbErr) {
      console.error('Failed to store error analysis:', dbErr);
    }
    res.status(500).json({ error: 'Failed to run anomaly detection.', details: err.message });
  }
});

// GET /api/ai/analyses - list all analyses (with optional type filter)
router.get('/analyses', async (req, res) => {
  try {
    let query = 'SELECT * FROM ai_analyses';
    const params = [];
    if (req.query.type) {
      query += ' WHERE type = $1';
      params.push(req.query.type);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching AI analyses:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/ai/analyses/:id - get specific analysis
router.get('/analyses/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_analyses WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'AI analysis not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching AI analysis:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/ai/analyses/:id - delete analysis
router.delete('/analyses/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ai_analyses WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'AI analysis not found.' });
    res.json({ message: 'AI analysis deleted successfully.' });
  } catch (err) {
    console.error('Error deleting AI analysis:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
