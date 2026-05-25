import React, { useState, useEffect } from 'react';
import { FiCpu, FiZap, FiClock, FiCheck, FiRotateCcw, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import AIResultDisplay from '../components/AIResultDisplay';
import Pagination from '../components/Pagination';

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

function OptimizationHistoryItem({ item, onApply, onRollback }) {
  const [expanded, setExpanded] = useState(false);
  const meta = (() => {
    try { return typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {}); } catch { return {}; }
  })();
  const status = meta.status;
  const hasStructured = meta.structured && meta.structured.suggestions && meta.structured.suggestions.length > 0;
  const [applying, setApplying] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const handleApply = async () => {
    setApplying(true); setActionMsg('');
    try {
      const res = await fetch(`/api/ai/apply-optimization/${item.id}`, { method: 'POST', headers: jsonHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setActionMsg(`Applied: ${data.applied?.length || 0} changes made.`);
      onApply && onApply();
    } catch (err) { setActionMsg(`Error: ${err.message}`); }
    setApplying(false);
  };

  const handleRollback = async () => {
    if (!window.confirm('Roll back this optimization?')) return;
    setRolling(true); setActionMsg('');
    try {
      const res = await fetch(`/api/ai/rollback-optimization/${item.id}`, { method: 'POST', headers: jsonHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setActionMsg(`Rolled back: ${data.rolledBack?.length || 0} changes reverted.`);
      onRollback && onRollback();
    } catch (err) { setActionMsg(`Error: ${err.message}`); }
    setRolling(false);
  };

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      marginBottom: '12px',
      overflow: 'hidden',
      background: 'var(--bg-card)',
    }}>
      <div
        style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(o => !o)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{item.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''} — Model: {item.model}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '12px' }}>
          {status && (
            <span className={`badge ${status === 'applied' ? 'badge-green' : status === 'rolled_back' ? 'badge-yellow' : ''}`} style={{ textTransform: 'capitalize' }}>
              {status}
            </span>
          )}
          {hasStructured && status !== 'applied' && status !== 'rolled_back' && (
            <button
              className="btn btn-primary"
              style={{ padding: '4px 12px', fontSize: '12px' }}
              onClick={e => { e.stopPropagation(); handleApply(); }}
              disabled={applying}
            >
              <FiCheck /> {applying ? 'Applying...' : 'Apply'}
            </button>
          )}
          {status === 'applied' && (
            <button
              style={{ background: 'none', border: '1px solid var(--accent-yellow)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-yellow)', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={e => { e.stopPropagation(); handleRollback(); }}
              disabled={rolling}
            >
              <FiRotateCcw /> {rolling ? 'Rolling back...' : 'Rollback'}
            </button>
          )}
        </div>
        <div style={{ color: 'var(--text-muted)' }}>{expanded ? <FiChevronDown /> : <FiChevronRight />}</div>
      </div>
      {actionMsg && (
        <div style={{ padding: '8px 16px', background: 'var(--bg-tertiary)', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}>
          {actionMsg}
        </div>
      )}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-color)' }}>
          {hasStructured && (
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Structured Suggestions</h4>
              {meta.structured.suggestions.map((s, i) => (
                <div key={i} style={{
                  background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                  marginBottom: '8px', fontSize: '13px',
                }}>
                  <strong style={{ color: 'var(--accent-cyan)' }}>Profile:</strong> {s.profileId}
                  {s.newBandwidth && <span style={{ marginLeft: '12px' }}><strong>Bandwidth:</strong> {s.newBandwidth} Mbps</span>}
                  {s.newLatency && <span style={{ marginLeft: '12px' }}><strong>Latency:</strong> {s.newLatency} ms</span>}
                  {s.reason && <p style={{ marginTop: '4px', color: 'var(--text-muted)' }}>{s.reason}</p>}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '12px' }}>
            <AIResultDisplay result={item} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIOptimizer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({});
  const [histPage, setHistPage] = useState(1);
  const [error, setError] = useState('');

  const [histLoading, setHistLoading] = useState(false);

  const fetchHistory = async (p = histPage) => {
    setHistLoading(true);
    try {
      const res = await fetch(`/api/ai/analyses?type=network-optimizer&page=${p}&limit=10`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data.data) ? data.data : []);
        setPagination(data.pagination || {});
      }
    } catch (e) { console.error(e); }
    setHistLoading(false);
  };

  useEffect(() => { fetchHistory(histPage); }, [histPage]);

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
      fetchHistory(1);
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

      {result && !loading && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Latest Result</h3>
            {result.structured && result.structured.suggestions && result.structured.suggestions.length > 0 && (
              <button
                className="btn btn-primary"
                style={{ fontSize: '13px' }}
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/ai/apply-optimization/${result.id}`, { method: 'POST', headers: jsonHeaders() });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error);
                    alert(`Applied ${d.applied?.length || 0} optimization(s) successfully.`);
                    fetchHistory(1);
                  } catch (e) { alert('Error: ' + e.message); }
                }}
              >
                <FiCheck /> Apply Optimization
              </button>
            )}
          </div>
          <AIResultDisplay result={result} />
        </div>
      )}

      {/* Optimization History with Apply/Rollback */}
      <div className="ai-history">
        <h3><FiClock style={{ marginRight: '8px' }} /> Optimization History</h3>
        {histLoading ? (
          <div className="loading-container"><div className="spinner" /><span className="loading-text">Loading history...</span></div>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No previous analyses found.</p>
        ) : (
          <>
            {history.map((item) => (
              <OptimizationHistoryItem
                key={item.id}
                item={item}
                onApply={() => fetchHistory(histPage)}
                onRollback={() => fetchHistory(histPage)}
              />
            ))}
            <Pagination
              page={histPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit || 10}
              onPageChange={setHistPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
