const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Налаштування кешу
const cache = new NodeCache({
  stdTTL: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 60, // TTL 60 секунд
  checkperiod: 30 // Перевірка кешу кожні 15 секунд
});

// Інтервал оновлення даних (у секундах)
const fundingUpdateInterval = process.env.FUNDING_UPDATE_INTERVAL
  ? parseInt(process.env.FUNDING_UPDATE_INTERVAL)
  : 20; // За документацією: 20 секунд

// Функція для асинхронного оновлення кешу
const updateCache = async (io) => {
  const cacheKey = 'funding-rates';
  try {
    logger('info', `Оновлення кешу: запит до ${process.env.COINGLASS_API_URL}`);
    const response = await axios.get(process.env.COINGLASS_API_URL, {
      headers: { 'coinglassSecret': process.env.API_KEY },
      timeout: 5000 // Таймаут 5 секунд
    });
    const data = response.data;
    // Перевірка структури відповіді від Coinglass
    if (data && typeof data === 'object' && 'code' in data && 'msg' in data && 'data' in data) {
      if (io) {
        // Якщо є WebSocket сервер, використовуємо його для оновлення
        await io.updateCacheAndBroadcast(data);
      } else {
        // Інакше просто оновлюємо кеш
        cache.set(cacheKey, data);
      }
      logger('info', 'Кеш успішно оновлено');
    } else {
      throw new Error('Некоректна структура відповіді від Coinglass API');
    }
  } catch (error) {
    logger('error', `Помилка оновлення кешу: ${error.message}`, { errorDetails: error.response?.data || error });
    // При помилці зберігаємо порожню відповідь з помилковим кодом
    const errorData = { code: '1', msg: 'Помилка отримання даних', data: [] };
    if (io) {
      await io.updateCacheAndBroadcast(errorData);
    } else {
      cache.set(cacheKey, errorData);
    }
  }
};

// Ініціалізація кешу при старті
let isCacheInitialized = false;
const initializeCache = async (io) => {
  await updateCache(io);
  isCacheInitialized = true;
};

router.get('/funding-rates', async (req, res) => {
  logger('info', `GET /api/proxy/funding-rates`);
  const cacheKey = 'funding-rates';

  // Чекаємо ініціалізації кешу для першого запиту
  if (!isCacheInitialized) {
    await initializeCache();
  }

  // Спроба отримати дані з кешу
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    logger('info', 'Повернення даних із кешу');
    return res.json(cachedData); // Повертаємо повну структуру, включаючи code і msg
  }

  // Якщо кеш порожній, повертаємо помилку з коректною структурою
  logger('warn', 'Кеш порожній, дані недоступні');
  res.status(503).json({ code: '1', msg: 'Дані тимчасово недоступні, спробуйте пізніше', data: [] });
});

// Експортуємо все разом
module.exports = {
  router,
  cache,
  initializeCache,
  updateCache
};