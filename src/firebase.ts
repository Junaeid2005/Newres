import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAquJRYiq01r8G8As_W9zSj91fsrVXzPZ0",
  authDomain: "savory-9163f.firebaseapp.com",
  projectId: "savory-9163f",
  storageBucket: "savory-9163f.firebasestorage.app",
  messagingSenderId: "794095121954",
  appId: "1:794095121954:web:20f6860754d5f6ce607c7b",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
