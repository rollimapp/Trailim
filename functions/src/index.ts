import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
  VersionReviewService,
  WorkflowError,
} from './versionReviewService.js';
import type { ProtectedSubmissionInput } from '../../src/types/vs1Trusted.js';
import { SessionParticipationService } from './sessionParticipationService.js';

initializeApp();
const service = new VersionReviewService(getFirestore());
const sessionService = new SessionParticipationService(getFirestore());

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

export const createRouteSession = onCall(async request => {
  try { return await sessionService.createRouteSession(request.data, authenticatedUserId(request.auth)); }
  catch (error) { return translateError(error); }
});

export const updateRouteSessionStatus = onCall(async request => {
  try { return await sessionService.updateRouteSessionStatus(request.data.sessionId, request.data.nextStatus, authenticatedUserId(request.auth)); }
  catch (error) { return translateError(error); }
});

export const joinRouteSession = onCall(async request => {
  try { return await sessionService.joinRouteSession(request.data.sessionId, authenticatedUserId(request.auth)); }
  catch (error) { return translateError(error); }
});

export const updateParticipationProgress = onCall(async request => {
  try { return await sessionService.updateParticipationProgress(request.data.sessionId, request.data.progress, authenticatedUserId(request.auth)); }
  catch (error) { return translateError(error); }
});

export const abandonParticipation = onCall(async request => {
  try { return await sessionService.abandonParticipation(request.data.sessionId, authenticatedUserId(request.auth)); }
  catch (error) { return translateError(error); }
});

export const submitTaskResponse = onCall(async request => {
  try {
    const submissionId = request.data?.submissionId;
    if (typeof submissionId !== 'string' || submissionId.length === 0) {
      throw new HttpsError('invalid-argument', 'submissionId is required');
    }
    return await sessionService.submitTaskResponse(
      request.data.sessionId, request.data.stationId, request.data.taskId,
      request.data.answer, authenticatedUserId(request.auth),
      submissionId,
    );
  } catch (error) { return translateError(error); }
});

import { getAuth as getAdminAuth } from 'firebase-admin/auth';

export const devSeedDatabase = onCall(async () => {
  if (process.env.FUNCTIONS_EMULATOR !== 'true') {
    throw new HttpsError('permission-denied', 'Only available in emulator mode');
  }
  const db = getFirestore();
  const batch = db.batch();

  const orgRef = db.collection('organizations').doc('org-edu-1');
  batch.set(orgRef, { id: 'org-edu-1', name: 'District 7 Education Network', status: 'active' });

  const memberships = [
    { uid: 'student-1', role: 'student', email: 'maya.lin@school.edu' },
    { uid: 'teacher-1', role: 'teacher', email: 'elena.vance@school.edu' },
    { uid: 'approver-1', role: 'teacher', email: 'david.m@cityheritage.org' }
  ];

  for (const m of memberships) {
    const memRef = orgRef.collection('memberships').doc(m.uid);
    batch.set(memRef, {
      id: `org-edu-1_${m.uid}`,
      organizationId: 'org-edu-1',
      userId: m.uid,
      role: m.role,
      status: 'active',
      createdAt: new Date().toISOString()
    });
  }

  const teamRef = db.collection('teams').doc('team-market-storytellers');
  batch.set(teamRef, {
    id: 'team-market-storytellers',
    organizationId: 'org-edu-1',
    name: 'Market Storytellers',
    createdByUserId: 'student-1',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const memberRef = teamRef.collection('members').doc('student-1');
  batch.set(memberRef, {
    id: 'team-market-storytellers_student-1',
    teamId: 'team-market-storytellers',
    userId: 'student-1',
    roles: ['manager', 'route_planner'],
    status: 'active',
    joinedAt: new Date().toISOString()
  });

  await batch.commit();
  return { success: true };
});

export const getDevCustomToken = onCall(async request => {
  if (process.env.FUNCTIONS_EMULATOR !== 'true') {
    throw new HttpsError('permission-denied', 'Only available in emulator mode');
  }
  const uid = request.data.uid;
  if (!uid) {
    throw new HttpsError('invalid-argument', 'uid is required');
  }
  const token = await getAdminAuth().createCustomToken(uid);
  return { token };
});

