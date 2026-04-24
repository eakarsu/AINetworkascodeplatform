const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  console.log('Starting database seed...');

  // Drop all tables
  await pool.query(`
    DROP TABLE IF EXISTS usage_analytics CASCADE;
    DROP TABLE IF EXISTS ai_analyses CASCADE;
    DROP TABLE IF EXISTS sim_cards CASCADE;
    DROP TABLE IF EXISTS api_keys CASCADE;
    DROP TABLE IF EXISTS network_events CASCADE;
    DROP TABLE IF EXISTS developer_apps CASCADE;
    DROP TABLE IF EXISTS latency_profiles CASCADE;
    DROP TABLE IF EXISTS bandwidth_allocations CASCADE;
    DROP TABLE IF EXISTS sla_monitors CASCADE;
    DROP TABLE IF EXISTS traffic_policies CASCADE;
    DROP TABLE IF EXISTS connected_devices CASCADE;
    DROP TABLE IF EXISTS edge_locations CASCADE;
    DROP TABLE IF EXISTS qos_profiles CASCADE;
    DROP TABLE IF EXISTS network_slices CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
  console.log('Dropped existing tables.');

  // Create tables
  await pool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR UNIQUE NOT NULL,
      password VARCHAR NOT NULL,
      name VARCHAR NOT NULL,
      role VARCHAR DEFAULT 'developer',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE network_slices (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      status VARCHAR DEFAULT 'active',
      max_bandwidth VARCHAR,
      latency VARCHAR,
      connected_devices INT DEFAULT 0,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE qos_profiles (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      priority INT,
      max_bandwidth VARCHAR,
      min_bandwidth VARCHAR,
      max_latency VARCHAR,
      jitter VARCHAR,
      packet_loss VARCHAR,
      status VARCHAR DEFAULT 'active',
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE edge_locations (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      region VARCHAR,
      city VARCHAR,
      status VARCHAR DEFAULT 'active',
      capacity VARCHAR,
      current_load INT DEFAULT 0,
      latency VARCHAR,
      ip_address VARCHAR,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE connected_devices (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      device_type VARCHAR,
      imei VARCHAR,
      ip_address VARCHAR,
      status VARCHAR DEFAULT 'active',
      network_slice VARCHAR,
      location VARCHAR,
      data_usage VARCHAR,
      last_seen TIMESTAMP,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE traffic_policies (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      type VARCHAR,
      priority INT,
      source VARCHAR,
      destination VARCHAR,
      action VARCHAR,
      bandwidth_limit VARCHAR,
      status VARCHAR DEFAULT 'active',
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE sla_monitors (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      service VARCHAR,
      target_uptime DECIMAL,
      current_uptime DECIMAL,
      target_latency VARCHAR,
      current_latency VARCHAR,
      target_bandwidth VARCHAR,
      current_bandwidth VARCHAR,
      status VARCHAR DEFAULT 'active',
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE bandwidth_allocations (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      allocated_bandwidth VARCHAR,
      used_bandwidth VARCHAR,
      utilization DECIMAL,
      network_slice VARCHAR,
      priority INT,
      status VARCHAR DEFAULT 'active',
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE latency_profiles (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      target_latency VARCHAR,
      current_latency VARCHAR,
      jitter VARCHAR,
      packet_loss VARCHAR,
      route VARCHAR,
      optimization VARCHAR,
      status VARCHAR DEFAULT 'active',
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE developer_apps (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      developer VARCHAR,
      app_type VARCHAR,
      api_calls_today INT DEFAULT 0,
      api_calls_limit INT DEFAULT 10000,
      status VARCHAR DEFAULT 'active',
      network_slice VARCHAR,
      sdk_version VARCHAR,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE network_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR NOT NULL,
      severity VARCHAR,
      source VARCHAR,
      message TEXT,
      details TEXT,
      resolved BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE api_keys (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      key_prefix VARCHAR,
      developer VARCHAR,
      permissions VARCHAR,
      rate_limit INT DEFAULT 1000,
      calls_today INT DEFAULT 0,
      status VARCHAR DEFAULT 'active',
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE sim_cards (
      id SERIAL PRIMARY KEY,
      iccid VARCHAR,
      imsi VARCHAR,
      msisdn VARCHAR,
      status VARCHAR DEFAULT 'active',
      network_slice VARCHAR,
      device VARCHAR,
      data_plan VARCHAR,
      data_used VARCHAR,
      apn VARCHAR,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE ai_analyses (
      id SERIAL PRIMARY KEY,
      type VARCHAR NOT NULL,
      title VARCHAR,
      input_data TEXT,
      result TEXT,
      status VARCHAR DEFAULT 'pending',
      model VARCHAR,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE usage_analytics (
      id SERIAL PRIMARY KEY,
      metric_name VARCHAR NOT NULL,
      category VARCHAR,
      value DECIMAL,
      unit VARCHAR,
      period VARCHAR,
      trend VARCHAR,
      change_percent DECIMAL,
      details TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Created all tables.');

  // Insert default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)`,
    ['admin@5gnetwork.com', hashedPassword, 'Admin User', 'admin']
  );
  console.log('Created admin user.');

  // Seed network_slices (15)
  await pool.query(`
    INSERT INTO network_slices (name, type, status, max_bandwidth, latency, connected_devices, description) VALUES
    ('Enterprise eMBB Slice', 'eMBB', 'active', '10 Gbps', '10ms', 1250, 'High-bandwidth slice for enterprise broadband applications'),
    ('Autonomous Vehicle URLLC', 'URLLC', 'active', '1 Gbps', '1ms', 340, 'Ultra-reliable low-latency slice for autonomous driving'),
    ('Smart City mMTC', 'mMTC', 'active', '500 Mbps', '50ms', 15000, 'Massive IoT connectivity for smart city sensors'),
    ('Healthcare URLLC', 'URLLC', 'active', '2 Gbps', '2ms', 180, 'Critical healthcare applications including remote surgery'),
    ('Industrial IoT mMTC', 'mMTC', 'active', '1 Gbps', '20ms', 8500, 'Factory floor IoT and industrial automation'),
    ('Gaming eMBB', 'eMBB', 'active', '5 Gbps', '5ms', 3200, 'Cloud gaming and AR/VR entertainment services'),
    ('Public Safety URLLC', 'URLLC', 'active', '2 Gbps', '3ms', 420, 'First responder and emergency services communications'),
    ('Smart Agriculture mMTC', 'mMTC', 'active', '200 Mbps', '100ms', 22000, 'Agricultural IoT sensors and drone monitoring'),
    ('Financial Services eMBB', 'eMBB', 'active', '8 Gbps', '3ms', 560, 'High-frequency trading and banking applications'),
    ('Media Broadcast eMBB', 'eMBB', 'active', '20 Gbps', '15ms', 890, 'Live 4K/8K video streaming and broadcast services'),
    ('Drone Fleet URLLC', 'URLLC', 'active', '500 Mbps', '5ms', 275, 'Commercial drone delivery and surveillance fleet'),
    ('Smart Grid mMTC', 'mMTC', 'active', '300 Mbps', '30ms', 18000, 'Power grid monitoring and smart meter connectivity'),
    ('Retail Analytics eMBB', 'eMBB', 'maintenance', '3 Gbps', '20ms', 1100, 'In-store analytics and customer experience platforms'),
    ('Logistics Tracking mMTC', 'mMTC', 'active', '250 Mbps', '40ms', 12000, 'Supply chain and fleet tracking sensors'),
    ('Telemedicine URLLC', 'URLLC', 'active', '4 Gbps', '2ms', 310, 'Remote patient monitoring and telemedicine consultations')
  `);
  console.log('Seeded network_slices.');

  // Seed qos_profiles (15)
  await pool.query(`
    INSERT INTO qos_profiles (name, priority, max_bandwidth, min_bandwidth, max_latency, jitter, packet_loss, status, description) VALUES
    ('Ultra-Reliable Premium', 1, '10 Gbps', '5 Gbps', '1ms', '0.1ms', '0.0001%', 'active', 'Highest priority QoS for mission-critical URLLC services'),
    ('Enterprise Gold', 2, '5 Gbps', '2 Gbps', '5ms', '0.5ms', '0.001%', 'active', 'Premium enterprise connectivity with guaranteed bandwidth'),
    ('Enterprise Silver', 3, '2 Gbps', '500 Mbps', '10ms', '1ms', '0.01%', 'active', 'Standard enterprise tier with reliable performance'),
    ('Healthcare Critical', 1, '4 Gbps', '2 Gbps', '2ms', '0.2ms', '0.0001%', 'active', 'Healthcare-grade QoS for surgical robotics and imaging'),
    ('IoT Standard', 5, '100 Mbps', '10 Mbps', '100ms', '10ms', '0.1%', 'active', 'Standard IoT device connectivity profile'),
    ('IoT Premium', 4, '500 Mbps', '50 Mbps', '50ms', '5ms', '0.01%', 'active', 'Enhanced IoT for industrial and critical sensors'),
    ('Gaming Low-Latency', 2, '1 Gbps', '200 Mbps', '5ms', '0.5ms', '0.001%', 'active', 'Optimized for cloud gaming with minimal latency'),
    ('Video Streaming 4K', 3, '500 Mbps', '100 Mbps', '20ms', '2ms', '0.01%', 'active', 'High-bandwidth profile for 4K video streaming'),
    ('Video Streaming 8K', 2, '2 Gbps', '500 Mbps', '15ms', '1ms', '0.001%', 'active', 'Ultra-high bandwidth for 8K content delivery'),
    ('V2X Communication', 1, '1 Gbps', '500 Mbps', '1ms', '0.1ms', '0.0001%', 'active', 'Vehicle-to-everything communication QoS'),
    ('Smart City Basic', 5, '50 Mbps', '5 Mbps', '200ms', '20ms', '0.5%', 'active', 'Basic tier for non-critical smart city sensors'),
    ('Financial Trading', 1, '5 Gbps', '2 Gbps', '1ms', '0.05ms', '0.0001%', 'active', 'Ultra-low latency for high-frequency trading'),
    ('Public Safety Priority', 1, '2 Gbps', '1 Gbps', '3ms', '0.3ms', '0.001%', 'active', 'Priority QoS for emergency services'),
    ('Best Effort', 6, '100 Mbps', '1 Mbps', '500ms', '50ms', '1%', 'active', 'Best effort delivery for non-critical traffic'),
    ('Drone Control', 2, '500 Mbps', '100 Mbps', '5ms', '0.5ms', '0.001%', 'active', 'Real-time drone command and control profile')
  `);
  console.log('Seeded qos_profiles.');

  // Seed edge_locations (15)
  await pool.query(`
    INSERT INTO edge_locations (name, region, city, status, capacity, current_load, latency, ip_address, description) VALUES
    ('NYC-EDGE-01', 'US-East', 'New York', 'active', '500 TB', 72, '2ms', '10.0.1.1', 'Primary edge node serving Manhattan financial district'),
    ('LAX-EDGE-01', 'US-West', 'Los Angeles', 'active', '400 TB', 58, '3ms', '10.0.2.1', 'West coast media and entertainment edge computing'),
    ('LDN-EDGE-01', 'EU-West', 'London', 'active', '450 TB', 65, '2ms', '10.1.1.1', 'European financial hub edge node'),
    ('TKY-EDGE-01', 'APAC', 'Tokyo', 'active', '600 TB', 81, '1ms', '10.2.1.1', 'Asia-Pacific primary edge with highest capacity'),
    ('FRA-EDGE-01', 'EU-Central', 'Frankfurt', 'active', '400 TB', 45, '3ms', '10.1.2.1', 'Central European industrial IoT edge node'),
    ('SIN-EDGE-01', 'APAC-SE', 'Singapore', 'active', '350 TB', 52, '2ms', '10.2.2.1', 'Southeast Asia smart city and logistics hub'),
    ('CHI-EDGE-01', 'US-Central', 'Chicago', 'active', '300 TB', 38, '4ms', '10.0.3.1', 'Midwest autonomous vehicle testing edge'),
    ('SYD-EDGE-01', 'APAC-South', 'Sydney', 'active', '250 TB', 33, '5ms', '10.2.3.1', 'Oceania mining and agriculture IoT edge'),
    ('DXB-EDGE-01', 'ME', 'Dubai', 'active', '300 TB', 41, '3ms', '10.3.1.1', 'Middle East smart city and construction edge'),
    ('MUM-EDGE-01', 'APAC-South', 'Mumbai', 'active', '350 TB', 68, '4ms', '10.2.4.1', 'India subcontinent telecom and fintech edge'),
    ('SEA-EDGE-01', 'US-West', 'Seattle', 'active', '400 TB', 55, '3ms', '10.0.4.1', 'Pacific Northwest tech and cloud gaming edge'),
    ('BER-EDGE-01', 'EU-Central', 'Berlin', 'maintenance', '300 TB', 12, '5ms', '10.1.3.1', 'German industrial automation edge - under maintenance'),
    ('SAO-EDGE-01', 'LATAM', 'Sao Paulo', 'active', '250 TB', 47, '6ms', '10.4.1.1', 'Latin America primary edge node'),
    ('TOR-EDGE-01', 'NA-North', 'Toronto', 'active', '300 TB', 35, '4ms', '10.0.5.1', 'Canadian healthcare and financial edge'),
    ('SEL-EDGE-01', 'APAC-NE', 'Seoul', 'active', '500 TB', 78, '1ms', '10.2.5.1', 'South Korea 5G gaming and media edge')
  `);
  console.log('Seeded edge_locations.');

  // Seed connected_devices (15)
  await pool.query(`
    INSERT INTO connected_devices (name, device_type, imei, ip_address, status, network_slice, location, data_usage, last_seen, description) VALUES
    ('AGV-Robot-001', 'Industrial Robot', '354678901234567', '192.168.1.10', 'active', 'Industrial IoT mMTC', 'Frankfurt Factory Floor', '2.4 GB/day', NOW() - INTERVAL '2 minutes', 'Automated Guided Vehicle in assembly line'),
    ('Tesla-AV-042', 'Autonomous Vehicle', '867530912345678', '192.168.2.20', 'active', 'Autonomous Vehicle URLLC', 'Chicago Test Track', '15.8 GB/day', NOW() - INTERVAL '30 seconds', 'Level 4 autonomous test vehicle with V2X'),
    ('SmartMeter-NYC-1892', 'Smart Meter', '123456789012345', '192.168.3.30', 'active', 'Smart Grid mMTC', 'New York Midtown', '50 MB/day', NOW() - INTERVAL '5 minutes', 'Residential smart electricity meter'),
    ('DroneDelivery-LAX-07', 'Delivery Drone', '987654321098765', '192.168.4.40', 'active', 'Drone Fleet URLLC', 'Los Angeles Downtown', '800 MB/day', NOW() - INTERVAL '1 minute', 'Package delivery drone with 4K camera'),
    ('SurgicalBot-LDN-03', 'Medical Robot', '456789012345678', '192.168.5.50', 'active', 'Healthcare URLLC', 'London Royal Hospital', '5.2 GB/day', NOW() - INTERVAL '10 seconds', 'Da Vinci surgical robot for remote surgery'),
    ('AirQuality-SIN-445', 'Environmental Sensor', '234567890123456', '192.168.6.60', 'active', 'Smart City mMTC', 'Singapore Marina Bay', '10 MB/day', NOW() - INTERVAL '15 minutes', 'PM2.5 and air quality monitoring sensor'),
    ('GameConsole-SEL-8821', 'Gaming Device', '345678901234567', '192.168.7.70', 'active', 'Gaming eMBB', 'Seoul Gangnam', '45 GB/day', NOW() - INTERVAL '3 minutes', 'Cloud gaming terminal with AR headset'),
    ('TrafficCam-TKY-112', 'Traffic Camera', '567890123456789', '192.168.8.80', 'active', 'Smart City mMTC', 'Tokyo Shibuya Crossing', '120 GB/day', NOW() - INTERVAL '1 second', '8K AI-powered traffic monitoring camera'),
    ('WearableECG-MUM-33', 'Medical Wearable', '678901234567890', '192.168.9.90', 'active', 'Telemedicine URLLC', 'Mumbai General Hospital', '200 MB/day', NOW() - INTERVAL '20 seconds', 'Continuous ECG and vitals monitoring wearable'),
    ('FieldTractor-SYD-05', 'Agricultural Robot', '789012345678901', '192.168.10.10', 'active', 'Smart Agriculture mMTC', 'Sydney Rural NSW', '1.5 GB/day', NOW() - INTERVAL '10 minutes', 'Autonomous farming tractor with GPS guidance'),
    ('POS-Terminal-DXB-77', 'Retail Device', '890123456789012', '192.168.11.11', 'active', 'Retail Analytics eMBB', 'Dubai Mall', '500 MB/day', NOW() - INTERVAL '45 seconds', 'Smart POS terminal with customer analytics'),
    ('FleetTracker-SAO-321', 'GPS Tracker', '901234567890123', '192.168.12.12', 'active', 'Logistics Tracking mMTC', 'Sao Paulo Port', '30 MB/day', NOW() - INTERVAL '2 minutes', 'Container fleet GPS and condition tracker'),
    ('BWCam-CHI-PD-019', 'Body Camera', '012345678901234', '192.168.13.13', 'active', 'Public Safety URLLC', 'Chicago Downtown', '8 GB/day', NOW() - INTERVAL '15 seconds', 'Police body-worn camera with live streaming'),
    ('TradingServer-NYC-HFT', 'Trading Terminal', '112233445566778', '192.168.14.14', 'active', 'Financial Services eMBB', 'New York Wall Street', '500 GB/day', NOW() - INTERVAL '1 millisecond', 'High-frequency trading co-location server'),
    ('BroadcastUnit-LAX-4K', 'Media Device', '223344556677889', '192.168.15.15', 'active', 'Media Broadcast eMBB', 'Los Angeles Hollywood', '250 GB/day', NOW() - INTERVAL '5 seconds', '4K live broadcast uplink unit')
  `);
  console.log('Seeded connected_devices.');

  // Seed traffic_policies (15)
  await pool.query(`
    INSERT INTO traffic_policies (name, type, priority, source, destination, action, bandwidth_limit, status, description) VALUES
    ('Emergency Services Priority', 'QoS', 1, 'public-safety-slice', '*', 'prioritize', 'Unlimited', 'active', 'Always prioritize emergency services traffic'),
    ('Healthcare Data Fast-Track', 'QoS', 1, 'healthcare-urllc', 'hospital-edge-*', 'prioritize', '4 Gbps', 'active', 'Fast-track all healthcare telemetry and imaging data'),
    ('DDoS Mitigation Rule', 'Security', 1, '*', 'core-network', 'rate-limit', '100 Mbps per source', 'active', 'Rate limit suspicious high-volume traffic sources'),
    ('Gaming Traffic Shaping', 'Shaping', 3, 'gaming-slice', 'game-servers-*', 'shape', '1 Gbps', 'active', 'Optimize packet scheduling for gaming workloads'),
    ('IoT Aggregation Policy', 'Aggregation', 4, 'mMTC-slice-*', 'iot-gateway', 'aggregate', '500 Mbps', 'active', 'Aggregate IoT sensor data before backhaul'),
    ('Video Bandwidth Cap', 'Shaping', 3, 'embb-media-slice', 'cdn-*', 'throttle', '20 Gbps', 'active', 'Cap media broadcast bandwidth during peak hours'),
    ('V2X Priority Routing', 'QoS', 1, 'autonomous-vehicle-slice', 'edge-compute-*', 'prioritize', '1 Gbps', 'active', 'Zero-drop priority for vehicle safety messages'),
    ('Backup Traffic Deprioritize', 'Shaping', 6, 'enterprise-backup', 'cloud-storage', 'deprioritize', '500 Mbps', 'active', 'Lower priority for non-urgent backup transfers'),
    ('Financial Data Encryption', 'Security', 2, 'financial-slice', 'trading-servers', 'encrypt-prioritize', '5 Gbps', 'active', 'Enforce encryption and priority for financial data'),
    ('Drone Geofence Control', 'Security', 2, 'drone-fleet-slice', '*', 'geofence-restrict', '500 Mbps', 'active', 'Restrict drone communications outside approved zones'),
    ('Peak Hour Load Balancing', 'Balancing', 3, '*', 'edge-*', 'load-balance', 'Dynamic', 'active', 'Distribute traffic across edge nodes during peaks'),
    ('Roaming Traffic Steering', 'Routing', 4, 'roaming-users', 'local-breakout', 'steer', '1 Gbps', 'active', 'Steer roaming traffic to nearest edge for low latency'),
    ('Firmware Update Window', 'Scheduling', 5, 'iot-devices-*', 'update-server', 'schedule', '2 Gbps', 'active', 'Restrict bulk IoT firmware updates to off-peak hours'),
    ('Inter-Slice Isolation', 'Security', 1, 'slice-*', 'slice-*', 'isolate', 'N/A', 'active', 'Enforce strict traffic isolation between network slices'),
    ('CDN Cache Optimization', 'Routing', 3, 'content-requests', 'cdn-edge-cache', 'cache-route', '10 Gbps', 'active', 'Route content requests to nearest CDN cache node')
  `);
  console.log('Seeded traffic_policies.');

  // Seed sla_monitors (15)
  await pool.query(`
    INSERT INTO sla_monitors (name, service, target_uptime, current_uptime, target_latency, current_latency, target_bandwidth, current_bandwidth, status, description) VALUES
    ('Enterprise eMBB SLA', 'Enterprise Broadband', 99.99, 99.97, '10ms', '8.2ms', '10 Gbps', '9.4 Gbps', 'active', 'Enterprise broadband service level monitoring'),
    ('Autonomous Vehicle SLA', 'V2X Communication', 99.999, 99.998, '1ms', '0.8ms', '1 Gbps', '980 Mbps', 'active', 'Mission-critical autonomous vehicle connectivity SLA'),
    ('Healthcare URLLC SLA', 'Remote Surgery', 99.999, 99.999, '2ms', '1.5ms', '2 Gbps', '1.8 Gbps', 'active', 'Healthcare ultra-reliable connectivity SLA'),
    ('Smart City IoT SLA', 'City Sensor Network', 99.9, 99.85, '50ms', '42ms', '500 Mbps', '380 Mbps', 'warning', 'Smart city IoT platform uptime and performance SLA'),
    ('Gaming Platform SLA', 'Cloud Gaming', 99.95, 99.94, '5ms', '4.1ms', '5 Gbps', '4.6 Gbps', 'active', 'Cloud gaming platform performance SLA'),
    ('Financial Trading SLA', 'HFT Platform', 99.999, 99.999, '1ms', '0.3ms', '5 Gbps', '4.8 Gbps', 'active', 'High-frequency trading ultra-low latency SLA'),
    ('Public Safety SLA', 'Emergency Comms', 99.999, 99.997, '3ms', '2.1ms', '2 Gbps', '1.9 Gbps', 'active', 'Public safety critical communications SLA'),
    ('Industrial IoT SLA', 'Factory Automation', 99.99, 99.98, '20ms', '15ms', '1 Gbps', '850 Mbps', 'active', 'Industrial automation connectivity SLA'),
    ('Media Broadcast SLA', 'Live Streaming', 99.95, 99.92, '15ms', '12ms', '20 Gbps', '18.5 Gbps', 'active', 'Live broadcast streaming quality SLA'),
    ('Drone Operations SLA', 'Drone Fleet Mgmt', 99.99, 99.96, '5ms', '4.5ms', '500 Mbps', '420 Mbps', 'warning', 'Drone fleet command and control SLA'),
    ('Smart Agriculture SLA', 'Precision Farming', 99.5, 99.6, '100ms', '85ms', '200 Mbps', '180 Mbps', 'active', 'Agricultural IoT monitoring SLA'),
    ('Retail Analytics SLA', 'In-Store Platform', 99.9, 99.88, '20ms', '18ms', '3 Gbps', '2.5 Gbps', 'active', 'Retail analytics and POS system SLA'),
    ('Logistics SLA', 'Fleet Tracking', 99.9, 99.91, '40ms', '35ms', '250 Mbps', '220 Mbps', 'active', 'Logistics fleet tracking connectivity SLA'),
    ('Telemedicine SLA', 'Patient Monitoring', 99.99, 99.95, '2ms', '1.8ms', '4 Gbps', '3.5 Gbps', 'active', 'Telemedicine platform performance SLA'),
    ('Smart Grid SLA', 'Power Management', 99.99, 99.97, '30ms', '22ms', '300 Mbps', '275 Mbps', 'active', 'Smart grid monitoring and control SLA')
  `);
  console.log('Seeded sla_monitors.');

  // Seed bandwidth_allocations (15)
  await pool.query(`
    INSERT INTO bandwidth_allocations (name, allocated_bandwidth, used_bandwidth, utilization, network_slice, priority, status, description) VALUES
    ('Enterprise Core Allocation', '10 Gbps', '7.2 Gbps', 72.0, 'Enterprise eMBB Slice', 2, 'active', 'Primary bandwidth pool for enterprise broadband users'),
    ('V2X Dedicated Channel', '1 Gbps', '680 Mbps', 68.0, 'Autonomous Vehicle URLLC', 1, 'active', 'Dedicated bandwidth for vehicle-to-everything communication'),
    ('Smart City IoT Pool', '500 Mbps', '320 Mbps', 64.0, 'Smart City mMTC', 4, 'active', 'Shared bandwidth pool for city-wide IoT sensors'),
    ('Healthcare Priority Band', '2 Gbps', '1.1 Gbps', 55.0, 'Healthcare URLLC', 1, 'active', 'Reserved bandwidth for healthcare critical applications'),
    ('Industrial Automation Band', '1 Gbps', '750 Mbps', 75.0, 'Industrial IoT mMTC', 3, 'active', 'Factory floor automation bandwidth allocation'),
    ('Gaming Burst Allocation', '5 Gbps', '4.2 Gbps', 84.0, 'Gaming eMBB', 3, 'warning', 'Gaming services bandwidth with burst capacity'),
    ('Emergency Services Reserve', '2 Gbps', '400 Mbps', 20.0, 'Public Safety URLLC', 1, 'active', 'Reserved emergency bandwidth - always available'),
    ('Agricultural IoT Band', '200 Mbps', '140 Mbps', 70.0, 'Smart Agriculture mMTC', 5, 'active', 'Rural agricultural sensor network bandwidth'),
    ('Financial Express Lane', '5 Gbps', '3.8 Gbps', 76.0, 'Financial Services eMBB', 1, 'active', 'Ultra-low latency financial data express lane'),
    ('Media Streaming Pool', '20 Gbps', '17.5 Gbps', 87.5, 'Media Broadcast eMBB', 3, 'warning', 'Live media broadcast bandwidth pool - near capacity'),
    ('Drone Control Channel', '500 Mbps', '290 Mbps', 58.0, 'Drone Fleet URLLC', 2, 'active', 'Drone fleet command and telemetry channel'),
    ('Smart Grid Allocation', '300 Mbps', '210 Mbps', 70.0, 'Smart Grid mMTC', 3, 'active', 'Power grid monitoring bandwidth allocation'),
    ('Retail Network Band', '3 Gbps', '1.8 Gbps', 60.0, 'Retail Analytics eMBB', 4, 'active', 'Retail store network and analytics bandwidth'),
    ('Logistics Tracking Band', '250 Mbps', '185 Mbps', 74.0, 'Logistics Tracking mMTC', 4, 'active', 'Supply chain tracking bandwidth allocation'),
    ('Telemedicine HD Band', '4 Gbps', '2.6 Gbps', 65.0, 'Telemedicine URLLC', 1, 'active', 'High-definition telemedicine video bandwidth')
  `);
  console.log('Seeded bandwidth_allocations.');

  // Seed latency_profiles (15)
  await pool.query(`
    INSERT INTO latency_profiles (name, target_latency, current_latency, jitter, packet_loss, route, optimization, status, description) VALUES
    ('NYC-to-Edge Ultra-Low', '1ms', '0.8ms', '0.05ms', '0.0001%', 'NYC-EDGE-01 Direct', 'Hardware offload + DPDK', 'active', 'Ultra-low latency path for NYC financial district'),
    ('V2X Safety Channel', '1ms', '0.6ms', '0.02ms', '0.00001%', 'CHI-EDGE-01 Direct', 'Pre-emptive scheduling', 'active', 'Sub-millisecond path for vehicle safety messages'),
    ('Remote Surgery Path', '2ms', '1.4ms', '0.1ms', '0.0001%', 'LDN-EDGE-01 Priority', 'Segment routing + SR-MPLS', 'active', 'Guaranteed latency for surgical robot control'),
    ('Tokyo Gaming Express', '3ms', '2.1ms', '0.3ms', '0.001%', 'TKY-EDGE-01 Gaming', 'Edge caching + TCP optimization', 'active', 'Optimized path for Japanese gaming servers'),
    ('Seoul Media Stream', '5ms', '3.8ms', '0.5ms', '0.001%', 'SEL-EDGE-01 Media', 'Adaptive bitrate routing', 'active', 'Low-latency media streaming path for Seoul'),
    ('Frankfurt Industrial', '10ms', '7.2ms', '1ms', '0.01%', 'FRA-EDGE-01 Industrial', 'Deterministic networking', 'active', 'Industrial automation path with time-sensitive networking'),
    ('Singapore Smart City', '15ms', '11ms', '2ms', '0.01%', 'SIN-EDGE-01 IoT', 'Multi-path aggregation', 'active', 'Aggregated IoT path for Singapore smart city'),
    ('Dubai Construction', '10ms', '8.5ms', '1.5ms', '0.01%', 'DXB-EDGE-01 Priority', 'QoS marking + priority queuing', 'active', 'Construction site real-time monitoring path'),
    ('Mumbai Fintech', '3ms', '2.2ms', '0.2ms', '0.001%', 'MUM-EDGE-01 Finance', 'FlexE slicing + hardware timestamps', 'active', 'Indian fintech low-latency express path'),
    ('Sydney Agriculture', '50ms', '38ms', '5ms', '0.05%', 'SYD-EDGE-01 Rural', 'Satellite-terrestrial bonding', 'active', 'Rural agricultural monitoring with satellite backup'),
    ('Chicago Public Safety', '3ms', '2.5ms', '0.3ms', '0.001%', 'CHI-EDGE-01 Priority', 'Pre-emptive + redundant path', 'active', 'First responder priority communication path'),
    ('Toronto Healthcare', '5ms', '3.9ms', '0.4ms', '0.001%', 'TOR-EDGE-01 Medical', 'Segment routing + failover', 'active', 'Canadian healthcare telemedicine optimized path'),
    ('Sao Paulo Logistics', '20ms', '16ms', '3ms', '0.02%', 'SAO-EDGE-01 Standard', 'ECMP load balancing', 'active', 'Latin America logistics tracking path'),
    ('Seattle Cloud Gaming', '5ms', '3.5ms', '0.4ms', '0.001%', 'SEA-EDGE-01 Gaming', 'GPU-accelerated edge render', 'active', 'Pacific NW cloud gaming rendering path'),
    ('London Broadcast', '8ms', '6.1ms', '0.8ms', '0.005%', 'LDN-EDGE-01 Media', 'SRT protocol optimization', 'active', 'UK broadcast uplink with SRT optimization')
  `);
  console.log('Seeded latency_profiles.');

  // Seed developer_apps (15)
  await pool.query(`
    INSERT INTO developer_apps (name, developer, app_type, api_calls_today, api_calls_limit, status, network_slice, sdk_version, description) VALUES
    ('AutoPilot V2X Suite', 'Waymo Engineering', 'V2X Communication', 45230, 100000, 'active', 'Autonomous Vehicle URLLC', 'v3.2.1', 'Vehicle-to-everything communication SDK integration'),
    ('SmartCity Dashboard', 'Urban Analytics Inc', 'IoT Management', 12400, 50000, 'active', 'Smart City mMTC', 'v2.8.0', 'City-wide IoT sensor management and visualization'),
    ('MedConnect Remote', 'HealthTech Solutions', 'Telemedicine', 8900, 25000, 'active', 'Healthcare URLLC', 'v4.1.0', 'Remote patient monitoring and consultation platform'),
    ('GameStream Ultra', 'CloudPlay Studios', 'Cloud Gaming', 78500, 200000, 'active', 'Gaming eMBB', 'v5.0.2', 'Ultra-low latency cloud gaming engine'),
    ('DroneOps Manager', 'SkyLogistics Corp', 'Fleet Management', 15600, 30000, 'active', 'Drone Fleet URLLC', 'v2.4.3', 'Commercial drone fleet management and routing'),
    ('FactoryIQ Platform', 'IndustrialAI GmbH', 'Industrial IoT', 34100, 75000, 'active', 'Industrial IoT mMTC', 'v3.6.1', 'AI-powered factory automation and monitoring'),
    ('TradeFast Engine', 'QuantumTrade Ltd', 'Financial Trading', 250000, 500000, 'active', 'Financial Services eMBB', 'v6.0.0', 'High-frequency trading engine with 5G edge compute'),
    ('LiveCast Producer', 'MediaStream Global', 'Broadcasting', 5600, 20000, 'active', 'Media Broadcast eMBB', 'v3.1.0', 'Live 4K/8K broadcast production platform'),
    ('AgriSense Monitor', 'FarmTech Australia', 'Agriculture IoT', 3200, 15000, 'active', 'Smart Agriculture mMTC', 'v1.9.5', 'Precision agriculture sensor network platform'),
    ('GridWatch Analytics', 'PowerGrid Solutions', 'Energy Management', 8700, 25000, 'active', 'Smart Grid mMTC', 'v2.3.0', 'Smart grid real-time monitoring and analytics'),
    ('SafeCity Command', 'PublicSafe Technologies', 'Public Safety', 21000, 50000, 'active', 'Public Safety URLLC', 'v4.2.1', 'Emergency services dispatch and communication platform'),
    ('RetailIQ Insights', 'ShopTech Solutions', 'Retail Analytics', 6800, 20000, 'active', 'Retail Analytics eMBB', 'v2.1.0', 'In-store analytics and customer behavior platform'),
    ('LogiTrack Global', 'SupplyChain Systems', 'Logistics', 11200, 30000, 'active', 'Logistics Tracking mMTC', 'v3.0.2', 'Global supply chain tracking and optimization'),
    ('SIMVault Manager', 'TelecomOps Inc', 'SIM Management', 4500, 10000, 'active', 'Enterprise eMBB Slice', 'v1.5.0', 'Enterprise SIM card lifecycle management'),
    ('NetworkAI Optimizer', 'NetIntelligence Labs', 'Network Optimization', 2100, 10000, 'active', 'Enterprise eMBB Slice', 'v2.0.0', 'AI-driven network optimization recommendation engine')
  `);
  console.log('Seeded developer_apps.');

  // Seed network_events (15)
  await pool.query(`
    INSERT INTO network_events (event_type, severity, source, message, details, resolved, created_at) VALUES
    ('slice_scaling', 'info', 'Gaming eMBB', 'Auto-scaled gaming slice from 5 Gbps to 7 Gbps', 'Peak evening traffic detected. Auto-scaling triggered at 85% utilization threshold.', true, NOW() - INTERVAL '2 hours'),
    ('latency_spike', 'warning', 'NYC-EDGE-01', 'Latency spike detected: 15ms (threshold: 10ms)', 'Temporary congestion on primary uplink. Traffic rerouted via backup path.', true, NOW() - INTERVAL '4 hours'),
    ('device_disconnect', 'warning', 'AGV-Robot-001', 'Industrial robot lost connectivity for 3 seconds', 'Brief radio interference on factory floor. Device reconnected automatically.', true, NOW() - INTERVAL '6 hours'),
    ('security_alert', 'critical', 'DDoS Mitigation', 'Potential DDoS attack detected on enterprise slice', 'Anomalous traffic pattern: 50x normal volume from 12 source IPs. Auto-mitigation activated.', true, NOW() - INTERVAL '12 hours'),
    ('sla_warning', 'warning', 'Smart City IoT SLA', 'SLA uptime dropped below 99.9% threshold', 'Current uptime: 99.85%. Root cause: scheduled maintenance on SIN-EDGE-01.', false, NOW() - INTERVAL '1 hour'),
    ('firmware_update', 'info', 'IoT Fleet Manager', 'Firmware update deployed to 2,500 smart meters', 'Version 2.4.1 deployed during off-peak window. 99.8% success rate.', true, NOW() - INTERVAL '8 hours'),
    ('edge_failover', 'critical', 'BER-EDGE-01', 'Edge node failover triggered - hardware fault', 'Primary compute blade failure. Traffic automatically redirected to FRA-EDGE-01.', false, NOW() - INTERVAL '30 minutes'),
    ('bandwidth_threshold', 'warning', 'Media Broadcast eMBB', 'Bandwidth utilization at 87.5% - approaching capacity', 'Live sports event causing high media traffic. Consider temporary allocation increase.', false, NOW() - INTERVAL '45 minutes'),
    ('new_device_registered', 'info', 'Device Manager', '150 new IoT sensors registered in Singapore', 'Smart city expansion: new air quality and traffic sensors deployed in Marina Bay area.', true, NOW() - INTERVAL '3 hours'),
    ('slice_created', 'info', 'Slice Manager', 'New URLLC slice created for hospital network', 'Toronto General Hospital requested dedicated URLLC slice for robotic surgery pilot.', true, NOW() - INTERVAL '24 hours'),
    ('certificate_expiry', 'warning', 'Security Manager', 'TLS certificate expiring in 7 days for api-gateway', 'Certificate CN=api.5gnetwork.com expires on 2026-03-23. Auto-renewal scheduled.', false, NOW() - INTERVAL '5 hours'),
    ('performance_degradation', 'warning', 'MUM-EDGE-01', 'Edge compute performance degraded by 15%', 'High ambient temperature affecting cooling efficiency. Load redistribution in progress.', false, NOW() - INTERVAL '2 hours'),
    ('api_rate_limit', 'info', 'API Gateway', 'Developer app TradeFast hit 90% of daily API limit', '450,000 of 500,000 daily calls consumed. Developer notified.', true, NOW() - INTERVAL '7 hours'),
    ('network_partition', 'critical', 'Core Router CR-07', 'Brief network partition between US-East and US-Central', '200ms partition resolved. BGP reconvergence completed in 1.2 seconds.', true, NOW() - INTERVAL '18 hours'),
    ('qos_policy_update', 'info', 'Policy Engine', 'QoS policy updated for Healthcare URLLC slice', 'Jitter tolerance tightened from 0.5ms to 0.2ms per hospital compliance requirements.', true, NOW() - INTERVAL '10 hours')
  `);
  console.log('Seeded network_events.');

  // Seed api_keys (15)
  await pool.query(`
    INSERT INTO api_keys (name, key_prefix, developer, permissions, rate_limit, calls_today, status, expires_at) VALUES
    ('Waymo Production Key', 'wm_prod_5g', 'Waymo Engineering', 'read,write,stream', 100000, 45230, 'active', NOW() + INTERVAL '365 days'),
    ('Urban Analytics Read', 'ua_read_5g', 'Urban Analytics Inc', 'read', 50000, 12400, 'active', NOW() + INTERVAL '180 days'),
    ('HealthTech Full Access', 'ht_full_5g', 'HealthTech Solutions', 'read,write,admin', 25000, 8900, 'active', NOW() + INTERVAL '365 days'),
    ('CloudPlay Gaming API', 'cp_game_5g', 'CloudPlay Studios', 'read,write,stream', 200000, 78500, 'active', NOW() + INTERVAL '365 days'),
    ('SkyLogistics Drone API', 'sl_drn_5g', 'SkyLogistics Corp', 'read,write', 30000, 15600, 'active', NOW() + INTERVAL '270 days'),
    ('IndustrialAI Key', 'ia_ind_5g', 'IndustrialAI GmbH', 'read,write', 75000, 34100, 'active', NOW() + INTERVAL '365 days'),
    ('QuantumTrade HFT Key', 'qt_hft_5g', 'QuantumTrade Ltd', 'read,write,stream,priority', 500000, 250000, 'active', NOW() + INTERVAL '90 days'),
    ('MediaStream Broadcast', 'ms_brd_5g', 'MediaStream Global', 'read,write,stream', 20000, 5600, 'active', NOW() + INTERVAL '365 days'),
    ('FarmTech Monitor Key', 'ft_agr_5g', 'FarmTech Australia', 'read', 15000, 3200, 'active', NOW() + INTERVAL '365 days'),
    ('PowerGrid Analytics', 'pg_pwr_5g', 'PowerGrid Solutions', 'read,write', 25000, 8700, 'active', NOW() + INTERVAL '365 days'),
    ('PublicSafe Emergency', 'ps_emg_5g', 'PublicSafe Technologies', 'read,write,admin,priority', 50000, 21000, 'active', NOW() + INTERVAL '365 days'),
    ('ShopTech Retail Key', 'st_rtl_5g', 'ShopTech Solutions', 'read', 20000, 6800, 'active', NOW() + INTERVAL '180 days'),
    ('SupplyChain Logistics', 'sc_log_5g', 'SupplyChain Systems', 'read,write', 30000, 11200, 'active', NOW() + INTERVAL '365 days'),
    ('TelecomOps Admin Key', 'to_adm_5g', 'TelecomOps Inc', 'read,write,admin', 10000, 4500, 'active', NOW() + INTERVAL '365 days'),
    ('NetIntelligence Dev', 'ni_dev_5g', 'NetIntelligence Labs', 'read,write', 10000, 2100, 'active', NOW() + INTERVAL '60 days')
  `);
  console.log('Seeded api_keys.');

  // Seed sim_cards (15)
  await pool.query(`
    INSERT INTO sim_cards (iccid, imsi, msisdn, status, network_slice, device, data_plan, data_used, apn, description) VALUES
    ('8901260882168741234', '310260882168741', '+14155551001', 'active', 'Autonomous Vehicle URLLC', 'Tesla-AV-042', 'Unlimited 5G', '475.2 GB', '5g-v2x.carrier.com', 'Autonomous vehicle primary SIM with V2X capabilities'),
    ('8901260882168741235', '310260882168742', '+14155551002', 'active', 'Industrial IoT mMTC', 'AGV-Robot-001', 'IoT 10GB', '7.2 GB', '5g-iot.carrier.com', 'Industrial robot connectivity SIM'),
    ('8944120000168741236', '234201234567890', '+447911123001', 'active', 'Healthcare URLLC', 'SurgicalBot-LDN-03', 'Unlimited 5G Priority', '156.8 GB', '5g-health.carrier.co.uk', 'Surgical robot dedicated high-priority SIM'),
    ('8901260882168741237', '310260882168743', '+14155551003', 'active', 'Smart City mMTC', 'SmartMeter-NYC-1892', 'IoT 1GB', '0.5 GB', '5g-smartcity.carrier.com', 'Smart meter low-data IoT SIM'),
    ('8901260882168741238', '310260882168744', '+14155551004', 'active', 'Drone Fleet URLLC', 'DroneDelivery-LAX-07', 'IoT 50GB', '24.1 GB', '5g-drone.carrier.com', 'Delivery drone with live video uplink SIM'),
    ('8965020882168741239', '520021234567890', '+6591234001', 'active', 'Smart City mMTC', 'AirQuality-SIN-445', 'IoT 500MB', '0.3 GB', '5g-sensor.singtel.com', 'Environmental sensor minimal data SIM'),
    ('8982010882168741240', '450051234567890', '+8210123401', 'active', 'Gaming eMBB', 'GameConsole-SEL-8821', 'Unlimited 5G', '1350.5 GB', '5g-gaming.sktelecom.com', 'Cloud gaming console high-bandwidth SIM'),
    ('8981100882168741241', '440101234567890', '+8190123401', 'active', 'Smart City mMTC', 'TrafficCam-TKY-112', 'IoT 100GB', '89.4 GB', '5g-camera.docomo.ne.jp', 'Traffic camera high-resolution upload SIM'),
    ('8991000882168741242', '404101234567890', '+919876543001', 'active', 'Telemedicine URLLC', 'WearableECG-MUM-33', 'IoT 5GB', '2.1 GB', '5g-health.jio.com', 'Medical wearable continuous monitoring SIM'),
    ('8961010882168741243', '505011234567890', '+61412345001', 'active', 'Smart Agriculture mMTC', 'FieldTractor-SYD-05', 'IoT 20GB', '12.8 GB', '5g-agri.telstra.com', 'Agricultural robot GPS and telemetry SIM'),
    ('8997100882168741244', '424011234567890', '+971501234001', 'active', 'Retail Analytics eMBB', 'POS-Terminal-DXB-77', 'Business 5GB', '3.2 GB', '5g-retail.du.ae', 'Smart POS terminal retail connectivity SIM'),
    ('8955010882168741245', '724111234567890', '+5511987654001', 'active', 'Logistics Tracking mMTC', 'FleetTracker-SAO-321', 'IoT 2GB', '0.8 GB', '5g-fleet.vivo.com.br', 'Container tracking GPS SIM'),
    ('8901260882168741246', '310260882168745', '+14155551005', 'active', 'Public Safety URLLC', 'BWCam-CHI-PD-019', 'Unlimited 5G Priority', '240.6 GB', '5g-safety.firstnet.com', 'Police body camera live streaming SIM'),
    ('8901260882168741247', '310260882168746', '+14155551006', 'active', 'Financial Services eMBB', 'TradingServer-NYC-HFT', 'Unlimited 5G Ultra', '15000.0 GB', '5g-finance.carrier.com', 'HFT server ultra-low latency dedicated SIM'),
    ('8901260882168741248', '310260882168747', '+14155551007', 'active', 'Media Broadcast eMBB', 'BroadcastUnit-LAX-4K', 'Unlimited 5G', '7500.0 GB', '5g-media.carrier.com', 'Live broadcast 4K uplink SIM')
  `);
  console.log('Seeded sim_cards.');

  // Seed ai_analyses (15)
  await pool.query(`
    INSERT INTO ai_analyses (type, title, input_data, result, status, model, created_at) VALUES
    ('network-optimizer', 'Gaming Slice Optimization', '{"slice":"Gaming eMBB","utilization":84,"peak_hours":"18:00-23:00"}', 'Recommendation: 1) Scale gaming slice to 7 Gbps during peak hours (18:00-23:00). 2) Enable predictive pre-scaling 30 minutes before peak. 3) Implement edge caching for top 20 game titles to reduce backbone traffic by ~35%. 4) Consider dedicated GPU edge instances in Seoul and Tokyo for APAC gamers. Expected improvement: 22% latency reduction, 15% cost savings through intelligent scaling.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '2 days'),
    ('traffic-analyzer', 'Weekly Traffic Pattern Analysis', '{"period":"2026-03-09 to 2026-03-15","slices":"all","metrics":"bandwidth,latency,connections"}', 'Key Findings: 1) Enterprise eMBB traffic increased 12% week-over-week, driven by video conferencing. Peak: Tuesday 10:00-12:00 UTC. 2) IoT mMTC traffic shows consistent daily pattern with 3% growth. 3) Gaming traffic peaked Saturday 20:00 UTC at 4.8 Gbps. 4) Healthcare URLLC maintains stable sub-2ms latency. 5) Anomaly: Logistics slice saw 40% traffic spike Wednesday - traced to Black Friday pre-sale inventory sync.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '1 day'),
    ('anomaly-detector', 'Security Scan - Enterprise Slice', '{"slice":"Enterprise eMBB","timeframe":"last_24h","metrics":"traffic_volume,source_ips,protocols"}', 'Anomalies Detected: [MEDIUM] 1) 3 previously unseen source IPs generating 200 Mbps each - recommend verification. [LOW] 2) UDP traffic increased 15% - likely new video conferencing deployment. [INFO] 3) TLS 1.2 connections still present (8%) - recommend migration to TLS 1.3. No critical threats identified. Overall risk score: 3/10.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '12 hours'),
    ('network-optimizer', 'Edge Node Capacity Planning', '{"nodes":["NYC-EDGE-01","TKY-EDGE-01","SEL-EDGE-01"],"current_load":[72,81,78],"growth_rate":"8% monthly"}', 'Capacity Planning: 1) TKY-EDGE-01 will reach 95% capacity in ~2 months at current growth. Recommend scheduling hardware expansion by April 2026. 2) SEL-EDGE-01 needs additional GPU blades for gaming workload growth. 3) NYC-EDGE-01 can handle 3 more months before expansion. 4) Consider deploying OSA-EDGE-01 (Osaka) as overflow for Tokyo. Estimated CAPEX: $2.4M for all recommended expansions.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '3 days'),
    ('traffic-analyzer', 'IoT Traffic Classification', '{"slice":"Smart City mMTC","device_count":15000,"protocols":"MQTT,CoAP,HTTP"}', 'Traffic Classification: 1) MQTT: 68% of IoT traffic (sensors, meters) - avg 2KB/msg, 45,000 msg/min. 2) CoAP: 22% (constrained devices) - avg 512B/msg. 3) HTTP: 10% (cameras, dashboards) - avg 50KB/req. Optimization: Switch 30% of HTTP devices to CoAP to reduce overhead by 40%. Implement MQTT broker clustering for scalability. Current protocol mix is efficient for the device profile.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '5 days'),
    ('anomaly-detector', 'V2X Network Health Check', '{"slice":"Autonomous Vehicle URLLC","vehicles":340,"metrics":"latency,packet_loss,handover_success"}', 'V2X Health Assessment: [HEALTHY] All critical metrics within SLA. Latency: 0.8ms avg (target: 1ms). Packet loss: 0.00001% (target: 0.0001%). Handover success: 99.998%. [INFO] Minor observation: handover latency increases by 0.1ms in CHI-EDGE-01 sector 7 - likely due to building obstruction. Recommend site survey. Overall V2X network health: EXCELLENT (9.8/10).', 'completed', 'openai/gpt-4', NOW() - INTERVAL '6 hours'),
    ('network-optimizer', 'Cross-Slice Resource Optimization', '{"slices":"all","utilization_data":"full","optimization_goal":"cost_reduction"}', 'Cross-Slice Optimization: 1) Merge Smart City and Smart Grid mMTC slices during off-peak (00:00-06:00) - save 15% resources. 2) Dynamically share unused Healthcare bandwidth with Telemedicine during non-surgery hours. 3) Implement time-based QoS for Gaming slice (reduce to 3 Gbps during 02:00-10:00). Total estimated monthly savings: $45,000 while maintaining all SLAs.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '4 days'),
    ('traffic-analyzer', 'Financial Trading Latency Deep Dive', '{"slice":"Financial Services eMBB","metric":"end_to_end_latency","granularity":"microsecond"}', 'Latency Analysis: 1) Mean E2E latency: 0.3ms. P99: 0.8ms. P99.9: 1.1ms. 2) Jitter: 0.05ms avg - excellent stability. 3) Micro-burst detected at market open (09:30 EST) causing 50us latency spike. 4) Recommendation: Pre-allocate buffer capacity 5 minutes before market open. 5) Current setup supports up to 2M transactions/sec before degradation.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '2 days'),
    ('anomaly-detector', 'Berlin Edge Node Failure Analysis', '{"node":"BER-EDGE-01","event":"hardware_fault","timestamp":"2026-03-16T10:30:00Z"}', '[CRITICAL] Root Cause Analysis: Primary compute blade (Blade-07) experienced memory ECC uncorrectable error leading to kernel panic. Failover to FRA-EDGE-01 completed in 1.8 seconds. Impact: 12ms latency increase for 847 devices during failover. Recommendation: 1) Replace Blade-07 memory modules. 2) Add redundant compute blade to BER-EDGE-01. 3) Update failover threshold to trigger on correctable ECC errors as early warning.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '1 hour'),
    ('network-optimizer', 'Drone Fleet Bandwidth Optimization', '{"slice":"Drone Fleet URLLC","drones":275,"video_quality":"1080p","telemetry_rate":"100Hz"}', 'Drone Optimization: 1) Current 1080p video uses 8 Mbps/drone = 2.2 Gbps total. Switch to H.265 encoding to reduce to 4 Mbps/drone. 2) Implement adaptive video quality based on mission criticality. 3) Batch telemetry uploads (100Hz to 10Hz for non-critical data) saving 60% uplink. 4) Use edge AI for local video processing - only upload anomalies. Expected bandwidth savings: 55%.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '7 days'),
    ('traffic-analyzer', 'Healthcare Network Compliance Audit', '{"slice":"Healthcare URLLC","compliance":"HIPAA,HL7","period":"Q1 2026"}', 'Compliance Audit Results: 1) All data-in-transit encrypted with TLS 1.3 - COMPLIANT. 2) Network isolation between healthcare and other slices - VERIFIED. 3) Latency SLA met 99.999% of time - COMPLIANT. 4) Data residency: all patient data routed through approved regions - COMPLIANT. 5) Access logging: 100% of API calls logged with user attribution. Overall: FULLY COMPLIANT. No remediation needed.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '10 days'),
    ('anomaly-detector', 'Mumbai Edge Thermal Alert', '{"node":"MUM-EDGE-01","temperature":38,"threshold":35,"performance_impact":"15%"}', '[HIGH] Thermal Alert: MUM-EDGE-01 operating at 38C (threshold: 35C). Performance degraded 15%. Root cause: HVAC unit #2 malfunction during Mumbai heat wave (ambient 42C). Immediate actions: 1) Redistribute 20% load to SIN-EDGE-01. 2) Dispatch HVAC repair team. 3) Enable thermal throttling to prevent hardware damage. Long-term: Install supplementary cooling for monsoon season preparation.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '3 hours'),
    ('network-optimizer', 'Smart Agriculture Satellite Optimization', '{"slice":"Smart Agriculture mMTC","connectivity":"hybrid_5g_satellite","sensors":22000}', 'Hybrid Connectivity Optimization: 1) 60% of sensors in 5G coverage - use terrestrial path. 2) 40% rely on satellite backhaul - batch uploads every 15 minutes instead of real-time. 3) Implement data compression (delta encoding) for soil sensors - 80% reduction. 4) Use satellite only for alerting, 5G for bulk data. 5) Deploy 3 additional rural small cells to shift 15% of satellite traffic to 5G. ROI: 8 months.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '8 days'),
    ('traffic-analyzer', 'Retail Analytics Peak Season Prep', '{"slice":"Retail Analytics eMBB","season":"holiday","expected_increase":"300%"}', 'Peak Season Readiness: 1) Current capacity: 3 Gbps allocated, 60% utilized. Holiday peak estimate: 7.2 Gbps needed. 2) Recommend pre-scaling to 8 Gbps by Nov 15. 3) Deploy edge caching for product catalog APIs. 4) Enable auto-scaling for POS transaction processing. 5) Test failover procedures before Black Friday. 6) Estimated additional cost: $12,000/month during peak. All SLAs achievable with recommended scaling.', 'completed', 'openai/gpt-4', NOW() - INTERVAL '5 days'),
    ('anomaly-detector', 'Weekly Network Security Summary', '{"scope":"all_slices","period":"2026-03-09 to 2026-03-15","threat_intelligence":"enabled"}', 'Weekly Security Summary: Total events analyzed: 2.4M. [CRITICAL] 1 DDoS attempt mitigated (enterprise slice). [HIGH] 2 unauthorized device registration attempts blocked. [MEDIUM] 5 certificate anomalies (resolved). [LOW] 12 rate limit violations. [INFO] 45 new device registrations verified. Threat landscape: No APT indicators. Recommend updating IDS signatures (2 weeks old). Overall security posture: STRONG (8.5/10).', 'completed', 'openai/gpt-4', NOW() - INTERVAL '1 day')
  `);
  console.log('Seeded ai_analyses.');

  // Seed usage_analytics (15)
  await pool.query(`
    INSERT INTO usage_analytics (metric_name, category, value, unit, period, trend, change_percent, details) VALUES
    ('Total Data Throughput', 'bandwidth', 847.5, 'TB', 'daily', 'up', 8.2, 'Total data transferred across all network slices in the last 24 hours'),
    ('Active Connected Devices', 'devices', 62847, 'count', 'current', 'up', 3.5, 'Total number of active connected devices across all slices'),
    ('Average Network Latency', 'latency', 4.2, 'ms', 'hourly', 'down', -5.1, 'Average latency across all edge nodes weighted by traffic volume'),
    ('API Calls Total', 'api', 547800, 'calls', 'daily', 'up', 12.4, 'Total API calls across all developer applications'),
    ('Network Uptime', 'reliability', 99.97, 'percent', 'monthly', 'stable', 0.01, 'Overall network availability across all slices'),
    ('Edge Node Utilization', 'compute', 58.3, 'percent', 'current', 'up', 4.7, 'Average utilization across all 15 edge computing nodes'),
    ('SLA Compliance Rate', 'sla', 99.2, 'percent', 'monthly', 'down', -0.3, 'Percentage of SLA targets currently being met'),
    ('Active Network Slices', 'slices', 14, 'count', 'current', 'stable', 0.0, 'Number of active network slices (1 in maintenance)'),
    ('Peak Bandwidth Usage', 'bandwidth', 42.8, 'Gbps', 'daily_peak', 'up', 6.9, 'Maximum instantaneous bandwidth recorded in the last 24 hours'),
    ('IoT Messages Processed', 'iot', 12500000, 'messages', 'daily', 'up', 5.2, 'Total IoT messages processed across mMTC slices'),
    ('AI Analyses Performed', 'ai', 15, 'analyses', 'weekly', 'up', 25.0, 'Number of AI-powered network analyses completed this week'),
    ('Active SIM Cards', 'sim', 15, 'count', 'current', 'up', 7.1, 'Number of active SIM cards in the network'),
    ('Revenue per GB', 'financial', 0.12, 'USD', 'monthly_avg', 'down', -2.1, 'Average revenue per gigabyte of data transferred'),
    ('Carbon Footprint', 'sustainability', 12.4, 'tons CO2', 'monthly', 'down', -8.5, 'Estimated monthly carbon emissions from network operations'),
    ('Developer Apps Active', 'developer', 15, 'count', 'current', 'up', 15.4, 'Number of active developer applications using the platform')
  `);
  console.log('Seeded usage_analytics.');

  console.log('Database seeding completed successfully!');
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  pool.end();
  process.exit(1);
});
