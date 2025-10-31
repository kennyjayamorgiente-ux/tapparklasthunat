const fs = require('fs');
const path = require('path');

console.log('🧹 Resetting Metro cache...');

// Remove .expo directory
const expoDir = path.join(__dirname, '.expo');
if (fs.existsSync(expoDir)) {
  fs.rmSync(expoDir, { recursive: true, force: true });
  console.log('✅ Removed .expo directory');
}

// Remove node_modules/.cache
const cacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('✅ Removed node_modules/.cache');
}

// Remove any InternalBytecode.js files
const internalBytecodeFile = path.join(__dirname, 'InternalBytecode.js');
if (fs.existsSync(internalBytecodeFile)) {
  fs.unlinkSync(internalBytecodeFile);
  console.log('✅ Removed InternalBytecode.js');
}

console.log('🎉 Metro cache reset complete!');
console.log('Now run: npx expo start --clear');

