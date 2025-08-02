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

module.exports = router;