const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { requestCamelToSnake, responseSnakeToCamel } = require('./middleware/caseConverter');

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`5G Network-as-Code API running on port ${PORT}`);
});

module.exports = app;
