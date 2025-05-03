// server/routes/fundingRatesExtended.js
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const chalk = require('chalk');
const dayjs = require('dayjs');

const router = express.Router();
const fundingCache = new NodeCache({ stdTTL: 60 });
// Експортуємо кеш для використання в socket.js
module.exports = router;
module.exports.fundingCache = fundingCache;

const COINGLASS_API = 'https://open-api.coinglass.com/public/v2/funding';

const log = (type, message) => {
  const ts = dayjs().format('YYYY-MM-DD HH:mm:ss');
  if (type === 'hit') console.log(chalk.green(`[CACHE HIT ${ts}]`), message);
  if (type === 'update') console.log(chalk.yellow(`[CACHE UPDATE ${ts}]`), message);
  if (type === 'error') console.log(chalk.red(`[ERROR ${ts}]`), message);
};

// Оновлення кешу кожні 20 секунд
setInterval(async () => {
  try {
    const COINGLASS_SECRET = process.env.API_KEY;
    if (!COINGLASS_SECRET) return;
    const { data } = await axios.get(COINGLASS_API, {
      headers: {
        accept: 'application/json',
        coinglassSecret: COINGLASS_SECRET
      }
    });
    if (Array.isArray(data.data)) {
      fundingCache.set('extended', data);
      log('update', `[AUTO] Stored ${data.data.length} symbols to cache.`);
    }
  } catch (error) {
    log('error', `[AUTO] ${error?.response?.data || error.message}`);
  }
}, 20000);

router.get('/funding-rates-extended', async (req, res) => {
  console.log('[DEBUG] funding-rates-extended endpoint was hit');

  const COINGLASS_SECRET = process.env.API_KEY;

  if (!COINGLASS_SECRET) {
    return res.status(500).json({ error: 'Missing Coinglass API key. Please set API_KEY in .env.' });
  }

  const cached = fundingCache.get('extended');
  if (cached) {
    console.log('[DEBUG] cached:', Array.isArray(cached) ? cached.length : 'no data');
    log('hit', `Returned ${cached.length} cached symbols.`);
    return res.json(cached);
  }

  try {
    const { data } = await axios.get(COINGLASS_API, {
      headers: {
        accept: 'application/json',
        coinglassSecret: COINGLASS_SECRET
      }
    });
  
    if (!Array.isArray(data.data)) {
      throw new Error('Expected data.data to be an array');
    }
  
    fundingCache.set('extended', data);
    log('update', `Stored ${data.data?.length || 0} symbols to cache.`);
    res.json(data);
  } catch (error) {
    log('error', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch funding rates from Coinglass',
      details: error?.response?.data || error.message
    });
  }
  
});

module.exports = router;