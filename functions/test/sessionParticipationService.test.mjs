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
      versionNumber: 1, sourceDraftId: 'draft-a', content: { title: 'Route' }, stationIds: ['station-1', 'station-2'],
      createdByUserId: 'creator-a', submittedAt: now, status: 'approved', visibility: 'class',
    }),
    seed('routes/route-a/versions/version-unapproved', {
      id: 'version-unapproved', routeId: 'route-a', organizationId: 'org-a', ownerTeamId: 'team-a',
      versionNumber: 2, sourceDraftId: 'draft-a', content: { title: 'Route V2' }, stationIds: [],
      createdByUserId: 'creator-a', submittedAt: now, status: 'submitted', visibility: 'class',
    }),
    seed('routes/route-a/versions/version-approved/stations/station-1', {
      id: 'station-1', routeId: 'route-a', routeVersionId: 'version-approved', position: 1,
      tasks: [
        { id: 'option-task', type: 'multiple_choice', options: [{ id: 'a' }, { id: 'b' }] },
        { id: 'retry-task', type: 'multiple_choice', options: [{ id: 'a' }, { id: 'b' }] },
        { id: 'text-case', type: 'open_text' }, { id: 'text-insensitive', type: 'open_text' },
        { id: 'submission-task', type: 'reflection' }, { id: 'manual-task', type: 'open_text' },
      ],
    }),
    seed('routes/route-a/versions/version-approved/answerKeys/option-task', {
      id: 'option-task', recordType: 'task_answer', routeVersionId: 'version-approved', stationId: 'station-1', taskId: 'option-task',
      validation: { kind: 'option_ids', correctOptionIds: ['a'] }, pointsAwarded: 10, allowRetry: false, penaltyPerAttempt: 0,
    }),
    seed('routes/route-a/versions/version-approved/answerKeys/retry-task', {
      id: 'retry-task', recordType: 'task_answer', routeVersionId: 'version-approved', stationId: 'station-1', taskId: 'retry-task',
      validation: { kind: 'option_ids', correctOptionIds: ['a'] }, pointsAwarded: 10, allowRetry: true, attemptLimit: 3, penaltyPerAttempt: 2,
    }),
    seed('routes/route-a/versions/version-approved/answerKeys/text-case', {
      id: 'text-case', recordType: 'task_answer', routeVersionId: 'version-approved', stationId: 'station-1', taskId: 'text-case',
      validation: { kind: 'accepted_text', acceptedAnswers: ['Trail'], caseSensitive: true }, pointsAwarded: 4, allowRetry: false, penaltyPerAttempt: 0,
    }),
    seed('routes/route-a/versions/version-approved/answerKeys/text-insensitive', {
      id: 'text-insensitive', recordType: 'task_answer', routeVersionId: 'version-approved', stationId: 'station-1', taskId: 'text-insensitive',
      validation: { kind: 'accepted_text', acceptedAnswers: ['Trail'], caseSensitive: false }, pointsAwarded: 4, allowRetry: false, penaltyPerAttempt: 0,
    }),
    seed('routes/route-a/versions/version-approved/answerKeys/submission-task', {
      id: 'submission-task', recordType: 'task_answer', routeVersionId: 'version-approved', stationId: 'station-1', taskId: 'submission-task',
      validation: { kind: 'submission_only' }, pointsAwarded: 3, allowRetry: false, penaltyPerAttempt: 0,
    }),
    seed('routes/route-a/versions/version-approved/answerKeys/manual-task', {
      id: 'manual-task', recordType: 'task_answer', routeVersionId: 'version-approved', stationId: 'station-1', taskId: 'manual-task',
      validation: { kind: 'manual_review' }, pointsAwarded: 20, allowRetry: false, penaltyPerAttempt: 0,
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

test('teacher authority still requires a valid same-organization route owner team', async () => {
  await firestore.doc('teams/team-a').update({ organizationId: 'org-b' });
  await assert.rejects(createSession('learning', 'teacher-a'), /owner team does not match/);
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

test('progress rejects unknown and duplicate station identities', async () => {
  const { sessionId } = await createSession();
  await service.joinRouteSession(sessionId, 'student-a');
  await assert.rejects(service.updateParticipationProgress(sessionId, {
    completedStationIds: ['unknown-station'], progressPercentage: 0,
  }, 'student-a'), /Completed station does not belong/);
  await assert.rejects(service.updateParticipationProgress(sessionId, {
    currentStationId: 'unknown-station', completedStationIds: [], progressPercentage: 0,
  }, 'student-a'), /Current station does not belong/);
  await assert.rejects(service.updateParticipationProgress(sessionId, {
    completedStationIds: ['station-1', 'station-1'], progressPercentage: 100,
  }, 'student-a'), /must be unique/);
});

test('progress percentage is derived from the bound version and ignores caller authority', async () => {
  const { sessionId } = await createSession();
  await service.joinRouteSession(sessionId, 'student-a');
  await service.updateParticipationProgress(sessionId, {
    currentStationId: 'station-1', completedStationIds: [], progressPercentage: 100,
  }, 'student-a');
  let participation = (await firestore.doc(`routeSessions/${sessionId}/participations/student-a`).get()).data();
  assert.equal(participation.progressPercentage, 0);
  await service.updateParticipationProgress(sessionId, {
    currentStationId: 'station-2', completedStationIds: ['station-1'], progressPercentage: 0,
  }, 'student-a');
  participation = (await firestore.doc(`routeSessions/${sessionId}/participations/student-a`).get()).data();
  assert.equal(participation.progressPercentage, 50);
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
  assert.equal(participation.progressPercentage, 50);
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

const joinedSession = async () => {
  const { sessionId } = await createSession();
  await service.joinRouteSession(sessionId, 'student-a');
  return sessionId;
};

test('trusted option evaluation awards configured points once and rejects forged option shapes', async () => {
  const sessionId = await joinedSession();
  const result = await service.submitTaskResponse(sessionId, 'station-1', 'option-task', ['a'], 'student-a');
  assert.equal(result.isCorrect, true);
  assert.equal(result.pointsAwarded, 10);
  assert.equal(result.score, 10);
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'option-task', ['a'], 'student-a'), /Retry is not allowed/);
  assert.equal((await firestore.collection(`routeSessions/${sessionId}/participations/student-a/responses`).get()).size, 1);
});

test('incorrect answer awards zero and option IDs are strict', async () => {
  let sessionId = await joinedSession();
  const result = await service.submitTaskResponse(sessionId, 'station-1', 'option-task', 'b', 'student-a');
  assert.equal(result.isCorrect, false);
  assert.equal(result.pointsAwarded, 0);
  sessionId = (await createSession()).sessionId;
  await service.joinRouteSession(sessionId, 'student-a');
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'option-task', ['unknown'], 'student-a'), /Unknown option/);
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'option-task', ['a', 'a'], 'student-a'), /unique option/);
});

