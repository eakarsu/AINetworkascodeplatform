import React, { useState } from 'react';
import { FiTrendingUp, FiZap } from 'react-icons/fi';
import AIResultDisplay from '../components/AIResultDisplay';

const jsonHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const samples = [
  {
    label: 'Slice growth forecast',
    data: 'eMBB slice utilization 75% trending +3%/week. URLLC at 42%. mMTC at 88% with new IoT onboarding planned. Forecast next quarter capacity needs.',
  },
  {
    label: 'Edge node expansion',
    data: 'Average edge utilization 65%, peak 92%. Device count growing 18%/quarter. Forecast where to add capacity over next 90 days.',
  },
];

export default function AICapacityForecast() {
  const [input, setInput] = useState('');
  const [horizon, setHorizon] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai/capacity-forecast', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ input, horizon_days: horizon, title: `Capacity Forecast (${horizon}d)` }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Forecast failed'); }
      const data = await res.json();
      setResult(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Capacity Forecast</h1>
          <p>Forecast bandwidth and capacity needs across slices and edge locations</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3><FiTrendingUp style={{ marginRight: 8 }} /> Usage Data</h3>
        <div className="quick-actions">
          {samples.map((s, i) => <button key={i} onClick={() => setInput(s.data)}>{s.label}</button>)}
        </div>
        <div className="form-group">
          <label>Forecast Horizon (days)</label>
          <input type="number" className="form-control" value={horizon} min={1} max={365}
            onChange={e => setHorizon(parseInt(e.target.value) || 30)} style={{ maxWidth: 140 }} />
        </div>
        <div className="form-group">
          <textarea className="form-control" rows={6} placeholder="Paste usage history, slice metrics, growth trends..."
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !input.trim()}>
          {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Forecasting...</> :
            <><FiZap /> Run Forecast</>}
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading && (
        <div className="loading-container">
          <div className="spinner" /><span className="loading-text">AI is forecasting capacity needs...</span>
        </div>
      )}

      {result && !loading && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Forecast</h3>
          <AIResultDisplay result={result} />
        </div>
      )}
    </div>
  );
}
