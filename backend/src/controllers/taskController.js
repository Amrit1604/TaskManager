/**
 * controllers/taskController.js
 * Enforces RBAC at the data level:
 *  - Admin: full CRUD on tasks
 *  - Member: can only update status of their assigned tasks
 */
const TaskModel = require('../models/taskModel');
const AuditLogModel = require('../models/auditLogModel');
const ProjectModel = require('../models/projectModel');
const UserModel = require('../models/userModel');
const EmailService = require('../services/emailService');

const TaskController = {
  /** GET /projects/:id/tasks?status=&priority= */
  async listByProject(req, res, next) {
    try {
      const project = await ProjectModel.findById(req.params.id);
      if (!project) return res.status(404).json({ error: true, message: 'Project not found' });

      // Members can only view tasks in their projects
      if (req.user.role === 'member') {
        const isMember = await ProjectModel.isMember(project.id, req.user.id);
        if (!isMember) return res.status(403).json({ error: true, message: 'Access denied' });
      }

      const { status, priority } = req.query;
      const tasks = await TaskModel.findByProject(project.id, { status, priority });
      res.json({ tasks });
    } catch (err) {
      next(err);
    }
  },

  /** GET /projects/:id/stats */
  async getStats(req, res, next) {
    try {
      const stats = await TaskModel.getStatsByProject(req.params.id);
      res.json({ stats });
    } catch (err) {
      next(err);
    }
  },

  /** GET /tasks/dashboard — global stats (admin) or per-user tasks (member) */
  async getDashboard(req, res, next) {
    try {
      if (req.user.role === 'admin') {
        const stats = await TaskModel.getGlobalStats();
        res.json({ stats });
      } else {
        const tasks = await TaskModel.findByAssignee(req.user.id);
        res.json({ tasks });
      }
    } catch (err) {
      next(err);
    }
  },

  /** POST /projects/:id/tasks — project members */
  async create(req, res, next) {
    try {
      const project = await ProjectModel.findById(req.params.id);
      if (!project) return res.status(404).json({ error: true, message: 'Project not found' });

      if (req.user.role !== 'admin') {
        const isMember = await ProjectModel.isMember(project.id, req.user.id);
        if (!isMember) return res.status(403).json({ error: true, message: 'You must be a member of this project to create tasks' });
      }

      const { title, description, assignee_id, priority, status, due_date } = req.body;

      // Verify assignee is a project member
      if (assignee_id) {
        const isAssigneeMember = await ProjectModel.isMember(project.id, assignee_id);
        if (!isAssigneeMember) {
          return res.status(400).json({ error: true, message: 'Assignee must be a member of this project' });
        }
      }

      const task = await TaskModel.create({
        title, description, project_id: project.id,
        assignee_id, created_by: req.user.id, priority, status, due_date,
      });

      // Send email notification to assignee (silently fails if SMTP not configured)
      if (task.assignee_id && task.assignee_email) {
        EmailService.notifyTaskAssigned({
          assigneeEmail: task.assignee_email,
          assigneeName: task.assignee_name,
          taskTitle: task.title,
          projectName: project.name,
          dueDate: task.due_date,
          assignedByName: req.user.name,
        });
      }

      res.status(201).json({ message: 'Task created', task });
    } catch (err) {
      next(err);
    }
  },

  /** PUT /tasks/:id — project members can full update */
  async update(req, res, next) {
    try {
      const task = await TaskModel.findById(req.params.id);
      if (!task) return res.status(404).json({ error: true, message: 'Task not found' });

      if (req.user.role !== 'admin') {
        const isMember = await ProjectModel.isMember(task.project_id, req.user.id);
        if (!isMember) {
          return res.status(403).json({ error: true, message: 'You must be a member of the project to update its tasks' });
        }
      }

      const oldStatus = task.status;
      const { title, description, assignee_id, priority, status, due_date } = req.body;

      const updatedTask = await TaskModel.update(task.id, { title, description, assignee_id, priority, status, due_date });

      // Log status change to audit table if status changed
      if (req.body.status && req.body.status !== oldStatus) {
        await AuditLogModel.create({
          task_id: task.id,
          changed_by: req.user.id,
          old_status: oldStatus,
          new_status: req.body.status,
        });
      }

      res.json({ message: 'Task updated', task: updatedTask });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /tasks/:id — project members (soft delete) */
  async remove(req, res, next) {
    try {
      const task = await TaskModel.findById(req.params.id);
      if (!task) return res.status(404).json({ error: true, message: 'Task not found' });

      if (req.user.role !== 'admin') {
        const isMember = await ProjectModel.isMember(task.project_id, req.user.id);
        if (!isMember) return res.status(403).json({ error: true, message: 'You must be a member of the project to delete its tasks' });
      }

      await TaskModel.softDelete(req.params.id);
      res.json({ message: 'Task deleted' });
    } catch (err) {
      next(err);
    }
  },

  /** GET /tasks/:id/audit — project members */
  async getTaskAudit(req, res, next) {
    try {
      const task = await TaskModel.findById(req.params.id);
      if (!task) return res.status(404).json({ error: true, message: 'Task not found' });

      if (req.user.role !== 'admin') {
        const isMember = await ProjectModel.isMember(task.project_id, req.user.id);
        if (!isMember) return res.status(403).json({ error: true, message: 'Access denied' });
      }

      const logs = await AuditLogModel.findByTask(req.params.id);
      res.json({ logs });
    } catch (err) {
      next(err);
    }
  },

  /** GET /projects/:id/audit — project members */
  async getProjectAudit(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        const isMember = await ProjectModel.isMember(req.params.id, req.user.id);
        if (!isMember) return res.status(403).json({ error: true, message: 'Access denied' });
      }

      const logs = await AuditLogModel.findByProject(req.params.id);
      res.json({ logs });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = TaskController;
