// Comprehensive fix for all TapPark app issues
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing all TapPark app issues...\n');

// 1. Fix Metro bundler cache issues
console.log('1. Clearing Metro bundler cache...');
const cachePaths = [
  path.join(__dirname, 'node_modules', '.cache'),
  path.join(__dirname, '.expo'),
  path.join(__dirname, 'metro.config.js.cache'),
];

cachePaths.forEach(cachePath => {
  if (fs.existsSync(cachePath)) {
    try {
      fs.rmSync(cachePath, { recursive: true, force: true });
      console.log(`   ✅ Removed cache: ${path.basename(cachePath)}`);
    } catch (error) {
      console.log(`   ⚠️ Could not remove cache: ${path.basename(cachePath)}`);
    }
  }
});

// 2. Clear npm cache
console.log('\n2. Clearing npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'pipe' });
  console.log('   ✅ Cleared npm cache');
} catch (error) {
  console.log('   ⚠️ Could not clear npm cache');
}

// 3. Fix API configuration for localhost
console.log('\n3. Updating API configuration...');
const apiConfigPath = path.join(__dirname, 'config', 'api.ts');
if (fs.existsSync(apiConfigPath)) {
  try {
    let apiConfig = fs.readFileSync(apiConfigPath, 'utf8');
    // Change to localhost for easier testing
    apiConfig = apiConfig.replace(
      "ENVIRONMENT: 'network' as 'localhost' | 'network'",
      "ENVIRONMENT: 'localhost' as 'localhost' | 'network'"
    );
    fs.writeFileSync(apiConfigPath, apiConfig);
    console.log('   ✅ Updated API config to use localhost');
  } catch (error) {
    console.log('   ⚠️ Could not update API config');
  }
}

// 4. Create a simple test user script
console.log('\n4. Creating test user script...');
const testUserScript = `
// Test user credentials for TapPark
const testUsers = [
  {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  },
  {
    email: 'admin@tappark.com',
    password: 'admin123',
    name: 'Admin User'
  }
];

console.log('Test users for TapPark:');
testUsers.forEach(user => {
  console.log(\`Email: \${user.email}\`);
  console.log(\`Password: \${user.password}\`);
  console.log(\`Name: \${user.name}\`);
  console.log('---');
});
`;

fs.writeFileSync(path.join(__dirname, 'test-users.js'), testUserScript);
console.log('   ✅ Created test user script');

console.log('\n🎉 All fixes applied!');
console.log('\n📋 Next steps:');
console.log('1. Make sure your backend server is running:');
console.log('   cd tapparkuser-backend && npm start');
console.log('');
console.log('2. Start your frontend server:');
console.log('   npx expo start --clear --port 8082');
console.log('');
console.log('3. Test with these credentials:');
console.log('   Email: test@example.com');
console.log('   Password: password123');
console.log('');
console.log('4. If you still have issues, try:');
console.log('   - Restart your computer');
console.log('   - Check if MySQL is running');
console.log('   - Verify your backend database has users');

