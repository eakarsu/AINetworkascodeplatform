const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

router.use(auth);
router.use(aiRateLimiter);

const OPENROUTER_URL = `${String(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '')}/chat/completions`;
const AI_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const MAX_PROMPT_LENGTH = 3000;

async function callOpenRouter(systemPrompt, userMessage, model) {
  // Cap prompt length
  const safeMesage = userMessage.length > MAX_PROMPT_LENGTH
    ? userMessage.slice(0, MAX_PROMPT_LENGTH) + '\n...[truncated]'
    : userMessage;

  const startTime = Date.now();
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
      'X-Title': '5G Network-as-Code Platform',
    },
    body: JSON.stringify({
      model: model || AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: safeMesage },
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

    const systemPrompt = `You are a 5G network optimization expert. You analyze network slice configurations, bandwidth allocations, and QoS profiles to provide actionable optimization recommendations.

IMPORTANT: You MUST respond with valid JSON in this exact structure (no markdown, no extra text):
{
  "summary": "Brief overall summary",
  "suggestions": [
    {
      "profileId": "qos-profile-uuid-or-name",
      "newBandwidth": 100,
      "newLatency": 5,
      "reason": "Explanation of why this change is recommended"
    }
  ],
  "sections": [
    {
      "title": "Section Title",
      "type": "success|warning|info|danger",
      "items": ["bullet point 1", "bullet point 2"]
    }
  ]
}`;

    const userMessage = typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2);
    const { content: rawResult, duration } = await callOpenRouter(
      systemPrompt,
      `Analyze the following 5G network configuration and provide optimization recommendations:\n\n${userMessage}`
    );

    // Parse structured JSON from AI response
    let structuredResult = null;
    let displayResult = rawResult;
    try {
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredResult = JSON.parse(jsonMatch[0]);
        displayResult = structuredResult.sections
          ? structuredResult.sections.map(s => `## ${s.title}\n${(s.items || []).join('\n')}`).join('\n\n')
          : rawResult;
      }
    } catch (parseErr) {
      // Fallback: keep raw text
    }

    const metadata = structuredResult ? JSON.stringify({ structured: structuredResult }) : null;

    const dbResult = await pool.query(
      `INSERT INTO ai_analyses (type, title, input_data, result, status, model, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      ['network-optimizer', title, userMessage, displayResult, 'completed', AI_MODEL, metadata]
    );

    const row = dbResult.rows[0];
    row.processing_time = duration;
    if (structuredResult) row.structured = structuredResult;
    res.json(row);
  } catch (err) {
    console.error('Network optimizer error:', err);
    try {
      await pool.query(
        `INSERT INTO ai_analyses (type, title, input_data, result, status, model)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['network-optimizer', req.body.title || 'Network Optimization Analysis', String(req.body.input || ''), err.message, 'failed', AI_MODEL]
      );
    } catch (dbErr) {
      console.error('Failed to store error analysis:', dbErr);
    }
    res.status(500).json({ error: 'Failed to run network optimization analysis.', details: err.message });
  }
});

