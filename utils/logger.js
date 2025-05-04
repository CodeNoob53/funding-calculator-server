const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${level.toUpperCase()} ${timestamp}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = (type, message) => {
  logger.log({
    level: type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'info',
    message
  });
};
