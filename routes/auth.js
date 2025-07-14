const express = require('express');
const { registerAccount, registerCardOnly, login, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerAccount);
router.post('/register-card-only', registerCardOnly); 
router.post('/login', login);

router.get('/me', authenticateToken, getCurrentUser);

router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Authentication API',
        timestamp: new Date().toISOString(),
        endpoints: {
            'POST /register': 'Đăng ký tài khoản cơ bản',
            'POST /register-card-only': 'Đăng ký thẻ thư viện',
            'POST /login': 'Đăng nhập',
            'GET /me': 'Lấy thông tin user hiện tại (protected)'
        }
    });
});

module.exports = router;