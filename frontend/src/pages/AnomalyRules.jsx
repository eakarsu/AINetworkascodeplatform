import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiAlertOctagon, FiPlay, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import Pagination from '../components/Pagination';

const API_URL = '/api/anomaly-rules';
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });
const authHeader = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const OPERATORS = ['>', '<', '>=', '<=', '='];
const ACTIONS = ['alert', 'throttle', 'isolate', 'notify', 'log'];

const emptyForm = { name: '', metric: '', operator: '>', threshold: '', action: 'alert', enabled: true };

export default function AnomalyRules() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [evaluating, setEvaluating] = useState(null);
  const [evalResults, setEvalResults] = useState({});

  const fetchData = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?page=${p}&limit=20`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data.data) ? data.data : []);
        setPagination(data.pagination || {});
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(page); }, [page]);

  const filtered = items.filter(i =>
    Object.values(i).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async (e) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch(API_URL, { method: 'POST', headers: headers(), body: JSON.stringify(formData) });
      if (res.ok) { fetchData(); setShowAdd(false); setFormData(emptyForm); }
      else { const d = await res.json(); setError(d.error || 'Failed'); }
    } catch (e) { setError(e.message); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch(`${API_URL}/${editItem.id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(formData) });
      if (res.ok) { fetchData(); setEditItem(null); setFormData(emptyForm); }
      else { const d = await res.json(); setError(d.error || 'Failed'); }
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: headers() });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleEvaluate = async (rule) => {
    setEvaluating(rule.id);
    setEvalResults(prev => ({ ...prev, [rule.id]: null }));
    try {
      const res = await fetch(`${API_URL}/${rule.id}/evaluate`, { method: 'POST', headers: headers() });
      const data = await res.json();
      setEvalResults(prev => ({ ...prev, [rule.id]: data }));
    } catch (e) {
      setEvalResults(prev => ({ ...prev, [rule.id]: { error: e.message } }));
    }
    setEvaluating(null);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      name: item.name, metric: item.metric, operator: item.operator,
      threshold: item.threshold, action: item.action, enabled: item.enabled,
    });
    setError('');
  };

  const FormFields = () => (
    <>
      {error && <div className="login-error">{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label>Rule Name *</label>
          <input className="form-control" required value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Metric Name *</label>
          <input className="form-control" required value={formData.metric} onChange={e => setFormData(f => ({ ...f, metric: e.target.value }))} placeholder="e.g. bandwidth, latency" />
        </div>
        <div className="form-group">
          <label>Operator *</label>
          <select className="form-control" value={formData.operator} onChange={e => setFormData(f => ({ ...f, operator: e.target.value }))}>
            {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Threshold *</label>
          <input className="form-control" type="number" required value={formData.threshold} onChange={e => setFormData(f => ({ ...f, threshold: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Action *</label>
          <select className="form-control" value={formData.action} onChange={e => setFormData(f => ({ ...f, action: e.target.value }))}>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Enabled</label>
          <select className="form-control" value={formData.enabled ? 'true' : 'false'} onChange={e => setFormData(f => ({ ...f, enabled: e.target.value === 'true' }))}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div><h1>Anomaly Rules</h1><p>Define threshold-based rules to trigger network event detection and AI root-cause analysis</p></div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setFormData(emptyForm); setError(''); }}>
          <FiPlus /> Add Rule
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input"><FiSearch /><input placeholder="Search rules..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{pagination.total || 0} rules</span>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><span className="loading-text">Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><FiAlertOctagon /><h3>No anomaly rules found</h3><p>Create your first rule to start monitoring</p></div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Metric</th><th>Condition</th><th>Action</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <React.Fragment key={item.id}>
                    <tr>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.metric}</td>
                      <td>
                        <span style={{
                          fontFamily: 'monospace', fontSize: '12px',
                          background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px',
                        }}>
                          {item.metric} {item.operator} {item.threshold}
                        </span>
                      </td>
                      <td><span className="badge badge-yellow">{item.action}</span></td>
                      <td>
                        <span className={`badge ${item.enabled ? 'badge-green' : 'badge-red'}`}>
                          {item.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => handleEvaluate(item)}
                            disabled={evaluating === item.id}
                          >
                            {evaluating === item.id ? '...' : <><FiPlay /> Evaluate</>}
                          </button>
                          <button
                            style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', padding: '4px 8px', cursor: 'pointer' }}
                            onClick={() => openEdit(item)}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            style={{ background: 'none', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-red)', padding: '4px 8px', cursor: 'pointer' }}
                            onClick={() => handleDelete(item.id)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {evalResults[item.id] && (
                      <tr>
                        <td colSpan={6} style={{ padding: '0 16px 12px' }}>
                          <div style={{
                            background: evalResults[item.id].triggered ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)',
                            border: `1px solid ${evalResults[item.id].triggered ? 'var(--accent-red)' : 'var(--accent-green)'}`,
                            borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '13px',
                          }}>
                            {evalResults[item.id].error ? (
                              <span style={{ color: 'var(--accent-red)' }}>{evalResults[item.id].error}</span>
                            ) : (
                              <>
                                <strong style={{ color: evalResults[item.id].triggered ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                                  {evalResults[item.id].triggered ? 'TRIGGERED' : 'OK'} — checked {evalResults[item.id].checkedRows} rows, {evalResults[item.id].triggeredCount || 0} violations
                                </strong>
                                {evalResults[item.id].aiRootCause && (
                                  <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
                                    <strong>AI Root Cause:</strong> {evalResults[item.id].aiRootCause}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit || 20} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Anomaly Rule</h2><button className="modal-close" onClick={() => setShowAdd(false)}>&times;</button></div>
            <form onSubmit={handleAdd}>
              <div className="modal-body"><FormFields /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><FiPlus /> Create Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Edit Rule: {editItem.name}</h2><button className="modal-close" onClick={() => setEditItem(null)}>&times;</button></div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body"><FormFields /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><FiCheck /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
