import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAWgnGhIZo7VZOIraQwYBgaexRFMv9702s',
  authDomain: 'cardgame-17a73.firebaseapp.com',
  databaseURL: 'https://cardgame-17a73-default-rtdb.firebaseio.com',
  projectId: 'cardgame-17a73',
  storageBucket: 'cardgame-17a73.firebasestorage.app',
  messagingSenderId: '36949370169',
  appId: '1:36949370169:web:3ac30d88935b274b76f4e8',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let _auth;
try {
  _auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  _auth = getAuth(app);
}

export const auth = _auth;
export const db = getFirestore(app);
