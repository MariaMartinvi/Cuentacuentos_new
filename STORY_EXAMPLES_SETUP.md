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
3. Give your app a name (e.g., "AudioGretel Web") and click "Register app"
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

1. Check the browser console for any errors
2. Verify that the Firebase configuration in `src/config/firebase.js` matches your Firebase project settings
3. Ensure that the stories collection exists in Firestore and contains documents with the correct structure
4. Check that the storage rules allow reading the audio files

### Access Denied Errors

1. Verify that your Firebase project's authentication is properly set up
2. Check that the storage rules allow access to the audio files
3. Ensure that the Firebase configuration is correct in your app
4. If using Firebase Admin SDK, verify that the service account key is valid

### Audio Files Not Playing

1. Check that the audio files are properly uploaded to Firebase Storage
2. Verify that the storage rules allow reading the audio files
3. Ensure that the audio file URLs in Firestore are correct
4. Check that the audio files are in a supported format (MP3)

### Firebase Configuration Issues

1. Verify that your Firebase project is properly set up
2. Check that the Firebase configuration in `src/config/firebase.js` matches your project settings
3. Ensure that the Firebase Admin SDK is properly initialized
4. Check that the service account key is valid and has the necessary permissions

### Storage Rules

Make sure your Firebase Storage rules allow reading the audio files. Here's an example of storage rules that allow public read access to audio files:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /stories/{storyId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Firestore Rules

Make sure your Firestore rules allow reading the stories collection. Here's an example of Firestore rules that allow public read access to stories:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stories/{storyId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Common Issues

1. **CORS Issues**: If you're getting CORS errors, make sure your Firebase Storage rules allow access from your domain
2. **Authentication Issues**: If you're using Firebase Authentication, make sure it's properly set up and the user is authenticated
3. **Storage Rules**: Make sure your storage rules allow reading the audio files
4. **Firestore Rules**: Make sure your Firestore rules allow reading the stories collection
5. **Service Account Key**: If using Firebase Admin SDK, make sure the service account key is valid and has the necessary permissions

### Support

If you're still having issues, you can:

1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Visit the [Firebase Support](https://firebase.google.com/support) page
3. Post a question on [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
4. Contact the AudioGretel support team at support@audiogretel.com 