const express = require('express');
const router = express.Router();

const fundingRates = require('./fundingRates');
const monitoring = require('./monitoring');
const verifyToken = require('../middlewares/verifyToken');

// Захищаємо всі /api/proxy/* запити
router.use('/proxy', verifyToken, fundingRates.router);

// Додаємо роути моніторингу (також захищені API ключем)
router.use('/monitoring', verifyToken, monitoring.router);

module.exports = router;