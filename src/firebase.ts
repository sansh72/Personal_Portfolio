import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAAUc0BOOjkPAPYINh7yUXg9-SRWqs0YEw",
  authDomain: "personalportfolio-50693.firebaseapp.com",
  projectId: "personalportfolio-50693",
  storageBucket: "personalportfolio-50693.firebasestorage.app",
  messagingSenderId: "935704602901",
  appId: "1:935704602901:web:8d04986406dfa4da2d611c",
  measurementId: "G-4R9158B03E"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
