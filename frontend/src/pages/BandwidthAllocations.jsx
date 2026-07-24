import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiBarChart2 } from 'react-icons/fi';
import Pagination from '../components/Pagination';
import DetailModal from '../components/DetailModal';

const API_URL = '/api/bandwidth-allocations';
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });
const authHeader = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const fields = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'allocatedBandwidth', label: 'Allocated (Gbps)', type: 'number' },
  { key: 'usedBandwidth', label: 'Used (Gbps)', type: 'number' },
  { key: 'networkSlice', label: 'Network Slice', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'overprovisioned'] },
  { key: 'description', label: 'Description', type: 'textarea' },
];

export default function BandwidthAllocations() {
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
  const handleSave = async (data) => { try { const id = data._id || data.id; await fetch(`${API_URL}/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }); fetchData(page); setSelected(null); } catch (e) { console.error(e); } };
  const handleDelete = async (id) => { try { await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: headers() }); fetchData(page); setSelected(null); } catch (e) { console.error(e); } };
  const handleAdd = async (e) => { e.preventDefault(); setError(''); try { const res = await fetch(API_URL, { method: 'POST', headers: headers(), body: JSON.stringify(formData) }); if (res.ok) { fetchData(1); setShowAdd(false); setFormData({}); } else { const d = await res.json(); setError(d.error || 'Failed'); } } catch (e) { setError(e.message); } };

  const getUtilization = (item) => {
    if (!item.allocatedBandwidth || item.allocatedBandwidth === 0) return 0;
    return Math.round((item.usedBandwidth / item.allocatedBandwidth) * 100);
  };
  const getUtilColor = (pct) => pct > 90 ? 'red' : pct > 70 ? 'yellow' : 'green';

  return (
    <div>
      <div className="page-header">
        <div><h1>Bandwidth Allocations</h1><p>Manage bandwidth allocation across network slices</p></div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setFormData({ status: 'active' }); }}><FiPlus /> Add Allocation</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input"><FiSearch /><input placeholder="Search allocations..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} allocations</span>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><span className="loading-text">Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><FiBarChart2 /><h3>No allocations found</h3><p>Create your first bandwidth allocation</p></div>
        ) : (
          <>
          <table>
            <thead><tr><th>Name</th><th>Allocated</th><th>Used</th><th>Utilization</th><th>Network Slice</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(item => {
                const pct = getUtilization(item);
                return (
                  <tr key={item._id || item.id} onClick={() => setSelected(item)}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</td>
                    <td>{item.allocatedBandwidth} Gbps</td>
                    <td>{item.usedBandwidth} Gbps</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar" style={{ width: '80px' }}>
                          <div className={`progress-fill ${getUtilColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span style={{ color: pct > 90 ? 'var(--accent-red)' : 'var(--text-secondary)', fontWeight: pct > 90 ? 600 : 400 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>{item.networkSlice}</td>
                    <td><span className={`badge ${item.status === 'active' ? 'badge-green' : item.status === 'inactive' ? 'badge-red' : 'badge-yellow'}`}>{item.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit || 20} onPageChange={setPage} />
          </>
        )}
      </div>

      <DetailModal isOpen={!!selected} item={selected} fields={fields} title="Bandwidth Allocation Details" onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Bandwidth Allocation</h2><button className="modal-close" onClick={() => setShowAdd(false)}>&times;</button></div>
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
