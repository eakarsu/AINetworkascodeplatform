import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiActivity } from 'react-icons/fi';
import DetailModal from '../components/DetailModal';

const API_URL = '/api/sla-monitors';
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });
const authHeader = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const fields = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'service', label: 'Service', type: 'text' },
  { key: 'targetUptime', label: 'Target Uptime (%)', type: 'number' },
  { key: 'currentUptime', label: 'Current Uptime (%)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'breached'] },
  { key: 'targetLatency', label: 'Target Latency', type: 'text' },
  { key: 'currentLatency', label: 'Current Latency', type: 'text' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

export default function SlaMonitors() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  const fetchData = async () => {
    try { const res = await fetch(API_URL, { headers: authHeader() }); if (res.ok) { const data = await res.json(); setItems(Array.isArray(data) ? data : []); } } catch (e) { console.error(e); } setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  const filtered = items.filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(search.toLowerCase())));
  const handleSave = async (data) => { try { const id = data._id || data.id; await fetch(`${API_URL}/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }); fetchData(); setSelected(null); } catch (e) { console.error(e); } };
  const handleDelete = async (id) => { try { await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: headers() }); fetchData(); setSelected(null); } catch (e) { console.error(e); } };
  const handleAdd = async (e) => { e.preventDefault(); setError(''); try { const res = await fetch(API_URL, { method: 'POST', headers: headers(), body: JSON.stringify(formData) }); if (res.ok) { fetchData(); setShowAdd(false); setFormData({}); } else { const d = await res.json(); setError(d.error || 'Failed'); } } catch (e) { setError(e.message); } };

  return (
    <div>
      <div className="page-header">
        <div><h1>SLA Monitors</h1><p>Service level agreement tracking and monitoring</p></div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setFormData({ status: 'active', targetUptime: 99.9 }); }}><FiPlus /> Add Monitor</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input"><FiSearch /><input placeholder="Search monitors..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} monitors</span>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><span className="loading-text">Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><FiActivity /><h3>No SLA monitors found</h3><p>Create your first SLA monitor</p></div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Service</th><th>Target Uptime</th><th>Current Uptime</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(item => {
                const meetsTarget = parseFloat(item.currentUptime) >= parseFloat(item.targetUptime);
                return (
                  <tr key={item._id || item.id} onClick={() => setSelected(item)}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</td>
                    <td>{item.service}</td>
                    <td>{item.targetUptime}%</td>
                    <td style={{ color: meetsTarget ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>{item.currentUptime}%</td>
                    <td><span className={`badge ${item.status === 'active' ? 'badge-green' : item.status === 'breached' ? 'badge-red' : 'badge-yellow'}`}>{item.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <DetailModal isOpen={!!selected} item={selected} fields={fields} title="SLA Monitor Details" onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add SLA Monitor</h2><button className="modal-close" onClick={() => setShowAdd(false)}>&times;</button></div>
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