test('retry scoring replaces prior award by delta and attempt limit is atomic', async () => {
  const sessionId = await joinedSession();
  await service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'b', 'student-a');
  const second = await service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'a', 'student-a');
  assert.equal(second.pointsAwarded, 8);
  assert.equal(second.score, 8);
  const third = await service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'a', 'student-a');
  assert.equal(third.pointsAwarded, 6);
  assert.equal(third.score, 6);
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'a', 'student-a'), /Attempt limit/);
});

test('concurrent duplicate submission creates one response and cannot inflate score', async () => {
  const sessionId = await joinedSession();
  const results = await Promise.allSettled([
    service.submitTaskResponse(sessionId, 'station-1', 'option-task', 'a', 'student-a'),
    service.submitTaskResponse(sessionId, 'station-1', 'option-task', 'a', 'student-a'),
  ]);
  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal((await firestore.doc(`routeSessions/${sessionId}/participations/student-a`).get()).data().score, 10);
});

test('accepted text respects exact case policy', async () => {
  const sessionId = await joinedSession();
  const sensitive = await service.submitTaskResponse(sessionId, 'station-1', 'text-case', 'trail', 'student-a');
  const insensitive = await service.submitTaskResponse(sessionId, 'station-1', 'text-insensitive', 'trail', 'student-a');
  assert.equal(sensitive.isCorrect, false);
  assert.equal(insensitive.isCorrect, true);
  assert.equal(insensitive.pointsAwarded, 4);
});

