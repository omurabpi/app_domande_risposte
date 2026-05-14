/**
 * storage.js — Livello di astrazione dati
 *
 * Se DB_SERVER è configurato nel .env → usa SQL Server
 * Altrimenti → fallback in-memory (dati persi al riavvio del server)
 */

const isDbConfigured = () =>
  !!(process.env.DB_SERVER && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME);

// ─── In-Memory Store ─────────────────────────────────────────────────────────

let _nextId = 1;
let _questions = [];

const mem = {
  async createQuestion(text) {
    const q = {
      id: _nextId++,
      text,
      is_read: false,
      is_highlighted: false,
      is_public: false,
      created_at: new Date().toISOString(),
    };
    _questions.unshift(q);
    return q;
  },

  async getAll() {
    return [..._questions];
  },

  async getPublic() {
    return _questions
      .filter((q) => q.is_public)
      .sort((a, b) => b.is_highlighted - a.is_highlighted);
  },

  async update(id, patch) {
    const idx = _questions.findIndex((q) => q.id === Number(id));
    if (idx === -1) return false;
    _questions[idx] = { ..._questions[idx], ...patch };
    return true;
  },

  async remove(id) {
    const before = _questions.length;
    _questions = _questions.filter((q) => q.id !== Number(id));
    return _questions.length < before;
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
