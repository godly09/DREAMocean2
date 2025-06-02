import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with your actual API key
  authDomain: "corn-1780c.firebaseapp.com",
  projectId: "corn-1780c",
  storageBucket: "corn-1780c.firebasestorage.app",
  messagingSenderId: "820822405889",
  appId: "1:820822405889:web:b68afa326dd6ab7e5fa100",
  measurementId: "G-63Y1PNM1JG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
