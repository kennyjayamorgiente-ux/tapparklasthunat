// Fix Metro bundler issues
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Metro bundler issues...');

// Remove problematic cache files
const cachePaths = [
  path.join(__dirname, 'node_modules', '.cache'),
  path.join(__dirname, '.expo'),
  path.join(__dirname, 'metro.config.js.cache'),
];

cachePaths.forEach(cachePath => {
  if (fs.existsSync(cachePath)) {
    try {
      fs.rmSync(cachePath, { recursive: true, force: true });
      console.log(`✅ Removed cache: ${cachePath}`);
    } catch (error) {
      console.log(`⚠️ Could not remove cache: ${cachePath}`);
    }
  }
});

// Clear npm cache
const { execSync } = require('child_process');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ Cleared npm cache');
} catch (error) {
  console.log('⚠️ Could not clear npm cache');
}

console.log('');
console.log('🚀 Next steps:');
console.log('1. Stop the current Expo server (Ctrl+C)');
console.log('2. Run: npx expo start --clear');
console.log('3. If issues persist, try: npx expo install --fix');

