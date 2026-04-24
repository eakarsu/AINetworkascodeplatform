import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiLayers } from 'react-icons/fi';
import DetailModal from '../components/DetailModal';

const API_URL = '/api/network-slices';
const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + localStorage.getItem('token'),
});

const fields = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'type', label: 'Type', type: 'select', options: ['eMBB', 'URLLC', 'mMTC'] },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'provisioning'] },
  { key: 'maxBandwidth', label: 'Max Bandwidth (Gbps)', type: 'number' },
  { key: 'latency', label: 'Latency (ms)', type: 'number' },
  { key: 'connectedDevices', label: 'Connected Devices', type: 'number' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

const typeColors = { eMBB: 'badge-blue', URLLC: 'badge-purple', mMTC: 'badge-green' };

export default function NetworkSlices() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch(API_URL, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
      if (res.ok) { const data = await res.json(); setItems(Array.isArray(data) ? data : []); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = items.filter(i =>
    Object.values(i).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async (data) => {
    try {
      const id = data._id || data.id;
      const res = await fetch(`${API_URL}/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
      if (res.ok) { fetchData(); setSelected(null); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: headers() });
      if (res.ok) { fetchData(); setSelected(null); }
    } catch (e) { console.error(e); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(API_URL, { method: 'POST', headers: headers(), body: JSON.stringify(formData) });
      if (res.ok) { fetchData(); setShowAdd(false); setFormData({}); }
      else { const d = await res.json(); setError(d.error || 'Failed to create'); }
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Network Slices</h1>
          <p>Manage 5G network slices for different service types</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setFormData({ type: 'eMBB', status: 'active' }); }}>
          <FiPlus /> Add Slice
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input">
            <FiSearch />
            <input placeholder="Search slices..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} slices</span>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><span className="loading-text">Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><FiLayers /><h3>No network slices found</h3><p>Create your first network slice to get started</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Type</th><th>Status</th><th>Max Bandwidth</th><th>Latency</th><th>Devices</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id || item.id} onClick={() => setSelected(item)}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</td>
                  <td><span className={`badge ${typeColors[item.type] || 'badge-blue'}`}>{item.type}</span></td>
                  <td><span className={`badge ${item.status === 'active' ? 'badge-green' : item.status === 'inactive' ? 'badge-red' : 'badge-yellow'}`}>{item.status}</span></td>
                  <td>{item.maxBandwidth} Gbps</td>
                  <td>{item.latency} ms</td>
                  <td>{item.connectedDevices || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DetailModal
        isOpen={!!selected}
        item={selected}
        fields={fields}
        title="Network Slice Details"
        onClose={() => setSelected(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Network Slice</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>&times;</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {error && <div className="login-error">{error}</div>}
                {fields.filter(f => !f.readOnly).map(field => (
                  <div key={field.key} className="form-group">
                    <label>{field.label}</label>
                    {field.type === 'select' ? (
                      <select className="form-control" value={formData[field.key] || ''} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}>
                        <option value="">Select...</option>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
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
