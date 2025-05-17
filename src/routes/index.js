const express = require('express');
const router = express.Router();

const fundingRates = require('./fundingRates');
const verifyToken = require('../middlewares/verifyToken');

// Захищаємо всі /api/proxy/* запити
router.use('/proxy', verifyToken, fundingRates.router);

module.exports = router;