test('submission-only awards configured points while manual review awards none', async () => {
  const sessionId = await joinedSession();
  const submitted = await service.submitTaskResponse(sessionId, 'station-1', 'submission-task', 'evidence', 'student-a');
  const manual = await service.submitTaskResponse(sessionId, 'station-1', 'manual-task', 'essay', 'student-a');
  assert.equal(submitted.evaluationStatus, 'evaluated');
  assert.equal(submitted.isCorrect, undefined);
  assert.equal(submitted.pointsAwarded, 3);
  assert.equal(manual.evaluationStatus, 'manual_review');
  assert.equal(manual.pointsAwarded, 0);
  assert.equal(manual.score, 3);
});

test('task, key, identity, membership, and terminal gates fail closed', async () => {
  const sessionId = await joinedSession();
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'missing', 'x', 'student-a'), /Task must exist/);
  await firestore.doc('routes/route-a/versions/version-approved/answerKeys/option-task').update({ stationId: 'station-2' });
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'option-task', 'a', 'student-a'), /AnswerKey identity/);
  await firestore.doc('organizations/org-a/memberships/student-a').update({ status: 'disabled' });
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'text-case', 'Trail', 'student-a'), /Active organization membership/);
  await firestore.doc('organizations/org-a/memberships/student-a').update({ status: 'active' });
  await service.updateRouteSessionStatus(sessionId, 'completed', 'teacher-a');
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'text-case', 'Trail', 'student-a'), /terminal/);
});

test('cancelled session, abandoned participation, other user, and cross-organization caller are denied', async () => {
  let sessionId = await joinedSession();
  await service.updateRouteSessionStatus(sessionId, 'cancelled', 'teacher-a');
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'option-task', 'a', 'student-a'), /terminal/);
  sessionId = await joinedSession();
  await service.abandonParticipation(sessionId, 'student-a');
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'option-task', 'a', 'student-a'), /not active/);
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'option-task', 'a', 'student-2'), /not active/);
  await assert.rejects(service.submitTaskResponse(sessionId, 'station-1', 'option-task', 'a', 'teacher-b'), /not active/);
});

test('idempotency - same submission ID deduplicates concurrent and sequential attempts', async () => {
  const sessionId = await joinedSession();

  // 1. Concurrent same submission ID with allowRetry=true => one attempt
  const results = await Promise.all([
    service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'b', 'student-a', 'idemp-1'),
    service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'b', 'student-a', 'idemp-1'),
  ]);
  assert.equal(results[0].attemptCount, 1);
  assert.equal(results[1].attemptCount, 1);
  assert.equal(results[0].score, 0);
  assert.equal(results[1].score, 0);

  // 2. Network replay same submission ID => same result, same attemptCount, same score
  const replay = await service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'b', 'student-a', 'idemp-1');
  assert.equal(replay.attemptCount, 1);
  assert.equal(replay.pointsAwarded, 0);
  assert.equal(replay.score, 0);

  // 3. New submission ID => second attempt (which is a genuine new attempt)
  const second = await service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'a', 'student-a', 'idemp-2');
  assert.equal(second.attemptCount, 2);
  assert.equal(second.pointsAwarded, 8);
  assert.equal(second.score, 8);

  // 4. Replay of second attempt => same result, attemptCount = 2, score = 8
  const replaySecond = await service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'a', 'student-a', 'idemp-2');
  assert.equal(replaySecond.attemptCount, 2);
  assert.equal(replaySecond.pointsAwarded, 8);
  assert.equal(replaySecond.score, 8);

  // 5. New submission ID for third attempt => third attempt (which is a genuine new attempt)
  const third = await service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'a', 'student-a', 'idemp-3');
  assert.equal(third.attemptCount, 3);
  assert.equal(third.pointsAwarded, 6);
  assert.equal(third.score, 6);

  // 6. Attempt limit still enforced
  await assert.rejects(
    service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'a', 'student-a', 'idemp-4'),
    /Attempt limit exceeded/
  );

  // 7. But replay of the third attempt (same submission ID) is still allowed and returns the same result
  const replayThird = await service.submitTaskResponse(sessionId, 'station-1', 'retry-task', 'a', 'student-a', 'idemp-3');
  assert.equal(replayThird.attemptCount, 3);
  assert.equal(replayThird.pointsAwarded, 6);
  assert.equal(replayThird.score, 6);
});
