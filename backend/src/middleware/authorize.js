/**
 * middleware/authorize.js
 * Role-based access control factory.
 * Usage: router.post('/route', authenticate, authorize('admin'), controller)
 *
 * Returns HTTP 403 if the authenticated user's role is not in the allowed list.
 * This is enforced at the API level — it's NOT just a hidden button on the frontend.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: true, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: true,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
}

module.exports = authorize;
