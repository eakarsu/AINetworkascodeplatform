import React from 'react';
import NetworkTopologyGraph from '../components/NetworkTopologyGraph';
import ConfigDriftHeatmap from '../components/ConfigDriftHeatmap';
import NetworkChangeReport from '../components/NetworkChangeReport';
import PolicyRulesEditor from '../components/PolicyRulesEditor';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Network Views</h1>
        <p style={{ color: '#94a3b8', marginTop: 4 }}>Custom topology, drift, change reporting, and policy editor.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <NetworkTopologyGraph />
        <ConfigDriftHeatmap />
        <NetworkChangeReport />
        <PolicyRulesEditor />
      </div>
    </div>
  );
}
