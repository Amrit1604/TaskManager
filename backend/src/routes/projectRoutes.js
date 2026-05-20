/**
 * routes/projectRoutes.js
 */
const express = require('express');
const ProjectController = require('../controllers/projectController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createProjectRules, updateProjectRules, addMemberRules } = require('../validators/projectValidators');

const router = express.Router();

// All project routes require authentication
router.use(authenticate);

// List all projects (filtered by role in controller)
router.get('/',    ProjectController.list);

// Single project
router.get('/:id', ProjectController.get);

// Admin only: create, update, delete
router.post('/',    authorize('admin'), createProjectRules, validate, ProjectController.create);
router.put('/:id',  authorize('admin'), updateProjectRules, validate, ProjectController.update);
router.delete('/:id', authorize('admin'), ProjectController.remove);

// Admin only: manage members
router.post('/:id/members',             authorize('admin'), addMemberRules, validate, ProjectController.addMember);
router.delete('/:id/members/:userId',   authorize('admin'), ProjectController.removeMember);

module.exports = router;
