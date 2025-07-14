const { testConnection } = require('../config/database');

console.log('🧪 Starting database test...\n');

testConnection()
  .then(() => {
    console.log('\n✅ Database test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database test failed:', error);
    process.exit(1);
  });