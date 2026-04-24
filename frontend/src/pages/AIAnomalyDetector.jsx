import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiZap, FiClock } from 'react-icons/fi';
import AIResultDisplay from '../components/AIResultDisplay';

const authHeader = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });
const jsonHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const sampleInputs = [
  {
    label: 'Latency Spike Detection',
    data: 'Network metrics for last hour: Avg latency jumped from 8ms to 45ms on URLLC slice. Packet loss increased from 0.01% to 2.3%. Jitter went from 1ms to 12ms. Edge node EU-Central-1 showing 98% CPU utilization. 15 devices reported connectivity issues. Detect anomalies and identify root cause.',
  },
  {
    label: 'Bandwidth Anomaly',
    data: 'Unusual bandwidth consumption pattern detected: Slice "IoT-Industrial" normally uses 50Gbps, currently at 180Gbps. No new devices registered. Traffic is predominantly outbound. Top 3 source devices account for 70% of traffic. Normal device count: 5000, current active: 5002. Analyze for potential security breach or device malfunction.',
  },
  {
    label: 'Device Behavior Anomaly',
    data: 'Device fleet analysis: 50 IoT sensors in Zone-A reporting data every 100ms instead of normal 5-second intervals. Signal strength normal. Battery levels dropping 10x faster. Adjacent Zone-B and Zone-C operating normally. Firmware version: 2.3.1 across all zones. Detect anomalies and recommend remediation.',
  },
  {
    label: 'SLA Violation Pattern',
    data: 'SLA violations trending upward: Week 1: 2 violations, Week 2: 5 violations, Week 3: 12 violations, Week 4: 23 violations. All violations related to uptime target (99.99%). Affected services: enterprise VPN, video conferencing, IoT telemetry. Edge locations involved: US-East-1, US-East-2. Detect pattern and predict next week violations.',
  },
];

export default function AIAnomalyDetector() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [selectedHistory, setSelectedHistory] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/analyses?type=anomaly-detector', { headers: authHeader() });
      if (res.ok) { const data = await res.json(); setHistory(Array.isArray(data) ? data : []); }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/ai/anomaly-detector', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ input, type: 'anomaly-detector' }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Detection failed'); }
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
          <h1>AI Anomaly Detector</h1>
          <p>Real-time anomaly detection and root cause analysis</p>
        </div>
      </div>

      <div className="ai-input-section">
        <h3><FiAlertTriangle style={{ marginRight: '8px' }} /> Network Metrics Input</h3>
        <div className="quick-actions">
          {sampleInputs.map((s, i) => (
            <button key={i} onClick={() => setInput(s.data)}>{s.label}</button>
          ))}
        </div>
        <div className="form-group">
          <textarea
            className="form-control"
            rows={5}
            placeholder="Enter network metrics, describe unusual behavior, or paste monitoring data for anomaly detection..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !input.trim()}>
          {loading ? (
            <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Detecting...</>
          ) : (
            <><FiZap /> Detect Anomalies</>
          )}
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">AI is scanning for anomalies...</span>
        </div>
      )}

      {result && !loading && <AIResultDisplay result={result} />}

      {selectedHistory && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Historical Detection Result
          </h3>
          <AIResultDisplay result={selectedHistory} />
        </div>
      )}

      <div className="ai-history">
        <h3><FiClock style={{ marginRight: '8px' }} /> Detection History</h3>
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No previous detections found.</p>
        ) : (
          history.map((item, i) => (
            <div key={item._id || i} className="ai-history-item" onClick={() => setSelectedHistory(item)}>
              <div className="history-meta">
                <span>{item.type || 'Anomaly Detection'}</span>
                <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</span>
              </div>
              <div className="history-preview">{item.input || item.query || 'Detection result'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
