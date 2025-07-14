const express = require('express');
const { 
    getAllCollections,
    getCollectionById,
    searchCollections,
    createCollection,
    addBookToCollection,
    removeBookFromCollection,
    deleteCollection
} = require('../controllers/collectionController');
const { authenticateToken, optionalAuth, requireAdminOrLibrarian } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getAllCollections);
router.get('/search', optionalAuth, searchCollections);
router.get('/:id', optionalAuth, getCollectionById);

router.post('/', authenticateToken, requireAdminOrLibrarian, createCollection);
router.post('/:collectionId/books', authenticateToken, requireAdminOrLibrarian, addBookToCollection);
router.delete('/:collectionId/books/:bookId', authenticateToken, requireAdminOrLibrarian, removeBookFromCollection);
router.delete('/:id', authenticateToken, requireAdminOrLibrarian, deleteCollection);

router.get('/test', (req, res) => {
    res.json({ 
        message: 'Collections API working',
        endpoints: {
            'GET /': 'Get all collections (public)',
            'GET /search': 'Search collections (public)',
            'GET /:id': 'Get collection by ID (public)',
            'POST /': 'Create collection (admin/librarian)',
            'POST /:collectionId/books': 'Add book to collection (admin/librarian)',
            'DELETE /:collectionId/books/:bookId': 'Remove book from collection (admin/librarian)',
            'DELETE /:id': 'Delete collection (admin/librarian)'
        }
    });
});

module.exports = router;