const dotenv = require('dotenv');
dotenv.config();
const logger = require('./utils/logger');
const setupServer = require('./server');
const setupSocketServer = require('./server/socket');
const { initializeCache, updateCache } = require('./routes/fundingRates');
const { setIoServer } = require('./routes/monitoring');

// Перевірка обов'язкових змінних середовища
const requiredEnv = ['API_KEY', 'CLIENT_URL', 'COINGLASS_API_URL', 'FUNDING_UPDATE_INTERVAL'];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    logger('error', `FATAL: ${env} is not defined in .env`);
    process.exit(1);
  }
}

// Ініціалізація сервера
const { app, server } = setupServer();

// Глобальна обробка помилок
app.use((err, req, res, next) => {
  logger('error', `Помилка: ${err.message}`);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

// Ініціалізація Socket.IO з Heartbeat
const io = setupSocketServer(server);

// Передача io серверу в модуль моніторингу
setIoServer(io);

// Ініціалізація кешу з WebSocket підтримкою
initializeCache(io);

// Періодичне оновлення кешу
const fundingUpdateInterval = parseInt(process.env.FUNDING_UPDATE_INTERVAL) || 20000;
setInterval(() => updateCache(io), fundingUpdateInterval);

// Запуск сервера
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger('info', `Server running on port ${PORT}`);
  logger('info', `Funding update interval: ${fundingUpdateInterval}ms`);
  logger('info', `Heartbeat interval: ${process.env.CUSTOM_HEARTBEAT_INTERVAL || 30000}ms`);
  logger('info', `Max missed pongs: ${process.env.MAX_MISSED_PONGS || 3}`);
  logger('info', `Socket.IO ping timeout: ${process.env.SOCKET_PING_TIMEOUT || 60000}ms`);
  logger('info', `Socket.IO ping interval: ${process.env.SOCKET_PING_INTERVAL || 25000}ms`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger('info', 'Received SIGTERM. Performing graceful shutdown...');
  
  // Закриття HTTP сервера
  server.close(() => {
    logger('info', 'HTTP server closed.');
    process.exit(0);
  });
  
  // Закриття Socket.IO сервера (heartbeat інтервали очистяться автоматично)
  if (io) {
    io.close(() => {
      logger('info', 'Socket.IO server closed.');
    });
  }
});

// Обробка SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  logger('info', 'Received SIGINT. Performing graceful shutdown...');
  
  server.close(() => {
    logger('info', 'HTTP server closed.');
    process.exit(0);
  });
  
  if (io) {
    io.close(() => {
      logger('info', 'Socket.IO server closed.');
    });
  }
});

// Обробка необроблених відхилень Promise
process.on('unhandledRejection', (reason, promise) => {
  logger('error', `Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// Обробка необроблених винятків
process.on('uncaughtException', (error) => {
  logger('error', `Uncaught Exception: ${error.message}`, { error });
  
  // Graceful shutdown при критичній помилці
  server.close(() => {
    process.exit(1);
  });
});