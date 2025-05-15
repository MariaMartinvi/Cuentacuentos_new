/**
 * Simple CORS test script for Firebase Storage
 * 
 * Usage:
 * node cors-test.js
 */

const { initializeApp } = require('firebase/app');
const { getStorage, ref, getDownloadURL } = require('firebase/storage');
// Import fetch correctly for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// Import dotenv to load environment variables
require('dotenv').config();

// Verificar que las variables de entorno estén definidas
const requiredVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env file and ensure all required variables are defined.');
  process.exit(1);
}

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Files to test
const filesToTest = [
  'audio/dragon-no-volar.mp3',
  'audio/dragon-share.mp3'
];

// Test direct URL access
async function testDirectAccess(url) {
  console.log(`Testing direct access to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000',
        'Accept': 'audio/*, */*'
      }
    });
    
    if (response.ok) {
      console.log('✓ Direct access successful');
      console.log(`  Status: ${response.status}`);
      console.log(`  Content-Type: ${response.headers.get('content-type')}`);
      console.log(`  Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
      
      // Check if CORS headers are present
      if (response.headers.get('access-control-allow-origin')) {
        console.log('✓ CORS headers present');
      } else {
        console.log('✗ CORS headers missing');
      }
      
      return true;
    } else {
      console.log(`✗ Direct access failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error accessing URL: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== FIREBASE STORAGE CORS TEST ===');
  
  let allPassed = true;
  
  for (const file of filesToTest) {
    console.log(`\nTesting file: ${file}`);
    
    try {
      // Get download URL
      const fileRef = ref(storage, file);
      const downloadURL = await getDownloadURL(fileRef);
      console.log(`✓ Got download URL: ${downloadURL}`);
      
      // Test direct access
      const accessResult = await testDirectAccess(downloadURL);
      if (!accessResult) {
        allPassed = false;
      }
      
    } catch (error) {
      console.error(`✗ Error getting download URL: ${error.message}`);
      allPassed = false;
    }
  }
  
  console.log('\n=== TEST SUMMARY ===');
  if (allPassed) {
    console.log('✓ All tests passed! CORS appears to be configured correctly.');
  } else {
    console.log('✗ Some tests failed. CORS may not be configured correctly.');
    console.log('  Run the cors-fix.js script to apply CORS configuration.');
  }
}

// Run the tests
main().catch(error => {
  console.error('Error running tests:', error);
}); 