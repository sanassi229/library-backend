require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/banners', require('./routes/banner'));
app.use('/api/users', require('./routes/users'));
app.use('/api/collections', require('./routes/collections'));
app.use('/api/borrow', require('./routes/borrow'));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'Library Management API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'PostgreSQL (Supabase)',
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '📚 Library Management System API',
    version: '1.0.0',
    database: 'PostgreSQL (Supabase)',
    endpoints: {
      '/health': 'System health check',
      '/api/auth/*': 'Authentication endpoints',
      '/api/books/*': 'Book management endpoints',
      '/api/banners/*': 'Banner management endpoints',
      '/api/users/*': 'User management endpoints',
      '/api/collections/*': 'Collection management endpoints',
      '/api/borrow/*': 'Borrow management endpoints'
    },
    authEndpoints: {
      'POST /api/auth/register': 'Register basic account',
      'POST /api/auth/register-card-only': 'Register library card',
      'POST /api/auth/login': 'User login',
      'GET /api/auth/me': 'Get current user info'
    },
    bookEndpoints: {
      'GET /api/books': 'Get all books',
      'GET /api/books/search': 'Search books',
      'GET /api/books/categories': 'Get categories',
      'GET /api/books/popular': 'Get popular books',
      'POST /api/books': 'Add book (admin/librarian)',
      'PUT /api/books/:id': 'Update book (admin/librarian)',
      'DELETE /api/books/:id': 'Delete book (admin/librarian)'
    },
    bannerEndpoints: {
      'GET /api/banners': 'Get all active banners',
      'GET /api/banners/:id': 'Get banner by ID',
      'POST /api/banners': 'Add banner (admin/librarian)',
      'PUT /api/banners/:id': 'Update banner (admin/librarian)',

      'PATCH /api/banners/:id/status': 'Update banner status (admin/librarian)',
      'DELETE /api/banners/:id': 'Delete banner (admin)'
    }
  });
});

const swaggerSetup = require('./swagger');
swaggerSetup(app);

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/auth/register',
      'POST /api/auth/register-card-only',
      'POST /api/auth/login',
      'GET /api/books',
      'GET /api/books/search',
      'GET /api/banners',
      'GET /api/collections',
      'GET /api/users (admin)',
      'GET /api/borrow (admin/librarian)'
    ]
  });
});

app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const startServer = async () => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Starting Library Management System API...');
    console.log('='.repeat(60));

    const dbConnected = await connectDatabase();
    
    if (!dbConnected) {
      console.error('❌ Cannot start server - database connection failed');
      process.exit(1);
    }

    const server = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Server is running successfully!');
      console.log(`📍 Local URL: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗃️  Database: PostgreSQL (Supabase)`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log('\n📋 Available API endpoints:');
      console.log(`   GET  http://localhost:${PORT}/`);
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log('\n🔐 Authentication APIs:');
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/auth/register-card-only`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
      console.log('\n📚 Book APIs:');
      console.log(`   GET  http://localhost:${PORT}/api/books`);
      console.log(`   GET  http://localhost:${PORT}/api/books/search`);
      console.log(`   GET  http://localhost:${PORT}/api/books/categories`);
      console.log(`   POST http://localhost:${PORT}/api/books (admin/librarian)`);
      console.log('\n🎨 Banner APIs:');
      console.log(`   GET  http://localhost:${PORT}/api/banners`);
      console.log(`   POST http://localhost:${PORT}/api/banners (admin/librarian)`);
      console.log(`   PUT  http://localhost:${PORT}/api/banners/:id (admin/librarian)`);
      console.log(`   DELETE http://localhost:${PORT}/api/banners/:id (admin)`);
      console.log('\n👥 User APIs:');
      console.log(`   GET  http://localhost:${PORT}/api/users (admin)`);
      console.log(`   GET  http://localhost:${PORT}/api/users/search (admin)`);
      console.log('\n📁 Collection APIs:');
      console.log(`   GET  http://localhost:${PORT}/api/collections`);
      console.log(`   POST http://localhost:${PORT}/api/collections (admin/librarian)`);
      console.log('\n📋 Borrow APIs:');
      console.log(`   GET  http://localhost:${PORT}/api/borrow (admin/librarian)`);
      console.log(`   POST http://localhost:${PORT}/api/borrow (admin/librarian)`);
      console.log('='.repeat(60));
    });

    process.on('SIGTERM', () => {
      console.log('\n🔄 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🔄 SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();