import { Router } from 'express';

export const router = Router();

// simple in-memory default user (placeholder)
const DEFAULT_USER = {
  username: 'admin',
  password: 'admin123',
};

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
    return res.json({ ok: true, token: 'dev-token', user: { username } });
  }
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});
