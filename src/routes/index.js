const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const fundingRatesExtendedRoutes = require('./fundingRatesExtended');
const verifyToken = require('../middlewares/verifyToken');
const rateLimitMiddleware = require('../middlewares/rateLimit');

// Маршрути автентифікації (не потребують захисту)
router.use('/auth', authRoutes);

// Захищені маршрути
router.use('/proxy', (req, res, next) => {
  verifyToken(req, null, (err) => {
    if (err) return res.status(403).json({ error: err.message });
    next();
  });
}, rateLimitMiddleware, fundingRatesExtendedRoutes);

module.exports = router;