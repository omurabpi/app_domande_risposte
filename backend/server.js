require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const questionsRoutes = require('./src/routes/questions');
const { isDbConfigured, isVercelKvConfigured } = require('./src/storage');

// Blocca avvio se JWT_SECRET non è impostato in produzione
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('ERRORE: JWT_SECRET non impostato. Imposta la variabile d\'ambiente prima di avviare in produzione.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Sicurezza HTTP headers
app.use(helmet());

// CORS: in produzione accetta solo dal dominio del frontend
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors({
  origin: allowedOrigin || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

// Rate limiting: max 10 tentativi di login ogni 15 minuti per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppi tentativi di accesso. Riprova tra 15 minuti.' },
});

// Rate limiting: max 30 domande ogni 10 minuti per IP
const questionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppe richieste. Riprova tra qualche minuto.' },
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionLimiter);
app.use('/api/questions', questionsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In locale avvia il server; su Vercel viene esportato come serverless function
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    const mode = isVercelKvConfigured()
        ? '🔴 Vercel KV (Redis)'
        : isDbConfigured()
          ? '🗄️  SQL Server'
          : '📄 File JSON locale';
    console.log(`Backend in ascolto su http://localhost:${PORT}`);
    console.log(`Modalità storage: ${mode}`);
    if (!isVercelKvConfigured() && !isDbConfigured()) {
      const user = process.env.ADMIN_USER || 'admin';
      const pass = process.env.ADMIN_PASSWORD || 'admin';
      console.log(`Login admin locale → utente: "${user}"  password: "${pass}"`);
    }
  });
}

module.exports = app;
