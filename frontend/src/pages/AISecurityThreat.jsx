import React, { useState } from 'react';
import { FiShield, FiZap } from 'react-icons/fi';
import AIResultDisplay from '../components/AIResultDisplay';

const jsonHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const samples = [
  {
    label: 'DDoS spike',
    data: 'Slice eMBB-A: 2.5x normal traffic over last 10min from 15 source ASNs. UDP/8080 burst. Latency on adjacent slices rising. Investigate.',
  },
  {
    label: 'SIM swap pattern',
    data: '12 SIMs reactivated within 30min from same MSC. Inbound auth failures up 4x. Suspect SIM-swap fraud or coordinated attack.',
  },
];

export default function AISecurityThreat() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');


  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai/security-threat-detector', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ input, title: 'Security Threat Detection' }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Detection failed'); }
      const data = await res.json();
      setResult(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Security Threat Detector</h1>
          <p>Detect intrusions, DDoS, lateral movement, and SIM-swap fraud</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3><FiShield style={{ marginRight: 8 }} /> Events / Metrics</h3>
        <div className="quick-actions">
          {samples.map((s, i) => <button key={i} onClick={() => setInput(s.data)}>{s.label}</button>)}
        </div>
        <div className="form-group">

          <textarea className="form-control" rows={6} placeholder="Paste network events, auth logs, traffic anomalies..."
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !input.trim()}>
          {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing...</> :
            <><FiZap /> Detect Threats</>}
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading && (
        <div className="loading-container">
          <div className="spinner" /><span className="loading-text">AI is analyzing threats...</span>
        </div>
      )}

      {result && !loading && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Threat Analysis</h3>
          <AIResultDisplay result={result} />
        </div>
      )}
    </div>
  );
}
