import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NetworkSlices from './pages/NetworkSlices';
import QosProfiles from './pages/QosProfiles';
import EdgeLocations from './pages/EdgeLocations';
import ConnectedDevices from './pages/ConnectedDevices';
import TrafficPolicies from './pages/TrafficPolicies';
import SlaMonitors from './pages/SlaMonitors';
import BandwidthAllocations from './pages/BandwidthAllocations';
import LatencyProfiles from './pages/LatencyProfiles';
import DeveloperApps from './pages/DeveloperApps';
import NetworkEvents from './pages/NetworkEvents';
import ApiKeys from './pages/ApiKeys';
import SimCards from './pages/SimCards';
import AIOptimizer from './pages/AIOptimizer';
import AITrafficAnalyzer from './pages/AITrafficAnalyzer';
import AIAnomalyDetector from './pages/AIAnomalyDetector';
import AICapacityForecast from './pages/AICapacityForecast';
import AISecurityThreat from './pages/AISecurityThreat';
import AICostOptimizer from './pages/AICostOptimizer';
import AINetworkSliceOptimizer from './pages/AINetworkSliceOptimizer';
import AIComplianceReport from './pages/AIComplianceReport';
import AIAutomatedProvisioning from './pages/AIAutomatedProvisioning';
import AIMultiOperatorFederation from './pages/AIMultiOperatorFederation';
import UsageAnalytics from './pages/UsageAnalytics';
import CamaraApis from './pages/CamaraApis';
import AnomalyRules from './pages/AnomalyRules';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/network-slices" element={<NetworkSlices />} />
          <Route path="/qos-profiles" element={<QosProfiles />} />
          <Route path="/edge-locations" element={<EdgeLocations />} />
          <Route path="/devices" element={<ConnectedDevices />} />
          <Route path="/traffic-policies" element={<TrafficPolicies />} />
          <Route path="/sla-monitors" element={<SlaMonitors />} />
          <Route path="/bandwidth-allocations" element={<BandwidthAllocations />} />
          <Route path="/latency-profiles" element={<LatencyProfiles />} />
          <Route path="/developer-apps" element={<DeveloperApps />} />
          <Route path="/network-events" element={<NetworkEvents />} />
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="/sim-cards" element={<SimCards />} />
          <Route path="/ai-optimizer" element={<AIOptimizer />} />
          <Route path="/ai-traffic" element={<AITrafficAnalyzer />} />
          <Route path="/ai-anomaly" element={<AIAnomalyDetector />} />
          <Route path="/ai-capacity-forecast" element={<AICapacityForecast />} />
          <Route path="/ai-security-threat" element={<AISecurityThreat />} />
          <Route path="/ai-cost-optimizer" element={<AICostOptimizer />} />
          <Route path="/ai-network-slice-optimizer" element={<AINetworkSliceOptimizer />} />
          <Route path="/ai-compliance-report" element={<AIComplianceReport />} />
          <Route path="/ai-automated-provisioning" element={<AIAutomatedProvisioning />} />
          <Route path="/ai-multi-operator-federation" element={<AIMultiOperatorFederation />} />
          <Route path="/usage-analytics" element={<UsageAnalytics />} />
          <Route path="/camara-apis" element={<CamaraApis />} />
          <Route path="/anomaly-rules" element={<AnomalyRules />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </ProtectedRoute>
  );
}
