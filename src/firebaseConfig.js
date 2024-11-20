// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDeiJOFW5jvO6kIZHIggS1U3yHMHQxXE1o",
  authDomain: "timesheet-cc5a9.firebaseapp.com",
  projectId: "timesheet-cc5a9",
  storageBucket: "timesheet-cc5a9.firebasestorage.app",
  messagingSenderId: "806284065916",
  appId: "1:806284065916:web:e130b3f14f2557b1d75df9",
  measurementId: "G-GRP6XK7RS6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };