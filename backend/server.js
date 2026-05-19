const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { requestCamelToSnake, responseSnakeToCamel } = require('./middleware/caseConverter');
const runMigrations = require('./migrate');

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Case conversion: camelCase <-> snake_case
app.use(responseSnakeToCamel);
app.use(requestCamelToSnake);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: '5G Network-as-Code Platform API' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/network-slices', require('./routes/networkSlices'));
app.use('/api/qos-profiles', require('./routes/qosProfiles'));
app.use('/api/edge-locations', require('./routes/edgeLocations'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/traffic-policies', require('./routes/trafficPolicies'));
app.use('/api/sla-monitors', require('./routes/slaMonitors'));
app.use('/api/bandwidth-allocations', require('./routes/bandwidthAllocations'));
app.use('/api/latency-profiles', require('./routes/latencyProfiles'));
app.use('/api/developer-apps', require('./routes/developerApps'));
app.use('/api/network-events', require('./routes/networkEvents'));
app.use('/api/api-keys', require('./routes/apiKeys'));
app.use('/api/sim-cards', require('./routes/simCards'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/usage-analytics', require('./routes/usageAnalytics'));

// CAMARA API Conformance Layer (API-key auth, not JWT)
app.use('/api/camara', require('./routes/camara'));

// Anomaly Rules Engine (JWT auth)
app.use('/api/anomaly-rules', require('./routes/anomalyRules'));

// Custom Views (4 features: 2 viz + 2 non-viz) — mounted BEFORE 404 / error handler
app.use('/api/custom-views', require('./routes/customViews'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Run DB migrations then start server
runMigrations()
  .catch(err => console.error('Migration warning:', err.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`5G Network-as-Code API running on port ${PORT}`);
    });
  });

module.exports = app;

// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/network-optimizer-agent', require('./routes/network-optimizer-agent'));
app.use('/api/threat-detection-agent', require('./routes/threat-detection-agent'));
app.use('/api/capacity-planning-ai', require('./routes/capacity-planning-ai'));
app.use('/api/network-slicing-autonomous', require('./routes/network-slicing-autonomous'));
app.use('/api/api-marketplace', require('./routes/api-marketplace'));

// === Batch 05 Gaps & Frontend Mounts ===
try { const _gap_capacity_forecast = require('./routes/gap-capacity-forecast'); app.use('/api/gap-capacity-forecast', _gap_capacity_forecast); } catch(e) { console.error('gap mount fail capacity-forecast:', e.message); }
try { const _gap_network_slice_optimizer = require('./routes/gap-network-slice-optimizer'); app.use('/api/gap-network-slice-optimizer', _gap_network_slice_optimizer); } catch(e) { console.error('gap mount fail network-slice-optimizer:', e.message); }
try { const _gap_cost_optimizer = require('./routes/gap-cost-optimizer'); app.use('/api/gap-cost-optimizer', _gap_cost_optimizer); } catch(e) { console.error('gap mount fail cost-optimizer:', e.message); }
try { const _gap_security_threat_detector = require('./routes/gap-security-threat-detector'); app.use('/api/gap-security-threat-detector', _gap_security_threat_detector); } catch(e) { console.error('gap mount fail security-threat-detector:', e.message); }
try { const _gap_network = require('./routes/gap-network'); app.use('/api/gap-network', _gap_network); } catch(e) { console.error('gap mount fail network:', e.message); }
try { const _gap_real_time = require('./routes/gap-real-time'); app.use('/api/gap-real-time', _gap_real_time); } catch(e) { console.error('gap mount fail real-time:', e.message); }
try { const _gap_automated = require('./routes/gap-automated'); app.use('/api/gap-automated', _gap_automated); } catch(e) { console.error('gap mount fail automated:', e.message); }
try { const _gap_oss_bss = require('./routes/gap-oss-bss'); app.use('/api/gap-oss-bss', _gap_oss_bss); } catch(e) { console.error('gap mount fail oss-bss:', e.message); }
try { const _gap_billing = require('./routes/gap-billing'); app.use('/api/gap-billing', _gap_billing); } catch(e) { console.error('gap mount fail billing:', e.message); }
try { const _gap_compliance = require('./routes/gap-compliance'); app.use('/api/gap-compliance', _gap_compliance); } catch(e) { console.error('gap mount fail compliance:', e.message); }
try { const _gap_multi_operator = require('./routes/gap-multi-operator'); app.use('/api/gap-multi-operator', _gap_multi_operator); } catch(e) { console.error('gap mount fail multi-operator:', e.message); }
// === End Batch 05 Mounts ===
