/**
 * Lightweight migration runner — called from server startup.
 * Each migration is idempotent (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
 */
const pool = require('./db');

async function runMigrations() {
  // 1. Add metadata column to ai_analyses if missing
  await pool.query(`
    ALTER TABLE ai_analyses ADD COLUMN IF NOT EXISTS metadata JSONB;
  `);

  // 2. Add updated_at column to ai_analyses if missing
  await pool.query(`
    ALTER TABLE ai_analyses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
  `);

  // 3. Add usage_count to api_keys if missing
  await pool.query(`
    ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
  `);

  // 4. Add is_active to api_keys if missing (for apiKeyAuth middleware)
  await pool.query(`
    ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  `);

  // 5. Ensure anomaly_rules table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS anomaly_rules (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      metric VARCHAR(255) NOT NULL,
      operator VARCHAR(20) NOT NULL,
      threshold NUMERIC NOT NULL,
      action VARCHAR(255) NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('Migrations applied successfully.');
}

module.exports = runMigrations;
