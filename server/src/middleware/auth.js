/**
 * Middleware to require an authenticated session.
 * Returns 401 if the user is not logged in.
 */
export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized' });
}
