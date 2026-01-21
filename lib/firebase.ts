import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Remplacez ces valeurs par celles de votre console Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBGIJ68MpEu70-H-xYlUPI7OHftKeWIVb0",
  authDomain: "galepedia-70d3f.firebaseapp.com",
  projectId: "galepedia-70d3f",
  storageBucket: "galepedia-70d3f.firebasestorage.app",
  messagingSenderId: "454884686002",
  appId: "1:454884686002:web:d5002b86096e37d8d331ab"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with Offline Persistence (IndexedDB)
// This enables the app to work offline and syncs automatically when online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);