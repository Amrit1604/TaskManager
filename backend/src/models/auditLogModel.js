/**
 * models/auditLogModel.js
 * Audit log: records every task status change with who changed it and when.
 */
const { pool } = require('../config/db');

const AuditLogModel = {
  /** Insert a new audit log entry when a task status changes */
  async create({ task_id, changed_by, old_status, new_status }) {
    const [result] = await pool.execute(
      'INSERT INTO audit_logs (task_id, changed_by, old_status, new_status) VALUES (?, ?, ?, ?)',
      [task_id, changed_by, old_status, new_status]
    );
    return result.insertId;
  },

  /** Get all audit entries for a specific task */
  async findByTask(taskId) {
    const [rows] = await pool.execute(
      `SELECT al.*, u.name AS changed_by_name, u.email AS changed_by_email, t.title AS task_title
       FROM audit_logs al
       JOIN users u ON u.id = al.changed_by
       JOIN tasks t ON t.id = al.task_id
       WHERE al.task_id = ?
       ORDER BY al.changed_at DESC`,
      [taskId]
    );
    return rows;
  },

  /** Get all audit entries for all tasks in a project */
  async findByProject(projectId) {
    const [rows] = await pool.execute(
      `SELECT al.*, u.name AS changed_by_name, t.title AS task_title
       FROM audit_logs al
       JOIN users  u ON u.id = al.changed_by
       JOIN tasks  t ON t.id = al.task_id
       WHERE t.project_id = ? AND t.deleted_at IS NULL
       ORDER BY al.changed_at DESC
       LIMIT 200`,
      [projectId]
    );
    return rows;
  },
};

module.exports = AuditLogModel;
