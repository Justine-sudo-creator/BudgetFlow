
'use client';
import { FirebaseError } from 'firebase/app';
import {
  Auth, // Import Auth type for type hinting
  UserCredential,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from './initializer';

type ErrorCallback = (error: FirebaseError) => void;

const createNewUserDocument = (userCredential: UserCredential) => {
    const { firestore } = initializeFirebase();
    const user = userCredential.user;
    if (firestore && user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const initialUserData = {
            id: user.uid,
            email: user.email,
            allowance: 0,
            budgetTarget: { amount: 0, period: 'daily' },
        };
        // This is a crucial, blocking write on first login.
        return setDoc(userDocRef, initialUserData);
    }
    return Promise.resolve();
};

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth, onError: ErrorCallback): Promise<void> {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  return signInAnonymously(authInstance)
    .then(createNewUserDocument)
    .catch(onError);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, onError: ErrorCallback): Promise<void> {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  return createUserWithEmailAndPassword(authInstance, email, password)
    .then(createNewUserDocument)
    .catch(onError);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, onError: ErrorCallback): Promise<void> {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  return signInWithEmailAndPassword(authInstance, email, password)
    .catch(onError);
}
