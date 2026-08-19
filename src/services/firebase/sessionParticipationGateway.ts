import { httpsCallable } from 'firebase/functions';
import type { ExperienceMode } from '../../types';
import { getFirebaseServices, isFirebaseConfigured } from './firebaseClient';
import { getCallableFunctions } from './versionReviewGateway';

export const isFirebaseSessionParticipationEnabled = () =>
  isFirebaseConfigured() &&
  import.meta.env.VITE_ENABLE_FIREBASE_SESSION_PARTICIPATION === 'true' &&
  getFirebaseServices().auth.currentUser !== null;

export const isFirebaseTaskResponseScoringEnabled = () =>
  isFirebaseSessionParticipationEnabled() &&
  import.meta.env.VITE_ENABLE_FIREBASE_TASK_RESPONSE_SCORING === 'true';

export class FirebaseSessionParticipationGateway {
  async createSession(input: { routeId: string; routeVersionId: string; title: string; mode: ExperienceMode; assignedClassIds?: string[] }) {
    return httpsCallable(getCallableFunctions(), 'createRouteSession')(input);
  }

  async updateSessionStatus(sessionId: string, nextStatus: 'active' | 'completed' | 'cancelled') {
    return httpsCallable(getCallableFunctions(), 'updateRouteSessionStatus')({ sessionId, nextStatus });
  }

  async joinSession(sessionId: string) {
    return httpsCallable(getCallableFunctions(), 'joinRouteSession')({ sessionId });
  }

  async updateProgress(sessionId: string, progress: { currentStationId?: string; completedStationIds: string[]; progressPercentage: number }) {
    return httpsCallable(getCallableFunctions(), 'updateParticipationProgress')({ sessionId, progress });
  }

  async abandonParticipation(sessionId: string) {
    return httpsCallable(getCallableFunctions(), 'abandonParticipation')({ sessionId });
  }

  async submitTaskResponse(sessionId: string, stationId: string, taskId: string, answer: string | string[], submissionId?: string) {
    return httpsCallable(getCallableFunctions(), 'submitTaskResponse')({ sessionId, stationId, taskId, answer, submissionId });
  }
}

export const firebaseSessionParticipationGateway = new FirebaseSessionParticipationGateway();
