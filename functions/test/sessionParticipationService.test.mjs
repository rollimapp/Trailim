import assert from 'node:assert/strict';
import test, { after, before, beforeEach } from 'node:test';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { SessionParticipationService } from '../lib/functions/src/sessionParticipationService.js';

let app;
let firestore;
let service;
const seed = (path, value) => firestore.doc(path).set(value);
const membership = (organizationId, userId, role = 'student', status = 'active') => ({
  id: `${organizationId}_${userId}`, organizationId, userId, role, status, createdAt: Timestamp.now(),
});

before(async () => {
  app = initializeApp({ projectId: 'demo-no-project' }, 'session-tests');
  firestore = getFirestore(app);
  service = new SessionParticipationService(firestore);
});

beforeEach(async () => {
  for (const name of ['routeSessions', 'routes', 'teams', 'organizations']) {
    await firestore.recursiveDelete(firestore.collection(name));
  }
  const now = Timestamp.now();
  await Promise.all([
    seed('organizations/org-a', { id: 'org-a', name: 'A', status: 'active' }),
    seed('organizations/org-b', { id: 'org-b', name: 'B', status: 'active' }),
    seed('organizations/org-a/memberships/creator-a', membership('org-a', 'creator-a')),
    seed('organizations/org-a/memberships/teacher-a', membership('org-a', 'teacher-a', 'teacher')),
    seed('organizations/org-a/memberships/student-a', membership('org-a', 'student-a')),
    seed('organizations/org-a/memberships/student-2', membership('org-a', 'student-2')),
    seed('organizations/org-a/memberships/inactive-a', membership('org-a', 'inactive-a', 'student', 'disabled')),
    seed('organizations/org-b/memberships/teacher-b', membership('org-b', 'teacher-b', 'teacher')),
    seed('teams/team-a', { id: 'team-a', organizationId: 'org-a', createdByUserId: 'creator-a', status: 'active', createdAt: now, updatedAt: now }),
    seed('routes/route-a', {
      id: 'route-a', organizationId: 'org-a', ownerTeamId: 'team-a', createdByUserId: 'creator-a', title: 'Route',
      status: 'approved', currentDraftId: 'draft-a', approvedVersionId: 'version-approved',
      latestSubmittedVersionId: 'version-approved', visibility: 'class', createdAt: now, updatedAt: now,
    }),
    seed('routes/route-a/versions/version-approved', {
      id: 'version-approved', routeId: 'route-a', organizationId: 'org-a', ownerTeamId: 'team-a',
      versionNumber: 1, sourceDraftId: 'draft-a', content: { title: 'Route' }, stationIds: ['station-1'],
      createdByUserId: 'creator-a', submittedAt: now, status: 'approved', visibility: 'class',
    }),
    seed('routes/route-a/versions/version-unapproved', {
      id: 'version-unapproved', routeId: 'route-a', organizationId: 'org-a', ownerTeamId: 'team-a',
      versionNumber: 2, sourceDraftId: 'draft-a', content: { title: 'Route V2' }, stationIds: [],
      createdByUserId: 'creator-a', submittedAt: now, status: 'submitted', visibility: 'class',
    }),
  ]);
});

after(async () => { await deleteApp(app); });

const createSession = (mode = 'learning', userId = 'teacher-a') => service.createRouteSession({
  routeId: 'route-a', routeVersionId: 'version-approved', title: `${mode} session`, mode,
}, userId);

test('authorized teacher and route creator create independent sessions for the exact approved version', async () => {
  const first = await createSession('learning');
  const second = await createSession('challenge', 'creator-a');
  assert.notEqual(first.sessionId, second.sessionId);
  const firstData = (await firestore.doc(`routeSessions/${first.sessionId}`).get()).data();
  const secondData = (await firestore.doc(`routeSessions/${second.sessionId}`).get()).data();
  assert.equal(firstData.routeVersionId, 'version-approved');
  assert.equal(secondData.mode, 'challenge');
  assert.equal(firstData.status, 'open');
});

test('session creation rejects unapproved, non-current, and cross-organization authority', async () => {
  await assert.rejects(service.createRouteSession({
    routeId: 'route-a', routeVersionId: 'version-unapproved', title: 'Bad', mode: 'learning',
  }, 'teacher-a'), /current approved version/);
  await firestore.doc('routes/route-a/versions/version-unapproved').update({ status: 'approved' });
  await assert.rejects(service.createRouteSession({
    routeId: 'route-a', routeVersionId: 'version-unapproved', title: 'Still bad', mode: 'learning',
  }, 'teacher-a'), /current approved version/);
  await assert.rejects(createSession('learning', 'teacher-b'), /Active organization membership/);
});

