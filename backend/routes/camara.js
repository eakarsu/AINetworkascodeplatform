const express = require('express');
const router = express.Router();
const pool = require('../db');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// All CAMARA routes use API-key auth (GSMA Open Gateway pattern)
router.use(apiKeyAuth);

// Helper to generate a session ID
function generateSessionId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'sess_';
  for (let i = 0; i < 20; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// POST /api/camara/qod/sessions — Quality-on-Demand: create QoS session
router.post('/qod/sessions', async (req, res) => {
  try {
    const { deviceId, qosProfileId, duration, applicationServer } = req.body;
    if (!deviceId || !qosProfileId) {
      return res.status(400).json({ error: 'deviceId and qosProfileId are required.' });
    }

    // Validate qos_profiles row exists
    const profileResult = await pool.query(
      'SELECT * FROM qos_profiles WHERE id = $1',
      [qosProfileId]
    );
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: `QoS profile '${qosProfileId}' not found.` });
    }
    const profile = profileResult.rows[0];

    if (profile.status && profile.status !== 'active') {
      return res.status(422).json({ error: `QoS profile '${qosProfileId}' is not active.` });
    }

    // Check device exists
    const deviceResult = await pool.query(
      'SELECT * FROM connected_devices WHERE id = $1',
      [deviceId]
    );
    if (deviceResult.rows.length === 0) {
      return res.status(404).json({ error: `Device '${deviceId}' not found.` });
    }

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + (duration || 3600) * 1000);

    res.status(201).json({
      sessionId,
      status: 'REQUESTED',
      device: { id: deviceResult.rows[0].id, name: deviceResult.rows[0].name },
      qosProfile: {
        id: profile.id,
        name: profile.name,
        maxBandwidth: profile.max_bandwidth,
        maxLatency: profile.max_latency,
      },
      applicationServer: applicationServer || null,
      duration: duration || 3600,
      expiresAt: expiresAt.toISOString(),
      startedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('CAMARA QoD session error:', err);
    res.status(500).json({ error: 'Failed to create QoD session.' });
  }
});

// GET /api/camara/device-status/:deviceId — device connectivity status
router.get('/device-status/:deviceId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM connected_devices WHERE id = $1',
      [req.params.deviceId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found.' });
    }
    const device = result.rows[0];
    const lastSeen = device.last_seen ? new Date(device.last_seen) : null;
    const secondsSinceLastSeen = lastSeen ? Math.floor((Date.now() - lastSeen.getTime()) / 1000) : null;

    res.json({
      deviceId: device.id,
      connectivityStatus: device.status === 'active' ? 'CONNECTED' : 'DISCONNECTED',
      roaming: false,
      lastSeenAt: device.last_seen || null,
      secondsSinceLastSeen,
      networkSlice: device.network_slice || null,
      ipAddress: device.ip_address || null,
    });
  } catch (err) {
    console.error('CAMARA device status error:', err);
    res.status(500).json({ error: 'Failed to retrieve device status.' });
  }
});

// POST /api/camara/sim-swap/check — SIM swap recency check
router.post('/sim-swap/check', async (req, res) => {
  try {
    const { msisdn, maxAgeHours } = req.body;
    if (!msisdn) return res.status(400).json({ error: 'msisdn is required.' });

    const result = await pool.query(
      'SELECT * FROM sim_cards WHERE msisdn = $1',
      [msisdn]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'SIM card not found for the given MSISDN.' });
    }
    const sim = result.rows[0];
    const thresholdHours = maxAgeHours || 24;
    const updatedAt = sim.updated_at ? new Date(sim.updated_at) : null;
    const thresholdMs = thresholdHours * 60 * 60 * 1000;
    const swappedRecently = updatedAt
      ? Date.now() - updatedAt.getTime() < thresholdMs
      : false;

    res.json({
      msisdn,
      swapped: swappedRecently,
      swappedAt: updatedAt ? updatedAt.toISOString() : null,
      thresholdHours,
      iccid: sim.iccid || null,
    });
  } catch (err) {
    console.error('CAMARA SIM swap error:', err);
    res.status(500).json({ error: 'Failed to check SIM swap status.' });
  }
});

// POST /api/camara/number-verify — verify phone number matches device record
router.post('/number-verify', async (req, res) => {
  try {
    const { msisdn, deviceId } = req.body;
    if (!msisdn) return res.status(400).json({ error: 'msisdn is required.' });

    const simResult = await pool.query(
      'SELECT * FROM sim_cards WHERE msisdn = $1',
      [msisdn]
    );
    if (simResult.rows.length === 0) {
      return res.json({ msisdn, verified: false, reason: 'Number not found in SIM registry.' });
    }
    const sim = simResult.rows[0];

    let verified = true;
    let reason = 'Number verified successfully.';

    if (deviceId) {
      // Check if SIM's device field matches the requested deviceId
      if (sim.device && String(sim.device) !== String(deviceId)) {
        verified = false;
        reason = 'Phone number does not match the specified device.';
      }
    }

    res.json({
      msisdn,
      verified,
      reason,
      simStatus: sim.status || null,
      iccid: sim.iccid || null,
    });
  } catch (err) {
    console.error('CAMARA number verify error:', err);
    res.status(500).json({ error: 'Failed to verify phone number.' });
  }
});

module.exports = router;