// POST /api/ai/apply-optimization/:analysisId — apply suggested slice/QoS changes
router.post('/apply-optimization/:analysisId', async (req, res) => {
  try {
    const analysisResult = await pool.query('SELECT * FROM ai_analyses WHERE id = $1', [req.params.analysisId]);
    if (analysisResult.rows.length === 0) return res.status(404).json({ error: 'AI analysis not found.' });
    const analysis = analysisResult.rows[0];
    if (analysis.type !== 'network-optimizer') {
      return res.status(400).json({ error: 'Only network-optimizer analyses can be applied.' });
    }

    let structured = null;
    try {
      const meta = typeof analysis.metadata === 'string' ? JSON.parse(analysis.metadata) : analysis.metadata;
      structured = meta && meta.structured ? meta.structured : null;
    } catch (e) { /* no structured data */ }

    if (!structured || !structured.suggestions || structured.suggestions.length === 0) {
      return res.status(422).json({ error: 'No structured optimization suggestions found in this analysis.' });
    }

    const applied = [];
    const diffSnapshot = { appliedAt: new Date().toISOString(), changes: [] };

    for (const suggestion of structured.suggestions) {
      const { profileId, newBandwidth, newLatency, reason } = suggestion;
      if (!profileId) continue;

      // Try matching by id or name in qos_profiles
      const profileRes = await pool.query(
        'SELECT * FROM qos_profiles WHERE id::text = $1 OR name = $1',
        [String(profileId)]
      );
      if (profileRes.rows.length === 0) {
        applied.push({ profileId, status: 'not_found' });
        continue;
      }
      const profile = profileRes.rows[0];

      const before = { maxBandwidth: profile.max_bandwidth, maxLatency: profile.max_latency };

      await pool.query(
        `UPDATE qos_profiles SET
           max_bandwidth = COALESCE($1, max_bandwidth),
           max_latency = COALESCE($2, max_latency),
           updated_at = NOW()
         WHERE id = $3`,
        [newBandwidth || null, newLatency || null, profile.id]
      );

      const after = { maxBandwidth: newBandwidth || profile.max_bandwidth, maxLatency: newLatency || profile.max_latency };
      diffSnapshot.changes.push({ profileId: profile.id, profileName: profile.name, before, after, reason });
      applied.push({ profileId: profile.id, profileName: profile.name, status: 'applied', before, after });
    }

    // Also try applying slice changes if referenced
    if (structured.sliceChanges) {
      for (const change of structured.sliceChanges) {
        if (!change.sliceId) continue;
        const sliceRes = await pool.query(
          'SELECT * FROM network_slices WHERE id::text = $1 OR name = $1',
          [String(change.sliceId)]
        );
        if (sliceRes.rows.length === 0) continue;
        const slice = sliceRes.rows[0];
        const before = { maxBandwidth: slice.max_bandwidth, latency: slice.latency };
        await pool.query(
          `UPDATE network_slices SET
             max_bandwidth = COALESCE($1, max_bandwidth),
             latency = COALESCE($2, latency),
             updated_at = NOW()
           WHERE id = $3`,
          [change.newBandwidth || null, change.newLatency || null, slice.id]
        );
        const after = { maxBandwidth: change.newBandwidth || slice.max_bandwidth, latency: change.newLatency || slice.latency };
        diffSnapshot.changes.push({ sliceId: slice.id, sliceName: slice.name, before, after });
      }
    }

    // Record diff in analysis metadata
    const existingMeta = (() => {
      try { return typeof analysis.metadata === 'string' ? JSON.parse(analysis.metadata) : (analysis.metadata || {}); } catch { return {}; }
    })();
    existingMeta.diffSnapshot = diffSnapshot;
    existingMeta.status = 'applied';

    await pool.query(
      'UPDATE ai_analyses SET metadata = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(existingMeta), analysis.id]
    );

    res.json({ message: 'Optimization applied successfully.', applied, diffSnapshot });
  } catch (err) {
    console.error('Apply optimization error:', err);
    res.status(500).json({ error: 'Failed to apply optimization.', details: err.message });
  }
});

// POST /api/ai/rollback-optimization/:analysisId — revert applied changes
router.post('/rollback-optimization/:analysisId', async (req, res) => {
  try {
    const analysisResult = await pool.query('SELECT * FROM ai_analyses WHERE id = $1', [req.params.analysisId]);
    if (analysisResult.rows.length === 0) return res.status(404).json({ error: 'AI analysis not found.' });
    const analysis = analysisResult.rows[0];

    const meta = (() => {
      try { return typeof analysis.metadata === 'string' ? JSON.parse(analysis.metadata) : (analysis.metadata || {}); } catch { return {}; }
    })();

    const diffSnapshot = meta.diffSnapshot;
    if (!diffSnapshot || !diffSnapshot.changes || diffSnapshot.changes.length === 0) {
      return res.status(422).json({ error: 'No diff snapshot found. Was this optimization applied?' });
    }
    if (meta.status === 'rolled_back') {
      return res.status(409).json({ error: 'This optimization has already been rolled back.' });
    }

    const rolledBack = [];
    for (const change of diffSnapshot.changes) {
      if (change.profileId) {
        await pool.query(
          `UPDATE qos_profiles SET
             max_bandwidth = $1,
             max_latency = $2,
             updated_at = NOW()
           WHERE id = $3`,
          [change.before.maxBandwidth, change.before.maxLatency, change.profileId]
        );
        rolledBack.push({ profileId: change.profileId, restoredTo: change.before });
      } else if (change.sliceId) {
        await pool.query(
          `UPDATE network_slices SET
             max_bandwidth = $1,
             latency = $2,
             updated_at = NOW()
           WHERE id = $3`,
          [change.before.maxBandwidth, change.before.latency, change.sliceId]
        );
        rolledBack.push({ sliceId: change.sliceId, restoredTo: change.before });
      }
    }

    meta.status = 'rolled_back';
    meta.rolledBackAt = new Date().toISOString();
    await pool.query(
      'UPDATE ai_analyses SET metadata = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(meta), analysis.id]
    );

    res.json({ message: 'Optimization rolled back successfully.', rolledBack });
  } catch (err) {
    console.error('Rollback optimization error:', err);
    res.status(500).json({ error: 'Failed to rollback optimization.', details: err.message });
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
      ['traffic-analyzer', title, userMessage, result, 'completed', AI_MODEL]
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
        ['traffic-analyzer', req.body.title || 'Traffic Analysis', String(req.body.input || ''), err.message, 'failed', AI_MODEL]
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
      ['anomaly-detector', title, userMessage, result, 'completed', AI_MODEL]
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
        ['anomaly-detector', req.body.title || 'Anomaly Detection Analysis', String(req.body.input || ''), err.message, 'failed', AI_MODEL]
      );
    } catch (dbErr) {
      console.error('Failed to store error analysis:', dbErr);
    }
    res.status(500).json({ error: 'Failed to run anomaly detection.', details: err.message });
  }
});

