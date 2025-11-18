// Debug script to test backend connection
const fetch = require('node-fetch');

const API_BASE_URL = 'http://192.168.1.22:3000/api';

async function testConnection() {
  console.log('🔍 Testing backend connection...');
  console.log('📍 API URL:', API_BASE_URL);
  
  try {
    // Test basic connection
    const response = await fetch(`http://192.168.1.22:3000/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('✅ Backend server is running and accessible');
      const data = await response.json();
      console.log('📊 Response:', data);
    } else {
      console.log('❌ Backend server responded with error:', response.status);
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend server');
    console.log('🔧 Error details:', error.message);
    console.log('');
    console.log('🚀 Solutions:');
    console.log('1. Make sure your backend server is running:');
    console.log('   cd tapparkuser-backend && npm start');
    console.log('');
    console.log('2. Check if the IP address is correct:');
    console.log('   - Run "ipconfig" in Command Prompt');
    console.log('   - Look for your computer\'s IP address');
    console.log('   - Update config/api.ts with the correct IP');
    console.log('');
    console.log('3. Try using localhost instead:');
    console.log('   - Change ENVIRONMENT to "localhost" in config/api.ts');
    console.log('   - This works if testing on emulator');
  }
}

testConnection();

