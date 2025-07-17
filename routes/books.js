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

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "The Great Gatsby"
 *         author:
 *           type: string
 *           example: "F. Scott Fitzgerald"
 *         description:
 *           type: string
 *           example: "A classic American novel set in the Jazz Age"
 *         isbn:
 *           type: string
 *           example: "978-0-7432-7356-5"
 *         category:
 *           type: string
 *           example: "Fiction"
 *         publisher:
 *           type: string
 *           example: "Scribner"
 *         publishedYear:
 *           type: integer
 *           example: 1925
 *         pages:
 *           type: integer
 *           example: 180
 *         language:
 *           type: string
 *           example: "English"
 *         coverImage:
 *           type: string
 *           format: uri
 *           example: "https://example.com/covers/gatsby.jpg"
 *         totalCopies:
 *           type: integer
 *           example: 5
 *         availableCopies:
 *           type: integer
 *           example: 3
 *         location:
 *           type: string
 *           example: "Section A, Shelf 1"
 *         rating:
 *           type: number
 *           format: float
 *           example: 4.5
 *         borrowCount:
 *           type: integer
 *           example: 25
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *     BookInput:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - isbn
 *         - category
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           example: "To Kill a Mockingbird"
 *         author:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           example: "Harper Lee"
 *         description:
 *           type: string
 *           maxLength: 1000
 *           example: "A novel about racial injustice in the American South"
 *         isbn:
 *           type: string
 *           pattern: "^[0-9-]+$"
 *           example: "978-0-06-112008-4"
 *         category:
 *           type: string
 *           example: "Literature"
 *         publisher:
 *           type: string
 *           example: "HarperCollins"
 *         publishedYear:
 *           type: integer
 *           minimum: 1000
 *           maximum: 2030
 *           example: 1960
 *         pages:
 *           type: integer
 *           minimum: 1
 *           example: 376
 *         language:
 *           type: string
 *           example: "English"
 *         totalCopies:
 *           type: integer
 *           minimum: 1
 *           example: 3
 *         location:
 *           type: string
 *           example: "Section B, Shelf 2"
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Fiction"
 *         description:
 *           type: string
 *           example: "Fictional literature and novels"
 *         bookCount:
 *           type: integer
 *           example: 150
 *     PopularBook:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "The Great Gatsby"
 *         author:
 *           type: string
 *           example: "F. Scott Fitzgerald"
 *         borrowCount:
 *           type: integer
 *           example: 25
 *         rating:
 *           type: number
 *           format: float
 *           example: 4.5
 *         coverImage:
 *           type: string
 *           format: uri
 *           example: "https://example.com/covers/gatsby.jpg"
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
 *   name: Books
 *   description: Book management APIs for library catalog
 */

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books
 *     description: Retrieve a paginated list of all books with optional filtering
 *     tags: [Books]
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by book category
 *         example: "Fiction"
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filter by availability (true for available books only)
 *         example: true
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, author, publishedYear, createdAt, borrowCount]
 *           default: createdAt
 *         description: Sort books by field
 *         example: "title"
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
 *         description: List of books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 95
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
router.get('/', optionalAuth, getAllBooks);

/**
 * @swagger
 * /api/books/search:
 *   get:
 *     summary: Search books
 *     description: Search for books by title, author, or ISBN
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (title, author, or ISBN)
 *         example: "gatsby"
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by book category
 *         example: "Fiction"
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *         example: true
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 searchQuery:
 *                   type: string
 *                   example: "gatsby"
 *                 totalResults:
 *                   type: integer
 *                   example: 3
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
router.get('/search', optionalAuth, searchBooks);

/**
 * @swagger
 * /api/books/categories:
 *   get:
 *     summary: Get all book categories
 *     description: Retrieve a list of all book categories with book counts
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/categories', optionalAuth, getCategories);

/**
 * @swagger
 * /api/books/popular:
 *   get:
 *     summary: Get popular books
 *     description: Retrieve a list of popular books based on borrow count and ratings
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of popular books to return
 *         example: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by book category
 *         example: "Fiction"
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *           default: month
 *         description: Time frame for popularity calculation
 *         example: "month"
 *     responses:
 *       200:
 *         description: List of popular books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PopularBook'
 *                 timeframe:
 *                   type: string
 *                   example: "month"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/popular', optionalAuth, getPopularBooks);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get book by ID
 *     description: Retrieve a specific book by its ID with detailed information
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Book ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Book retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 book:
 *                   $ref: '#/components/schemas/Book'
 *                 relatedBooks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 2
 *                       title:
 *                         type: string
 *                         example: "The Catcher in the Rye"
 *                       author:
 *                         type: string
 *                         example: "J.D. Salinger"
 *                       coverImage:
 *                         type: string
 *                         format: uri
 *                         example: "https://example.com/covers/catcher.jpg"
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid book ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', optionalAuth, getBookById);

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create a new book
 *     description: Add a new book to the library catalog (Admin/Librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookInput'
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Book created successfully"
 *                 book:
 *                   $ref: '#/components/schemas/Book'
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
router.post('/', authenticateToken, requireAdminOrLibrarian, addBook);

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Update a book
 *     description: Update an existing book in the library catalog (Admin/Librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Book ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Book Title"
 *               author:
 *                 type: string
 *                 example: "Updated Author Name"
 *               description:
 *                 type: string
 *                 example: "Updated book description"
 *               isbn:
 *                 type: string
 *                 example: "978-0-12-345678-9"
 *               category:
 *                 type: string
 *                 example: "Updated Category"
 *               publisher:
 *                 type: string
 *                 example: "Updated Publisher"
 *               publishedYear:
 *                 type: integer
 *                 example: 2024
 *               pages:
 *                 type: integer
 *                 example: 250
 *               language:
 *                 type: string
 *                 example: "English"
 *               totalCopies:
 *                 type: integer
 *                 example: 5
 *               location:
 *                 type: string
 *                 example: "Section C, Shelf 3"
 *     responses:
 *       200:
 *         description: Book updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Book updated successfully"
 *                 book:
 *                   $ref: '#/components/schemas/Book'
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
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticateToken, requireAdminOrLibrarian, updateBook);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete a book
 *     description: Remove a book from the library catalog (Admin/Librarian only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Book ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Book deleted successfully"
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
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - book cannot be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, requireAdminOrLibrarian, deleteBook);

module.exports = router;