import React, { useState, useEffect } from 'react';
import { FiCpu, FiZap, FiClock } from 'react-icons/fi';
import AIResultDisplay from '../components/AIResultDisplay';

const authHeader = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });
const jsonHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const sampleInputs = [
  {
    label: 'Optimize Slice Allocation',
    data: 'Analyze current network slice allocation across eMBB, URLLC, and mMTC services. Current load: eMBB at 78%, URLLC at 45%, mMTC at 92%. Suggest optimal redistribution of resources to maximize efficiency while maintaining SLA targets.',
  },
  {
    label: 'Reduce Latency',
    data: 'Current average latency across edge locations: US-East 12ms, US-West 18ms, EU-Central 25ms, APAC 35ms. Target latency for URLLC services is <10ms. Analyze routing paths and suggest optimizations for latency reduction.',
  },
  {
    label: 'Capacity Planning',
    data: 'Network capacity utilization trending upward: 65% average over past month, peak 89%. Expected device growth: 15% per quarter. Current edge nodes: 12. Analyze and recommend capacity expansion strategy for next 6 months.',
  },
  {
    label: 'Energy Efficiency',
    data: 'Network energy consumption: 450 kWh daily across 12 edge locations. Peak usage hours: 9AM-6PM. Off-peak utilization drops to 20%. Suggest energy optimization strategies including dynamic scaling and sleep modes.',
  },
];

export default function AIOptimizer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [selectedHistory, setSelectedHistory] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/analyses?type=network-optimizer', { headers: authHeader() });
      if (res.ok) { const data = await res.json(); setHistory(Array.isArray(data) ? data : []); }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai/network-optimizer', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ input, type: 'network-optimizer' }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Analysis failed'); }
      const data = await res.json();
      setResult(data);
      fetchHistory();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Network Optimizer</h1>
          <p>AI-powered network optimization and recommendations</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3><FiCpu style={{ marginRight: '8px' }} /> Network Configuration Input</h3>
        <div className="quick-actions">
          {sampleInputs.map((s, i) => (
            <button key={i} onClick={() => setInput(s.data)}>{s.label}</button>
          ))}
        </div>
        <div className="form-group">
          <textarea
            className="form-control"
            rows={5}
            placeholder="Describe your network configuration, current metrics, or optimization goals..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !input.trim()}>
          {loading ? (
            <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing...</>
          ) : (
            <><FiZap /> Analyze & Optimize</>
          )}
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">AI is analyzing your network configuration...</span>
        </div>
      )}

      {result && !loading && <AIResultDisplay result={result} />}

      {selectedHistory && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Historical Analysis Result
          </h3>
          <AIResultDisplay result={selectedHistory} />
        </div>
      )}

      <div className="ai-history">
        <h3><FiClock style={{ marginRight: '8px' }} /> Analysis History</h3>
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No previous analyses found.</p>
        ) : (
          history.map((item, i) => (
            <div key={item._id || i} className="ai-history-item" onClick={() => setSelectedHistory(item)}>
              <div className="history-meta">
                <span>{item.type || 'Network Optimization'}</span>
                <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</span>
              </div>
              <div className="history-preview">{item.input || item.query || 'Analysis result'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
