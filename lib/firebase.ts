import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdiWnkmo96zxajkfOZ0YgdeX-ngNNmCBA",
  authDomain: "presentsir2.firebaseapp.com",
  projectId: "presentsir2",
  storageBucket: "presentsir2.firebasestorage.app",
  messagingSenderId: "241942961860",
  appId: "1:241942961860:web:d958cd7f57338d3119f391",
  measurementId: "G-ZTBL8R5TH8"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// The native implementation is provided by firebase.native.ts.
const auth = getAuth(app);

// Initialize Firestore
const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

export { app, auth, firestore };


