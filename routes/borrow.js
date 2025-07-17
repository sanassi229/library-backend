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

/**
 * @swagger
 * components:
 *   schemas:
 *     BorrowRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: integer
 *           example: 5
 *         bookId:
 *           type: integer
 *           example: 10
 *         borrowDate:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         dueDate:
 *           type: string
 *           format: date
 *           example: "2024-02-15"
 *         returnDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2024-02-10"
 *         status:
 *           type: string
 *           enum: [borrowed, returned, overdue, lost]
 *           example: "borrowed"
 *         renewCount:
 *           type: integer
 *           example: 1
 *         maxRenewals:
 *           type: integer
 *           example: 3
 *         fineAmount:
 *           type: number
 *           format: float
 *           example: 0.00
 *         notes:
 *           type: string
 *           example: "Book in good condition"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 5
 *             username:
 *               type: string
 *               example: "john_doe"
 *             fullName:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "john@example.com"
 *             cardNumber:
 *               type: string
 *               example: "LIB2024001"
 *         book:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 10
 *             title:
 *               type: string
 *               example: "The Great Gatsby"
 *             author:
 *               type: string
 *               example: "F. Scott Fitzgerald"
 *             isbn:
 *               type: string
 *               example: "978-0-7432-7356-5"
 *             coverImage:
 *               type: string
 *               format: uri
 *               example: "https://example.com/covers/gatsby.jpg"
 *     BorrowInput:
 *       type: object
 *       required:
 *         - userId
 *         - bookId
 *       properties:
 *         userId:
 *           type: integer
 *           example: 5
 *           description: "ID of the user borrowing the book"
 *         bookId:
 *           type: integer
 *           example: 10
 *           description: "ID of the book being borrowed"
 *         borrowDate:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *           description: "Date when the book is borrowed (defaults to today)"
 *         dueDate:
 *           type: string
 *           format: date
 *           example: "2024-02-15"
 *           description: "Due date for return (defaults to 30 days from borrow date)"
 *         notes:
 *           type: string
 *           maxLength: 500
 *           example: "Student ID verified"
 *           description: "Additional notes for the borrow record"
 *     BorrowStatusUpdate:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [borrowed, returned, overdue, lost]
 *           example: "returned"
 *         returnDate:
 *           type: string
 *           format: date
 *           example: "2024-02-10"
 *           description: "Required when status is 'returned'"
 *         fineAmount:
 *           type: number
 *           format: float
 *           minimum: 0
 *           example: 5.00
 *           description: "Fine amount for overdue or lost books"
 *         notes:
 *           type: string
 *           maxLength: 500
 *           example: "Book returned in good condition"
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
 *   name: Borrow
 *   description: Borrow record management APIs for library transactions
 */

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/borrow:
 *   get:
 *     summary: Get all borrow records
 *     description: Retrieve a paginated list of all borrow records (Admin/Librarian only)
 *     tags: [Borrow]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [borrowed, returned, overdue, lost]
 *         description: Filter by borrow status
 *         example: "borrowed"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *         example: 5
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: integer
 *         description: Filter by book ID
 *         example: 10
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *         description: Filter overdue records only
 *         example: true
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [borrowDate, dueDate, returnDate, createdAt]
 *           default: createdAt
 *         description: Sort records by field
 *         example: "dueDate"
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
 *         description: List of borrow records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 borrows:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BorrowRecord'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalItems:
 *                       type: integer
 *                       example: 47
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalBorrowed:
 *                       type: integer
 *                       example: 25
 *                     totalReturned:
 *                       type: integer
 *                       example: 15
 *                     totalOverdue:
 *                       type: integer
 *                       example: 7
 *                     totalLost:
 *                       type: integer
 *                       example: 0
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
router.get('/', requireAdminOrLibrarian, getAllBorrows);

/**
 * @swagger
 * /api/borrow/search:
 *   get:
 *     summary: Search borrow records
 *     description: Search for borrow records by user name, book title, or ISBN (Admin/Librarian only)
 *     tags: [Borrow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (user name, book title, or ISBN)
 *         example: "john"
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [borrowed, returned, overdue, lost]
 *         description: Filter by borrow status
 *         example: "borrowed"
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 borrows:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BorrowRecord'
 *                 searchQuery:
 *                   type: string
 *                   example: "john"
 *                 totalResults:
 *                   type: integer
 *                   example: 8
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
router.get('/search', requireAdminOrLibrarian, searchBorrows);

/**
 * @swagger
 * /api/borrow/{id}:
 *   get:
 *     summary: Get borrow record by ID
 *     description: Retrieve a specific borrow record by its ID (Admin/Librarian only)
 *     tags: [Borrow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Borrow record ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Borrow record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 borrow:
 *                   $ref: '#/components/schemas/BorrowRecord'
 *                 timeline:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                         enum: [borrowed, renewed, returned, overdue_notice]
 *                         example: "borrowed"
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                       notes:
 *                         type: string
 *                         example: "Book borrowed successfully"
 *                       performedBy:
 *                         type: string
 *                         example: "librarian_jane"
 *       404:
 *         description: Borrow record not found
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
router.get('/:id', requireAdminOrLibrarian, getBorrowById);

/**
 * @swagger
 * /api/borrow:
 *   post:
 *     summary: Create a new borrow record
 *     description: Create a new borrow record for a user and book (Admin/Librarian only)
 *     tags: [Borrow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BorrowInput'
 *     responses:
 *       201:
 *         description: Borrow record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Borrow record created successfully"
 *                 borrow:
 *                   $ref: '#/components/schemas/BorrowRecord'
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
 *         description: User or book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requireAdminOrLibrarian, createBorrow);

/**
 * @swagger
 * /api/borrow/{id}/status:
 *   patch:
 *     summary: Update borrow record status
 *     description: Update the status of a specific borrow record (Admin/Librarian only)
 *     tags: [Borrow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Borrow record ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BorrowStatusUpdate'
 *     responses:
 *       200:
 *         description: Borrow record status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Borrow record status updated successfully"
 *                 borrow:
 *                   $ref: '#/components/schemas/BorrowRecord'
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
 *         description: Borrow record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/status', requireAdminOrLibrarian, updateBorrowStatus);

/**
 * @swagger
 * /api/borrow/{id}:
 *   delete:
 *     summary: Delete a borrow record
 *     description: Delete a specific borrow record (Admin/Librarian only)
 *     tags: [Borrow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Borrow record ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Borrow record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Borrow record deleted successfully"
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
 *         description: Borrow record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - borrow record cannot be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', requireAdminOrLibrarian, deleteBorrow);

module.exports = router;