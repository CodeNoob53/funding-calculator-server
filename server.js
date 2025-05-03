// server.js - модифікуємо існуючий файл
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http'); // Додаємо для створення HTTP-сервера
const fundingRatesExtended = require('./routes/fundingRatesExtended');
const setupSocketServer = require('./socket'); // Імпортуємо нашу функцію

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Створюємо HTTP-сервер на основі Express
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
// HTTP логування запитів
app.use(morgan('dev'));

// Всяку транзакцію через /api/proxy будемо додатково логувати
app.use('/api/proxy', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Роут для розширених фандинг-рейтів
app.use('/api/proxy', fundingRatesExtended);

// Кореневий маршрут
app.get('/', (req, res) => {
  res.send('Funding Server is running...');
});

// Ініціалізуємо Socket.IO
const io = setupSocketServer(server);

// Запускаємо HTTP-сервер замість app
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});