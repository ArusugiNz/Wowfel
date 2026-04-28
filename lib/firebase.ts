import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth";

export const googleProvider = new GoogleAuthProvider();

const firebaseConfig = {
  apiKey: "AIzaSyC4dAUrTVnT1dPpe2yAkpgDGVReRo5NvGg",
  authDomain: "wowfel-backend.firebaseapp.com",
  databaseURL: "https://wowfel-backend-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wowfel-backend",
  storageBucket: "wowfel-backend.firebasestorage.app",
  messagingSenderId: "152026373732",
  appId: "1:152026373732:web:ddcee612f618bd260e8971",
  measurementId: "G-F6KFRKJ3D4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
