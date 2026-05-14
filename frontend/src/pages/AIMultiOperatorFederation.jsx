import React, { useState } from 'react';
import { FiGlobe, FiZap } from 'react-icons/fi';
import AIResultDisplay from '../components/AIResultDisplay';

const jsonHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });

export default function AIMultiOperatorFederation() {
  const [operators, setOperators] = useState('operatorA, operatorB');
  const [goal, setGoal] = useState('roaming-and-slice-handoff');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const ops = operators.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/ai/multi-operator-federation', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ operators: ops, goal, input, title: `Federation Plan (${goal})` }),
      });
      if (res.status === 503) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'AI service unavailable.');
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Federation analysis failed'); }
      setResult(await res.json());
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Multi-Operator Federation</h1>
          <p>Inter-operator federation strategy: identity, billing, slice exchange</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3><FiGlobe style={{ marginRight: 8 }} /> Federation Inputs</h3>
        <div className="form-group">
          <label>Operators (comma-separated)</label>
          <input className="form-control" value={operators} onChange={e => setOperators(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Goal</label>
          <select className="form-control" value={goal} onChange={e => setGoal(e.target.value)} style={{ maxWidth: 320 }}>
            <option value="roaming-and-slice-handoff">Roaming + slice handoff</option>
            <option value="cross-operator-slas">Cross-operator SLAs</option>
            <option value="federated-billing">Federated billing</option>
            <option value="emergency-failover">Emergency failover</option>
          </select>
        </div>
        <div className="form-group">
          <textarea className="form-control" rows={6} placeholder="Additional context: regions, regulatory constraints, vendor mix..." value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</> : <><FiZap /> Generate Federation Plan</>}
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading && (
        <div className="loading-container"><div className="spinner" /><span className="loading-text">AI is generating federation plan...</span></div>
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