// GET /api/ai/analyses - list all analyses (with pagination + optional type filter)
router.get('/analyses', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) FROM ai_analyses';
    let dataQuery = 'SELECT * FROM ai_analyses';
    const params = [];

    if (req.query.type) {
      countQuery += ' WHERE type = $1';
      dataQuery += ' WHERE type = $1';
      params.push(req.query.type);
    }

    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    dataQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(dataQuery, params);
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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

// POST /api/ai/capacity-forecast - predict bandwidth/capacity needs
router.post('/capacity-forecast', async (req, res) => {
  try {
    const inputData = req.body.input || req.body.usage_history || req.body.metrics || '';
    const title = req.body.title || 'Capacity Forecast';
    const horizon = req.body.horizon_days || 30;
    const systemPrompt = `You are a 5G network capacity-planning expert. Forecast bandwidth, throughput, and resource requirements based on historical usage. Output sections: ## Forecast Summary, ## Per-slice projections, ## Capacity recommendations, ## Risk factors. Provide quantitative estimates and confidence levels.`;
    const userMessage = `Forecast horizon: ${horizon} days.\nUsage / metrics data:\n${typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2)}`;
    const { content: result, duration } = await callOpenRouter(systemPrompt, userMessage);
    const dbResult = await pool.query(
      `INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      ['capacity-forecast', title, userMessage, result, 'completed', AI_MODEL]
    );
    const row = dbResult.rows[0]; row.processing_time = duration; res.json(row);
  } catch (err) {
    console.error('Capacity forecast error:', err);
    try { await pool.query(`INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6)`, ['capacity-forecast', req.body.title || 'Capacity Forecast', String(req.body.input || ''), err.message, 'failed', AI_MODEL]); } catch {}
    res.status(500).json({ error: 'Failed to run capacity forecast.', details: err.message });
  }
});

// POST /api/ai/security-threat-detector
router.post('/security-threat-detector', async (req, res) => {
  try {
    const inputData = req.body.input || req.body.events || req.body.metrics_data || '';
    const title = req.body.title || 'Security Threat Detection';
    const systemPrompt = `You are a 5G network security analyst. Identify potential intrusions, DDoS attacks, lateral movement, and SIM-swap fraud. Output sections: ## Threat Summary, ## Findings (with severity), ## Indicators of Compromise, ## Mitigation Steps. Use severity ratings: critical/high/medium/low.`;
    const userMessage = typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2);
    const { content: result, duration } = await callOpenRouter(systemPrompt, `Analyze the following data for security threats:\n\n${userMessage}`);
    const dbResult = await pool.query(
      `INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      ['security-threat-detector', title, userMessage, result, 'completed', AI_MODEL]
    );
    const row = dbResult.rows[0]; row.processing_time = duration; res.json(row);
  } catch (err) {
    console.error('Security threat error:', err);
    try { await pool.query(`INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6)`, ['security-threat-detector', req.body.title || 'Security Threat', String(req.body.input || ''), err.message, 'failed', AI_MODEL]); } catch {}
    res.status(500).json({ error: 'Failed to run security threat detection.', details: err.message });
  }
});

// POST /api/ai/network-slice-optimizer - per-slice resource & SLA optimization
router.post('/network-slice-optimizer', async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured.' });
    }
    const inputData = req.body.input || req.body.slices || req.body.slice_data || '';
    const title = req.body.title || 'Network Slice Optimization';
    const sliceType = req.body.slice_type || 'mixed';
    const systemPrompt = `You are a 5G network-slice optimization expert. Given slice configurations (eMBB, URLLC, mMTC), QoS targets, and observed metrics, recommend per-slice resource allocations, isolation policies, and SLA-aware adjustments. Output sections: ## Slice Summary, ## Per-Slice Recommendations (bandwidth, latency target, priority, isolation level), ## SLA Risks, ## Implementation Steps. Be quantitative.`;
    const userMessage = `Slice type focus: ${sliceType}.\nSlice configuration / metrics:\n${typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2)}`;
    const { content: result, duration } = await callOpenRouter(systemPrompt, userMessage);
    const dbResult = await pool.query(
      `INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      ['network-slice-optimizer', title, userMessage, result, 'completed', AI_MODEL]
    );
    const row = dbResult.rows[0]; row.processing_time = duration; res.json(row);
  } catch (err) {
    console.error('Network slice optimizer error:', err);
    try { await pool.query(`INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6)`, ['network-slice-optimizer', req.body.title || 'Network Slice Optimization', String(req.body.input || ''), err.message, 'failed', AI_MODEL]); } catch {}
    res.status(500).json({ error: 'Failed to run network slice optimization.', details: err.message });
  }
});

// POST /api/ai/compliance-report — SLA / uptime / regulatory compliance reporting (NEEDS-PRODUCT-DECISION)
// PRODUCT-DECISION: Default to a "best-effort" report combining ai_analyses + sla_monitors + network_events.
// Frameworks default to ['SLA', 'GDPR', 'NIS2'] when caller does not specify; period defaults to last 30 days.
router.post('/compliance-report', async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured.', missing: 'OPENROUTER_API_KEY' });
    }
    const title = req.body.title || 'Compliance Report';
    const frameworks = Array.isArray(req.body.frameworks) && req.body.frameworks.length
      ? req.body.frameworks
      : ['SLA', 'GDPR', 'NIS2'];
    const periodDays = Number.isInteger(req.body.period_days) ? req.body.period_days : 30;
    const inputData = req.body.input || req.body.compliance_data || '';
    const systemPrompt = `You are a telecom compliance analyst. Produce a concise compliance report covering SLA adherence, uptime, regulatory frameworks (${frameworks.join(', ')}), and notable incidents. Output sections: ## Executive Summary, ## Per-Framework Findings, ## SLA / Uptime Metrics, ## Incidents & Root Causes, ## Recommended Actions. Be concrete and quantitative where possible.`;
    const userMessage = `Period: last ${periodDays} days. Frameworks: ${frameworks.join(', ')}.\nSupplied data:\n${typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2)}`;
    const { content: result, duration } = await callOpenRouter(systemPrompt, userMessage);
    const dbResult = await pool.query(
      `INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      ['compliance-report', title, userMessage, result, 'completed', AI_MODEL]
    );
    const row = dbResult.rows[0]; row.processing_time = duration; res.json(row);
  } catch (err) {
    console.error('Compliance report error:', err);
    try { await pool.query(`INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6)`, ['compliance-report', req.body.title || 'Compliance Report', String(req.body.input || ''), err.message, 'failed', AI_MODEL]); } catch {}
    res.status(500).json({ error: 'Failed to run compliance report.', details: err.message });
  }
});

// POST /api/ai/automated-provisioning — agentic CAMARA provisioning recommendations (NEEDS-CREDS)
// Env: CAMARA_PROVISIONING_API_KEY required for production calls. We always require OPENROUTER_API_KEY.
// In absence of CAMARA_PROVISIONING_API_KEY this endpoint returns AI plan only (not executed) and notes the gap.
router.post('/automated-provisioning', async (req, res) => {
  try {
    if (!process.env.CAMARA_PROVISIONING_API_KEY) {
      return res.status(503).json({ error: 'CAMARA provisioning API key not configured.', missing: 'CAMARA_PROVISIONING_API_KEY' });
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured.', missing: 'OPENROUTER_API_KEY' });
    }
    const title = req.body.title || 'Automated Provisioning Plan';
    const intent = req.body.intent || req.body.input || '';
    const systemPrompt = `You are an autonomous 5G network provisioning agent. Translate intent into a stepwise CAMARA provisioning plan: slice creation, QoS profile assignment, device on-boarding, SLA monitor setup. Output sections: ## Plan Summary, ## CAMARA Steps (with endpoint + payload), ## Pre-flight Checks, ## Rollback Plan.`;
    const userMessage = `Intent: ${typeof intent === 'string' ? intent : JSON.stringify(intent, null, 2)}`;
    const { content: result, duration } = await callOpenRouter(systemPrompt, userMessage);
    const dbResult = await pool.query(
      `INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      ['automated-provisioning', title, userMessage, result, 'completed', AI_MODEL]
    );
    const row = dbResult.rows[0]; row.processing_time = duration; res.json(row);
  } catch (err) {
    console.error('Automated provisioning error:', err);
    try { await pool.query(`INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6)`, ['automated-provisioning', req.body.title || 'Automated Provisioning Plan', String(req.body.intent || ''), err.message, 'failed', AI_MODEL]); } catch {}
    res.status(500).json({ error: 'Failed to run automated provisioning plan.', details: err.message });
  }
});

// POST /api/ai/multi-operator-federation — federation strategy across operators (NEEDS-PRODUCT-DECISION)
// PRODUCT-DECISION: Operator inventory comes from req.body.operators or defaults to ['operatorA', 'operatorB'].
// Federation goal defaults to 'roaming-and-slice-handoff' when not specified.
router.post('/multi-operator-federation', async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured.', missing: 'OPENROUTER_API_KEY' });
    }
    const title = req.body.title || 'Multi-Operator Federation Plan';
    const operators = Array.isArray(req.body.operators) && req.body.operators.length
      ? req.body.operators
      : ['operatorA', 'operatorB'];
    const goal = req.body.goal || 'roaming-and-slice-handoff';
    const inputData = req.body.input || req.body.context || '';
    const systemPrompt = `You are a 5G inter-operator federation expert. Recommend a federation strategy covering identity, billing settlement, slice exchange, SLA harmonization, and observability. Output sections: ## Federation Goal, ## Operator-Specific Steps, ## Trust & Identity, ## Billing/Settlement, ## SLA Harmonization, ## Risks.`;
    const userMessage = `Operators: ${operators.join(', ')}. Goal: ${goal}.\nContext:\n${typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2)}`;
    const { content: result, duration } = await callOpenRouter(systemPrompt, userMessage);
    const dbResult = await pool.query(
      `INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      ['multi-operator-federation', title, userMessage, result, 'completed', AI_MODEL]
    );
    const row = dbResult.rows[0]; row.processing_time = duration; res.json(row);
  } catch (err) {
    console.error('Multi-operator federation error:', err);
    try { await pool.query(`INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6)`, ['multi-operator-federation', req.body.title || 'Multi-Operator Federation Plan', String(req.body.input || ''), err.message, 'failed', AI_MODEL]); } catch {}
    res.status(500).json({ error: 'Failed to run multi-operator federation analysis.', details: err.message });
  }
});

// POST /api/ai/cost-optimizer - reduce bandwidth/transit cost
router.post('/cost-optimizer', async (req, res) => {
  try {
    const inputData = req.body.input || req.body.cost_data || req.body.usage_data || '';
    const title = req.body.title || 'Cost Optimization';
    const systemPrompt = `You are a telecom cost-optimization expert. Identify ways to reduce bandwidth, peering, transit, and slice over-provisioning costs. Output sections: ## Quick Wins, ## Structural Changes, ## Risk Trade-offs, ## Estimated Savings. Provide quantified savings ranges where possible.`;
    const userMessage = typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2);
    const { content: result, duration } = await callOpenRouter(systemPrompt, `Recommend cost optimizations for:\n\n${userMessage}`);
    const dbResult = await pool.query(
      `INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      ['cost-optimizer', title, userMessage, result, 'completed', AI_MODEL]
    );
    const row = dbResult.rows[0]; row.processing_time = duration; res.json(row);
  } catch (err) {
    console.error('Cost optimizer error:', err);
    try { await pool.query(`INSERT INTO ai_analyses (type, title, input_data, result, status, model) VALUES ($1,$2,$3,$4,$5,$6)`, ['cost-optimizer', req.body.title || 'Cost Optimization', String(req.body.input || ''), err.message, 'failed', AI_MODEL]); } catch {}
    res.status(500).json({ error: 'Failed to run cost optimization.', details: err.message });
  }
});

module.exports = router;
