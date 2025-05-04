const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const async = require('async');
const logger = require('../utils/logger');
const config = require('../config');

const router = express.Router();
const fundingCache = new NodeCache({ stdTTL: config.cacheTTL });

const COINGLASS_API_URL = process.env.COINGLASS_API_URL;

if (!process.env.API_KEY) {
  logger('error', 'FATAL: API_KEY is not defined in .env');
}

// Створення черги без використання callback
const fetchQueue = async.queue(async (task) => {
  return await task();
}, 1);

// Функція для отримання даних через чергу
const fetchFundingData = async () => {
  return new Promise((resolve, reject) => {
    fetchQueue.push(
      async () => {
        const { data } = await axios.get(COINGLASS_API_URL, {
          headers: {
            accept: 'application/json',
            coinglassSecret: process.env.API_KEY
          }
        });
        return data;
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// Автоматичне оновлення кешу
setInterval(async () => {
  try {
    const data = await fetchFundingData();
    if (Array.isArray(data.data)) {
      fundingCache.set('extended', data);
      logger('update', `[AUTO] Stored ${data.data.length} symbols to cache`);
    }
  } catch (error) {
    logger(
      'error',
      `[AUTO] ${error?.response?.data ? JSON.stringify(error.response.data) : error.message}`
    );
  }
}, config.fundingUpdateInterval);

// Ручний ендпоінт
router.get('/funding-rates-extended', async (req, res) => {
  logger('info', 'funding-rates-extended endpoint was hit');

  const cached = fundingCache.get('extended');
  if (cached) {
    logger('hit', `Returned ${cached.data.length} cached symbols`);
    return res.json(cached);
  }

  try {
    const data = await fetchFundingData();
    if (!Array.isArray(data.data)) {
      throw new Error('Expected data.data to be an array');
    }
    fundingCache.set('extended', data);
    logger('update', `Stored ${data.data.length} symbols to cache`);
    res.json(data);
  } catch (error) {
    logger(
      'error',
      error?.response?.data ? JSON.stringify(error.response.data) : error.message
    );
    res.status(500).json({
      error: 'Failed to fetch funding rates from Coinglass',
      details: error?.response?.data || error.message
    });
  }
});

module.exports = router;
module.exports.fundingCache = fundingCache;
