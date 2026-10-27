import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4nFnR_GGWkjyv9RqXOEm0DcS5RWGaSZs",
  authDomain: "motorshop-33714.firebaseapp.com",
  projectId: "motorshop-33714",
  storageBucket: "motorshop-33714.firebasestorage.app",
  messagingSenderId: "577829652802",
  appId: "1:577829652802:web:d7da29f08ec9dd1996a0db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
