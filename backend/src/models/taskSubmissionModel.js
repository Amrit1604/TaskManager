/**
 * models/taskSubmissionModel.js
 * SQL queries for the task_submissions table.
 */
const { pool } = require('../config/db');

const TaskSubmissionModel = {
  /** Create a task submission */
  async create({ task_id, user_id, content, file_url }) {
    const [result] = await pool.execute(
      `INSERT INTO task_submissions (task_id, user_id, content, file_url)
       VALUES (?, ?, ?, ?)`,
      [task_id, user_id, content, file_url || null]
    );
    return this.findById(result.insertId);
  },

  /** Find submission by ID */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT ts.*, u.name AS user_name, u.email AS user_email
       FROM task_submissions ts
       JOIN users u ON u.id = ts.user_id
       WHERE ts.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /** Find all submissions for a task, ordered by newest first */
  async findByTask(taskId) {
    const [rows] = await pool.execute(
      `SELECT ts.*, u.name AS user_name, u.email AS user_email
       FROM task_submissions ts
       JOIN users u ON u.id = ts.user_id
       WHERE ts.task_id = ?
       ORDER BY ts.submitted_at DESC`,
      [taskId]
    );
    return rows;
  },
};

module.exports = TaskSubmissionModel;
