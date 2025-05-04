const dotenv = require('dotenv');
dotenv.config();
const logger = require('./utils/logger');
const setupServer = require('./server');
const setupSocketServer = require('./server/socket');

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

// Ініціалізація Socket.IO
const io = setupSocketServer(server);

// Запуск сервера
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger('info', `Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger('info', 'Received SIGTERM. Performing graceful shutdown...');
  server.close(() => {
    logger('info', 'HTTP server closed.');
    process.exit(0);
  });
  io.close(() => {
    logger('info', 'Socket.IO server closed.');
  });
});