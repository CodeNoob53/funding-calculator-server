const express = require('express');
const router = express.Router();

const proxyRouter = require('./fundingRates');
const verifyToken = require('../middlewares/verifyToken');

// Захищаємо всі /api/proxy/* запити
app.use('/api/proxy', verifyToken, fundingRatesRouter);

module.exports = router;