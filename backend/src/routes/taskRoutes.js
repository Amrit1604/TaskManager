/**
 * routes/taskRoutes.js
 */
const express = require('express');
const TaskController = require('../controllers/taskController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createTaskRules, updateStatusRules } = require('../validators/taskValidators');

const router = express.Router({ mergeParams: true }); // mergeParams for /projects/:id/tasks

router.use(authenticate);

// Dashboard stats / my tasks
router.get('/dashboard', TaskController.getDashboard);

// Tasks under a project (mounted at /projects/:id/tasks)
router.get('/',    TaskController.listByProject);
router.get('/stats', TaskController.getStats);
router.post('/', createTaskRules, validate, TaskController.create);

// Individual task operations (standalone /tasks/:id)
router.put('/:taskId',    TaskController.update);
router.delete('/:taskId', TaskController.remove);
router.get('/:taskId/audit', TaskController.getTaskAudit);

// Task Submissions routes
router.post('/:taskId/submission', TaskController.submitWork);
router.get('/:taskId/submission', TaskController.getSubmissions);

module.exports = router;
