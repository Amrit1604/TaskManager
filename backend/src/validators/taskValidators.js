/**
 * validators/taskValidators.js
 */
const { body } = require('express-validator');

const createTaskRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 2, max: 200 }).withMessage('Title must be 2–200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),

  body('assignee_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('assignee_id must be a positive integer'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),

  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done']).withMessage('Status must be todo, in_progress, or done'),

  body('due_date')
    .optional({ nullable: true })
    .isISO8601().withMessage('due_date must be a valid date (YYYY-MM-DD)'),
];

const updateStatusRules = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['todo', 'in_progress', 'done']).withMessage('Status must be todo, in_progress, or done'),
];

module.exports = { createTaskRules, updateStatusRules };
