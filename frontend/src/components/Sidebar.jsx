import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiLayers, FiSliders, FiMapPin, FiSmartphone,
  FiShield, FiActivity, FiBarChart2, FiClock, FiCode,
  FiCalendar, FiKey, FiCreditCard, FiCpu, FiTrendingUp,
  FiAlertTriangle, FiPieChart, FiLogOut, FiWifi
} from 'react-icons/fi';

const navSections = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    ],
  },
  {
    title: 'Network Management',
    items: [
      { path: '/network-slices', label: 'Network Slices', icon: FiLayers },
      { path: '/qos-profiles', label: 'QoS Profiles', icon: FiSliders },
      { path: '/edge-locations', label: 'Edge Locations', icon: FiMapPin },
    ],
  },
  {
    title: 'Device Management',
    items: [
      { path: '/devices', label: 'Connected Devices', icon: FiSmartphone },
      { path: '/sim-cards', label: 'SIM Cards', icon: FiCreditCard },
    ],
  },
  {
    title: 'Policy & Monitoring',
    items: [
      { path: '/traffic-policies', label: 'Traffic Policies', icon: FiShield },
      { path: '/sla-monitors', label: 'SLA Monitors', icon: FiActivity },
      { path: '/bandwidth-allocations', label: 'Bandwidth', icon: FiBarChart2 },
      { path: '/latency-profiles', label: 'Latency Profiles', icon: FiClock },
    ],
  },
  {
    title: 'Developer Portal',
    items: [
      { path: '/developer-apps', label: 'Developer Apps', icon: FiCode },
      { path: '/api-keys', label: 'API Keys', icon: FiKey },
    ],
  },
  {
    title: 'AI Intelligence',
    items: [
      { path: '/ai-optimizer', label: 'Network Optimizer', icon: FiCpu },
      { path: '/ai-traffic', label: 'Traffic Analyzer', icon: FiTrendingUp },
      { path: '/ai-anomaly', label: 'Anomaly Detector', icon: FiAlertTriangle },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { path: '/usage-analytics', label: 'Usage Analytics', icon: FiPieChart },
      { path: '/network-events', label: 'Network Events', icon: FiCalendar },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon"><FiWifi /></div>
        <div className="brand-text">
          <h1>5G NaaC</h1>
          <p>Network-as-Code</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {(user.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user.name || 'Admin User'}</div>
            <div className="user-role">{user.role || 'Administrator'}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <FiLogOut /> Sign Out
        </button>
      </div>
    </aside>
  );
}
