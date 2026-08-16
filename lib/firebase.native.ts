import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// Firebase's React Native entry point provides AsyncStorage persistence.
// The package's TypeScript default entry point does not expose this symbol.
// @ts-ignore
import { getReactNativePersistence } from '@firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDdiWnkmo96zxajkfOZ0YgdeX-ngNNmCBA",
  authDomain: "presentsir2.firebaseapp.com",
  projectId: "presentsir2",
  storageBucket: "presentsir2.firebasestorage.app",
  messagingSenderId: "241942961860",
  appId: "1:241942961860:web:d958cd7f57338d3119f391",
  measurementId: "G-ZTBL8R5TH8"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

export { app, auth, firestore };
