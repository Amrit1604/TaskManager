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

// Admin or creator only: create, update, delete
router.post('/',    createProjectRules, validate, ProjectController.create);
router.put('/:id',  updateProjectRules, validate, ProjectController.update);
router.delete('/:id', ProjectController.remove);

// Admin or creator only: manage members
router.post('/:id/members',             addMemberRules, validate, ProjectController.addMember);
router.delete('/:id/members/:userId',   ProjectController.removeMember);

module.exports = router;
