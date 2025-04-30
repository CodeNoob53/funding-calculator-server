// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const fundingRatesExtended = require('./routes/fundingRatesExtended');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
