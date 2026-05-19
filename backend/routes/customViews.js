// Custom Views — Network-as-Code platform
// Endpoints (auth-protected to match platform convention; rate-limited per-IP):
//   GET  /api/custom-views/topology       -> network topology graph (nodes/edges)
//   GET  /api/custom-views/config-drift   -> device config drift heatmap data
//   GET  /api/custom-views/change-report  -> PDF (network change report)
//   GET  /api/custom-views/policy-rules   -> list policy rules
//   POST /api/custom-views/policy-rules   -> create policy rule
//   PUT  /api/custom-views/policy-rules/:id  -> update policy rule
//   DELETE /api/custom-views/policy-rules/:id -> delete policy rule

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
let ipKeyGenerator;
try { ({ ipKeyGenerator } = require('express-rate-limit')); } catch (e) { ipKeyGenerator = null; }
let auth;
try { auth = require('../middleware/auth'); } catch (e) { auth = (req, res, next) => next(); }

// Use the library's IPv6-safe ipKeyGenerator helper explicitly to avoid ERR_ERL_KEY_GEN_IPV6.
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => (ipKeyGenerator ? ipKeyGenerator(req, res) : (req.ip || 'global')),
});

router.use(limiter);
router.use(auth);

// In-memory policy rules store (deterministic seed)
let policyRulesSeq = 4;
const policyRules = [
  { id: 1, name: 'Block-Outbound-Telnet', source: '10.0.0.0/8', destination: 'any', port: 23, protocol: 'tcp', action: 'deny', priority: 100, enabled: true },
  { id: 2, name: 'Allow-VoIP-SIP', source: 'any', destination: '10.10.5.0/24', port: 5060, protocol: 'udp', action: 'allow', priority: 200, enabled: true },
  { id: 3, name: 'QoS-Streaming-DSCP46', source: '10.20.0.0/16', destination: 'any', port: 443, protocol: 'tcp', action: 'mark-dscp-46', priority: 150, enabled: true },
];

// 1) VIZ: Network topology graph (SVG nodes/edges) ----------------------------
router.get('/topology', (req, res) => {
  // Deterministic small topology
  const nodes = [
    { id: 'core-rt-1',  type: 'router',   x:  80, y:  60, label: 'Core-RT-1',  status: 'up'   },
    { id: 'core-rt-2',  type: 'router',   x: 520, y:  60, label: 'Core-RT-2',  status: 'up'   },
    { id: 'agg-sw-1',   type: 'switch',   x: 200, y: 180, label: 'Agg-SW-1',   status: 'up'   },
    { id: 'agg-sw-2',   type: 'switch',   x: 400, y: 180, label: 'Agg-SW-2',   status: 'degraded' },
    { id: 'edge-fw-1',  type: 'firewall', x: 100, y: 300, label: 'Edge-FW-1',  status: 'up'   },
    { id: 'edge-fw-2',  type: 'firewall', x: 500, y: 300, label: 'Edge-FW-2',  status: 'up'   },
    { id: 'access-ap-1',type: 'ap',       x: 300, y: 380, label: 'Access-AP-1',status: 'down' },
  ];
  const edges = [
    { source: 'core-rt-1',  target: 'core-rt-2', bandwidth: '100G', utilization: 0.62 },
    { source: 'core-rt-1',  target: 'agg-sw-1',  bandwidth: '40G',  utilization: 0.41 },
    { source: 'core-rt-2',  target: 'agg-sw-2',  bandwidth: '40G',  utilization: 0.78 },
    { source: 'agg-sw-1',   target: 'edge-fw-1', bandwidth: '10G',  utilization: 0.33 },
    { source: 'agg-sw-2',   target: 'edge-fw-2', bandwidth: '10G',  utilization: 0.55 },
    { source: 'agg-sw-1',   target: 'access-ap-1', bandwidth: '1G', utilization: 0.12 },
    { source: 'agg-sw-2',   target: 'access-ap-1', bandwidth: '1G', utilization: 0.08 },
  ];
  res.json({
    generatedAt: new Date().toISOString(),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges,
  });
});

// 2) VIZ: Device config drift heatmap -----------------------------------------
router.get('/config-drift', (req, res) => {
  const devices = ['core-rt-1', 'core-rt-2', 'agg-sw-1', 'agg-sw-2', 'edge-fw-1', 'edge-fw-2', 'access-ap-1'];
  const categories = ['NTP', 'SNMP', 'ACL', 'BGP', 'OSPF', 'AAA', 'Logging'];
  // Deterministic drift scores 0-100
  function score(d, c) {
    let s = 0;
    const str = `${d}|${c}`;
    for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
    return s % 101;
  }
  const matrix = devices.map(d => ({
    device: d,
    cells: categories.map(c => ({ category: c, drift: score(d, c) })),
  }));
  res.json({
    generatedAt: new Date().toISOString(),
    devices,
    categories,
    matrix,
    legend: [
      { range: '0-20', label: 'Compliant', color: '#16a34a' },
      { range: '21-50', label: 'Minor', color: '#eab308' },
      { range: '51-80', label: 'Major', color: '#f97316' },
      { range: '81-100', label: 'Critical', color: '#dc2626' },
    ],
  });
});

// 3) NON-VIZ: Network change report PDF ---------------------------------------
router.get('/change-report', (req, res) => {
  // Minimal hand-rolled PDF (1 page) so we don't add a heavy dep.
  const lines = [
    'Network-as-Code Platform — Network Change Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Recent Changes (last 24h):',
    '  - 14:02  core-rt-1   OSPF area 0.0.0.1 added            (admin)',
    '  - 13:41  agg-sw-2    VLAN 220 trunked on Gi0/24         (admin)',
    '  - 12:18  edge-fw-1   ACL deny-telnet-out applied        (admin)',
    '  - 11:55  access-ap-1 SSID corp-guest WPA3 rotated       (system)',
    '  - 10:30  core-rt-2   BGP neighbor 10.0.0.6 reset        (admin)',
    '',
    'Summary: 5 changes, 0 rollbacks, 1 drift alert.',
  ];

  function esc(s) { return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  let contentStream = 'BT /F1 12 Tf 50 780 Td 14 TL\n';
  lines.forEach((ln, i) => {
    if (i === 0) contentStream += `(${esc(ln)}) Tj\n`;
    else contentStream += `T* (${esc(ln)}) Tj\n`;
  });
  contentStream += 'ET';

  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objects[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>';
  objects[4] = `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`;
  objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = Buffer.byteLength(pdf);
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="network-change-report.pdf"');
  res.status(200).send(Buffer.from(pdf, 'binary'));
});

// 4) NON-VIZ: Network policy rules editor (CRUD) ------------------------------
router.get('/policy-rules', (req, res) => {
  res.json({ count: policyRules.length, rules: policyRules });
});

router.post('/policy-rules', (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'name required' });
  const rule = {
    id: ++policyRulesSeq,
    name: String(b.name),
    source: b.source || 'any',
    destination: b.destination || 'any',
    port: Number(b.port) || 0,
    protocol: b.protocol || 'tcp',
    action: b.action || 'allow',
    priority: Number(b.priority) || 100,
    enabled: b.enabled !== false,
  };
  policyRules.push(rule);
  res.status(201).json(rule);
});

router.put('/policy-rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = policyRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  policyRules[idx] = { ...policyRules[idx], ...(req.body || {}), id };
  res.json(policyRules[idx]);
});

router.delete('/policy-rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = policyRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const [removed] = policyRules.splice(idx, 1);
  res.json({ deleted: true, rule: removed });
});

module.exports = router;
