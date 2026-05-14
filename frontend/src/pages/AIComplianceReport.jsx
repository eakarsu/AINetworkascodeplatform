import React, { useState } from 'react';
import { FiCheckSquare, FiZap } from 'react-icons/fi';
import AIResultDisplay from '../components/AIResultDisplay';

const jsonHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const ALL_FRAMEWORKS = ['SLA', 'GDPR', 'NIS2', 'ISO27001', 'PCI-DSS'];

export default function AIComplianceReport() {
  const [input, setInput] = useState('');
  const [periodDays, setPeriodDays] = useState(30);
  const [frameworks, setFrameworks] = useState(['SLA', 'GDPR', 'NIS2']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const toggleFramework = (f) => {
    setFrameworks(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai/compliance-report', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ input, period_days: Number(periodDays), frameworks, title: `Compliance Report (${frameworks.join(', ')})` }),
      });
      if (res.status === 503) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'AI service unavailable.');
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Compliance report failed'); }
      setResult(await res.json());
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Compliance Report</h1>
          <p>SLA, uptime and regulatory compliance summary</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3><FiCheckSquare style={{ marginRight: 8 }} /> Compliance Inputs</h3>
        <div className="form-group">
          <label>Period (days)</label>
          <input type="number" className="form-control" value={periodDays} onChange={e => setPeriodDays(e.target.value)} min={1} max={365} style={{ maxWidth: 120 }} />
        </div>
        <div className="form-group">
          <label>Frameworks</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_FRAMEWORKS.map(f => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={frameworks.includes(f)} onChange={() => toggleFramework(f)} />
                {f}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <textarea className="form-control" rows={6} placeholder="Paste SLA metrics, incidents, audit notes..." value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</> : <><FiZap /> Generate Compliance Report</>}
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading && (
        <div className="loading-container"><div className="spinner" /><span className="loading-text">AI is generating compliance report...</span></div>
      )}

      {result && !loading && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Report</h3>
          <AIResultDisplay result={result} />
        </div>
      )}
    </div>
  );
}
