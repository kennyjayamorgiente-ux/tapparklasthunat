const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle the InternalBytecode.js issue
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure transformer to handle source maps properly
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Add resolver configuration to ignore problematic files
config.resolver.blacklistRE = /InternalBytecode\.js$/;

// Prevent creation of InternalBytecode.js
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'js');
config.resolver.sourceExts.push('js');

module.exports = config;

