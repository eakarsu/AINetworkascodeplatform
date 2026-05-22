import React, { useEffect, useState } from 'react';

const EMPTY = { name: '', source: 'any', destination: 'any', port: 0, protocol: 'tcp', action: 'allow', priority: 100, enabled: true };

export default function PolicyRulesEditor() {
  const [rules, setRules] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const res = await fetch('/api/custom-views/policy-rules', { headers: headers() });
      const j = await res.json();
      setRules(j.rules || []);
    } catch (e) { setErr(String(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.name) { setErr('Name required'); return; }
    setErr('');
    const url = editingId ? `/api/custom-views/policy-rules/${editingId}` : '/api/custom-views/policy-rules';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(draft) });
    if (!res.ok) { setErr(`Save failed: ${res.status}`); return; }
    setDraft(EMPTY); setEditingId(null); load();
  };

  const remove = async (id) => {
    if (!confirm(`Delete rule ${id}?`)) return;
    await fetch(`/api/custom-views/policy-rules/${id}`, { method: 'DELETE', headers: headers() });
    load();
  };

  const edit = (r) => { setEditingId(r.id); setDraft({ ...r }); };
  const cancel = () => { setEditingId(null); setDraft(EMPTY); };

  return (
    <div style={{ background: '#0f172a', borderRadius: 10, padding: 16, color: '#e2e8f0' }}>
      <strong>Network Policy Rules</strong>
      {err && <div style={{ color: '#fca5a5', marginTop: 8 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
        <input placeholder="Name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={inp} />
        <input placeholder="Source CIDR" value={draft.source} onChange={e => setDraft({ ...draft, source: e.target.value })} style={inp} />
        <input placeholder="Destination CIDR" value={draft.destination} onChange={e => setDraft({ ...draft, destination: e.target.value })} style={inp} />
        <input placeholder="Port" type="number" value={draft.port} onChange={e => setDraft({ ...draft, port: Number(e.target.value) })} style={inp} />
        <select value={draft.protocol} onChange={e => setDraft({ ...draft, protocol: e.target.value })} style={inp}>
          <option>tcp</option><option>udp</option><option>icmp</option>
        </select>
        <select value={draft.action} onChange={e => setDraft({ ...draft, action: e.target.value })} style={inp}>
          <option>allow</option><option>deny</option><option>mark-dscp-46</option>
        </select>
        <input placeholder="Priority" type="number" value={draft.priority} onChange={e => setDraft({ ...draft, priority: Number(e.target.value) })} style={inp} />
        <label style={{ alignSelf: 'center' }}><input type="checkbox" checked={draft.enabled} onChange={e => setDraft({ ...draft, enabled: e.target.checked })} /> Enabled</label>
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button onClick={save} style={btnPrimary}>{editingId ? 'Update Rule' : 'Add Rule'}</button>
        {editingId && <button onClick={cancel} style={btnSecondary}>Cancel</button>}
      </div>

      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#1e293b' }}>
            {['ID', 'Name', 'Source', 'Dest', 'Port', 'Proto', 'Action', 'Pri', 'On', ''].map(h => (
              <th key={h} style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #334155' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan="10" style={{ padding: 12 }}>Loading...</td></tr>}
          {rules.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={td}>{r.id}</td>
              <td style={td}>{r.name}</td>
              <td style={td}>{r.source}</td>
              <td style={td}>{r.destination}</td>
              <td style={td}>{r.port}</td>
              <td style={td}>{r.protocol}</td>
              <td style={td}>{r.action}</td>
              <td style={td}>{r.priority}</td>
              <td style={td}>{r.enabled ? 'yes' : 'no'}</td>
              <td style={td}>
                <button onClick={() => edit(r)} style={btnLink}>edit</button>{' '}
                <button onClick={() => remove(r.id)} style={btnLinkDanger}>del</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inp = { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 4, padding: '6px 8px' };
const btnPrimary = { background: '#2563eb', color: '#fff', border: 0, padding: '8px 14px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 };
const btnSecondary = { background: '#475569', color: '#fff', border: 0, padding: '8px 14px', borderRadius: 4, cursor: 'pointer' };
const btnLink = { background: 'transparent', color: '#60a5fa', border: 0, cursor: 'pointer', textDecoration: 'underline' };
const btnLinkDanger = { background: 'transparent', color: '#fca5a5', border: 0, cursor: 'pointer', textDecoration: 'underline' };
const td = { padding: 8 };
