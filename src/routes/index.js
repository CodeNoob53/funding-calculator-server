const express = require('express');
const router = express.Router();

const fundingRatesRouter    = require('./fundingRates');
const verifyToken = require('../middlewares/verifyToken');

// Захищаємо всі /api/proxy/* запити
router.use('/proxy', verifyToken, fundingRatesRouter);

module.exports = router;