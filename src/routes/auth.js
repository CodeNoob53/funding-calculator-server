const express = require('express');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  logger('info', 'Спроба автентифікації', { username });

  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ id: username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    logger('auth', `Автентифікація успішна для користувача: ${username}`);
    res.json({ token });
  } else {
    logger('error', `Невдала автентифікація для користувача: ${username}`);
    res.status(401).json({ error: 'Неправильний логін або пароль' });
  }
});

module.exports = router;