test('session lifecycle is forward-only and binding fields remain unchanged', async () => {
  const { sessionId } = await createSession();
  await service.updateRouteSessionStatus(sessionId, 'active', 'teacher-a');
  await service.updateRouteSessionStatus(sessionId, 'completed', 'teacher-a');
  await assert.rejects(service.updateRouteSessionStatus(sessionId, 'active', 'teacher-a'), /Invalid completed/);
  const session = (await firestore.doc(`routeSessions/${sessionId}`).get()).data();
  assert.equal(session.routeId, 'route-a');
  assert.equal(session.routeVersionId, 'version-approved');
  assert.equal(session.organizationId, 'org-a');
});

test('cancelled session is terminal', async () => {
  const { sessionId } = await createSession();
  await service.updateRouteSessionStatus(sessionId, 'cancelled', 'teacher-a');
  await assert.rejects(service.updateRouteSessionStatus(sessionId, 'active', 'teacher-a'), /Invalid cancelled/);
});

test('duplicate and concurrent join attempts return one deterministic participation', async () => {
  const { sessionId } = await createSession();
  const results = await Promise.all([
    service.joinRouteSession(sessionId, 'student-a'),
    service.joinRouteSession(sessionId, 'student-a'),
  ]);
  assert.equal(results[0].participationId, results[1].participationId);
  assert.equal((await firestore.collection(`routeSessions/${sessionId}/participations`).get()).size, 1);
  const resumed = await service.joinRouteSession(sessionId, 'student-a');
  assert.equal(resumed.resumed, true);
});

test('same user and version in learning and challenge sessions remain isolated', async () => {
  const learning = await createSession('learning');
  const challenge = await createSession('challenge');
  const first = await service.joinRouteSession(learning.sessionId, 'student-a');
  const second = await service.joinRouteSession(challenge.sessionId, 'student-a');
  assert.notEqual(first.participationId, second.participationId);
  await service.updateParticipationProgress(learning.sessionId, {
    currentStationId: 'station-1', completedStationIds: ['station-1'], progressPercentage: 100,
  }, 'student-a');
  const challengeState = (await firestore.doc(`routeSessions/${challenge.sessionId}/participations/student-a`).get()).data();
  assert.equal(challengeState.progressPercentage, 0);
});

test('progress preserves score and identity and is blocked by terminal parent lifecycle', async () => {
  const { sessionId } = await createSession();
  await service.joinRouteSession(sessionId, 'student-a');
  await service.updateParticipationProgress(sessionId, {
    currentStationId: 'station-1', completedStationIds: ['station-1'], progressPercentage: 50,
  }, 'student-a');
  let participation = (await firestore.doc(`routeSessions/${sessionId}/participations/student-a`).get()).data();
  assert.equal(participation.score, 0);
  assert.equal(participation.routeVersionId, 'version-approved');
  await service.updateRouteSessionStatus(sessionId, 'completed', 'teacher-a');
  await assert.rejects(service.updateParticipationProgress(sessionId, {
    completedStationIds: ['station-1'], progressPercentage: 100,
  }, 'student-a'), /terminal/);
  await assert.rejects(service.abandonParticipation(sessionId, 'student-a'), /terminal/);
  await assert.rejects(service.joinRouteSession(sessionId, 'student-2'), /not open or active/);
});

test('cancelled session rejects progress, join, and resume writes', async () => {
  const { sessionId } = await createSession();
  await service.joinRouteSession(sessionId, 'student-a');
  await service.updateRouteSessionStatus(sessionId, 'cancelled', 'teacher-a');
  await assert.rejects(service.updateParticipationProgress(sessionId, {
    completedStationIds: [], progressPercentage: 0,
  }, 'student-a'), /terminal/);
  await assert.rejects(service.joinRouteSession(sessionId, 'student-a'), /not open or active/);
});

test('inactive organization member cannot join and abandon is idempotent', async () => {
  const { sessionId } = await createSession();
  await assert.rejects(service.joinRouteSession(sessionId, 'inactive-a'), /Active organization membership/);
  await service.joinRouteSession(sessionId, 'student-a');
  await service.abandonParticipation(sessionId, 'student-a');
  await service.abandonParticipation(sessionId, 'student-a');
  assert.equal((await firestore.doc(`routeSessions/${sessionId}/participations/student-a`).get()).data().status, 'abandoned');
});
