import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace with your Firebase project configuration
// Get this from Firebase Console -> Project Settings -> General
const firebaseConfig = {
  apiKey: "AIzaSyCLwGaVISepZVUK2TvbZ6MxRIafpSvNBiU",
  authDomain: "summarist-internship-1cb1e.firebaseapp.com",
  projectId: "summarist-internship-1cb1e",
  storageBucket: "summarist-internship-1cb1e.firebasestorage.app",
  messagingSenderId: "1035812047826",
  appId: "1:1035812047826:web:3d97dd37ae441e23f7160b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);
export default app;
