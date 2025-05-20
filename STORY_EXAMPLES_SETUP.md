# Personalized Story Examples Setup Guide

This guide will help you set up the "Ejemplos de cuentos" (Personalized Story Examples) feature using Firebase for storing and retrieving story texts and audio files.

## 1. Firebase Setup

### Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the steps to create a new project
3. Once your project is created, click "Continue"

### Enable Firestore Database

1. In the Firebase console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" and click "Next"
4. Select a location that is closest to your users and click "Enable"

### Enable Storage

1. In the Firebase console, go to "Storage"
2. Click "Get started"
3. Read through the security rules information and click "Next"
4. Select a location that is closest to your users and click "Done"

### Create a Web App

1. In the Firebase console, click the gear icon next to "Project Overview" and select "Project settings"
2. Scroll down to "Your apps" and click the web icon (</>) to add a web app
3. Give your app a name (e.g., "MiCuentaCuentos Web") and click "Register app"
4. Copy the Firebase configuration object (it looks like `const firebaseConfig = { ... }`)

### Update Firebase Configuration

1. Open the file `src/firebase/config.js` in your project
2. Replace the placeholder values with your Firebase configuration values

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## 2. Create Service Account for Admin Access

To upload stories to Firebase, you'll need a service account:

1. In the Firebase console, go to "Project settings" > "Service accounts"
2. Click "Generate new private key"
3. Save the downloaded JSON file as `serviceAccountKey.json` in the `scripts` directory

## 3. Prepare Story Files

1. Create a directory structure for your story files:

```
Cuentos_Front_Clean/scripts/storyFiles/
├── stories/
│   ├── dragon-no-volar.txt
│   ├── princesa-valiente.txt
│   ├── magic-forest.txt
│   ├── tesoro-perdido.txt
│   └── space-adventure.txt
└── audio/
    ├── dragon-no-volar.mp3
    ├── princesa-valiente.mp3
    ├── magic-forest.mp3
    ├── tesoro-perdido.mp3
    └── space-adventure.mp3
```

2. Add your story text files to the `stories` directory
3. Add your audio files to the `audio` directory

## 4. Install Firebase Admin SDK

```bash
cd Cuentos_Front_Clean
npm install firebase-admin --save-dev
```

## 5. Upload Stories to Firebase

Run the upload script to upload your stories to Firebase:

```bash
node scripts/uploadExampleStories.js
```

This script will:
- Create the necessary directory structure if it doesn't exist
- Upload the text and audio files to Firebase Storage
- Create documents in the Firestore database with metadata about each story

## 6. Verify Setup

1. Open your application in the browser
2. Navigate to the "Ejemplos de cuentos" page
3. Verify that the stories are displayed correctly
4. Test the filtering functionality
5. Click on the "Read story" and "Listen to audio" links to ensure they work properly

## 7. Customizing the Personalized Story Examples

To add or modify the example stories:

1. Add new story text and audio files to the `storyFiles` directory
2. Edit the `exampleStories` array in `scripts/uploadExampleStories.js` to include your new stories
3. Run the upload script again to upload the new stories

## Troubleshooting

### Stories Not Displaying

- Check the browser console for errors
- Verify that your Firebase configuration is correct
- Make sure the Firestore database and Storage are properly set up
- Check that the story documents exist in the Firestore database
- Verify that the text and audio files were uploaded to Firebase Storage

### Access Denied Errors

- Check your Firebase security rules for Firestore and Storage
- Make sure they allow read access to the story examples

### Upload Script Errors

- Verify that the `serviceAccountKey.json` file is in the correct location
- Make sure the Firebase Admin SDK is properly installed
- Check that the story files exist in the correct directories 