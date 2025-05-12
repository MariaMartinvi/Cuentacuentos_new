# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# MiCuentaCuentos - Story Examples Setup

## Fixing Firebase Permission Errors

If you're seeing errors like:
```
Error fetching story examples: FirebaseError: Missing or insufficient permissions.
Error loading stories: FirebaseError: Missing or insufficient permissions.
```

This is because the Firebase security rules need to be updated to allow public read access to the story examples.

### Step 1: Update Firebase Security Rules

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: "cuentacuentos-b2e64"
3. For Firestore Rules:
   - Go to Firestore Database
   - Click on the "Rules" tab
   - Replace the existing rules with:
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
   - Click "Publish"
   
4. For Storage Rules:
   - Go to Storage
   - Click on the "Rules" tab
   - Replace the existing rules with:
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
   - Click "Publish"

### Step 2: Create Example Story Data

To add example stories to your Firebase project, follow these steps:

1. Go to the Firebase Console
2. Navigate to Firestore Database
3. Create a collection called `storyExamples`
4. Add a document with the following fields:
   - id: "dragon-no-volar"
   - title: "El dragón que no podía volar"
   - age: "3to5"
   - language: "spanish"
   - level: "beginner"
   - textPath: "stories/dragon-no-volar.txt"
   - audioPath: "audio/dragon-no-volar.mp3"

5. Navigate to Storage
6. Create a folder called `stories`
7. Upload a text file named `dragon-no-volar.txt` with a sample story
8. Create a folder called `audio`
9. Upload an MP3 file named `dragon-no-volar.mp3` (you can use any small MP3 file for testing)

After completing these steps, reload your application and the story examples should load correctly.

## Running the Application

To run the application in development mode:

```
npm start
```

To build the application for production:

```
npm run build
```

## Additional Information

For more detailed setup instructions, see the `STORY_EXAMPLES_SETUP.md` file in the project root.
