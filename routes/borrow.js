const express = require('express');
const { 
    getAllBorrows,
    getBorrowById,
    createBorrow,
    searchBorrows,
    updateBorrowStatus,
    deleteBorrow
} = require('../controllers/borrowController');
const { authenticateToken, requireAdminOrLibrarian } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireAdminOrLibrarian, getAllBorrows);
router.get('/search', requireAdminOrLibrarian, searchBorrows);
router.get('/:id', requireAdminOrLibrarian, getBorrowById);
router.post('/', requireAdminOrLibrarian, createBorrow);
router.patch('/:id/status', requireAdminOrLibrarian, updateBorrowStatus);
router.delete('/:id', requireAdminOrLibrarian, deleteBorrow);

router.get('/test', (req, res) => {
    res.json({ 
        message: 'Borrow API working',
        endpoints: {
            'GET /': 'Get all borrows (admin/librarian)',
            'GET /search': 'Search borrows (admin/librarian)',
            'GET /:id': 'Get borrow by ID (admin/librarian)',
            'POST /': 'Create borrow (admin/librarian)',
            'PATCH /:id/status': 'Update borrow status (admin/librarian)',
            'DELETE /:id': 'Delete borrow (admin/librarian)'
        }
    });
});

module.exports = router;