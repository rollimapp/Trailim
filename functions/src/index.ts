import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
  VersionReviewService,
  WorkflowError,
} from './versionReviewService.js';
import type { ProtectedSubmissionInput } from '../../src/types/vs1Trusted.js';

initializeApp();
const service = new VersionReviewService(getFirestore());

const authenticatedUserId = (auth: { uid: string } | undefined) => {
  if (!auth) throw new HttpsError('unauthenticated', 'Firebase authentication is required');
  return auth.uid;
};

const translateError = (error: unknown): never => {
  if (error instanceof WorkflowError) throw new HttpsError(error.code, error.message);
  throw error;
};

export const submitRouteDraft = onCall(async request => {
  try {
    return await service.submitDraft(
      request.data.routeId,
      authenticatedUserId(request.auth),
      request.data.protected as ProtectedSubmissionInput,
    );
  } catch (error) { return translateError(error); }
});

export const resubmitRoute = onCall(async request => {
  try {
    return await service.resubmit(
      request.data.routeId,
      authenticatedUserId(request.auth),
      request.data.protected as ProtectedSubmissionInput,
    );
  } catch (error) { return translateError(error); }
});

export const requestRouteChanges = onCall(async request => {
  try {
    return await service.requestChanges(
      request.data.reviewId,
      authenticatedUserId(request.auth),
      request.data.feedback,
    );
  } catch (error) { return translateError(error); }
});

export const approveRouteVersion = onCall(async request => {
  try {
    return await service.approveVersion(
      request.data.routeVersionId,
      authenticatedUserId(request.auth),
      request.data.feedback,
    );
  } catch (error) { return translateError(error); }
});
