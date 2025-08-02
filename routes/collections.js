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

module.exports = router;