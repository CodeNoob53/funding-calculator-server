const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('../routes');
const metricsMiddleware = require('../middlewares/metrics');
const logger = require('../utils/logger');
const os = require('os');

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

  // Health check endpoint
  app.get('/health', (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpu: {
        loadAvg: os.loadavg(),
        cpus: os.cpus().length
      },
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.json(health);
  });

  // Кореневий маршрут
  app.get('/', (req, res) => {
    res.send('Funding Server is running...');
  });

  // Централізована обробка помилок
  app.use((err, req, res) => {
    logger('error', err.message);
    res.status(500).json({
      error: 'Internal Server Error',
      details: err.message
    });
  });

  return { app, server };
};

module.exports = setupServer;