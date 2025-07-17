const express = require('express');
const { registerAccount, registerCardOnly, login, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         username:
 *           type: string
 *           example: "john_doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           example: "+84123456789"
 *         role:
 *           type: string
 *           enum: [admin, librarian, user]
 *           example: "user"
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           example: "active"
 *         cardNumber:
 *           type: string
 *           example: "LIB2024001"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Login successful"
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           $ref: '#/components/schemas/User'
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
 *   name: Auth
 *   description: Authentication and authorization APIs
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: Create a new user account with full registration details
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: "john_doe"
 *                 description: "Unique username for the account"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *                 description: "Password for the account"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *                 description: "Email address for the account"
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *                 description: "Full name of the user"
 *               phone:
 *                 type: string
 *                 example: "+84123456789"
 *                 description: "Phone number of the user"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', registerAccount);

/**
 * @swagger
 * /api/auth/register-card-only:
 *   post:
 *     summary: Register a library card only (without full account)
 *     description: Create a library card registration without creating a full user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phone
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Jane Smith"
 *                 description: "Full name for the library card"
 *               phone:
 *                 type: string
 *                 example: "+84987654321"
 *                 description: "Phone number for the library card"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane@example.com"
 *                 description: "Optional email address"
 *               address:
 *                 type: string
 *                 example: "123 Main St, City"
 *                 description: "Optional address"
 *     responses:
 *       201:
 *         description: Library card registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Library card registered successfully"
 *                 cardNumber:
 *                   type: string
 *                   example: "LIB2024001"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register-card-only', registerCardOnly);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and get a JWT token
 *     description: Authenticate user and return JWT token for subsequent requests
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *                 description: "Username or email"
 *               password:
 *                 type: string
 *                 example: "password123"
 *                 description: "User password"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - missing credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the profile information of the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 borrowHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       bookTitle:
 *                         type: string
 *                         example: "The Great Gatsby"
 *                       borrowDate:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-15"
 *                       status:
 *                         type: string
 *                         enum: [borrowed, returned, overdue]
 *                         example: "returned"
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalBorrowed:
 *                       type: integer
 *                       example: 15
 *                     currentlyBorrowed:
 *                       type: integer
 *                       example: 3
 *                     overdueBooks:
 *                       type: integer
 *                       example: 0
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;