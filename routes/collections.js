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

/**
 * @swagger
 * components:
 *   schemas:
 *     Collection:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Best Sellers 2024"
 *         description:
 *           type: string
 *           example: "A curated collection of the year's best selling books"
 *         coverImage:
 *           type: string
 *           format: uri
 *           example: "https://example.com/collections/bestsellers2024.jpg"
 *         isPublic:
 *           type: boolean
 *           example: true
 *         bookCount:
 *           type: integer
 *           example: 25
 *         createdBy:
 *           type: integer
 *           example: 2
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         creator:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 2
 *             username:
 *               type: string
 *               example: "librarian_jane"
 *             fullName:
 *               type: string
 *               example: "Jane Smith"
 *         books:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 10
 *               title:
 *                 type: string
 *                 example: "The Great Gatsby"
 *               author:
 *                 type: string
 *                 example: "F. Scott Fitzgerald"
 *               coverImage:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/covers/gatsby.jpg"
 *               addedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-10T14:20:00.000Z"
 *     CollectionInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           example: "Science Fiction Classics"
 *         description:
 *           type: string
 *           maxLength: 1000
 *           example: "A collection of timeless science fiction novels"
 *         isPublic:
 *           type: boolean
 *           default: true
 *           example: true
 *         coverImage:
 *           type: string
 *           format: uri
 *           example: "https://example.com/collections/scifi.jpg"
 *     BookToCollection:
 *       type: object
 *       required:
 *         - bookId
 *       properties:
 *         bookId:
 *           type: integer
 *           example: 15
 *           description: "ID of the book to add to the collection"
 *         notes:
 *           type: string
 *           maxLength: 500
 *           example: "Featured book of the month"
 *           description: "Optional notes about why this book is in the collection"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Bad Request"
 *         message:
 *           type: string
 *           example: "Invalid input data"
 */

/**
 * @swagger
 * tags:
 *   name: Collections
 *   description: Collection management APIs for organizing books into curated groups
 */

/**
 * @swagger
 * /api/collections:
 *   get:
 *     summary: Get all collections
 *     description: Retrieve a paginated list of all public collections and user's private collections
 *     tags: [Collections]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: public
 *         schema:
 *           type: boolean
 *         description: Filter by public/private collections
 *         example: true
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt, bookCount]
 *           default: createdAt
 *         description: Sort collections by field
 *         example: "name"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *         example: "asc"
 *     responses:
 *       200:
 *         description: List of collections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 collections:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Collection'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     totalItems:
 *                       type: integer
 *                       example: 28
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', optionalAuth, getAllCollections);

/**
 * @swagger
 * /api/collections/search:
 *   get:
 *     summary: Search collections
 *     description: Search for collections by name or description
 *     tags: [Collections]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (collection name or description)
 *         example: "science fiction"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: public
 *         schema:
 *           type: boolean
 *         description: Filter by public/private collections
 *         example: true
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 collections:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Collection'
 *                 searchQuery:
 *                   type: string
 *                   example: "science fiction"
 *                 totalResults:
 *                   type: integer
 *                   example: 5
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     hasNext:
 *                       type: boolean
 *                       example: false
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Bad request - missing search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/search', optionalAuth, searchCollections);

/**
 * @swagger
 * /api/collections/{id}:
 *   get:
 *     summary: Get collection by ID
 *     description: Retrieve a specific collection by its ID with all books included
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collection ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Collection retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collection'
 *       404:
 *         description: Collection not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - private collection access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid collection ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', optionalAuth, getCollectionById);

/**
 * @swagger
 * /api/collections:
 *   post:
 *     summary: Create a new collection
 *     description: Create a new book collection (Admin/Librarian only)
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CollectionInput'
 *     responses:
 *       201:
 *         description: Collection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Collection created successfully"
 *                 collection:
 *                   $ref: '#/components/schemas/Collection'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, requireAdminOrLibrarian, createCollection);

/**
 * @swagger
 * /api/collections/{collectionId}/books:
 *   post:
 *     summary: Add book to collection
 *     description: Add a book to an existing collection (Admin/Librarian only)
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collection ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookToCollection'
 *     responses:
 *       200:
 *         description: Book added to collection successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Book added to collection successfully"
 *                 collection:
 *                   $ref: '#/components/schemas/Collection'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Collection or book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:collectionId/books', authenticateToken, requireAdminOrLibrarian, addBookToCollection);

/**
 * @swagger
 * /api/collections/{collectionId}/books/{bookId}:
 *   delete:
 *     summary: Remove book from collection
 *     description: Remove a book from an existing collection (Admin/Librarian only)
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collection ID
 *         example: 1
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Book ID
 *         example: 15
 *     responses:
 *       200:
 *         description: Book removed from collection successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Book removed from collection successfully"
 *                 collection:
 *                   $ref: '#/components/schemas/Collection'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Collection, book, or book-collection relationship not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:collectionId/books/:bookId', authenticateToken, requireAdminOrLibrarian, removeBookFromCollection);

/**
 * @swagger
 * /api/collections/{id}:
 *   delete:
 *     summary: Delete a collection
 *     description: Delete a specific collection (Admin/Librarian only)
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collection ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Collection deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Collection deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Collection not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - collection cannot be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, requireAdminOrLibrarian, deleteCollection);

module.exports = router;