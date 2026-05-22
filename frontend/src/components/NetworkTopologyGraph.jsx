import React, { useEffect, useState } from 'react';

const typeColor = { router: '#2563eb', switch: '#0891b2', firewall: '#dc2626', ap: '#7c3aed' };
const statusStroke = { up: '#16a34a', degraded: '#eab308', down: '#dc2626' };

export default function NetworkTopologyGraph() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/topology', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .catch(e => setErr(String(e)));
  }, []);

  if (err) return <div style={{ color: '#dc2626' }}>Error: {err}</div>;
  if (!data) return <div>Loading topology...</div>;

  const nodeMap = Object.fromEntries(data.nodes.map(n => [n.id, n]));

  return (
    <div style={{ background: '#0f172a', borderRadius: 10, padding: 16, color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div><strong>Network Topology</strong> — {data.nodeCount} nodes / {data.edgeCount} links</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Generated {new Date(data.generatedAt).toLocaleTimeString()}</div>
      </div>
      <svg viewBox="0 0 620 440" style={{ width: '100%', height: 420, background: '#1e293b', borderRadius: 8 }}>
        {data.edges.map((e, i) => {
          const s = nodeMap[e.source]; const t = nodeMap[e.target];
          if (!s || !t) return null;
          const u = e.utilization;
          const color = u > 0.7 ? '#dc2626' : u > 0.4 ? '#eab308' : '#22c55e';
          const midX = (s.x + t.x) / 2; const midY = (s.y + t.y) / 2;
          return (
            <g key={`e-${i}`}>
              <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={color} strokeWidth={2 + u * 4} opacity={0.8} />
              <text x={midX} y={midY - 4} fill="#94a3b8" fontSize="10" textAnchor="middle">{e.bandwidth} ({Math.round(u * 100)}%)</text>
            </g>
          );
        })}
        {data.nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={22} fill={typeColor[n.type] || '#64748b'} stroke={statusStroke[n.status] || '#94a3b8'} strokeWidth={3} />
            <text x={n.x} y={n.y + 4} fill="#fff" fontSize="9" textAnchor="middle">{n.type}</text>
            <text x={n.x} y={n.y + 38} fill="#e2e8f0" fontSize="11" textAnchor="middle">{n.label}</text>
          </g>
        ))}
      </svg>
      <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
        {Object.entries(typeColor).map(([k, c]) => (
          <span key={k}><span style={{ display: 'inline-block', width: 10, height: 10, background: c, borderRadius: '50%', marginRight: 4 }} />{k}</span>
        ))}
        {Object.entries(statusStroke).map(([k, c]) => (
          <span key={k}><span style={{ display: 'inline-block', width: 10, height: 10, border: `2px solid ${c}`, borderRadius: '50%', marginRight: 4 }} />{k}</span>
        ))}
      </div>
    </div>
  );
}
