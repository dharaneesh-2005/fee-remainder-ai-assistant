const express = require('express');
const { login } = require('../middleware/auth');

const router = express.Router();

// Login route
router.post('/login', login);

module.exports = router;
