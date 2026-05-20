/**
 * models/taskModel.js
 * SQL queries for the tasks table with support for filtering and soft delete.
 */
const { pool } = require('../config/db');

const TaskModel = {
  /** Base SELECT with joined user names — reused by multiple queries */
  _baseSelect: `
    SELECT
      t.*,
      u_assign.name  AS assignee_name,
      u_assign.email AS assignee_email,
      u_create.name  AS creator_name,
      p.name         AS project_name
    FROM tasks t
    LEFT JOIN users  u_assign ON u_assign.id = t.assignee_id
    LEFT JOIN users  u_create ON u_create.id = t.created_by
    LEFT JOIN projects p      ON p.id = t.project_id
  `,

  /** Get tasks for a project with optional filters */
  async findByProject(projectId, { status, priority } = {}) {
    let sql = `${this._baseSelect} WHERE t.project_id = ? AND t.deleted_at IS NULL`;
    const params = [projectId];

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }

    sql += ' ORDER BY t.due_date ASC, t.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /** Get tasks assigned to a specific user across all their projects */
  async findByAssignee(assigneeId) {
    const [rows] = await pool.execute(
      `${this._baseSelect}
       WHERE t.assignee_id = ? AND t.deleted_at IS NULL
       ORDER BY t.due_date ASC`,
      [assigneeId]
    );
    return rows;
  },

  /** Find a single active task by id */
  async findById(id) {
    const [rows] = await pool.execute(
      `${this._baseSelect} WHERE t.id = ? AND t.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /** Create a task */
  async create({ title, description, project_id, assignee_id, created_by, priority, status, due_date }) {
    const [result] = await pool.execute(
      `INSERT INTO tasks (title, description, project_id, assignee_id, created_by, priority, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, project_id, assignee_id || null, created_by, priority || 'medium', status || 'todo', due_date || null]
    );
    return this.findById(result.insertId);
  },

  /** Full update (admin) */
  async update(id, { title, description, assignee_id, priority, status, due_date }) {
    await pool.execute(
      `UPDATE tasks SET title = ?, description = ?, assignee_id = ?, priority = ?, status = ?, due_date = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [title, description || null, assignee_id || null, priority, status, due_date || null, id]
    );
    return this.findById(id);
  },

  /** Status-only update (member) */
  async updateStatus(id, status) {
    await pool.execute(
      'UPDATE tasks SET status = ? WHERE id = ? AND deleted_at IS NULL',
      [status, id]
    );
    return this.findById(id);
  },

  /** Soft-delete a task */
  async softDelete(id) {
    await pool.execute('UPDATE tasks SET deleted_at = NOW() WHERE id = ?', [id]);
  },

  /** Dashboard stats for a project */
  async getStatsByProject(projectId) {
    const [rows] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'todo') AS todo,
         SUM(status = 'in_progress') AS in_progress,
         SUM(status = 'done') AS done,
         SUM(status != 'done' AND due_date < CURDATE()) AS overdue
       FROM tasks
       WHERE project_id = ? AND deleted_at IS NULL`,
      [projectId]
    );
    return rows[0];
  },

  /** Dashboard stats across ALL projects (admin view) */
  async getGlobalStats() {
    const [rows] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'todo') AS todo,
         SUM(status = 'in_progress') AS in_progress,
         SUM(status = 'done') AS done,
         SUM(status != 'done' AND due_date < CURDATE()) AS overdue
       FROM tasks
       WHERE deleted_at IS NULL`
    );
    return rows[0];
  },
};

module.exports = TaskModel;
