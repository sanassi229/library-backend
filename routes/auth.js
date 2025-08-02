const express = require('express');
const { registerAccount, registerCardOnly, login, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerAccount);
router.post('/register-card-only', registerCardOnly);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;
