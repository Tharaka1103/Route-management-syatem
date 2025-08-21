const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', '.env.local');
const requiredVars = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
];

console.log('🔍 Checking environment configuration...\n');

if (!fs.existsSync(envFile)) {
  console.log('❌ .env.local file not found!');
  console.log('📝 Please copy .env.example to .env.local and configure it.\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envFile, 'utf8');
const missingVars = [];

requiredVars.forEach(varName => {
  const regex = new RegExp(`^${varName}=(.+)$`, 'm');
  const match = envContent.match(regex);
  
  if (!match || match[1].includes('your-') || match[1].includes('replace-')) {
    missingVars.push(varName);
  } else {
    console.log(`✅ ${varName}: configured`);
  }
});

if (missingVars.length > 0) {
  console.log('\n❌ Missing or incomplete environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  console.log('\n📋 Configuration guide:');
  console.log('1. MONGODB_URI: Your MongoDB connection string');
  console.log('2. NEXTAUTH_SECRET: Random string for JWT signing');
  console.log('3. NEXTAUTH_URL: http://localhost:3000 (for development)');
  console.log('4. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Your Google Maps API key');
  console.log('\n🔗 Get Google Maps API key: https://developers.google.com/maps/documentation/javascript/get-api-key');
  
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are configured!');
  console.log('🚀 You can now run: npm run dev');
}
