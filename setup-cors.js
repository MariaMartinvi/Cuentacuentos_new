/**
 * Script to help set up CORS configuration for Firebase Storage
 * 
 * Usage:
 * 1. Make sure you have installed the Firebase CLI: npm install -g firebase-tools
 * 2. Run: node setup-cors.js
 */

const fs = require('fs');
const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Create the CORS configuration file
const createCorsFile = () => {
  const corsConfig = [
    {
      "origin": ["*"],
      "method": ["GET", "HEAD", "OPTIONS"],
      "maxAgeSeconds": 3600,
      "responseHeader": ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"]
    }
  ];

  fs.writeFileSync('cors.json', JSON.stringify(corsConfig, null, 2));
  console.log('✅ Created cors.json file');
};

// Apply CORS configuration to Firebase Storage
const applyCorsConfig = (projectId) => {
  const bucketName = `gs://${projectId}.appspot.com`;
  const command = `gsutil cors set cors.json ${bucketName}`;
  
  console.log(`📝 Running: ${command}`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error applying CORS configuration:', error);
      console.error('Make sure you have installed gsutil and are logged in with Firebase CLI');
      console.log('Try running: firebase login');
      return;
    }
    
    console.log('✅ CORS configuration applied successfully!');
    console.log('You can now access files from Firebase Storage without CORS errors.');
    
    // Clean up
    fs.unlinkSync('cors.json');
    console.log('✅ Removed temporary cors.json file');
    
    rl.close();
  });
};

// Main function
const main = () => {
  console.log('🔥 Firebase Storage CORS Configuration Setup 🔥');
  console.log('This script will help you set up CORS for your Firebase Storage bucket.');
  
  rl.question('Enter your Firebase project ID (e.g., "cuentacuentos-b2e64"): ', (projectId) => {
    if (!projectId) {
      console.error('❌ Project ID is required');
      rl.close();
      return;
    }
    
    createCorsFile();
    applyCorsConfig(projectId);
  });
};

// Run the script
main(); 