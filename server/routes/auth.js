const express = require('express');
const router = express.Router();

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple authentication for demo purposes
  if (username === 'admin' && password === 'admin123') {
    res.json({
      message: 'Login successful',
      user: {
        id: 1,
        username: 'admin',
        name: 'Administrator'
      },
      token: 'demo-token' // In production, this would be a JWT or similar
    });
  } else {
    res.status(401).json({
      message: 'Invalid credentials'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({
    message: 'Logout successful'
  });
});

module.exports = router;