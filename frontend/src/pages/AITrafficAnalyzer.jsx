import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiZap, FiClock } from 'react-icons/fi';
import AIResultDisplay from '../components/AIResultDisplay';

const authHeader = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });
const jsonHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const sampleInputs = [
  {
    label: 'Peak Traffic Analysis',
    data: 'Analyze traffic patterns during peak hours (9AM-6PM). Current throughput: 850 Gbps average, 1.2 Tbps peak. Top traffic sources: video streaming (40%), enterprise VPN (25%), IoT telemetry (20%), other (15%). Identify bottlenecks and suggest traffic management improvements.',
  },
  {
    label: 'QoS Compliance',
    data: 'Check QoS compliance across all network slices. eMBB: target 100Mbps min, current avg 95Mbps. URLLC: target <5ms latency, current avg 7ms. mMTC: target 1M devices/km2, current 750K. Analyze deviations and recommend corrective actions.',
  },
  {
    label: 'Traffic Prediction',
    data: 'Historical traffic data: Mon-Fri avg 750Gbps, weekends avg 450Gbps. Monthly growth rate: 8%. Upcoming events: major sports event in 2 weeks (expected 3x traffic spike in streaming). Predict traffic load and recommend preparation strategy.',
  },
  {
    label: 'DDoS Pattern Detection',
    data: 'Unusual traffic spike detected: 300% increase in UDP packets from APAC region over last 2 hours. Source IPs distributed across 5,000+ unique addresses. Normal baseline: 50Gbps, current: 200Gbps. Analyze if this is a DDoS attack and suggest mitigation.',
  },
];

export default function AITrafficAnalyzer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [selectedHistory, setSelectedHistory] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/analyses?type=traffic-analyzer', { headers: authHeader() });
      if (res.ok) { const data = await res.json(); setHistory(Array.isArray(data) ? data : []); }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai/traffic-analyzer', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ input, type: 'traffic-analyzer' }),
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
          <h1>AI Traffic Analyzer</h1>
          <p>Intelligent traffic pattern analysis and optimization</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3><FiTrendingUp style={{ marginRight: '8px' }} /> Traffic Data Input</h3>
        <div className="quick-actions">
          {sampleInputs.map((s, i) => (
            <button key={i} onClick={() => setInput(s.data)}>{s.label}</button>
          ))}
        </div>
        <div className="form-group">
          <textarea
            className="form-control"
            rows={5}
            placeholder="Enter traffic data, patterns, or describe the traffic scenario you want to analyze..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !input.trim()}>
          {loading ? (
            <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing...</>
          ) : (
            <><FiZap /> Analyze Traffic</>
          )}
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">AI is analyzing traffic patterns...</span>
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
                <span>{item.type || 'Traffic Analysis'}</span>
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
