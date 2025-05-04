const express = require('express');
const axios = require('axios');
const fundingCache = require('../services/fundingCache');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/funding-rates-extended', async (req, res) => {
  try {
    const response = await axios.get(`${process.env.COINGLASS_API_URL}/funding-rates-extended`, {
      headers: { 'coinglassSecret': process.env.API_KEY }
    });

    const data = { data: response.data };
    fundingCache.set('extended', data);
    logger('info', `[AUTO] Stored ${data.data.length} funding records to cache`);

    res.json(data);
  } catch (error) {
    logger('error', 'Failed to fetch funding rates', error);
    res.status(500).json({ error: 'Failed to fetch funding rates' });
  }
});

module.exports = router;
module.exports.fundingCache = fundingCache;