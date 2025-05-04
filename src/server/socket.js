const { Server } = require('socket.io');
const verifyToken = require('../middlewares/verifyToken');
const crypto = require('crypto');
const logger = require('../utils/logger');
const config = require('../config');
const fundingCache = require('../services/fundingCache');

const setupSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: config.socketPingTimeout,
    pingInterval: config.socketPingInterval
  });

  // Middleware для автентифікації
  io.use((socket, next) => {
    verifyToken(socket, null, (err) => {
      if (err) {
        logger('error', `Authentication failed: ${err.message}`);
        socket.disconnect(true);
        return;
      }
      logger('auth', `Successful authentication for user: ${socket.user.id}`);
      next();
    });
  });

  // Обробка підключень
  let lastDataHash = '';
  io.on('connection', (socket) => {
    const userId = socket.user ? socket.user.id : 'anon';
    logger('connect', `New client connected: ${userId}, socketId: ${socket.id}`);

    // Відправка початкових даних
    const initialData = fundingCache.get('extended');
    if (initialData && initialData.data) {
      socket.emit('initialData', initialData);
      logger('broadcast', `Sent initial data to client ${userId}`);
    }

    // Обробка відключення
    socket.on('disconnect', (reason) => {
      logger('disconnect', `Client disconnected: ${userId}, reason: ${reason}`);
    });
  });

  // Періодичне оновлення даних
  setInterval(() => {
    const latestData = fundingCache.get('extended');
    if (latestData && latestData.data) {
      const currentHash = crypto.createHash('md5').update(JSON.stringify(latestData)).digest('hex');
      if (currentHash !== lastDataHash) {
        io.emit('dataUpdate', latestData);
        logger('broadcast', 'Sent data update to all clients');
        lastDataHash = currentHash;
      }
    }
  }, config.fundingUpdateInterval);

  return io;
};

module.exports = setupSocketServer;