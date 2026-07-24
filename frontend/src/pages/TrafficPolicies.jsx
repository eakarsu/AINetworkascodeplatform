import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiShield } from 'react-icons/fi';
import Pagination from '../components/Pagination';
import DetailModal from '../components/DetailModal';

const API_URL = '/api/traffic-policies';
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });
const authHeader = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const fields = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'type', label: 'Type', type: 'select', options: ['rate-limiting', 'traffic-shaping', 'access-control', 'qos-marking', 'load-balancing'] },
  { key: 'priority', label: 'Priority', type: 'number' },
  { key: 'source', label: 'Source', type: 'text' },
  { key: 'destination', label: 'Destination', type: 'text' },
  { key: 'action', label: 'Action', type: 'select', options: ['allow', 'deny', 'throttle', 'redirect', 'mark'] },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'testing'] },
  { key: 'description', label: 'Description', type: 'textarea' },
];

export default function TrafficPolicies() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  const fetchData = async (p = page) => {
    try { const res = await fetch(`${API_URL}?page=${p}&limit=20`, { headers: authHeader() }); if (res.ok) { const data = await res.json(); setItems(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])); setPagination(data.pagination || {}); } } catch (e) { console.error(e); } setLoading(false);
  };
  useEffect(() => { fetchData(page); }, [page]);
  const filtered = items.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(search.toLowerCase())));
  const handleSave = async (data) => { try { const id = data._id || data.id; const res = await fetch(`${API_URL}/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }); if (res.ok) { fetchData(page); setSelected(null); } } catch (e) { console.error(e); } };
  const handleDelete = async (id) => { try { const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: headers() }); if (res.ok) { fetchData(page); setSelected(null); } } catch (e) { console.error(e); } };
  const handleAdd = async (e) => { e.preventDefault(); setError(''); try { const res = await fetch(API_URL, { method: 'POST', headers: headers(), body: JSON.stringify(formData) }); if (res.ok) { fetchData(1); setShowAdd(false); setFormData({}); } else { const d = await res.json(); setError(d.error || 'Failed'); } } catch (e) { setError(e.message); } };

  const actionColors = { allow: 'badge-green', deny: 'badge-red', throttle: 'badge-yellow', redirect: 'badge-blue', mark: 'badge-purple' };

  return (
    <div>
      <div className="page-header">
        <div><h1>Traffic Policies</h1><p>Network traffic rules and policy management</p></div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setFormData({ status: 'active', action: 'allow', type: 'rate-limiting' }); }}><FiPlus /> Add Policy</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input"><FiSearch /><input placeholder="Search policies..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} policies</span>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><span className="loading-text">Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><FiShield /><h3>No policies found</h3><p>Create your first traffic policy</p></div>
        ) : (
          <>
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Priority</th><th>Source</th><th>Destination</th><th>Action</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id || item.id} onClick={() => setSelected(item)}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</td>
                  <td><span className="badge badge-cyan">{item.type}</span></td>
                  <td>{item.priority}</td>
                  <td style={{ fontFamily: 'monospace' }}>{item.source}</td>
                  <td style={{ fontFamily: 'monospace' }}>{item.destination}</td>
                  <td><span className={`badge ${actionColors[item.action] || 'badge-blue'}`}>{item.action}</span></td>
                  <td><span className={`badge ${item.status === 'active' ? 'badge-green' : item.status === 'inactive' ? 'badge-red' : 'badge-yellow'}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
            <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit || 20} onPageChange={setPage} />
          </>
        )}
      </div>

      <DetailModal isOpen={!!selected} item={selected} fields={fields} title="Traffic Policy Details" onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Traffic Policy</h2><button className="modal-close" onClick={() => setShowAdd(false)}>&times;</button></div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {error && <div className="login-error">{error}</div>}
                {fields.filter(f => !f.readOnly).map(field => (
                  <div key={field.key} className="form-group">
                    <label>{field.label}</label>
                    {field.type === 'select' ? (
                      <select className="form-control" value={formData[field.key] || ''} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}><option value="">Select...</option>{field.options.map(o => <option key={o} value={o}>{o}</option>)}</select>
                    ) : field.type === 'textarea' ? (
                      <textarea className="form-control" value={formData[field.key] || ''} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))} />
                    ) : (
                      <input type={field.type === 'number' ? 'number' : 'text'} className="form-control" value={formData[field.key] || ''} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><FiPlus /> Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
