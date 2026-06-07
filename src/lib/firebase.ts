import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDQFKYxqQt7AYeFEKfcZWYvcUdupK7hQso",
  authDomain: "acesatai.firebaseapp.com",
  projectId: "acesatai",
  storageBucket: "acesatai.firebasestorage.app",
  messagingSenderId: "75736553754",
  appId: "1:75736553754:web:cbe9cae5ea30f64a1df4a3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
