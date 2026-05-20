/**
 * services/authService.js
 * Business logic for authentication: password hashing, JWT creation/parsing.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const SALT_ROUNDS = 12;

const AuthService = {
  /** Hash a plain-text password */
  async hashPassword(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
  },

  /** Compare a plain password against a stored hash */
  async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },

  /**
   * Sign a JWT containing { id, name, email, role }.
   * The token is stored in an httpOnly cookie — never returned in the response body.
   */
  signToken(user) {
    return jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  },

  /**
   * Set the JWT as an httpOnly, Secure, SameSite=Strict cookie.
   * httpOnly → JS cannot read it (prevents XSS token theft)
   * Secure  → only sent over HTTPS in production
   */
  setCookieToken(res, token) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction || process.env.COOKIE_SECURE === 'true',
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });
  },

  /** Register a new user */
  async signup({ name, email, password, role }) {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      const err = new Error('An account with this email already exists');
      err.status = 409;
      throw err;
    }

    const password_hash = await this.hashPassword(password);
    const user = await UserModel.create({ name, email, password_hash, role: role || 'member' });
    return user;
  },

  /** Authenticate a user by email/password */
  async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const valid = await this.verifyPassword(password, user.password_hash);
    if (!valid) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    return user;
  },
};

module.exports = AuthService;
