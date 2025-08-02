const express = require('express');
const { 
    getAllBooks, 
    getBookById,
    searchBooks, 
    addBook, 
    updateBook,
    deleteBook,
    getCategories,
    getPopularBooks,
    checkBooksAvailability,
    getBulkBooks
} = require('../controllers/bookController');
const { authenticateToken, optionalAuth, requireAdminOrLibrarian } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getAllBooks);
router.get('/search', optionalAuth, searchBooks);
router.get('/categories', optionalAuth, getCategories);
router.get('/popular', optionalAuth, getPopularBooks);
router.get('/:id', optionalAuth, getBookById);
router.post('/', authenticateToken, requireAdminOrLibrarian, addBook);
router.put('/:id', authenticateToken, requireAdminOrLibrarian, updateBook);
router.delete('/:id', authenticateToken, requireAdminOrLibrarian, deleteBook);
router.post('/check-availability', optionalAuth, checkBooksAvailability);
router.get('/bulk', optionalAuth, getBulkBooks);

module.exports = router;
