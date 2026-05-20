/**
 * validators/projectValidators.js
 */
const { body, param } = require('express-validator');

const createProjectRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 2, max: 150 }).withMessage('Project name must be 2–150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be under 1000 characters'),
];

const updateProjectRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Project name must be 2–150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be under 1000 characters'),
];

const addMemberRules = [
  body('userId')
    .notEmpty().withMessage('userId is required')
    .isInt({ min: 1 }).withMessage('userId must be a positive integer'),
];

module.exports = { createProjectRules, updateProjectRules, addMemberRules };
