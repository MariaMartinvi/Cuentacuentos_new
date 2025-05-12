/**
 * Script to upload example stories to Firebase
 * 
 * To use this script:
 * 1. Create a Firebase project and enable Firestore and Storage
 * 2. Create a service account key in Firebase console (Project settings > Service accounts > Generate new private key)
 * 3. Save the key as serviceAccountKey.json in the scripts directory
 * 4. Prepare your story text and audio files in the storyFiles directory
 * 5. Run this script with: node scripts/uploadExampleStories.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'cuentacuentos-b2e64.firebasestorage.app' // Updated to match config.js
  });
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  console.log('Make sure you have a valid serviceAccountKey.json file in the scripts directory');
  process.exit(1);
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Example stories data
const exampleStories = [
  {
    id: 'dragon-no-volar',
    title: 'El dragón que no podía volar',
    age: '3to5',
    language: 'spanish',
    level: 'beginner',
    textPath: 'stories/dragon-no-volar.txt',
    audioPath: 'audio/dragon-no-volar.mp3'
  },
  {
    id: 'princesa-valiente',
    title: 'La princesa valiente',
    age: '6to8',
    language: 'spanish',
    level: 'intermediate',
    textPath: 'stories/princesa-valiente.txt',
    audioPath: 'audio/princesa-valiente.mp3'
  },
  {
    id: 'magic-forest',
    title: 'The Magic Forest',
    age: '6to8',
    language: 'english',
    level: 'beginner',
    textPath: 'stories/magic-forest.txt',
    audioPath: 'audio/magic-forest.mp3'
  },
  {
    id: 'tesoro-perdido',
    title: 'El misterio del tesoro perdido',
    age: '9to12',
    language: 'spanish',
    level: 'advanced',
    textPath: 'stories/tesoro-perdido.txt',
    audioPath: 'audio/tesoro-perdido.mp3'
  },
  {
    id: 'space-adventure',
    title: 'The Space Adventure',
    age: '9to12',
    language: 'english',
    level: 'intermediate',
    textPath: 'stories/space-adventure.txt',
    audioPath: 'audio/space-adventure.mp3'
  }
];

// Directory where story files are stored
const storyFilesDir = path.join(__dirname, 'storyFiles');

// Upload a file to Firebase Storage
async function uploadFile(localFilePath, storagePath) {
  try {
    await bucket.upload(localFilePath, {
      destination: storagePath,
      metadata: {
        contentType: storagePath.endsWith('.mp3') ? 'audio/mpeg' : 'text/plain'
      }
    });
    console.log(`Uploaded ${localFilePath} to ${storagePath}`);
    return true;
  } catch (error) {
    console.error(`Error uploading ${localFilePath}:`, error);
    return false;
  }
}

// Upload story data to Firestore
async function uploadStoryData(story) {
  try {
    await db.collection('storyExamples').doc(story.id).set(story);
    console.log(`Added story data for: ${story.title}`);
    return true;
  } catch (error) {
    console.error(`Error adding story data for ${story.title}:`, error);
    return false;
  }
}

// Main upload function
async function uploadExampleStories() {
  console.log('Starting upload of example stories...');
  
  // Create storyFiles directory if it doesn't exist
  if (!fs.existsSync(storyFilesDir)) {
    fs.mkdirSync(storyFilesDir);
    fs.mkdirSync(path.join(storyFilesDir, 'stories'));
    fs.mkdirSync(path.join(storyFilesDir, 'audio'));
    console.log(`Created storyFiles directory at ${storyFilesDir}`);
    console.log('Please add your story text and audio files to this directory and run the script again.');
    return;
  }
  
  for (const story of exampleStories) {
    console.log(`Processing story: ${story.title}`);
    
    // Check if text file exists
    const textFilePath = path.join(storyFilesDir, story.textPath);
    if (!fs.existsSync(textFilePath)) {
      console.log(`Text file not found: ${textFilePath}`);
      console.log('Skipping this story...');
      continue;
    }
    
    // Check if audio file exists
    const audioFilePath = path.join(storyFilesDir, story.audioPath);
    if (!fs.existsSync(audioFilePath)) {
      console.log(`Audio file not found: ${audioFilePath}`);
      console.log('Skipping this story...');
      continue;
    }
    
    // Upload text file
    const textUploaded = await uploadFile(textFilePath, story.textPath);
    
    // Upload audio file
    const audioUploaded = await uploadFile(audioFilePath, story.audioPath);
    
    // Upload story data to Firestore if both files were uploaded successfully
    if (textUploaded && audioUploaded) {
      await uploadStoryData(story);
    }
  }
  
  console.log('Upload process completed!');
}

// Run the upload function
uploadExampleStories().catch(error => {
  console.error('Error in upload process:', error);
  process.exit(1);
}); 