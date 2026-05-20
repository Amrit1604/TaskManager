/**
 * routes/userRoutes.js
 */
const express = require('express');
const ProjectController = require('../controllers/projectController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

// Get all users — used by admin to pick members when creating tasks/projects
router.get('/', ProjectController.listUsers);

module.exports = router;
