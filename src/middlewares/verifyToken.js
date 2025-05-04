const jwt = require('jsonwebtoken');

module.exports = (context, tokenSource, next) => {
  let token;
  let errorCallback;

  // Визначаємо джерело токена та callback залежно від контексту
  if (typeof context === 'object' && context.headers) {
    // HTTP контекст
    token = context.headers['authorization']?.split(' ')[1];
    errorCallback = (err) => context.status(403).json({ error: err.message });
  } else if (typeof context === 'object' && context.handshake) {
    // WebSocket контекст
    token = context.handshake.auth?.token;
    errorCallback = (err) => next(new Error(err.message));
  } else {
    return next ? next(new Error('Invalid context for token verification')) : null;
  }

  if (!token) {
    const error = new Error('Token required');
    return errorCallback(error);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return errorCallback(err);
    }
    if (context.user) context.user = decoded; // Прикріплюємо до контексту
    if (next) next(); // Для WS
  });
};