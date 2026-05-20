/**
 * middleware/validate.js
 * Runs express-validator's validationResult and short-circuits with 400
 * if any field-level errors are present. Use after validator chains.
 */
const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      // Returns field-level errors for the frontend to display inline
      fields: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = validate;
