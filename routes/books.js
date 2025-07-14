const express = require('express');
const { 
    getAllBooks, 
    getBookById,
    searchBooks, 
    addBook, 
    updateBook,
    deleteBook,
    getCategories,
    getPopularBooks
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

router.get('/test', (req, res) => {
    res.json({ 
        message: 'Books API working',
        endpoints: {
            'GET /': 'Get all books (public)',
            'GET /search?q=keyword': 'Search books (public)',
            'GET /categories': 'Get book categories (public)',
            'GET /popular': 'Get popular books (public)',
            'GET /:id': 'Get book by ID (public)',
            'POST /': 'Add book (admin/librarian)',
            'PUT /:id': 'Update book (admin/librarian)',
            'DELETE /:id': 'Delete book (admin/librarian)'
        }
    });
});

module.exports = router;