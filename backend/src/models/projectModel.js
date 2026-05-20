/**
 * models/projectModel.js
 * SQL queries for the projects table and project_members join table.
 */
const { pool } = require('../config/db');

const ProjectModel = {
  /** Get all projects visible to a user (admin: all; member: only joined projects) */
  async findAllForUser(userId, role) {
    if (role === 'admin') {
      const [rows] = await pool.execute(
        `SELECT p.*, u.name AS creator_name
         FROM projects p
         JOIN users u ON u.id = p.created_by
         WHERE p.deleted_at IS NULL
         ORDER BY p.created_at DESC`
      );
      return rows;
    }
    // Members only see projects they're part of
    const [rows] = await pool.execute(
      `SELECT p.*, u.name AS creator_name
       FROM projects p
       JOIN users u ON u.id = p.created_by
       JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = ? AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return rows;
  },

  /** Find a single active project by id */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT p.*, u.name AS creator_name
       FROM projects p
       JOIN users u ON u.id = p.created_by
       WHERE p.id = ? AND p.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /** Create a new project and return it */
  async create({ name, description, created_by }) {
    const [result] = await pool.execute(
      'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)',
      [name, description || null, created_by]
    );
    return this.findById(result.insertId);
  },

  /** Update project fields */
  async update(id, { name, description }) {
    await pool.execute(
      'UPDATE projects SET name = ?, description = ? WHERE id = ? AND deleted_at IS NULL',
      [name, description || null, id]
    );
    return this.findById(id);
  },

  /** Soft-delete a project */
  async softDelete(id) {
    await pool.execute(
      'UPDATE projects SET deleted_at = NOW() WHERE id = ?',
      [id]
    );
  },

  /** Get all members of a project with their details */
  async getMembers(projectId) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ? AND u.deleted_at IS NULL
       ORDER BY u.name`,
      [projectId]
    );
    return rows;
  },

  /** Add a user to a project (ignore duplicate) */
  async addMember(projectId, userId) {
    await pool.execute(
      'INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)',
      [projectId, userId]
    );
  },

  /** Remove a member from a project */
  async removeMember(projectId, userId) {
    await pool.execute(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
  },

  /** Check if a user is a member of a project */
  async isMember(projectId, userId) {
    const [rows] = await pool.execute(
      'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ? LIMIT 1',
      [projectId, userId]
    );
    return rows.length > 0;
  },
};

module.exports = ProjectModel;
