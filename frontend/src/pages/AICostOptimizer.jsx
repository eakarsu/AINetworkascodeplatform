import React, { useState } from 'react';
import { FiDollarSign, FiZap } from 'react-icons/fi';
import AIResultDisplay from '../components/AIResultDisplay';

const jsonHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const samples = [
  {
    label: 'Peering & transit',
    data: 'Monthly egress: 320Tbps via 3 transit providers ($45k). 60% routed sub-optimally. Identify cost reductions and peering opportunities.',
  },
  {
    label: 'Slice over-provisioning',
    data: 'eMBB slice avg utilization 35%, allocated 2x peak. URLLC 22%, allocated for SLA buffer. Find structural cost reductions.',
  },
];

export default function AICostOptimizer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');


  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai/cost-optimizer', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ input, title: 'Cost Optimization' }),
      });
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
          <h1>AI Cost Optimizer</h1>
          <p>Reduce bandwidth, peering, transit, and slice over-provisioning costs</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3><FiDollarSign style={{ marginRight: 8 }} /> Cost / Usage Data</h3>
        <div className="quick-actions">
          {samples.map((s, i) => <button key={i} onClick={() => setInput(s.data)}>{s.label}</button>)}
        </div>
        <div className="form-group">

          <textarea className="form-control" rows={6} placeholder="Paste cost breakdown, usage data, slice allocations..."
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !input.trim()}>
          {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing...</> :
            <><FiZap /> Find Savings</>}
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading && (
        <div className="loading-container">
          <div className="spinner" /><span className="loading-text">AI is finding cost optimizations...</span>
        </div>
      )}

      {result && !loading && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Cost Optimization Plan</h3>
          <AIResultDisplay result={result} />
        </div>
      )}
    </div>
  );
}
