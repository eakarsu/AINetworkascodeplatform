import React, { useEffect, useState } from 'react';

function colorFor(v) {
  if (v <= 20) return '#16a34a';
  if (v <= 50) return '#eab308';
  if (v <= 80) return '#f97316';
  return '#dc2626';
}

export default function ConfigDriftHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/config-drift', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setData)
      .catch(e => setErr(String(e)));
  }, []);

  if (err) return <div style={{ color: '#dc2626' }}>Error: {err}</div>;
  if (!data) return <div>Loading drift data...</div>;

  const cell = 56;
  const labelW = 130;
  const W = labelW + data.categories.length * cell + 20;
  const H = 40 + data.matrix.length * cell + 20;

  return (
    <div style={{ background: '#0f172a', borderRadius: 10, padding: 16, color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>Device Config Drift Heatmap</strong>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Generated {new Date(data.generatedAt).toLocaleTimeString()}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, background: '#1e293b', borderRadius: 8 }}>
        {data.categories.map((c, i) => (
          <text key={c} x={labelW + i * cell + cell / 2} y={28} fill="#94a3b8" fontSize="12" textAnchor="middle">{c}</text>
        ))}
        {data.matrix.map((row, ri) => (
          <g key={row.device}>
            <text x={labelW - 10} y={50 + ri * cell + cell / 2} fill="#e2e8f0" fontSize="12" textAnchor="end">{row.device}</text>
            {row.cells.map((c, ci) => (
              <g key={`${row.device}-${c.category}`}>
                <rect x={labelW + ci * cell + 4} y={40 + ri * cell + 4} width={cell - 8} height={cell - 8} rx={4} fill={colorFor(c.drift)} />
                <text x={labelW + ci * cell + cell / 2} y={40 + ri * cell + cell / 2 + 4} fill="#0f172a" fontSize="13" textAnchor="middle" fontWeight="700">{c.drift}</text>
              </g>
            ))}
          </g>
        ))}
      </svg>
      <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
        {data.legend.map(l => (
          <span key={l.range}><span style={{ display: 'inline-block', width: 14, height: 14, background: l.color, borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />{l.range} {l.label}</span>
        ))}
      </div>
    </div>
  );
}
