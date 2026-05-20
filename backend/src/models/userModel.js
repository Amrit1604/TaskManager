/**
 * models/userModel.js
 * All SQL queries related to the users table.
 * Uses named placeholders and the shared pool for consistency.
 */
const { pool } = require('../config/db');

const UserModel = {
  /** Find an active user by email (used during login) */
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  /** Find an active user by id */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  /** Create a new user and return the inserted row */
  async create({ name, email, password_hash, role = 'member' }) {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );
    return this.findById(result.insertId);
  },

  /** List all non-deleted users (admin utility) */
  async findAll() {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE deleted_at IS NULL ORDER BY name'
    );
    return rows;
  },

  /** Soft-delete a user */
  async softDelete(id) {
    await pool.execute(
      'UPDATE users SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
  },
};

module.exports = UserModel;
