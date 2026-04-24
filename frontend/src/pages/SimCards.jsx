import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiCreditCard } from 'react-icons/fi';
import DetailModal from '../components/DetailModal';

const API_URL = '/api/sim-cards';
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });
const authHeader = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const fields = [
  { key: 'iccid', label: 'ICCID', type: 'text' },
  { key: 'imsi', label: 'IMSI', type: 'text' },
  { key: 'msisdn', label: 'MSISDN', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'suspended', 'provisioning'] },
  { key: 'networkSlice', label: 'Network Slice', type: 'text' },
  { key: 'device', label: 'Device', type: 'text' },
  { key: 'dataPlan', label: 'Data Plan', type: 'select', options: ['basic', 'standard', 'premium', 'enterprise', 'unlimited'] },
  { key: 'description', label: 'Description', type: 'textarea' },
];

export default function SimCards() {
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

  const planColors = { basic: 'badge-blue', standard: 'badge-cyan', premium: 'badge-purple', enterprise: 'badge-yellow', unlimited: 'badge-green' };

  return (
    <div>
      <div className="page-header">
        <div><h1>SIM Cards</h1><p>SIM card provisioning and management</p></div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setFormData({ status: 'active', dataPlan: 'standard' }); }}><FiPlus /> Add SIM</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input"><FiSearch /><input placeholder="Search SIM cards..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} SIMs</span>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><span className="loading-text">Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><FiCreditCard /><h3>No SIM cards found</h3><p>Provision your first SIM card</p></div>
        ) : (
          <table>
            <thead><tr><th>ICCID</th><th>IMSI</th><th>MSISDN</th><th>Status</th><th>Network Slice</th><th>Device</th><th>Data Plan</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id || item.id} onClick={() => setSelected(item)}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{item.iccid}</td>
                  <td style={{ fontFamily: 'monospace' }}>{item.imsi}</td>
                  <td>{item.msisdn}</td>
                  <td><span className={`badge ${item.status === 'active' ? 'badge-green' : item.status === 'suspended' ? 'badge-red' : 'badge-yellow'}`}>{item.status}</span></td>
                  <td>{item.networkSlice}</td>
                  <td>{item.device}</td>
                  <td><span className={`badge ${planColors[item.dataPlan] || 'badge-blue'}`}>{item.dataPlan}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DetailModal isOpen={!!selected} item={selected} fields={fields} title="SIM Card Details" onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add SIM Card</h2><button className="modal-close" onClick={() => setShowAdd(false)}>&times;</button></div>
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
                      <input type="text" className="form-control" value={formData[field.key] || ''} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))} />
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
