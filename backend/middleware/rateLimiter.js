const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// AI routes: 20 requests per hour per user ID or IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => {
    // Use user ID from JWT (set by auth middleware) or fall back to IP
    return (req.user && req.user.id) ? `user:${req.user.id}` : ipKeyGenerator(req.ip);
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Limit is 20 per hour. Please try again later.' },
});

// General API rate limiter (100 req/15 min)
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

module.exports = { aiRateLimiter, generalRateLimiter };
