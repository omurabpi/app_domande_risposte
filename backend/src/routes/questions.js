const express = require('express');
const { getStorage } = require('../storage');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/questions  — Invio domanda anonima (pubblico)
router.post('/', async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Il testo della domanda è obbligatorio' });
  }
  if (text.trim().length > 1000) {
    return res.status(400).json({ error: 'La domanda non può superare i 1000 caratteri' });
  }

  try {
    await getStorage().createQuestion(text.trim());
    res.status(201).json({ message: 'Domanda inviata con successo' });
  } catch (err) {
    console.error('Errore invio domanda:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// GET /api/questions/public  — Domande pubbliche (visibili agli studenti)
router.get('/public', async (req, res) => {
  try {
    const questions = await getStorage().getPublic();
    res.json(questions);
  } catch (err) {
    console.error('Errore lettura domande pubbliche:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// GET /api/questions  — Tutte le domande (solo admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const questions = await getStorage().getAll();
    res.json(questions);
  } catch (err) {
    console.error('Errore lettura domande:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// PATCH /api/questions/:id  — Aggiorna stato domanda (solo admin)
router.patch('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { is_read, is_highlighted, is_public } = req.body;

  if (is_read === undefined && is_highlighted === undefined && is_public === undefined) {
    return res.status(400).json({ error: 'Nessun campo da aggiornare' });
  }

  try {
    const found = await getStorage().update(id, { is_read, is_highlighted, is_public });
    if (!found) return res.status(404).json({ error: 'Domanda non trovata' });
    res.json({ message: 'Domanda aggiornata' });
  } catch (err) {
    console.error('Errore aggiornamento domanda:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// DELETE /api/questions/:id  — Elimina domanda (solo admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const found = await getStorage().remove(id);
    if (!found) return res.status(404).json({ error: 'Domanda non trovata' });
    res.json({ message: 'Domanda eliminata' });
  } catch (err) {
    console.error('Errore eliminazione domanda:', err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
