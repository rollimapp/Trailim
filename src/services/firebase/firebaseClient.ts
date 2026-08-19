import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

declare global {
  var __trailimFirebaseEmulatorsConnected: boolean | undefined;
}

const readFirebaseOptions = (): FirebaseOptions | null => {
  const options = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  return Object.values(options).every(Boolean) ? options as FirebaseOptions : null;
};

export const isFirebaseConfigured = () => readFirebaseOptions() !== null;

export const getFirebaseServices = (): FirebaseServices => {
  const options = readFirebaseOptions();
  if (!options) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values described in .env.example.');
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(options);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' &&
    !globalThis.__trailimFirebaseEmulatorsConnected
  ) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    globalThis.__trailimFirebaseEmulatorsConnected = true;
  }

  return { app, auth, firestore };
};
