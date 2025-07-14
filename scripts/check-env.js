require('dotenv').config();

const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT'
];

console.log('🔍 Checking environment variables...\n');

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('PASSWORD') || varName.includes('SECRET') || varName.includes('URL') 
      ? value.substring(0, 20) + '...' 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: Missing!`);
    allGood = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('✅ All environment variables are set!');
} else {
  console.log('❌ Some environment variables are missing!');
  console.log('💡 Please check your .env file');
}