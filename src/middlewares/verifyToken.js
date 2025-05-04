const logger = require('../utils/logger');

module.exports = function verifyToken(req, res, next) {
  const apiKey = req.headers['s_api_key'];

  // Перевірка API Key
  if (!apiKey) {
    logger('error', 'API Key відсутній');
    return res.status(403).json({ error: 'API Key required' });
  }

  const expectedApiKey = process.env.S_API_KEY;
  if (apiKey !== expectedApiKey) {
    logger('error', 'Неправильний API Key');
    return res.status(403).json({ error: 'Invalid API Key' });
  }

  logger('info', 'Автентифікація через API Key успішна');
  next();
};