/**
 * models/auditLogModel.js
 * Audit log: records task creations, status updates, assignees, priorities, due dates, and work submissions.
 */
const { pool } = require('../config/db');

const AuditLogModel = {
  /** Insert a new audit log entry */
  async create({ task_id, changed_by, action, field, old_value, new_value }) {
    const [result] = await pool.execute(
      `INSERT INTO audit_logs (task_id, changed_by, action, field, old_value, new_value)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        task_id,
        changed_by,
        action,
        field || null,
        old_value !== null && old_value !== undefined ? String(old_value) : null,
        new_value !== null && new_value !== undefined ? String(new_value) : null,
      ]
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
