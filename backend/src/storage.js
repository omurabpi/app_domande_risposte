/**
 * storage.js — Livello di astrazione dati
 *
 * Se DB_SERVER è configurato nel .env → usa SQL Server
 * Altrimenti → file JSON locale (data/questions.json) — persiste su disco
 */

const fs = require('fs');
const path = require('path');

const isDbConfigured = () =>
  !!(process.env.DB_SERVER && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME);

// ─── File JSON Store ──────────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'questions.json');

function _loadData() {
  if (!fs.existsSync(DATA_FILE)) return { nextId: 1, questions: [] };
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { nextId: 1, questions: [] };
  }
}

function _saveData(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const mem = {
  async createQuestion(text) {
    const data = _loadData();
    const q = {
      id: data.nextId++,
      text,
      is_read: false,
      is_highlighted: false,
      is_public: false,
      created_at: new Date().toISOString(),
    };
    data.questions.unshift(q);
    _saveData(data);
    return q;
  },

  async getAll() {
    return _loadData().questions;
  },

  async getPublic() {
    return _loadData().questions
      .filter((q) => q.is_public)
      .sort((a, b) => b.is_highlighted - a.is_highlighted);
  },

  async update(id, patch) {
    const data = _loadData();
    const idx = data.questions.findIndex((q) => q.id === Number(id));
    if (idx === -1) return false;
    data.questions[idx] = { ...data.questions[idx], ...patch };
    _saveData(data);
    return true;
  },

  async remove(id) {
    const data = _loadData();
    const before = data.questions.length;
    data.questions = data.questions.filter((q) => q.id !== Number(id));
    if (data.questions.length === before) return false;
    _saveData(data);
    return true;
  },

  async findUser(username) {
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin';
    if (username === adminUser) {
      return { id: 1, username: adminUser, _plainPassword: adminPass };
    }
    return null;
  },
};

// ─── SQL Server Store ─────────────────────────────────────────────────────────

const db = {
  async createQuestion(text) {
    const { getPool, sql } = require('./db');
    const pool = await getPool();
    await pool.request()
      .input('text', sql.NVarChar(1000), text)
      .query(`
        INSERT INTO questions (text, is_read, is_highlighted, is_public, created_at)
        VALUES (@text, 0, 0, 0, GETDATE())
      `);
  },

  async getAll() {
    const { getPool } = require('./db');
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, text, is_read, is_highlighted, is_public, created_at
      FROM questions ORDER BY created_at DESC
    `);
    return result.recordset;
  },

  async getPublic() {
    const { getPool } = require('./db');
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, text, is_highlighted, created_at
      FROM questions
      WHERE is_public = 1
      ORDER BY is_highlighted DESC, created_at DESC
    `);
    return result.recordset;
  },

  async update(id, patch) {
    const { getPool, sql } = require('./db');
    const pool = await getPool();
    const updates = [];
    const request = pool.request().input('id', sql.Int, id);

    if (patch.is_read !== undefined) {
      updates.push('is_read = @is_read');
      request.input('is_read', sql.Bit, patch.is_read ? 1 : 0);
    }
    if (patch.is_highlighted !== undefined) {
      updates.push('is_highlighted = @is_highlighted');
      request.input('is_highlighted', sql.Bit, patch.is_highlighted ? 1 : 0);
    }
    if (patch.is_public !== undefined) {
      updates.push('is_public = @is_public');
      request.input('is_public', sql.Bit, patch.is_public ? 1 : 0);
    }

    if (updates.length === 0) return false;
    const result = await request.query(`UPDATE questions SET ${updates.join(', ')} WHERE id = @id`);
    return result.rowsAffected[0] > 0;
  },

  async remove(id) {
    const { getPool, sql } = require('./db');
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM questions WHERE id = @id');
    return result.rowsAffected[0] > 0;
  },

  async findUser(username) {
    const { getPool, sql } = require('./db');
    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id, username, password_hash FROM admin_users WHERE username = @username');
    return result.recordset[0] || null;
  },
};

// ─── Export del modulo attivo ─────────────────────────────────────────────────

function getStorage() {
  return isDbConfigured() ? db : mem;
}

module.exports = { getStorage, isDbConfigured };
