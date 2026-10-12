import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { OperationType, handleFirestoreError } from './errors';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Sync user profile to Firestore /users/{uid}
    const userRef = doc(db, 'users', user.uid);
    try {
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Patient',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not sync user to Firestore users collection:', err);
    }

    return user;
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

export async function logOut() {
  return signOut(auth);
}

export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
