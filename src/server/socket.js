const { Server } = require('socket.io');
const logger = require('../utils/logger');
const cache = require('../routes/fundingRates').cache;

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware для автентифікації через API Key
  io.use((socket, next) => {
    const apiKey = socket.handshake.auth.apiKey;
    const expectedApiKey = process.env.S_API_KEY;

    if (!expectedApiKey || !apiKey || apiKey !== expectedApiKey) {
      logger('error', `WebSocket автентифікація провалена для ${socket.id}: Неправильний або відсутній API Key`);
      return next(new Error('Неправильний або відсутній API Key'));
    }

    logger('info', `WebSocket автентифікація успішна для ${socket.id}`);
    next();
  });

  // Функція для порівняння даних та визначення змін
  const findChanges = (oldData, newData) => {
    if (!oldData || !newData) return newData;
    
    const changes = {
      code: newData.code,
      msg: newData.msg,
      data: []
    };

    // Порівнюємо кожен символ та його біржі
    newData.data.forEach(newSymbol => {
      const oldSymbol = oldData.data.find(s => s.symbol === newSymbol.symbol);
      
      if (!oldSymbol) {
        // Новий символ
        changes.data.push(newSymbol);
        return;
      }

      const changedExchanges = [];
      newSymbol.exchanges.forEach(newExchange => {
        const oldExchange = oldSymbol.exchanges.find(e => e.exchange === newExchange.exchange);
        
        if (!oldExchange) {
          // Нова біржа
          changedExchanges.push(newExchange);
          return;
        }

        // Порівнюємо значення
        if (
          oldExchange.rate !== newExchange.rate ||
          oldExchange.predictedRate !== newExchange.predictedRate ||
          oldExchange.interestRate !== newExchange.interestRate ||
          oldExchange.nextFundingTime !== newExchange.nextFundingTime ||
          oldExchange.price !== newExchange.price ||
          oldExchange.status !== newExchange.status
        ) {
          changedExchanges.push(newExchange);
        }
      });

      if (changedExchanges.length > 0) {
        changes.data.push({
          ...newSymbol,
          exchanges: changedExchanges
        });
      }
    });

    return changes.data.length > 0 ? changes : null;
  };

  io.on('connection', (socket) => {
    logger('connect', `Клієнт підключено: ${socket.id}`);

    // Відправляємо початкові дані
    const initialData = cache.get('funding-rates');
    if (initialData) {
      socket.emit('initialData', initialData);
    }

    // Підписка на оновлення
    socket.on('subscribe', () => {
      logger('info', `Клієнт ${socket.id} підписався на оновлення`);
      socket.join('funding-updates');
    });

    socket.on('disconnect', () => {
      logger('disconnect', `Клієнт відключено: ${socket.id}`);
    });
  });

  // Функція для оновлення кешу та відправки змін через WebSocket
  const updateCacheAndBroadcast = async (newData) => {
    const oldData = cache.get('funding-rates');
    cache.set('funding-rates', newData);

    // Знаходимо зміни
    const changes = findChanges(oldData, newData);
    
    // Відправляємо тільки змінені дані
    if (changes) {
      io.to('funding-updates').emit('dataUpdate', changes);
      logger('update', `Відправлено оновлення даних через WebSocket`);
    }
  };

  // Експортуємо функцію для використання в інших модулях
  io.updateCacheAndBroadcast = updateCacheAndBroadcast;

  return io;
};