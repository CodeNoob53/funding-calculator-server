const { Server } = require('socket.io');
const logger = require('../utils/logger');

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

  io.on('connection', (socket) => {
    logger('connect', `Клієнт підключено: ${socket.id}`);

    // Приклад підготовки до пересилання оновлень (реалізується пізніше)
    socket.on('subscribe', (data) => {
      logger('info', `Клієнт ${socket.id} підписався на оновлення`);
      // Логіка підписки (буде додана пізніше)
    });

    socket.on('disconnect', () => {
      logger('disconnect', `Клієнт відключено: ${socket.id}`);
    });
  });

  return io;
};