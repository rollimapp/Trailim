import assert from 'node:assert/strict';
import test, { after, before, beforeEach } from 'node:test';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { VersionReviewService } from '../lib/functions/src/versionReviewService.js';

let app;
let firestore;
let service;

const membership = (organizationId, userId, role = 'student', status = 'active') => ({
  id: `${organizationId}_${userId}`, organizationId, userId, role, status, createdAt: Timestamp.now(),
});

const seed = async (path, value) => firestore.doc(path).set(value);

const protectedInput = {
  answerKeys: [{
    stationId: 'station-1',
    taskId: 'task-1',
    validation: { kind: 'option_ids', correctOptionIds: ['a'] },
    pointsAwarded: 10,
    allowRetry: false,
    penaltyPerAttempt: 0,
  }],
  triggers: [{ stationId: 'station-1', triggerType: 'qr_code', secret: 'TRAIL-SECRET' }],
};

const seedRoute = async (status = 'draft') => {
  const now = Timestamp.now();
  await seed('routes/route-1', {
    id: 'route-1', organizationId: 'org-a', ownerTeamId: 'team-a', createdByUserId: 'creator-a',
    title: 'Original route', status, currentDraftId: 'draft-1', visibility: 'class',
    createdAt: now, updatedAt: now,
  });
  await seed('routes/route-1/drafts/draft-1', {
    id: 'draft-1', routeId: 'route-1', organizationId: 'org-a', ownerTeamId: 'team-a',
    content: { title: 'Original route', subject: 'History' }, updatedByUserId: 'creator-a', updatedAt: now,
  });
  await seed('routes/route-1/drafts/draft-1/stations/station-1', {
    id: 'station-1', routeId: 'route-1', draftId: 'draft-1', title: 'Original station', shortLabel: 'S1',
    description: 'Description', position: 1, stationType: 'question', contentBlocks: [],
    trigger: { type: 'qr_code' }, tasks: [{
      id: 'task-1', type: 'multiple_choice', prompt: 'Choose',
      options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], required: true, displayPoints: 10,
    }], estimatedTimeMinutes: 5, required: true, allowSkip: false, allowRevisit: true,
  });
};

before(async () => {
  app = initializeApp({ projectId: 'demo-no-project' }, 'workflow-tests');
  firestore = getFirestore(app);
  service = new VersionReviewService(firestore);
});

beforeEach(async () => {
  for (const name of ['reviews', 'routes', 'teams', 'organizations']) {
    await firestore.recursiveDelete(firestore.collection(name));
  }
  await Promise.all([
    seed('organizations/org-a', { id: 'org-a', name: 'Org A', status: 'active' }),
    seed('organizations/org-b', { id: 'org-b', name: 'Org B', status: 'active' }),
    seed('organizations/org-a/memberships/creator-a', membership('org-a', 'creator-a')),
    seed('organizations/org-a/memberships/student-a', membership('org-a', 'student-a')),
    seed('organizations/org-a/memberships/inactive-a', membership('org-a', 'inactive-a', 'student', 'disabled')),
    seed('organizations/org-a/memberships/manager-a', membership('org-a', 'manager-a')),
    seed('organizations/org-a/memberships/teacher-a', membership('org-a', 'teacher-a', 'teacher')),
    seed('organizations/org-b/memberships/teacher-b', membership('org-b', 'teacher-b', 'teacher')),
    seed('teams/team-a', {
      id: 'team-a', organizationId: 'org-a', name: 'Team A', createdByUserId: 'creator-a', status: 'active',
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    }),
    seed('teams/other-team', {
      id: 'other-team', organizationId: 'org-a', name: 'Other Team', createdByUserId: 'teacher-a', status: 'active',
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    }),
    seed('teams/other-team/members/manager-a', {
      id: 'other-team_manager-a', teamId: 'other-team', userId: 'manager-a', roles: ['manager'],
      status: 'active', joinedAt: Timestamp.now(),
    }),
  ]);
  await seedRoute();
});

after(async () => {
  await deleteApp(app);
});

