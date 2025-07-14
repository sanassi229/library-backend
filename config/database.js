const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.log('💡 Please add DATABASE_URL to your .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, 
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 2000, 
});

const connectDatabase = async () => {
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    console.log(`📍 Host: ${new URL(process.env.DATABASE_URL).hostname}`);
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    client.release();
    
    console.log('✅ Database connected successfully!');
    console.log(`📅 Server time: ${result.rows[0].now}`);
    console.log(`🗃️  PostgreSQL version: ${result.rows[0].version.split(',')[0]}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Check your DATABASE_URL in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Database server is not accepting connections');
    }
    
    return false;
  }
};

const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`🔍 Query executed in ${duration}ms`);
    return res;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    console.error('📝 Query:', text);
    console.error('📋 Params:', params);
    throw error;
  }
};

const testConnection = async () => {
  try {
    console.log('🧪 Testing database connection...');
    
    const result = await query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    console.log(`📊 Found ${result.rows[0].table_count} tables in database`);
    
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('account_user', 'thethuvien', 'docgia', 'thuthu')
      ORDER BY table_name
    `);
    
    console.log('📋 Library tables found:');
    tables.rows.forEach(row => console.log(`   ✅ ${row.table_name}`));
    
    const userCount = await query('SELECT COUNT(*) as count FROM account_user');
    console.log(`👥 Total users: ${userCount.rows[0].count}`);
    
    console.log('✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
};

process.on('SIGINT', () => {
  console.log('🔄 Closing database pool...');
  pool.end(() => {
    console.log('✅ Database pool closed');
    process.exit(0);
  });
});

module.exports = {
  pool,
  query,
  connectDatabase,
  testConnection
};