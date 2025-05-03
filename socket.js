// server/socket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const chalk = require('chalk');
const dayjs = require('dayjs');

// Імпортуємо доступ до кешу фандингу
const fundingCache = require('./routes/fundingRatesExtended').fundingCache;

// Логування для відстеження подій WebSocket
const log = (type, message) => {
  const ts = dayjs().format('YYYY-MM-DD HH:mm:ss');
  if (type === 'connect') console.log(chalk.green(`[WS:CONNECT ${ts}]`), message);
  if (type === 'auth') console.log(chalk.blue(`[WS:AUTH ${ts}]`), message);
  if (type === 'disconnect') console.log(chalk.yellow(`[WS:DISCONNECT ${ts}]`), message);
  if (type === 'broadcast') console.log(chalk.magenta(`[WS:BROADCAST ${ts}]`), message);
  if (type === 'error') console.log(chalk.red(`[WS:ERROR ${ts}]`), message);
};

// Налаштування Socket.IO сервера
const setupSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*', // Дозволяємо підключення з нашого клієнтського додатку
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Налаштування повторного підключення
    pingTimeout: 30000,
    pingInterval: 10000,
  });
  
  // Middleware для автентифікації
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      log('error', `Підключення відхилено: відсутній токен`);
      return next(new Error('Необхідна автентифікація'));
    }
    
    try {
      // Перевірка JWT токена
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
      socket.user = decoded;
      log('auth', `Успішна автентифікація користувача: ${decoded.id}`);
      next();
    } catch (error) {
      log('error', `Помилка автентифікації: ${error.message}`);
      next(new Error('Недійсний токен'));
    }
  });
  
  // Обробка підключень
  io.on('connection', (socket) => {
    const userId = socket.user ? socket.user.id : 'anon';
    log('connect', `Новий клієнт підключений: ${userId}, socketId: ${socket.id}`);
    
    // Відправляємо початкові дані
    const initialData = fundingCache.get('extended');
    if (initialData && initialData.data) {
      socket.emit('initialData', initialData);
      log('broadcast', `Відправлено початкові дані для клієнта ${userId}`);
    }
    
    // Обробка відключення
    socket.on('disconnect', (reason) => {
      log('disconnect', `Клієнт відключений: ${userId}, причина: ${reason}`);
    });
    
    // Можна додати інші обробники подій за потреби
  });
  
  // Періодичне оновлення даних для всіх клієнтів
  setInterval(() => {
    const latestData = fundingCache.get('extended');
    if (latestData && latestData.data) {
      io.emit('dataUpdate', latestData);
      log('broadcast', `Оновлення даних відправлено всім клієнтам`);
    }
  }, 20000); // Кожні 20 секунд (синхронізовано з оновленням кешу)
  
  return io;
};

module.exports = setupSocketServer;