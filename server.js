const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const verifyToken = require('./middlewares/verifyToken');
const rateLimit = require('express-rate-limit');
const client = require('prom-client');
const fundingRatesExtended = require('./routes/fundingRatesExtended');
const setupSocketServer = require('./socket');
const logger = require('./utils/logger');

// Завантажуємо змінні середовища

console.log('Loaded env variables:', process.env); // Діагностика

// Перевірка обов'язкових змінних середовища
const requiredEnv = ['API_KEY', 'JWT_SECRET', 'CLIENT_URL', 'COINGLASS_API_URL'];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    logger('error', `FATAL: ${env} is not defined in .env`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Створюємо HTTP-сервер
const server = http.createServer(app);

// Налаштування Prometheus метрик
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code']
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// verifyToken middleware для захисту ендпоінтів
app.use('/api/proxy', verifyToken, fundingRatesExtended);

// Обмеження частоти запитів
app.use('/api/proxy', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 100, // максимум 100 запитів
  message: 'Too many requests, please try again later.'
}));

// Метрики для HTTP-запитів
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.path, code: res.statusCode });
  });
  next();
});

// Логування запитів до API
app.use('/api/proxy', (req, res, next) => {
  logger('info', `${req.method} ${req.originalUrl}`);
  next();
});

// Роути
app.use('/api/proxy', fundingRatesExtended);

// Метрики Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Кореневий маршрут
app.get('/', (req, res) => {
  res.send('Funding Server is running...');
});

// Централізована обробка помилок
app.use((err, req, res, next) => {
  logger('error', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message
  });
});

// Ініціалізація Socket.IO
const io = setupSocketServer(server);

// Запуск сервера
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