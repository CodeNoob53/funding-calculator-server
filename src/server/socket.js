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
    try {
      const oldData = cache.get('funding-rates');
      cache.set('funding-rates', newData);

      // Знаходимо зміни
      const changes = findChanges(oldData, newData);
      
      // Відправляємо тільки змінені дані
      if (changes) {
        io.to('funding-updates').emit('dataUpdate', changes);
        logger('update', `Відправлено оновлення даних через WebSocket`);
      }
    } catch (error) {
      logger('error', `Помилка при оновленні кешу та відправці змін: ${error.message}`);
    }
  };

  // Експортуємо функцію для використання в інших модулях
  io.updateCacheAndBroadcast = updateCacheAndBroadcast;

  return io;
};