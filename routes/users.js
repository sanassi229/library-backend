const express = require('express');
const { 
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserProfile,
    searchUsers
} = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireAdmin, getAllUsers);
router.get('/search', requireAdmin, searchUsers);
router.put('/:id', requireAdmin, updateUser);
router.delete('/:id', requireAdmin, deleteUser);

router.get('/:id', getUserById);
router.get('/:id/profile', getUserProfile);

router.get('/test', (req, res) => {
    res.json({ 
        message: 'Users API working',
        endpoints: {
            'GET /': 'Get all users (admin)',
            'GET /search': 'Search users (admin)',
            'GET /:id': 'Get user by ID',
            'GET /:id/profile': 'Get user profile with library card',
            'PUT /:id': 'Update user (admin)',
            'DELETE /:id': 'Delete user (admin)'
        }
    });
});

module.exports = router;