const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getStorage, isDbConfigured } = require('../storage');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password obbligatori' });
  }

  try {
    const user = await getStorage().findUser(username);

    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    let valid = false;
    if (isDbConfigured()) {
      // Modalità DB: password hashata con bcrypt
      valid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Modalità locale: confronto diretto con ADMIN_PASSWORD
      valid = password === user._plainPassword;
    }

    if (!valid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'dev-secret-locale',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({ token, username: user.username });
  } catch (err) {
    console.error('Errore login:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-locale');
    res.json({ valid: true, username: decoded.username });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