test('authorized submit creates exact immutable public version, protected data, and review', async () => {
  const result = await service.submitDraft('route-1', 'creator-a', protectedInput);
  const route = (await firestore.doc('routes/route-1').get()).data();
  const version = (await firestore.doc(`routes/route-1/versions/${result.routeVersionId}`).get()).data();
  const station = (await firestore.doc(`routes/route-1/versions/${result.routeVersionId}/stations/station-1`).get()).data();
  const answer = (await firestore.doc(`routes/route-1/versions/${result.routeVersionId}/answerKeys/task-1`).get()).data();
  const trigger = (await firestore.doc(`routes/route-1/versions/${result.routeVersionId}/answerKeys/trigger_station-1`).get()).data();
  const review = (await firestore.doc(`reviews/${result.reviewId}`).get()).data();

  assert.equal(route.status, 'in_review');
  assert.equal(route.latestSubmittedVersionId, result.routeVersionId);
  assert.equal(version.sourceDraftId, 'draft-1');
  assert.equal(version.versionNumber, 1);
  assert.equal(review.routeVersionId, result.routeVersionId);
  assert.equal(review.status, 'pending');
  assert.equal(JSON.stringify({ version, station }).includes('correctOptionIds'), false);
  assert.equal(JSON.stringify({ version, station }).includes('TRAIL-SECRET'), false);
  assert.deepEqual(answer.validation.correctOptionIds, ['a']);
  assert.equal(trigger.secret, 'TRAIL-SECRET');
});

test('unauthorized, inactive, and archived route submissions are rejected', async () => {
  await assert.rejects(service.submitDraft('route-1', 'student-a', protectedInput), /Route team authority/);
  await assert.rejects(service.submitDraft('route-1', 'manager-a', protectedInput), /Route team authority/);
  await assert.rejects(service.submitDraft('route-1', 'inactive-a', protectedInput), /Active organization membership/);
  await firestore.doc('routes/route-1').update({ status: 'archived' });
  await assert.rejects(service.submitDraft('route-1', 'creator-a', protectedInput), /must be draft/);
});

test('concurrent duplicate submissions create exactly one V1 and one pending review', async () => {
  const attempts = await Promise.allSettled([
    service.submitDraft('route-1', 'creator-a', protectedInput),
    service.submitDraft('route-1', 'creator-a', protectedInput),
  ]);
  assert.equal(attempts.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(attempts.filter(item => item.status === 'rejected').length, 1);
  assert.equal((await firestore.collection('routes/route-1/versions').get()).size, 1);
  assert.equal((await firestore.collection('reviews').where('status', '==', 'pending').get()).size, 1);
});

test('request changes, edit, resubmit V2, stale review rejection, and approval remain exact-version bound', async () => {
  const first = await service.submitDraft('route-1', 'creator-a', protectedInput);
  await assert.rejects(
    service.requestChanges(first.reviewId, 'teacher-b', 'Wrong organization'),
    /Active organization membership/,
  );
  await service.requestChanges(first.reviewId, 'teacher-a', 'Revise it');
  let route = (await firestore.doc('routes/route-1').get()).data();
  let draft = (await firestore.doc('routes/route-1/drafts/draft-1').get()).data();
  assert.equal(route.status, 'changes_requested');
  assert.equal(draft.basedOnVersionId, first.routeVersionId);
  await assert.rejects(service.requestChanges(first.reviewId, 'teacher-a', 'Again'), /not the current pending/);

  await firestore.doc('routes/route-1/drafts/draft-1').update({
    content: { title: 'Revised route', subject: 'History' }, updatedAt: Timestamp.now(),
  });
  await firestore.doc('routes/route-1/drafts/draft-1/stations/station-1').update({ title: 'Revised station' });
  const second = await service.resubmit('route-1', 'creator-a', protectedInput);
  assert.equal(second.versionNumber, 2);
  assert.notEqual(second.routeVersionId, first.routeVersionId);

  const firstVersion = (await firestore.doc(`routes/route-1/versions/${first.routeVersionId}`).get()).data();
  const firstStation = (await firestore.doc(`routes/route-1/versions/${first.routeVersionId}/stations/station-1`).get()).data();
  const secondVersion = (await firestore.doc(`routes/route-1/versions/${second.routeVersionId}`).get()).data();
  const secondReview = (await firestore.doc(`reviews/${second.reviewId}`).get()).data();
  assert.equal(firstVersion.content.title, 'Original route');
  assert.equal(firstStation.title, 'Original station');
  assert.equal(secondVersion.content.title, 'Revised route');
  assert.equal(secondVersion.basedOnVersionId, first.routeVersionId);
  assert.equal(secondReview.routeVersionId, second.routeVersionId);
  await assert.rejects(service.approveVersion(first.routeVersionId, 'teacher-a'), /Pending review not found/);
  await assert.rejects(service.approveVersion(second.routeVersionId, 'teacher-b'), /Active organization membership/);

  await service.approveVersion(second.routeVersionId, 'teacher-a', 'Approved');
  route = (await firestore.doc('routes/route-1').get()).data();
  assert.equal(route.status, 'approved');
  assert.equal(route.approvedVersionId, second.routeVersionId);
  assert.equal(route.latestSubmittedVersionId, second.routeVersionId);
  await assert.rejects(service.approveVersion(second.routeVersionId, 'teacher-a'), /Pending review not found/);
});
