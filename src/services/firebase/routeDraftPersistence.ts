import { getFirebaseServices, isFirebaseConfigured } from './firebaseClient';
import { firestoreRouteDraftRepository } from './routeDraftRepository';

export const getEnabledFirestoreRouteDraftRepository = () => {
  if (
    !isFirebaseConfigured() ||
    import.meta.env.VITE_ENABLE_FIREBASE_ROUTE_DRAFTS !== 'true'
  ) return null;

  return getFirebaseServices().auth.currentUser ? firestoreRouteDraftRepository : null;
};
