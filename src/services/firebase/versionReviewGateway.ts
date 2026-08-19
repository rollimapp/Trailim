import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import type { ProtectedSubmissionInput } from '../../types/vs1Trusted';
import { getFirebaseServices, isFirebaseConfigured } from './firebaseClient';

declare global {
  var __trailimFunctionsEmulatorConnected: boolean | undefined;
}

const getCallableFunctions = () => {
  const { app } = getFirebaseServices();
  const functions = getFunctions(app);
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' &&
    !globalThis.__trailimFunctionsEmulatorConnected
  ) {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    globalThis.__trailimFunctionsEmulatorConnected = true;
  }
  return functions;
};

export const isFirebaseVersionReviewEnabled = () =>
  isFirebaseConfigured() &&
  import.meta.env.VITE_ENABLE_FIREBASE_VERSION_REVIEW === 'true' &&
  getFirebaseServices().auth.currentUser !== null;

export class FirebaseVersionReviewGateway {
  async submitDraft(routeId: string, protectedData: ProtectedSubmissionInput) {
    return httpsCallable(getCallableFunctions(), 'submitRouteDraft')({ routeId, protected: protectedData });
  }

  async resubmit(routeId: string, protectedData: ProtectedSubmissionInput) {
    return httpsCallable(getCallableFunctions(), 'resubmitRoute')({ routeId, protected: protectedData });
  }

  async requestChanges(reviewId: string, feedback: string) {
    return httpsCallable(getCallableFunctions(), 'requestRouteChanges')({ reviewId, feedback });
  }

  async approveVersion(routeVersionId: string, feedback = '') {
    return httpsCallable(getCallableFunctions(), 'approveRouteVersion')({ routeVersionId, feedback });
  }
}

export const firebaseVersionReviewGateway = new FirebaseVersionReviewGateway();
