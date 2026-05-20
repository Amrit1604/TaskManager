/**
 * middleware/authenticate.js
 * Verifies the JWT stored in the httpOnly 'token' cookie.
 * Attaches the decoded payload to req.user if valid.
 *
 * Security note: httpOnly cookies cannot be read by JavaScript,
 * which prevents XSS attacks from stealing tokens (unlike localStorage).
 */
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: true, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    // Token expired or tampered with
    res.clearCookie('token');
    return res.status(401).json({ error: true, message: 'Session expired. Please log in again.' });
  }
}

module.exports = authenticate;
