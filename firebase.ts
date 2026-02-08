// @ts-ignore
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: 'AIzaSyCmhYqkfnsglHweOw8ayh0lhkYJB8zRLDU',
  authDomain: 'korpo-mafia.firebaseapp.com',
  databaseURL: 'https://korpo-mafia-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'korpo-mafia',
  storageBucket: 'korpo-mafia.firebasestorage.app',
  messagingSenderId: '174728937486',
  appId: '1:174728937486:web:78e81b40983bd290ec7c5f',
  measurementId: 'G-EYW31ZCHJ8'
};

console.log("Initializing Firebase App...");
const app = initializeApp(firebaseConfig);

console.log("Initializing Auth & Database...");
export const auth = getAuth(app);
export const db = getDatabase(app);

console.log("Firebase Initialized Successfully");