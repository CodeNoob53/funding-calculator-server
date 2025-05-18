const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Змінна для зберігання посилання на io сервер
let ioServer = null;

// Функція для встановлення посилання на io сервер
const setIoServer = (io) => {
  ioServer = io;
};

// GET /api/monitoring/connections - статистика всіх з'єднань
router.get('/connections', (req, res) => {
  try {
    if (!ioServer) {
      return res.status(503).json({
        error: 'WebSocket сервер недоступний'
      });
    }

    const stats = ioServer.getConnectionsStats();
    
    logger('info', `Запит статистики з'єднань: ${stats.summary.totalConnections} з'єднань`);
    
    res.json({
      timestamp: new Date().toISOString(),
      ...stats
    });
  } catch (error) {
    logger('error', `Помилка отримання статистики з'єднань: ${error.message}`, { error });
    res.status(500).json({
      error: 'Помилка отримання статистики',
      details: error.message
    });
  }
});

// GET /api/monitoring/health - детальний health check
router.get('/health', (req, res) => {
  try {
    const os = require('os');
    const process = require('process');
    
    // Базова інформація про систему
    const systemInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        process: process.uptime(),
        system: os.uptime()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        process: process.memoryUsage()
      },
      cpu: {
        loadAvg: os.loadavg(),
        cpus: os.cpus().length
      },
      environment: process.env.NODE_ENV || 'development'
    };

    // WebSocket статистика
    let websocketStats = null;
    if (ioServer) {
      const stats = ioServer.getConnectionsStats();
      websocketStats = {
        totalConnections: stats.summary.totalConnections,
        subscribedConnections: stats.summary.subscribedConnections,
        heartbeatInterval: stats.summary.heartbeatInterval,
        maxMissedPongs: stats.summary.maxMissedPongs
      };
    }

    // Перевірка кешу
    const cache = require('../services/fundingCache');
    const cacheStats = {
      hasData: cache.has('funding-rates'),
      size: cache.size
    };

    res.json({
      ...systemInfo,
      websocket: websocketStats,
      cache: cacheStats
    });
  } catch (error) {
    logger('error', `Помилка health check: ${error.message}`, { error });
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/monitoring/broadcast-test - тестова рассилка (тільки для розробки)
router.post('/broadcast-test', (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Тестова розсилка недоступна в production'
      });
    }

    if (!ioServer) {
      return res.status(503).json({
        error: 'WebSocket сервер недоступний'
      });
    }

    const testMessage = req.body.message || 'Тестове повідомлення';
    const subscribedCount = ioServer.sockets.adapter.rooms.get('funding-updates')?.size || 0;

    // Відправка тестового повідомлення
    ioServer.to('funding-updates').emit('testMessage', {
      message: testMessage,
      timestamp: Date.now(),
      source: 'monitoring'
    });

    logger('info', `Тестове повідомлення відправлено до ${subscribedCount} клієнтів`);

    res.json({
      success: true,
      message: 'Тестове повідомлення відправлено',
      recipientsCount: subscribedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger('error', `Помилка тестової розсилки: ${error.message}`, { error });
    res.status(500).json({
      error: 'Помилка тестової розсилки',
      details: error.message
    });
  }
});

// GET /api/monitoring/metrics - метрики у форматі для Prometheus
router.get('/metrics', async (req, res) => {
  try {
    const client = require('prom-client');
    
    // Додаткові WebSocket метрики
    if (ioServer) {
      const stats = ioServer.getConnectionsStats();
      
      // Створення або оновлення метрик
      const wsConnections = client.register.getSingleMetric('websocket_connections_total') || 
        new client.Gauge({
          name: 'websocket_connections_total',
          help: 'Total number of WebSocket connections'
        });
      
      const wsSubscribed = client.register.getSingleMetric('websocket_subscribed_connections') || 
        new client.Gauge({
          name: 'websocket_subscribed_connections',
          help: 'Number of subscribed WebSocket connections'
        });

      // Оновлення значень
      wsConnections.set(stats.summary.totalConnections);
      wsSubscribed.set(stats.summary.subscribedConnections);

      // Метрики затримки heartbeat
      const latencies = stats.connections
        .filter(conn => conn.averageLatency !== null)
        .map(conn => conn.averageLatency);

      if (latencies.length > 0) {
        const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const latencyMetric = client.register.getSingleMetric('websocket_heartbeat_latency_avg') || 
          new client.Gauge({
            name: 'websocket_heartbeat_latency_avg',
            help: 'Average WebSocket heartbeat latency in milliseconds'
          });
        latencyMetric.set(avgLatency);
      }
    }

    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    logger('error', `Помилка генерації метрик: ${error.message}`, { error });
    res.status(500).json({
      error: 'Помилка генерації метрик',
      details: error.message
    });
  }
});

module.exports = {
  router,
  setIoServer
};