const express = require('express');
const {     
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserProfile,
    getMyProfile,
    updateMyProfile,
    searchUsers
} = require('../controllers/userController');
const {     
    borrowBooks,
    getMyBorrows,
    renewBook,
    returnBook,
    getBorrowHistory,
    getBorrowStatistics
} = require('../controllers/userBorrowController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/borrow', borrowBooks);
router.get('/my-borrows', getMyBorrows);
router.get('/borrow-history', getBorrowHistory);
router.get('/borrow-statistics', getBorrowStatistics);
router.post('/borrows/:borrowId/books/:bookId/renew', renewBook);
router.post('/borrows/:borrowId/books/:bookId/return', returnBook);
router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);
router.get('/', requireAdmin, getAllUsers);
router.get('/search', requireAdmin, searchUsers);
router.put('/:id', requireAdmin, updateUser);
router.delete('/:id', requireAdmin, deleteUser);
router.get('/:id', getUserById);
router.get('/:id/profile', getUserProfile);

module.exports = router;