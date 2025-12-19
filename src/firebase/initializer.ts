// This file is meant for server-side Firebase initialization.
// It uses a separate method to initialize the app, which is necessary for server environments like API routes.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseServerInstances {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// This function ensures that Firebase is initialized only once on the server.
export function initializeFirebase(): FirebaseServerInstances {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}
