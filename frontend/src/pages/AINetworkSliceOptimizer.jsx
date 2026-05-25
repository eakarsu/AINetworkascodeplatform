import React, { useState } from 'react';
import { FiLayers, FiZap } from 'react-icons/fi';
import AIResultDisplay from '../components/AIResultDisplay';

const jsonHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const samples = [
  {
    label: 'eMBB peak congestion',
    type: 'eMBB',
    data: 'eMBB slice: 1Gbps peak, 700Mbps avg, target latency 20ms, current 35ms. URLLC running at 5% of allocation. mMTC stable at 60%. Need to optimize resource shares to relieve eMBB latency without breaching URLLC SLA.',
  },
  {
    label: 'URLLC SLA tightening',
    type: 'URLLC',
    data: 'URLLC slice (autonomous-vehicle vertical) needs 99.999% reliability and <5ms latency end-to-end. Current 4ms but isolation is shared with eMBB. Recommend slicing/isolation hardening with quantified resource cost.',
  },
];

export default function AINetworkSliceOptimizer() {
  const [input, setInput] = useState('');
  const [sliceType, setSliceType] = useState('mixed');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');


  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai/network-slice-optimizer', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ input, slice_type: sliceType, title: `Slice Optimization (${sliceType})` }),
      });
      if (res.status === 503) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'AI service unavailable. Configure OPENROUTER_API_KEY.');
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Optimization failed'); }
      const data = await res.json();
      setResult(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Network Slice Optimizer</h1>
          <p>Per-slice resource and SLA-aware optimization recommendations</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3><FiLayers style={{ marginRight: 8 }} /> Slice Configuration</h3>
        <div className="quick-actions">
          {samples.map((s, i) => (
            <button key={i} onClick={() => { setInput(s.data); setSliceType(s.type); }}>{s.label}</button>
          ))}
        </div>
        <div className="form-group">
          <label>Slice Type Focus</label>
          <select className="form-control" value={sliceType} onChange={e => setSliceType(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="mixed">Mixed</option>
            <option value="eMBB">eMBB</option>
            <option value="URLLC">URLLC</option>
            <option value="mMTC">mMTC</option>
          </select>
        </div>
        <div className="form-group">

          <textarea className="form-control" rows={6} placeholder="Paste slice configuration, QoS targets, and observed metrics..."
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !input.trim()}>
          {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Optimizing...</> :
            <><FiZap /> Run Slice Optimizer</>}
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading && (
        <div className="loading-container">
          <div className="spinner" /><span className="loading-text">AI is optimizing slices...</span>
        </div>
      )}

      {result && !loading && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Recommendations</h3>
          <AIResultDisplay result={result} />
        </div>
      )}
    </div>
  );
}
