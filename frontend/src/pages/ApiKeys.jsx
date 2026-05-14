import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiKey, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import DetailModal from '../components/DetailModal';
import Pagination from '../components/Pagination';

const API_URL = '/api/api-keys';
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });
const authHeader = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const fields = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'keyPrefix', label: 'Key Prefix', type: 'text' },
  { key: 'developer', label: 'Developer', type: 'text' },
  { key: 'permissions', label: 'Permissions', type: 'select', options: ['read', 'write', 'admin', 'read-write'] },
  { key: 'rateLimit', label: 'Rate Limit (req/min)', type: 'number' },
  { key: 'callsToday', label: 'Calls Today', type: 'number' },
  { key: 'usageCount', label: 'Total Usage Count', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'revoked', 'expired'] },
  { key: 'expiresAt', label: 'Expires At', type: 'text' },
];

export default function ApiKeys() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [toggling, setToggling] = useState(null);

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

  const filtered = items.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(search.toLowerCase())));

  const handleSave = async (data) => {
    try {
      const id = data._id || data.id;
      await fetch(`${API_URL}/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
      fetchData(page);
      setSelected(null);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: headers() });
      fetchData(page);
      setSelected(null);
    } catch (e) { console.error(e); }
  };

  const handleAdd = async (e) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch(API_URL, { method: 'POST', headers: headers(), body: JSON.stringify(formData) });
      if (res.ok) { fetchData(page); setShowAdd(false); setFormData({}); }
      else { const d = await res.json(); setError(d.error || 'Failed'); }
    } catch (e) { setError(e.message); }
  };

  const handleToggle = async (item) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    setToggling(item.id || item._id);
    try {
      await fetch(`${API_URL}/${item.id || item._id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData(page);
    } catch (e) { console.error(e); }
    setToggling(null);
  };

  const permColors = { read: 'badge-blue', write: 'badge-yellow', admin: 'badge-red', 'read-write': 'badge-purple' };

  return (
    <div>
      <div className="page-header">
        <div><h1>API Keys</h1><p>Developer API key management, usage tracking, and access control</p></div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setFormData({ status: 'active', permissions: 'read' }); }}>
          <FiPlus /> Generate Key
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input"><FiSearch /><input placeholder="Search keys..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{pagination.total || 0} keys</span>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><span className="loading-text">Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><FiKey /><h3>No API keys found</h3><p>Generate your first API key</p></div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Key Prefix</th><th>Developer</th><th>Permissions</th>
                  <th>Rate Limit</th><th>Calls Today</th><th>Total Usage</th><th>Status</th><th>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item._id || item.id} onClick={() => setSelected(item)} style={{ cursor: 'pointer' }}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{item.keyPrefix}...</td>
                    <td>{item.developer}</td>
                    <td><span className={`badge ${permColors[item.permissions] || 'badge-blue'}`}>{item.permissions}</span></td>
                    <td>{item.rateLimit}/min</td>
                    <td>{(item.callsToday || 0).toLocaleString()}</td>
                    <td>{(item.usageCount || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${item.status === 'active' ? 'badge-green' : item.status === 'revoked' ? 'badge-red' : 'badge-yellow'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: item.status === 'active' ? 'var(--accent-green)' : 'var(--text-muted)',
                          fontSize: '20px', display: 'flex', alignItems: 'center',
                        }}
                        disabled={toggling === (item.id || item._id)}
                        onClick={e => { e.stopPropagation(); handleToggle(item); }}
                        title={item.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {item.status === 'active' ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit || 20} onPageChange={setPage} />
          </>
        )}
      </div>

      <DetailModal isOpen={!!selected} item={selected} fields={fields} title="API Key Details" onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Generate API Key</h2><button className="modal-close" onClick={() => setShowAdd(false)}>&times;</button></div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {error && <div className="login-error">{error}</div>}
                {fields.filter(f => !f.readOnly && f.key !== 'usageCount').map(field => (
                  <div key={field.key} className="form-group">
                    <label>{field.label}</label>
                    {field.type === 'select' ? (
                      <select className="form-control" value={formData[field.key] || ''} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}>
                        <option value="">Select...</option>{field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={field.type === 'number' ? 'number' : 'text'} className="form-control" value={formData[field.key] || ''} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><FiPlus /> Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
