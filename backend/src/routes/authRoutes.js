/**
 * routes/authRoutes.js
 * Rate-limited to prevent brute-force attacks: 15 requests per 15 minutes per IP.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { signupRules, loginRules } = require('../validators/authValidators');

const router = express.Router();

// Apply strict rate limiting to all auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests from this IP. Please try again after 15 minutes.' },
});

router.use(authLimiter);

router.post('/signup', signupRules, validate, AuthController.signup);
router.post('/login',  loginRules,  validate, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me',      authenticate, AuthController.me);

module.exports = router;
