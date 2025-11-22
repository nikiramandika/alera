import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - replace with your actual config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBPqTqejOou8m2EG1skbkvENDcB7AhU8rg",
  authDomain: "alera-b60ac.firebaseapp.com",
  projectId: "alera-b60ac",
  storageBucket: "alera-b60ac.firebasestorage.app",
  messagingSenderId: "411616898655",
  appId: "1:411616898655:web:0307e9c127f1916d4ff5ea",
  measurementId: "G-MBPBSEQXHQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;