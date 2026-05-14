import React, { useState } from 'react';
import { FiWifi, FiSmartphone, FiRefreshCw, FiPhone, FiChevronDown, FiChevronUp, FiZap } from 'react-icons/fi';

const jsonHeaders = (apiKey) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`,
});

function ResultBox({ result, error }) {
  if (!result && !error) return null;
  return (
    <div style={{
      marginTop: '12px',
      padding: '14px',
      borderRadius: 'var(--radius-md)',
      background: error ? 'rgba(239,68,68,0.08)' : 'rgba(6,182,212,0.06)',
      border: `1px solid ${error ? 'var(--accent-red)' : 'var(--border-color)'}`,
      fontFamily: 'monospace',
      fontSize: '12px',
      color: error ? 'var(--accent-red)' : 'var(--text-secondary)',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      maxHeight: '300px',
      overflowY: 'auto',
    }}>
      {error || JSON.stringify(result, null, 2)}
    </div>
  );
}

function ApiCard({ title, icon: Icon, description, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="table-container" style={{ marginBottom: '16px' }}>
      <div
        style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: 'var(--radius-sm)',
            background: 'var(--gradient-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '16px',
          }}>
            <Icon />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)' }}>{open ? <FiChevronUp /> : <FiChevronDown />}</div>
      </div>
      {open && (
        <div style={{ padding: '0 20px 20px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function CamaraApis() {
  const [apiKey, setApiKey] = useState('');

  // QoD Session
  const [qodForm, setQodForm] = useState({ deviceId: '', qosProfileId: '', duration: 3600 });
  const [qodResult, setQodResult] = useState(null);
  const [qodError, setQodError] = useState('');
  const [qodLoading, setQodLoading] = useState(false);

  // Device Status
  const [deviceId, setDeviceId] = useState('');
  const [deviceResult, setDeviceResult] = useState(null);
  const [deviceError, setDeviceError] = useState('');
  const [deviceLoading, setDeviceLoading] = useState(false);

  // SIM Swap
  const [simForm, setSimForm] = useState({ msisdn: '', maxAgeHours: 24 });
  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState('');
  const [simLoading, setSimLoading] = useState(false);

  // Number Verify
  const [nvForm, setNvForm] = useState({ msisdn: '', deviceId: '' });
  const [nvResult, setNvResult] = useState(null);
  const [nvError, setNvError] = useState('');
  const [nvLoading, setNvLoading] = useState(false);

  const handleQod = async (e) => {
    e.preventDefault();
    setQodLoading(true); setQodError(''); setQodResult(null);
    try {
      const res = await fetch('/api/camara/qod/sessions', {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({ deviceId: qodForm.deviceId, qosProfileId: qodForm.qosProfileId, duration: Number(qodForm.duration) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setQodResult(data);
    } catch (err) { setQodError(err.message); }
    setQodLoading(false);
  };

  const handleDeviceStatus = async (e) => {
    e.preventDefault();
    setDeviceLoading(true); setDeviceError(''); setDeviceResult(null);
    try {
      const res = await fetch(`/api/camara/device-status/${deviceId}`, { headers: jsonHeaders(apiKey) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setDeviceResult(data);
    } catch (err) { setDeviceError(err.message); }
    setDeviceLoading(false);
  };

  const handleSimSwap = async (e) => {
    e.preventDefault();
    setSimLoading(true); setSimError(''); setSimResult(null);
    try {
      const res = await fetch('/api/camara/sim-swap/check', {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({ msisdn: simForm.msisdn, maxAgeHours: Number(simForm.maxAgeHours) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setSimResult(data);
    } catch (err) { setSimError(err.message); }
    setSimLoading(false);
  };

  const handleNumberVerify = async (e) => {
    e.preventDefault();
    setNvLoading(true); setNvError(''); setNvResult(null);
    try {
      const res = await fetch('/api/camara/number-verify', {
        method: 'POST',
        headers: jsonHeaders(apiKey),
        body: JSON.stringify({ msisdn: nvForm.msisdn, deviceId: nvForm.deviceId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setNvResult(data);
    } catch (err) { setNvError(err.message); }
    setNvLoading(false);
  };

  const inputStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    fontSize: '13px',
    width: '100%',
  };

  const labelStyle = { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>CAMARA APIs</h1>
          <p>GSMA Open Gateway / CAMARA API conformance layer — test endpoints with your API key</p>
        </div>
      </div>

      {/* API Key input */}
      <div className="table-container" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FiZap style={{ color: 'var(--accent-cyan)' }} />
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>API Key</span>
          <input
            style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
            placeholder="Enter your API key (key_prefix from API Keys page)"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', marginLeft: '28px' }}>
          CAMARA endpoints use API-key authentication (not JWT). Enter a key_prefix from your API Keys.
        </p>
      </div>

      {/* QoD Sessions */}
      <ApiCard
        title="POST /api/camara/qod/sessions"
        icon={FiWifi}
        description="Quality-on-Demand: Create a QoS session for a device"
      >
        <form onSubmit={handleQod}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Device ID *</label>
              <input style={inputStyle} required value={qodForm.deviceId} onChange={e => setQodForm(f => ({ ...f, deviceId: e.target.value }))} placeholder="UUID of device" />
            </div>
            <div>
              <label style={labelStyle}>QoS Profile ID *</label>
              <input style={inputStyle} required value={qodForm.qosProfileId} onChange={e => setQodForm(f => ({ ...f, qosProfileId: e.target.value }))} placeholder="UUID or name" />
            </div>
            <div>
              <label style={labelStyle}>Duration (seconds)</label>
              <input style={inputStyle} type="number" value={qodForm.duration} onChange={e => setQodForm(f => ({ ...f, duration: e.target.value }))} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={qodLoading || !apiKey}>
            {qodLoading ? 'Creating...' : 'Create QoD Session'}
          </button>
        </form>
        <ResultBox result={qodResult} error={qodError} />
      </ApiCard>

      {/* Device Status */}
      <ApiCard
        title="GET /api/camara/device-status/:deviceId"
        icon={FiSmartphone}
        description="Retrieve device connectivity status"
      >
        <form onSubmit={handleDeviceStatus} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Device ID *</label>
            <input style={inputStyle} required value={deviceId} onChange={e => setDeviceId(e.target.value)} placeholder="UUID of device" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={deviceLoading || !apiKey} style={{ whiteSpace: 'nowrap' }}>
            {deviceLoading ? 'Checking...' : 'Check Status'}
          </button>
        </form>
        <ResultBox result={deviceResult} error={deviceError} />
      </ApiCard>

      {/* SIM Swap Check */}
      <ApiCard
        title="POST /api/camara/sim-swap/check"
        icon={FiRefreshCw}
        description="Check if SIM was recently swapped for a given MSISDN"
      >
        <form onSubmit={handleSimSwap}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>MSISDN *</label>
              <input style={inputStyle} required value={simForm.msisdn} onChange={e => setSimForm(f => ({ ...f, msisdn: e.target.value }))} placeholder="+1234567890" />
            </div>
            <div>
              <label style={labelStyle}>Max Age (hours)</label>
              <input style={inputStyle} type="number" value={simForm.maxAgeHours} onChange={e => setSimForm(f => ({ ...f, maxAgeHours: e.target.value }))} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={simLoading || !apiKey}>
            {simLoading ? 'Checking...' : 'Check SIM Swap'}
          </button>
        </form>
        <ResultBox result={simResult} error={simError} />
      </ApiCard>

      {/* Number Verify */}
      <ApiCard
        title="POST /api/camara/number-verify"
        icon={FiPhone}
        description="Verify that a phone number matches a device record"
      >
        <form onSubmit={handleNumberVerify}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>MSISDN *</label>
              <input style={inputStyle} required value={nvForm.msisdn} onChange={e => setNvForm(f => ({ ...f, msisdn: e.target.value }))} placeholder="+1234567890" />
            </div>
            <div>
              <label style={labelStyle}>Device ID (optional)</label>
              <input style={inputStyle} value={nvForm.deviceId} onChange={e => setNvForm(f => ({ ...f, deviceId: e.target.value }))} placeholder="UUID of device" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={nvLoading || !apiKey}>
            {nvLoading ? 'Verifying...' : 'Verify Number'}
          </button>
        </form>
        <ResultBox result={nvResult} error={nvError} />
      </ApiCard>
    </div>
  );
}
