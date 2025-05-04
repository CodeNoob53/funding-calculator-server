const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('../routes');
const metricsMiddleware = require('../middlewares/metrics');
const rateLimitMiddleware = require('../middlewares/rateLimit');
const logger = require('../utils/logger');

const setupServer = () => {
  const app = express();
  const server = http.createServer(app);

  // Middleware
  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
  app.use(express.json());
  app.use(morgan('dev'));

  // Метрики Prometheus
  app.use(metricsMiddleware);

  // Логування запитів до API
  app.use('/api', (req, res, next) => {
    logger('info', `${req.method} ${req.originalUrl}`);
    next();
  });

  // Роути
  app.use('/api', routes);

  // Метрики Prometheus ендпоінт
  app.get('/metrics', async (req, res) => {
    const client = require('prom-client');
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

  return { app, server };
};

module.exports = setupServer;