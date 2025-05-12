// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCHwFteCQ32331TdD_Euit74bcO_JMRS9U",
    authDomain: "cuentacuentos-b2e64.firebaseapp.com",
    projectId: "cuentacuentos-b2e64",
    storageBucket: "cuentacuentos-b2e64.firebasestorage.app",
    messagingSenderId: "8183103149",
    appId: "1:8183103149:web:7e57b742d64996bd78d024",
    measurementId: "G-0B04JP0PPF"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage }; 