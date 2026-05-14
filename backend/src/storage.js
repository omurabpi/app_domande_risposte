/**
 * storage.js — Livello di astrazione dati
 *
 * Priorità:
 *  1. KV_REST_API_URL → Upstash Redis (produzione su Vercel)
 *  2. DB_SERVER + credenziali → SQL Server (mssql)
 *  3. Fallback → File JSON locale (backend/data/questions.json)
 */

const fs = require('fs');
const path = require('path');

const isVercelKvConfigured = () => !!process.env.KV_REST_API_URL;

const isDbConfigured = () =>
  !!(process.env.DB_SERVER && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME);

// ─── Vercel KV Store (Redis) — operazioni atomiche ───────────────────────────
//
// Struttura Redis:
//   q:counter          → INCR atomico per generare ID univoci
//   q:ids              → Sorted Set: score = timestamp Unix, member = id
//   q:{id}             → Hash con i campi della domanda
//
// Così due invii simultanei non si sovrascrivono mai.

const kvStore = {
  async createQuestion(text) {
    const redis = _getRedis();
    const id = await redis.incr('q:counter');
    const now = new Date().toISOString();
    const score = Date.now();

    await Promise.all([
      redis.hset(`q:${id}`, {
        id, text,
        is_read: 0,
        is_highlighted: 0,
        is_public: 0,
        created_at: now,
      }),
      redis.zadd('q:ids', { score, member: String(id) }),
    ]);

    return { id, text, is_read: false, is_highlighted: false, is_public: false, created_at: now };
  },

  async _fetchAll() {
    const redis = _getRedis();
    const ids = await redis.zrange('q:ids', 0, -1, { rev: true });
    if (!ids || ids.length === 0) return [];
    const questions = await Promise.all(ids.map((id) => redis.hgetall(`q:${id}`)));
    return questions
      .filter(Boolean)
      .map((q) => ({
        ...q,
        id: Number(q.id),
        is_read: !!Number(q.is_read),
        is_highlighted: !!Number(q.is_highlighted),
        is_public: !!Number(q.is_public),
      }));
  },

  async getAll() {
    return this._fetchAll();
  },

  async getPublic() {
    const all = await this._fetchAll();
    return all
      .filter((q) => q.is_public)
      .sort((a, b) => b.is_highlighted - a.is_highlighted);
  },

  async update(id, patch) {
    const redis = _getRedis();
    const exists = await redis.exists(`q:${id}`);
    if (!exists) return false;

    const fields = {};
    if (patch.is_read !== undefined)        fields.is_read        = patch.is_read ? 1 : 0;
    if (patch.is_highlighted !== undefined) fields.is_highlighted = patch.is_highlighted ? 1 : 0;
    if (patch.is_public !== undefined)      fields.is_public      = patch.is_public ? 1 : 0;

    if (Object.keys(fields).length === 0) return false;
    await redis.hset(`q:${id}`, fields);
    return true;
  },

  async remove(id) {
    const redis = _getRedis();
    const [deleted] = await Promise.all([
      redis.del(`q:${id}`),
      redis.zrem('q:ids', String(id)),
    ]);
    return deleted > 0;
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
  if (isVercelKvConfigured()) return kvStore;
  if (isDbConfigured()) return db;
  return mem; // JSON locale
}

module.exports = { getStorage, isDbConfigured, isVercelKvConfigured };
