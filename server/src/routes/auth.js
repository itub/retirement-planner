import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Kick off Google OAuth flow
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// Google redirects here after login
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  }
);

// Current user info
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.json({ user: null });
  const { id, email, name, avatar_url } = req.user;
  res.json({ user: { id, email, name, avatar_url } });
});

// Logout
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

export default router;
