import React, { useState } from 'react';

export default function NetworkChangeReport() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const download = async () => {
    setBusy(true); setMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/custom-views/change-report', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'network-change-report.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setMsg('Report downloaded.');
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: '#0f172a', borderRadius: 10, padding: 16, color: '#e2e8f0' }}>
      <strong>Network Change Report (PDF)</strong>
      <p style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>
        Generates a 1-page PDF summary of recent device changes (OSPF, BGP, ACL, VLAN, SSID) and rollbacks.
      </p>
      <button
        onClick={download}
        disabled={busy}
        style={{ background: '#2563eb', color: '#fff', border: 0, padding: '10px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
      >
        {busy ? 'Generating...' : 'Download PDF'}
      </button>
      {msg && <div style={{ marginTop: 10, fontSize: 13 }}>{msg}</div>}
    </div>
  );
}
