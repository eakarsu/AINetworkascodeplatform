import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiPieChart, FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Pagination from '../components/Pagination';
import DetailModal from '../components/DetailModal';

const API_URL = '/api/usage-analytics';
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') });
const authHeader = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const fields = [
  { key: 'metricName', label: 'Metric', type: 'text' },
  { key: 'category', label: 'Category', type: 'select', options: ['bandwidth', 'latency', 'devices', 'api-calls', 'traffic', 'storage'] },
  { key: 'value', label: 'Value', type: 'number' },
  { key: 'unit', label: 'Unit', type: 'text' },
  { key: 'period', label: 'Period', type: 'select', options: ['hourly', 'daily', 'weekly', 'monthly'] },
  { key: 'trend', label: 'Trend', type: 'select', options: ['up', 'down', 'flat'] },
  { key: 'details', label: 'Details', type: 'textarea' },
];

const trendIcon = (trend) => {
  if (trend === 'up') return <span className="trend-up"><FiTrendingUp /> Up</span>;
  if (trend === 'down') return <span className="trend-down"><FiTrendingDown /> Down</span>;
  return <span className="trend-flat"><FiMinus /> Flat</span>;
};

export default function UsageAnalytics() {
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

  const chartData = items.slice(0, 10).map(i => ({ name: i.metricName ? i.metricName.substring(0, 15) : 'N/A', value: parseFloat(i.value) || 0 }));

  return (
    <div>
      <div className="page-header">
        <div><h1>Usage Analytics</h1><p>Platform usage metrics and trends</p></div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setFormData({ period: 'daily', trend: 'flat', category: 'bandwidth' }); }}><FiPlus /> Add Metric</button>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="chart-container">
            <h3>Metrics Overview (Bar)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4f" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #2d3a4f', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container">
            <h3>Metrics Trend (Line)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4f" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #2d3a4f', borderRadius: '8px', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input"><FiSearch /><input placeholder="Search metrics..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} metrics</span>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner" /><span className="loading-text">Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><FiPieChart /><h3>No metrics found</h3><p>Add your first usage metric</p></div>
        ) : (
          <table>
            <thead><tr><th>Metric</th><th>Category</th><th>Value</th><th>Unit</th><th>Period</th><th>Trend</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id || item.id} onClick={() => setSelected(item)}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.metricName}</td>
                  <td><span className="badge badge-cyan">{item.category}</span></td>
                  <td style={{ fontWeight: 600 }}>{item.value}</td>
                  <td>{item.unit}</td>
                  <td>{item.period}</td>
                  <td>{trendIcon(item.trend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
            <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit || 20} onPageChange={setPage} />
        )
        }
      </div>

      <DetailModal isOpen={!!selected} item={selected} fields={fields} title="Analytics Details" onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Usage Metric</h2><button className="modal-close" onClick={() => setShowAdd(false)}>&times;</button></div>
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
