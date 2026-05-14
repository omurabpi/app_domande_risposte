require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const questionsRoutes = require('./src/routes/questions');
const { isDbConfigured, isPostgresConfigured } = require('./src/storage');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In locale avvia il server; su Vercel viene esportato come serverless function
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    const mode = isPostgresConfigured()
      ? '🐘 PostgreSQL (Supabase)'
      : isDbConfigured()
        ? '🗄️  SQL Server'
        : '📄 File JSON locale';
    console.log(`Backend in ascolto su http://localhost:${PORT}`);
    console.log(`Modalità storage: ${mode}`);
    if (!isPostgresConfigured() && !isDbConfigured()) {
      const user = process.env.ADMIN_USER || 'admin';
      const pass = process.env.ADMIN_PASSWORD || 'admin';
      console.log(`Login admin locale → utente: "${user}"  password: "${pass}"`);
    }
  });
}

module.exports = app;
