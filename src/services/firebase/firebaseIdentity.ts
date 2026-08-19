import { onAuthStateChanged, type User, type Unsubscribe } from 'firebase/auth';
import { getFirebaseServices, isFirebaseConfigured } from './firebaseClient';

export type FirebaseIdentityListener = (user: User | null) => void;

export const observeFirebaseIdentity = (listener: FirebaseIdentityListener): Unsubscribe => {
  if (!isFirebaseConfigured()) {
    listener(null);
    return () => undefined;
  }
  return onAuthStateChanged(getFirebaseServices().auth, listener);
};
