# Firebase Security Rules

## Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to story examples
    match /storyExamples/{document=**} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // For other collections, require authentication
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to stories and audio files
    match /stories/{fileName} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    match /audio/{fileName} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // For other files, require authentication
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## How to Apply These Rules

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: "cuentacuentos-b2e64"
3. For Firestore Rules:
   - Go to Firestore Database
   - Click on the "Rules" tab
   - Replace the existing rules with the Firestore rules above
   - Click "Publish"
   
4. For Storage Rules:
   - Go to Storage
   - Click on the "Rules" tab
   - Replace the existing rules with the Storage rules above
   - Click "Publish"

These rules allow anyone to read story examples from Firestore and story files from Storage, but only authenticated users can write data. This is a common pattern for applications that have public content but restricted content creation. 