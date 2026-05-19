import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';

// Lazy-load all feature pages so a parse error in any single page does not
// crash the entire bundle. Each broken page is isolated to its own route.
function safeLazy(loader) {
  return lazy(() =>
    loader().catch((err) => ({
      default: () => (
        <div style={{ padding: 24, color: '#fca5a5' }}>
          <h2>Page failed to load</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(err && err.message || err)}</pre>
        </div>
      ),
    }))
  );
}

const Dashboard                 = safeLazy(() => import('./pages/Dashboard'));
const NetworkSlices             = safeLazy(() => import('./pages/NetworkSlices'));
const QosProfiles               = safeLazy(() => import('./pages/QosProfiles'));
const EdgeLocations             = safeLazy(() => import('./pages/EdgeLocations'));
const ConnectedDevices          = safeLazy(() => import('./pages/ConnectedDevices'));
const TrafficPolicies           = safeLazy(() => import('./pages/TrafficPolicies'));
const SlaMonitors               = safeLazy(() => import('./pages/SlaMonitors'));
const BandwidthAllocations      = safeLazy(() => import('./pages/BandwidthAllocations'));
const LatencyProfiles           = safeLazy(() => import('./pages/LatencyProfiles'));
const DeveloperApps             = safeLazy(() => import('./pages/DeveloperApps'));
const NetworkEvents             = safeLazy(() => import('./pages/NetworkEvents'));
const ApiKeys                   = safeLazy(() => import('./pages/ApiKeys'));
const SimCards                  = safeLazy(() => import('./pages/SimCards'));
const AIOptimizer               = safeLazy(() => import('./pages/AIOptimizer'));
const AITrafficAnalyzer         = safeLazy(() => import('./pages/AITrafficAnalyzer'));
const AIAnomalyDetector         = safeLazy(() => import('./pages/AIAnomalyDetector'));
const AICapacityForecast        = safeLazy(() => import('./pages/AICapacityForecast'));
const AISecurityThreat          = safeLazy(() => import('./pages/AISecurityThreat'));
const AICostOptimizer           = safeLazy(() => import('./pages/AICostOptimizer'));
const AINetworkSliceOptimizer   = safeLazy(() => import('./pages/AINetworkSliceOptimizer'));
const AIComplianceReport        = safeLazy(() => import('./pages/AIComplianceReport'));
const AIAutomatedProvisioning   = safeLazy(() => import('./pages/AIAutomatedProvisioning'));
const AIMultiOperatorFederation = safeLazy(() => import('./pages/AIMultiOperatorFederation'));
const UsageAnalytics            = safeLazy(() => import('./pages/UsageAnalytics'));
const CamaraApis                = safeLazy(() => import('./pages/CamaraApis'));
const AnomalyRules              = safeLazy(() => import('./pages/AnomalyRules'));
const CustomViewsPage           = safeLazy(() => import('./pages/CustomViewsPage'));

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
        <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
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
            <Route path="/custom-views" element={<CustomViewsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}
