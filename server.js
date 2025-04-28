// server.js
require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const axios      = require('axios')
const rateLimit  = require('express-rate-limit')
const pino       = require('pino')
const pinoHttp   = require('pino-http')

const app = express()

// Налаштування Pino
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' }
  } : undefined
})

// HTTP логування
app.use(pinoHttp({ logger }))

// Body parser
app.use(express.json())

// CORS – обмежуємо тільки свої домени
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin === 'http://localhost:3000') return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  }
}))

// API-key захист
app.use('/api', (req, res, next) => {
  const key = req.get('x-api-key')
  if (!key || key !== process.env.SERVER_API_KEY) {
    req.log.warn({ provided: key }, 'Unauthorized API access attempt')
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
})

// Rate limit
app.use('/api', rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.log.warn('Rate limit exceeded')
    res.status(429).json({ error: 'Перевищено ліміт 30 запитів/хв. Спробуйте пізніше.' })
  }
}))

// Налаштування Coinglass API
const CG_API_KEY = process.env.CG_API_KEY
const BASE_URL   = process.env.CG_BASE_URL
const cg = axios.create({
  baseURL: BASE_URL,
  headers: { accept: 'application/json', 'CG-API-KEY': CG_API_KEY }
})

// 1) Current funding rates
app.get('/api/futures/fundingRate/exchange-list', async (req, res) => {
  try {
    const { data } = await cg.get('/futures/fundingRate/exchange-list')
    res.json(data.data)
  } catch (e) {
    req.log.error({ err: e }, 'Error fetching fundingRate exchange-list')
    res.status(502).json({ error: e.message })
  }
})

// 2) Cumulative funding rates
app.get('/api/futures/fundingRate/cumulative-exchange-list', async (req, res) => {
  try {
    const { data } = await cg.get('/futures/fundingRate/cumulative-exchange-list')
    res.json(data.data)
  } catch (e) {
    req.log.error({ err: e }, 'Error fetching cumulative-exchange-list')
    res.status(502).json({ error: e.message })
  }
})

// 3) Coins markets info
app.get('/api/futures/coins-markets', async (req, res) => {
  try {
    const params = {}
    if (req.query.symbol)   params.symbol   = req.query.symbol
    if (req.query.exchange) params.exchange = req.query.exchange
    const { data } = await cg.get('/futures/coins-markets', { params })
    res.json(data.data)
  } catch (e) {
    req.log.error({ err: e, params: req.query }, 'Error fetching coins-markets')
    res.status(502).json({ error: e.message })
  }
})

// 4) Supported exchanges and pairs
app.get('/api/futures/supported-exchange-and-pairs', async (req, res) => {
  try {
    const params = {}
    if (req.query.exchange) params.exchange = req.query.exchange
    if (req.query.pair)     params.pair     = req.query.pair
    const { data } = await cg.get('/futures/supported-exchange-and-pairs', { params })
    res.json(data.data)
  } catch (e) {
    req.log.error({ err: e, params: req.query }, 'Error fetching supported-exchange-and-pairs')
    res.status(502).json({ error: e.message })
  }
})

// 5) Order book bid-ask
app.get('/api/futures/orderbook/bid-ask', async (req, res) => {
  try {
    const params = {}
    if (req.query.symbol)   params.symbol   = req.query.symbol
    if (req.query.exchange) params.exchange = req.query.exchange
    const { data } = await cg.get('/futures/orderbook/bid-ask', { params })
    res.json(data.data)
  } catch (e) {
    req.log.error({ err: e, params: req.query }, 'Error fetching orderbook bid-ask')
    res.status(502).json({ error: e.message })
  }
})

// Health-check
app.get('/api/health', (req, res) => {
  req.log.info('Health-check ok')
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  logger.info(`Proxy server listening on port ${PORT}`)
})
