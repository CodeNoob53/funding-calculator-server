const { Server } = require('socket.io');
const logger = require('../utils/logger');
const cache = require('../routes/fundingRates').cache;

// Зберігання heartbeat інтервалів та статистики
const heartbeatIntervals = new Map();
const socketStats = new Map();

// Конфігурація heartbeat з .env
const HEARTBEAT_INTERVAL = parseInt(process.env.CUSTOM_HEARTBEAT_INTERVAL) || 30000; // 30 секунд
const MAX_MISSED_PONGS = parseInt(process.env.MAX_MISSED_PONGS) || 3;
const PING_TIMEOUT = parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000; // 60 секунд
const PING_INTERVAL = parseInt(process.env.SOCKET_PING_INTERVAL) || 25000; // 25 секунд

// Функція для створення статистики сокета
function createSocketStats(socketId) {
  return {
    connectedAt: Date.now(),
    lastPing: null,
    lastPong: null,
    pingCount: 0,
    pongCount: 0,
    missedPongs: 0,
    averageLatency: 0,
    latencies: [],
    isSubscribed: false
  };
}

// Функція для очищення ресурсів сокета
function cleanupSocket(socketId) {
  // Очищення heartbeat інтервалу
  const interval = heartbeatIntervals.get(socketId);
  if (interval) {
    clearInterval(interval);
    heartbeatIntervals.delete(socketId);
  }
  
  // Логування фінальної статистики
  const stats = socketStats.get(socketId);
  if (stats) {
    const sessionDuration = Date.now() - stats.connectedAt;
    logger('info', `Статистика сесії ${socketId}:`, {
      duration: `${Math.round(sessionDuration / 1000)}s`,
      pings: stats.pingCount,
      pongs: stats.pongCount,
      missedPongs: stats.missedPongs,
      avgLatency: stats.averageLatency ? `${Math.round(stats.averageLatency)}ms` : 'N/A',
      subscribed: stats.isSubscribed
    });
  }
  
  // Видалення статистики
  socketStats.delete(socketId);
}

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Налаштування вбудованого heartbeat Socket.IO
    pingTimeout: PING_TIMEOUT,
    pingInterval: PING_INTERVAL,
    
    // Додаткові налаштування для стабільності
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
    allowEIO3: true,
    transports: ['websocket', 'polling']
  });

  // Middleware для автентифікації через API Key
  io.use((socket, next) => {
    const apiKey = socket.handshake.auth.apiKey;
    const expectedApiKey = process.env.S_API_KEY;

    if (!expectedApiKey || !apiKey || apiKey !== expectedApiKey) {
      logger('error', `WebSocket автентифікація провалена для ${socket.id}: Неправильний або відсутній API Key`);
      return next(new Error('Неправильний або відсутній API Key'));
    }

    logger('auth', `WebSocket автентифікація успішна для ${socket.id}`);
    next();
  });

  // Функція для порівняння даних та визначення змін
  const findChanges = (oldData, newData) => {
    // Перевірка на null/undefined
    if (!oldData || !newData) {
      logger('debug', 'Old or new data is missing, returning new data');
      return newData;
    }

    // Перевірка структури даних
    if (!Array.isArray(newData.data)) {
      logger('error', 'Invalid data structure: data is not an array', { newData });
      return null;
    }

    const changes = {
      code: newData.code,
      msg: newData.msg,
      data: []
    };

    // Порівнюємо кожен символ та його біржі
    newData.data.forEach(newSymbol => {
      // Перевірка структури символу
      if (!newSymbol || !newSymbol.symbol) {
        logger('warn', 'Invalid symbol structure, skipping', { newSymbol });
        return;
      }

      const oldSymbol = oldData.data?.find(s => s.symbol === newSymbol.symbol);
      
      if (!oldSymbol) {
        // Новий символ
        changes.data.push(newSymbol);
        return;
      }

      // Перевіряємо зміни в uMarginList
      const changedUMarginList = [];
      if (Array.isArray(newSymbol.uMarginList)) {
        newSymbol.uMarginList.forEach(newExchange => {
          // Перевірка структури біржі
          if (!newExchange || !newExchange.exchangeName) {
            logger('warn', 'Invalid uMargin exchange structure, skipping', { newExchange });
            return;
          }

          const oldExchange = oldSymbol.uMarginList?.find(e => e.exchangeName === newExchange.exchangeName);
          
          if (!oldExchange) {
            // Нова біржа
            changedUMarginList.push(newExchange);
            return;
          }

          // Порівнюємо значення
          if (
            oldExchange.rate !== newExchange.rate ||
            oldExchange.predictedRate !== newExchange.predictedRate ||
            oldExchange.status !== newExchange.status ||
            oldExchange.nextFundingTime !== newExchange.nextFundingTime ||
            oldExchange.fundingIntervalHours !== newExchange.fundingIntervalHours
          ) {
            changedUMarginList.push(newExchange);
          }
        });
      }

      // Перевіряємо зміни в cMarginList
      const changedCMarginList = [];
      if (Array.isArray(newSymbol.cMarginList)) {
        newSymbol.cMarginList.forEach(newExchange => {
          // Перевірка структури біржі
          if (!newExchange || !newExchange.exchangeName) {
            logger('warn', 'Invalid cMargin exchange structure, skipping', { newExchange });
            return;
          }

          const oldExchange = oldSymbol.cMarginList?.find(e => e.exchangeName === newExchange.exchangeName);
          
          if (!oldExchange) {
            // Нова біржа
            changedCMarginList.push(newExchange);
            return;
          }

          // Порівнюємо значення
          if (
            oldExchange.rate !== newExchange.rate ||
            oldExchange.predictedRate !== newExchange.predictedRate ||
            oldExchange.status !== newExchange.status ||
            oldExchange.nextFundingTime !== newExchange.nextFundingTime ||
            oldExchange.fundingIntervalHours !== newExchange.fundingIntervalHours
          ) {
            changedCMarginList.push(newExchange);
          }
        });
      }

      // Перевіряємо зміни в цінах
      const priceChanged = 
        oldSymbol.uIndexPrice !== newSymbol.uIndexPrice ||
        oldSymbol.uPrice !== newSymbol.uPrice ||
        oldSymbol.cIndexPrice !== newSymbol.cIndexPrice ||
        oldSymbol.cPrice !== newSymbol.cPrice;

      // Додаємо символ до змін, якщо є зміни в будь-якому списку або цінах
      if (changedUMarginList.length > 0 || changedCMarginList.length > 0 || priceChanged) {
        const changedSymbol = {
          ...newSymbol,
          uMarginList: changedUMarginList.length > 0 ? changedUMarginList : undefined,
          cMarginList: changedCMarginList.length > 0 ? changedCMarginList : undefined
        };
        changes.data.push(changedSymbol);
      }
    });

    return changes.data.length > 0 ? changes : null;
  };

  // Функція для початку heartbeat для сокета
  function startHeartbeat(socket) {
    const heartbeatInterval = setInterval(() => {
      const stats = socketStats.get(socket.id);
      if (!stats) return;

      const pingTimestamp = Date.now();
      
      // Перевірка чи отримали попередній pong
      if (stats.lastPing && (!stats.lastPong || stats.lastPong < stats.lastPing)) {
        stats.missedPongs++;
        logger('warn', `Пропущено pong від ${socket.id}, всього пропущено: ${stats.missedPongs}`);
        
        // Відключення після максимуму пропущених pong
        if (stats.missedPongs >= MAX_MISSED_PONGS) {
          logger('error', `Відключення ${socket.id} через ${MAX_MISSED_PONGS} пропущених pong`);
          socket.disconnect(true);
          return;
        }
      }
      
      // Перевірка чи сокет ще підключений
      if (!socket.connected) {
        clearInterval(heartbeatInterval);
        heartbeatIntervals.delete(socket.id);
        return;
      }
      
      // Відправка ping
      socket.emit('ping', { timestamp: pingTimestamp });
      stats.lastPing = pingTimestamp;
      stats.pingCount++;
      
      logger('debug', `Heartbeat ping #${stats.pingCount} → ${socket.id}`);
    }, HEARTBEAT_INTERVAL);
    
    // Зберігання інтервалу для подальшого очищення
    heartbeatIntervals.set(socket.id, heartbeatInterval);
  }

  io.on('connection', (socket) => {
    logger('connect', `Клієнт підключено: ${socket.id} [${socket.handshake.address}]`);

    // Ініціалізація статистики для сокета
    socketStats.set(socket.id, createSocketStats(socket.id));

    // Запуск heartbeat для цього сокета
    startHeartbeat(socket);

    // Відправляємо початкові дані
    const initialData = cache.get('funding-rates');
    if (initialData) {
      socket.emit('initialData', initialData);
      logger('info', `Початкові дані відправлено до ${socket.id}`);
    } else {
      logger('warn', `Початкові дані недоступні для ${socket.id}`);
    }

    // Обробка pong відповіді від клієнта
    socket.on('pong', (data) => {
      const stats = socketStats.get(socket.id);
      if (!stats || !data || !data.timestamp) {
        logger('warn', `Некоректний pong від ${socket.id}`);
        return;
      }

      const now = Date.now();
      const latency = now - data.timestamp;
      
      // Оновлення статистики
      stats.lastPong = now;
      stats.pongCount++;
      stats.missedPongs = 0; // Скидання лічильника пропущених
      
      // Розрахунок середньої затримки (зберігаємо останні 10 вимірів)
      stats.latencies.push(latency);
      if (stats.latencies.length > 10) {
        stats.latencies.shift();
      }
      stats.averageLatency = stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length;
      
      // Зберігання поточної затримки в сокеті для зручного доступу
      socket.latency = latency;
      socket.averageLatency = stats.averageLatency;
      
      logger('debug', `Pong #${stats.pongCount} ← ${socket.id}, затримка: ${latency}ms, середня: ${Math.round(stats.averageLatency)}ms`);
    });

    // Підписка на оновлення
    socket.on('subscribe', () => {
      const stats = socketStats.get(socket.id);
      if (stats) {
        stats.isSubscribed = true;
      }
      
      logger('info', `Клієнт ${socket.id} підписався на оновлення`);
      socket.join('funding-updates');
    });

    // Відписка від оновлень
    socket.on('unsubscribe', () => {
      const stats = socketStats.get(socket.id);
      if (stats) {
        stats.isSubscribed = false;
      }
      
      logger('info', `Клієнт ${socket.id} відписався від оновлень`);
      socket.leave('funding-updates');
    });

    // Обробка запиту статистики з'єднання
    socket.on('getConnectionStats', () => {
      const stats = socketStats.get(socket.id);
      if (stats) {
        const connectionStats = {
          connectedAt: new Date(stats.connectedAt).toISOString(),
          sessionDuration: Math.round((Date.now() - stats.connectedAt) / 1000),
          pingCount: stats.pingCount,
          pongCount: stats.pongCount,
          missedPongs: stats.missedPongs,
          currentLatency: socket.latency || null,
          averageLatency: Math.round(stats.averageLatency) || null,
          isSubscribed: stats.isSubscribed
        };
        
        socket.emit('connectionStats', connectionStats);
        logger('debug', `Статистика відправлена до ${socket.id}`);
      }
    });

    // Обробка відключення
    socket.on('disconnect', (reason) => {
      logger('disconnect', `Клієнт відключено: ${socket.id}, причина: ${reason}`);
      cleanupSocket(socket.id);
    });

    // Обробка помилок сокета
    socket.on('error', (error) => {
      logger('error', `Помилка сокета ${socket.id}: ${error.message}`, { error });
    });
  });

  // Функція для оновлення кешу та відправки змін через WebSocket
  const updateCacheAndBroadcast = async (newData) => {
    try {
      const oldData = cache.get('funding-rates');
      cache.set('funding-rates', newData);

      // Знаходимо зміни
      const changes = findChanges(oldData, newData);
      
      // Відправляємо тільки змінені дані підписаним клієнтам
      if (changes) {
        const subscribedCount = io.sockets.adapter.rooms.get('funding-updates')?.size || 0;
        
        if (subscribedCount > 0) {
          io.to('funding-updates').emit('dataUpdate', changes);
          logger('broadcast', `Оновлення даних відправлено до ${subscribedCount} підписаних клієнтів`);
        } else {
          logger('debug', 'Немає підписаних клієнтів для оновлення даних');
        }
      } else {
        logger('debug', 'Немає змін у даних, оновлення не відправляється');
      }
    } catch (error) {
      logger('error', `Помилка при оновленні кешу та відправці змін: ${error.message}`, { error });
    }
  };

  // Функція для отримання статистики всіх з'єднань (для моніторингу)
  const getConnectionsStats = () => {
    const connections = [];
    const totalConnections = io.sockets.sockets.size;
    const subscribedConnections = io.sockets.adapter.rooms.get('funding-updates')?.size || 0;
    
    io.sockets.sockets.forEach((socket) => {
      const stats = socketStats.get(socket.id);
      connections.push({
        id: socket.id,
        connected: socket.connected,
        address: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        rooms: Array.from(socket.rooms),
        latency: socket.latency || null,
        averageLatency: socket.averageLatency || null,
        stats: stats ? {
          connectedAt: new Date(stats.connectedAt).toISOString(),
          sessionDuration: Math.round((Date.now() - stats.connectedAt) / 1000),
          pingCount: stats.pingCount,
          pongCount: stats.pongCount,
          missedPongs: stats.missedPongs,
          isSubscribed: stats.isSubscribed
        } : null
      });
    });
    
    return {
      summary: {
        totalConnections,
        subscribedConnections,
        heartbeatInterval: HEARTBEAT_INTERVAL,
        maxMissedPongs: MAX_MISSED_PONGS
      },
      connections
    };
  };

  // Експортуємо функції для використання в інших модулях
  io.updateCacheAndBroadcast = updateCacheAndBroadcast;
  io.getConnectionsStats = getConnectionsStats;

  // Graceful shutdown - очищення всіх heartbeat інтервалів
  process.on('SIGTERM', () => {
    logger('info', 'Закриття всіх WebSocket з\'єднань...');
    
    // Очищення всіх heartbeat інтервалів
    heartbeatIntervals.forEach((interval, socketId) => {
      clearInterval(interval);
      logger('debug', `Heartbeat інтервал для ${socketId} очищено`);
    });
    
    // Закриття всіх з'єднань
    io.close(() => {
      logger('info', 'Socket.IO сервер закрито');
    });
  });

  return io;
};