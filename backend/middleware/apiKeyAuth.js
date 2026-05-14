const pool = require('../db');

const apiKeyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'API key required. Provide Authorization: Bearer <key>' });
  }

  const key = authHeader.split(' ')[1];

  try {
    const result = await pool.query(
      `SELECT * FROM api_keys
       WHERE key_prefix = $1
         AND is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [key]
    );

    if (result.rows.length === 0) {
      // Fallback: try matching on full key stored as key_prefix (for seeded data)
      const fallback = await pool.query(
        `SELECT * FROM api_keys
         WHERE (key_prefix = $1 OR name = $1)
           AND status = 'active'
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [key]
      );
      if (fallback.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired API key.' });
      }
      await pool.query(
        `UPDATE api_keys SET usage_count = COALESCE(usage_count, 0) + 1, calls_today = COALESCE(calls_today, 0) + 1 WHERE id = $1`,
        [fallback.rows[0].id]
      );
      req.apiKey = fallback.rows[0];
      return next();
    }

    await pool.query(
      `UPDATE api_keys SET usage_count = COALESCE(usage_count, 0) + 1, calls_today = COALESCE(calls_today, 0) + 1 WHERE id = $1`,
      [result.rows[0].id]
    );
    req.apiKey = result.rows[0];
    next();
  } catch (err) {
    console.error('API key auth error:', err);
    res.status(500).json({ error: 'Internal server error during API key validation.' });
  }
};

module.exports = apiKeyAuth;
