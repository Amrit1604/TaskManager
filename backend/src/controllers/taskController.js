/**
 * controllers/taskController.js
 * Enforces RBAC at the data level:
 *  - Admin: full CRUD on tasks
 *  - Member: can only view assigned tasks, update status of assigned tasks, and submit work
 */
const TaskModel = require('../models/taskModel');
const AuditLogModel = require('../models/auditLogModel');
const ProjectModel = require('../models/projectModel');
const UserModel = require('../models/userModel');
const TaskSubmissionModel = require('../models/taskSubmissionModel');
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

  /** POST /projects/:id/tasks — admin only */
  async create(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: true, message: 'Access denied: Only admins can create tasks' });
      }

      const project = await ProjectModel.findById(req.params.id);
      if (!project) return res.status(404).json({ error: true, message: 'Project not found' });

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

      // Log task creation
      await AuditLogModel.create({
        task_id: task.id,
        changed_by: req.user.id,
        action: 'created',
        field: null,
        old_value: null,
        new_value: task.title,
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

  /** PUT /tasks/:taskId — admin full updates or member status updates */
  async update(req, res, next) {
    try {
      const task = await TaskModel.findById(req.params.taskId);
      if (!task) return res.status(404).json({ error: true, message: 'Task not found' });

      // Enforce project membership check for non-admins
      if (req.user.role !== 'admin') {
        const isMember = await ProjectModel.isMember(task.project_id, req.user.id);
        if (!isMember) {
          return res.status(403).json({ error: true, message: 'You must be a member of the project to update its tasks' });
        }
      }

      const { title, description, assignee_id, priority, status, due_date } = req.body;

      // Track existing field values for change auditing
      const oldStatus = task.status;
      const oldPriority = task.priority;
      const oldAssigneeId = task.assignee_id;
      const oldDueDate = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : null;

      let updatedTask;

      if (req.user.role === 'member') {
        // Members can only update tasks assigned to them
        if (task.assignee_id !== req.user.id) {
          return res.status(403).json({ error: true, message: 'Access denied: Members can only update their own assigned tasks' });
        }

        // Validate that members are not trying to change other task fields
        const isChangingTitle = title !== undefined && title !== task.title;
        const isChangingDescription = description !== undefined && description !== task.description;
        const isChangingAssignee = assignee_id !== undefined && assignee_id !== task.assignee_id;
        const isChangingPriority = priority !== undefined && priority !== task.priority;
        const newDueDateStr = due_date ? new Date(due_date).toISOString().split('T')[0] : null;
        const isChangingDueDate = due_date !== undefined && newDueDateStr !== oldDueDate;

        if (isChangingTitle || isChangingDescription || isChangingAssignee || isChangingPriority || isChangingDueDate) {
          return res.status(403).json({ error: true, message: 'Access denied: Members can only update the status of their assigned tasks' });
        }

        // Update status only
        const finalStatus = status || task.status;
        updatedTask = await TaskModel.updateStatus(task.id, finalStatus);
      } else {
        // Admins can update any field
        // Verify assignee is a project member if provided
        if (assignee_id) {
          const isAssigneeMember = await ProjectModel.isMember(task.project_id, assignee_id);
          if (!isAssigneeMember) {
            return res.status(400).json({ error: true, message: 'Assignee must be a member of this project' });
          }
        }

        updatedTask = await TaskModel.update(task.id, {
          title: title !== undefined ? title : task.title,
          description: description !== undefined ? description : task.description,
          assignee_id: assignee_id !== undefined ? assignee_id : task.assignee_id,
          priority: priority !== undefined ? priority : task.priority,
          status: status !== undefined ? status : task.status,
          due_date: due_date !== undefined ? due_date : task.due_date,
        });
      }

      // ── Audit Logging of Modified Fields ─────────────────────────
      const newStatus = updatedTask.status;
      const newPriority = updatedTask.priority;
      const newAssigneeId = updatedTask.assignee_id;
      const newDueDate = updatedTask.due_date ? new Date(updatedTask.due_date).toISOString().split('T')[0] : null;

      // Status change
      if (oldStatus !== newStatus) {
        await AuditLogModel.create({
          task_id: task.id,
          changed_by: req.user.id,
          action: 'updated',
          field: 'status',
          old_value: oldStatus,
          new_value: newStatus,
        });
      }

      // Priority change
      if (oldPriority !== newPriority) {
        await AuditLogModel.create({
          task_id: task.id,
          changed_by: req.user.id,
          action: 'updated',
          field: 'priority',
          old_value: oldPriority,
          new_value: newPriority,
        });
      }

      // Assignee change
      if (oldAssigneeId !== newAssigneeId) {
        let oldAssigneeName = 'Unassigned';
        let newAssigneeName = 'Unassigned';

        if (oldAssigneeId) {
          const uOld = await UserModel.findById(oldAssigneeId);
          if (uOld) oldAssigneeName = uOld.name;
        }
        if (newAssigneeId) {
          const uNew = await UserModel.findById(newAssigneeId);
          if (uNew) newAssigneeName = uNew.name;
        }

        await AuditLogModel.create({
          task_id: task.id,
          changed_by: req.user.id,
          action: 'updated',
          field: 'assignee',
          old_value: oldAssigneeName,
          new_value: newAssigneeName,
        });
      }

      // Due Date change
      if (oldDueDate !== newDueDate) {
        await AuditLogModel.create({
          task_id: task.id,
          changed_by: req.user.id,
          action: 'updated',
          field: 'due_date',
          old_value: oldDueDate || 'No Due Date',
          new_value: newDueDate || 'No Due Date',
        });
      }

      res.json({ message: 'Task updated', task: updatedTask });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /tasks/:taskId — admin only (soft delete) */
  async remove(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: true, message: 'Access denied: Only admins can delete tasks' });
      }

      const task = await TaskModel.findById(req.params.taskId);
      if (!task) return res.status(404).json({ error: true, message: 'Task not found' });

      await TaskModel.softDelete(req.params.taskId);
      res.json({ message: 'Task deleted' });
    } catch (err) {
      next(err);
    }
  },

  /** GET /tasks/:taskId/audit — project members */
  async getTaskAudit(req, res, next) {
    try {
      const task = await TaskModel.findById(req.params.taskId);
      if (!task) return res.status(404).json({ error: true, message: 'Task not found' });

      if (req.user.role !== 'admin') {
        const isMember = await ProjectModel.isMember(task.project_id, req.user.id);
        if (!isMember) return res.status(403).json({ error: true, message: 'Access denied' });
      }

      const logs = await AuditLogModel.findByTask(req.params.taskId);
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

  /** POST /tasks/:taskId/submission — assignees submits work */
  async submitWork(req, res, next) {
    try {
      const task = await TaskModel.findById(req.params.taskId);
      if (!task) return res.status(404).json({ error: true, message: 'Task not found' });

      // Enforce project membership check
      if (req.user.role !== 'admin') {
        const isMember = await ProjectModel.isMember(task.project_id, req.user.id);
        if (!isMember) return res.status(403).json({ error: true, message: 'Access denied' });
      }

      // Members can only submit work for tasks assigned to them
      if (req.user.role === 'member' && task.assignee_id !== req.user.id) {
        return res.status(403).json({ error: true, message: 'Access denied: You can only submit work for tasks assigned to you' });
      }

      const { content, file_url } = req.body;
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: true, message: 'Submission content is required' });
      }

      const submission = await TaskSubmissionModel.create({
        task_id: task.id,
        user_id: req.user.id,
        content,
        file_url,
      });

      // Write submission log to audits
      await AuditLogModel.create({
        task_id: task.id,
        changed_by: req.user.id,
        action: 'submitted',
        field: 'submission',
        old_value: null,
        new_value: content.length > 80 ? content.substring(0, 77) + '...' : content,
      });

      res.status(201).json({ message: 'Work submitted successfully', submission });
    } catch (err) {
      next(err);
    }
  },

  /** GET /tasks/:taskId/submission — list submissions */
  async getSubmissions(req, res, next) {
    try {
      const task = await TaskModel.findById(req.params.taskId);
      if (!task) return res.status(404).json({ error: true, message: 'Task not found' });

      if (req.user.role !== 'admin') {
        const isMember = await ProjectModel.isMember(task.project_id, req.user.id);
        if (!isMember) return res.status(403).json({ error: true, message: 'Access denied' });
      }

      const submissions = await TaskSubmissionModel.findByTask(task.id);
      res.json({ submissions });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = TaskController;
