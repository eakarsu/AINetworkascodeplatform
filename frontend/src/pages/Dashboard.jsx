import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiLayers, FiSliders, FiMapPin, FiSmartphone, FiShield,
  FiActivity, FiBarChart2, FiClock, FiCode, FiCalendar,
  FiKey, FiCreditCard, FiCpu, FiTrendingUp, FiAlertTriangle, FiPieChart
} from 'react-icons/fi';

const API = (path) => fetch(path, {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.ok ? r.json() : []).catch(() => []);

const features = [
  {
    category: 'Network Management',
    items: [
      { key: 'networkSlices', name: 'Network Slices', path: '/network-slices', api: '/api/network-slices', icon: FiLayers, color: '#06b6d4', desc: 'Manage eMBB, URLLC, and mMTC slices' },
      { key: 'qosProfiles', name: 'QoS Profiles', path: '/qos-profiles', api: '/api/qos-profiles', icon: FiSliders, color: '#8b5cf6', desc: 'Quality of Service configurations' },
      { key: 'edgeLocations', name: 'Edge Locations', path: '/edge-locations', api: '/api/edge-locations', icon: FiMapPin, color: '#0ea5e9', desc: 'Multi-access edge computing nodes' },
    ]
  },
  {
    category: 'Device Management',
    items: [
      { key: 'devices', name: 'Connected Devices', path: '/devices', api: '/api/devices', icon: FiSmartphone, color: '#10b981', desc: 'IoT and mobile device management' },
      { key: 'simCards', name: 'SIM Cards', path: '/sim-cards', api: '/api/sim-cards', icon: FiCreditCard, color: '#f97316', desc: 'SIM provisioning and management' },
    ]
  },
  {
    category: 'Policy & Monitoring',
    items: [
      { key: 'trafficPolicies', name: 'Traffic Policies', path: '/traffic-policies', api: '/api/traffic-policies', icon: FiShield, color: '#ef4444', desc: 'Network traffic rules and policies' },
      { key: 'slaMonitors', name: 'SLA Monitors', path: '/sla-monitors', api: '/api/sla-monitors', icon: FiActivity, color: '#14b8a6', desc: 'Service level agreement tracking' },
      { key: 'bandwidth', name: 'Bandwidth', path: '/bandwidth-allocations', api: '/api/bandwidth-allocations', icon: FiBarChart2, color: '#06b6d4', desc: 'Bandwidth allocation management' },
      { key: 'latency', name: 'Latency Profiles', path: '/latency-profiles', api: '/api/latency-profiles', icon: FiClock, color: '#f59e0b', desc: 'Latency monitoring and profiles' },
    ]
  },
  {
    category: 'Developer Portal',
    items: [
      { key: 'devApps', name: 'Developer Apps', path: '/developer-apps', api: '/api/developer-apps', icon: FiCode, color: '#8b5cf6', desc: 'Registered applications' },
      { key: 'apiKeys', name: 'API Keys', path: '/api-keys', api: '/api/api-keys', icon: FiKey, color: '#ec4899', desc: 'API key management and permissions' },
    ]
  },
  {
    category: 'AI Intelligence',
    items: [
      { key: 'aiOptimizer', name: 'Network Optimizer', path: '/ai-optimizer', api: null, icon: FiCpu, color: '#8b5cf6', desc: 'AI-powered network optimization' },
      { key: 'aiTraffic', name: 'Traffic Analyzer', path: '/ai-traffic', api: null, icon: FiTrendingUp, color: '#06b6d4', desc: 'Intelligent traffic analysis' },
      { key: 'aiAnomaly', name: 'Anomaly Detector', path: '/ai-anomaly', api: null, icon: FiAlertTriangle, color: '#f59e0b', desc: 'Real-time anomaly detection' },
    ]
  },
  {
    category: 'Analytics',
    items: [
      { key: 'analytics', name: 'Usage Analytics', path: '/usage-analytics', api: '/api/usage-analytics', icon: FiPieChart, color: '#10b981', desc: 'Platform usage metrics' },
      { key: 'events', name: 'Network Events', path: '/network-events', api: '/api/network-events', icon: FiCalendar, color: '#ef4444', desc: 'Real-time network event log' },
    ]
  },
];

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  useEffect(() => {
    const fetchCounts = async () => {
      const allItems = features.flatMap(s => s.items).filter(f => f.api);
      const results = await Promise.all(
        allItems.map(f => API(f.api).then(data => ({ key: f.key, count: Array.isArray(data) ? data.length : 0 })))
      );
      const map = {};
      results.forEach(r => { map[r.key] = r.count; });
      setCounts(map);
      setLoading(false);
    };
    fetchCounts();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user.name || 'Admin'}</h1>
          <p>5G Network-as-Code Platform Overview</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="stats-grid">
        {[
          { label: 'Network Slices', key: 'networkSlices', color: '#06b6d4', icon: FiLayers },
          { label: 'Devices', key: 'devices', color: '#10b981', icon: FiSmartphone },
          { label: 'Edge Locations', key: 'edgeLocations', color: '#0ea5e9', icon: FiMapPin },
          { label: 'Active Alerts', key: 'events', color: '#ef4444', icon: FiCalendar },
        ].map(s => (
          <div key={s.key} className="stat-card" onClick={() => {
            const feat = features.flatMap(sec => sec.items).find(f => f.key === s.key);
            if (feat) navigate(feat.path);
          }}>
            <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>
              <s.icon />
            </div>
            <div className="stat-value">{loading ? '-' : (counts[s.key] || 0)}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feature cards by category */}
      {features.map(section => (
        <div key={section.category} className="dashboard-section">
          <h2>{section.category}</h2>
          <div className="feature-grid">
            {section.items.map(feature => (
              <div
                key={feature.key}
                className="feature-card"
                onClick={() => navigate(feature.path)}
              >
                <div className="feature-icon" style={{ background: `${feature.color}20`, color: feature.color }}>
                  <feature.icon />
                </div>
                <div className="feature-name">{feature.name}</div>
                {feature.api && (
                  <div className="feature-count">{loading ? '-' : (counts[feature.key] || 0)}</div>
                )}
                <div className="feature-desc">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
