/**
 * controllers/authController.js
 * Thin handlers — delegate business logic to authService.
 * Each function catches errors and passes them to the global errorHandler.
 */
const AuthService = require('../services/authService');
const UserModel = require('../models/userModel');

const AuthController = {
  /** POST /auth/signup */
  async signup(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const user = await AuthService.signup({ name, email, password, role });
      const token = AuthService.signToken(user);
      AuthService.setCookieToken(res, token);

      res.status(201).json({
        message: 'Account created successfully',
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      next(err);
    }
  },

  /** POST /auth/login */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await AuthService.login({ email, password });
      const token = AuthService.signToken(user);
      AuthService.setCookieToken(res, token);

      res.json({
        message: 'Logged in successfully',
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      next(err);
    }
  },

  /** POST /auth/logout */
  logout(req, res) {
    AuthService.clearCookieToken(res);
    res.json({ message: 'Logged out successfully' });
  },

  /** GET /auth/me — returns current authenticated user */
  async me(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: true, message: 'User not found' });
      }
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
