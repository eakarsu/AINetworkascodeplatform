import React, { useState } from 'react';
import { FiCpu, FiZap } from 'react-icons/fi';
import AIResultDisplay from '../components/AIResultDisplay';

const jsonHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const samples = [
  { label: 'Stadium event', text: 'Provision a 4-hour eMBB slice (2Gbps peak) for stadium event with 50k devices, hand off to LTE on exit.' },
  { label: 'AV testbed', text: 'Provision URLLC slice for autonomous-vehicle testbed: 99.999% reliability, <5ms latency, 100 vehicles in defined geofence.' },
];

export default function AIAutomatedProvisioning() {
  const [intent, setIntent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    if (!intent.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai/automated-provisioning', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ intent, title: 'Automated Provisioning Plan' }),
      });
      if (res.status === 503) {
        const d = await res.json().catch(() => ({}));
        const missing = d.missing ? ` (missing env: ${d.missing})` : '';
        throw new Error((d.error || 'Service unavailable.') + missing);
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Provisioning failed'); }
      setResult(await res.json());
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Automated Provisioning</h1>
          <p>Intent-driven CAMARA provisioning plan (requires CAMARA_PROVISIONING_API_KEY)</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3><FiCpu style={{ marginRight: 8 }} /> Provisioning Intent</h3>
        <div className="quick-actions">
          {samples.map((s, i) => (<button key={i} onClick={() => setIntent(s.text)}>{s.label}</button>))}
        </div>
        <div className="form-group">
          <textarea className="form-control" rows={6} placeholder="Describe the desired network state, SLAs, devices, and timing..." value={intent} onChange={e => setIntent(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !intent.trim()}>
          {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Planning...</> : <><FiZap /> Generate Plan</>}
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading && (
        <div className="loading-container"><div className="spinner" /><span className="loading-text">AI is generating provisioning plan...</span></div>
      )}

      {result && !loading && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Plan</h3>
          <AIResultDisplay result={result} />
        </div>
      )}
    </div>
  );
}
