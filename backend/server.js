require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const questionsRoutes = require('./src/routes/questions');
const { isDbConfigured } = require('./src/storage');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  const mode = isDbConfigured() ? '🗄️  SQL Server' : '⚡ In-memory (locale)';
  console.log(`Backend in ascolto su http://localhost:${PORT}`);
  console.log(`Modalità storage: ${mode}`);
  if (!isDbConfigured()) {
    const user = process.env.ADMIN_USER || 'admin';
    const pass = process.env.ADMIN_PASSWORD || 'admin';
    console.log(`Login admin locale → utente: "${user}"  password: "${pass}"`);
    console.log(`⚠️  Le domande verranno perse al riavvio del server.`);
  }
});
