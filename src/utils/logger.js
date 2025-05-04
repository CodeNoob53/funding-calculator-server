const winston = require('winston');
const chalk = require('chalk');
const { format } = require('winston');
const path = require('path');

// Налаштування з .env
const enableColors = process.env.LOG_COLORS !== 'false';
const logLevel = process.env.LOG_LEVEL || 'info';
const logToFile = process.env.LOG_TO_FILE !== 'false';

// Визначення кастомних рівнів логування
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    auth: 2, // Змінено з 3 на 2, щоб виводилося за замовчуванням
    connect: 4,
    disconnect: 5,
    update: 6,
    broadcast: 7,
    hit: 8,
    debug: 9
  },
  colors: {
    error: 'redBright',
    warn: 'yellowBright',
    info: 'blueBright',
    auth: 'cyanBright',
    connect: 'greenBright',
    disconnect: 'magentaBright',
    update: 'blue',
    broadcast: 'green',
    hit: 'cyan',
    debug: 'gray'
  }
};

// Застосування кольорів до рівнів
winston.addColors(customLevels.colors);

// Визначення типів логів з кольорами
const logTypes = {
  error: { color: chalk.redBright },
  warn: { color: chalk.yellowBright },
  info: { color: chalk.blueBright },
  auth: { color: chalk.cyanBright },
  connect: { color: chalk.greenBright },
  disconnect: { color: chalk.magentaBright },
  update: { color: chalk.blue },
  broadcast: { color: chalk.green },
  hit: { color: chalk.cyan },
  debug: { color: chalk.gray }
};

// Функція для фарбування чисел у помаранчевий та [AUTO] у жовтий
const colorizeMessage = (message) => {
  if (!enableColors) return message;
  let coloredMessage = message.replace(/\d+(\.\d+)?/g, (match) => chalk.hex('#FFA500')(match));
  coloredMessage = coloredMessage.replace(/\[AUTO\]/g, (match) => chalk.yellowBright(match));
  return coloredMessage;
};

// Формат для консолі (тільки HH:mm:ss)
const consoleFormat = format.combine(
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, meta }) => {
    const logType = logTypes[level] || logTypes.info;
    const levelText = level.toUpperCase().padEnd(7);
    const coloredLevel = enableColors ? logType.color(levelText) : levelText;
    const coloredMessage = colorizeMessage(message);
    const metaString = meta ? chalk.gray(` ${JSON.stringify(meta, null, 2)}`) : '';
    return `${chalk.gray(`[${timestamp}]`)} ${coloredLevel} ${coloredMessage}${metaString}`;
  })
);

// Формат для файлу (JSON, повна дата)
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.json()
);

// Налаштування логера
const transports = [
  new winston.transports.Console({
    format: consoleFormat
  })
];

// Додавання транспорту для файлу, якщо увімкнено
if (logToFile) {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', 'logs', 'app.log'),
      format: fileFormat,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true
    })
  );
}

const logger = winston.createLogger({
  level: logLevel,
  levels: customLevels.levels,
  transports
});

// Функція-обгортка для сумісності
module.exports = (type, message, meta = null) => {
  const level = type in logTypes ? type : 'info';
  logger.log({
    level,
    message,
    meta
  });
};

module.exports.logger = logger;