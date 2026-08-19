import fs from 'node:fs';
import test, { after, before, beforeEach } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc,
  updateDoc, where, writeBatch,
} from 'firebase/firestore';

const projectId = 'trailim-rules-test';
let environment;

const membership = (organizationId, userId, role = 'student') => ({
  id: `${organizationId}_${userId}`,
  organizationId,
  userId,
  role,
  status: 'active',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

const team = (id, organizationId, createdByUserId) => ({
  id,
  organizationId,
  name: `Team ${id}`,
  createdByUserId,
  status: 'active',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const teamMember = (teamId, userId, roles = ['researcher']) => ({
  id: `${teamId}_${userId}`,
  teamId,
  userId,
  roles,
  status: 'active',
  joinedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const route = (id, organizationId, ownerTeamId, createdByUserId, currentDraftId = `draft-${id}`) => ({
  id,
  organizationId,
  ownerTeamId,
  createdByUserId,
  title: `Route ${id}`,
  status: 'draft',
  currentDraftId,
  visibility: 'private',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const routeDraft = (routeValue, draftId = routeValue.currentDraftId) => ({
  id: draftId,
  routeId: routeValue.id,
  organizationId: routeValue.organizationId,
  ownerTeamId: routeValue.ownerTeamId,
  content: { title: routeValue.title, subject: 'History' },
  updatedByUserId: routeValue.createdByUserId,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const draftStation = (routeId, draftId, id = 'station-1') => ({
  id,
  routeId,
  draftId,
  title: 'Station one',
  shortLabel: 'S1',
  description: 'Description',
  position: 1,
  stationType: 'question',
  contentBlocks: [],
  trigger: { type: 'always_available' },
  tasks: [],
  estimatedTimeMinutes: 5,
  required: true,
  allowSkip: false,
  allowRevisit: true,
});

const versionStation = (routeId, routeVersionId, id = 'station-1') => {
  const { draftId: _draftId, ...station } = draftStation(routeId, 'source-draft', id);
  return { ...station, routeVersionId };
};

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const existingRoute = route('route-a', 'org-a', 'creator-team', 'creator-a', 'draft-a');
    const approvedRoute = {
      ...route('route-approved', 'org-a', 'creator-team', 'creator-a', 'draft-approved'),
      status: 'approved', visibility: 'class', approvedVersionId: 'version-approved',
      latestSubmittedVersionId: 'version-approved',
    };
    await Promise.all([
      setDoc(doc(db, 'organizations', 'org-a'), { id: 'org-a', name: 'Organization A', status: 'active' }),
      setDoc(doc(db, 'organizations', 'org-b'), { id: 'org-b', name: 'Organization B', status: 'active' }),
      setDoc(doc(db, 'organizations', 'org-a', 'memberships', 'student-a'), membership('org-a', 'student-a')),
      setDoc(doc(db, 'organizations', 'org-a', 'memberships', 'teacher-a'), membership('org-a', 'teacher-a', 'teacher')),
      setDoc(doc(db, 'organizations', 'org-a', 'memberships', 'creator-a'), membership('org-a', 'creator-a')),
      setDoc(doc(db, 'organizations', 'org-a', 'memberships', 'manager-a'), membership('org-a', 'manager-a')),
      setDoc(doc(db, 'organizations', 'org-b', 'memberships', 'student-b'), membership('org-b', 'student-b')),
      setDoc(doc(db, 'teams', 'team-a'), team('team-a', 'org-a', 'teacher-a')),
      setDoc(doc(db, 'teams', 'team-a', 'members', 'teacher-a'), teamMember('team-a', 'teacher-a', ['manager'])),
      setDoc(doc(db, 'teams', 'creator-team'), team('creator-team', 'org-a', 'creator-a')),
      setDoc(doc(db, 'teams', 'creator-team', 'members', 'existing-member'), teamMember('creator-team', 'existing-member')),
      setDoc(doc(db, 'teams', 'managed-team'), team('managed-team', 'org-a', 'teacher-a')),
      setDoc(doc(db, 'teams', 'managed-team', 'members', 'manager-a'), teamMember('managed-team', 'manager-a', ['manager'])),
      setDoc(doc(db, 'teams', 'team-b'), team('team-b', 'org-b', 'student-b')),
      setDoc(doc(db, 'routes', 'route-a'), existingRoute),
      setDoc(doc(db, 'routes', 'route-approved'), approvedRoute),
      setDoc(doc(db, 'routes', 'route-approved', 'versions', 'version-approved'), {
        id: 'version-approved', routeId: 'route-approved', organizationId: 'org-a', ownerTeamId: 'creator-team',
        versionNumber: 1, sourceDraftId: 'draft-approved', content: { title: 'Approved route' },
        stationIds: ['station-approved'], createdByUserId: 'creator-a',
        submittedAt: new Date('2026-01-02T00:00:00.000Z'), status: 'approved', visibility: 'class',
      }),
      setDoc(doc(db, 'routes', 'route-approved', 'versions', 'version-approved', 'stations', 'station-approved'), {
        ...versionStation('route-approved', 'version-approved', 'station-approved'),
      }),
      setDoc(doc(db, 'routes', 'route-a', 'drafts', 'draft-a'), routeDraft(existingRoute, 'draft-a')),
      setDoc(doc(db, 'routes', 'route-a', 'drafts', 'other-draft'), routeDraft(existingRoute, 'other-draft')),
      setDoc(doc(db, 'routes', 'route-a', 'drafts', 'draft-a', 'stations', 'station-1'), draftStation('route-a', 'draft-a')),
      setDoc(doc(db, 'routes', 'route-a', 'versions', 'version-1'), {
        id: 'version-1', routeId: 'route-a', organizationId: 'org-a', ownerTeamId: 'creator-team',
        versionNumber: 1, sourceDraftId: 'draft-a', content: { title: 'Submitted route' },
        stationIds: ['station-1'], createdByUserId: 'creator-a', submittedAt: new Date('2026-01-02T00:00:00.000Z'),
        status: 'submitted', visibility: 'class',
      }),
      setDoc(doc(db, 'routes', 'route-a', 'versions', 'version-1', 'stations', 'station-1'), {
        ...versionStation('route-a', 'version-1'),
      }),
      setDoc(doc(db, 'routes', 'route-a', 'versions', 'version-1', 'answerKeys', 'task-1'), {
        id: 'task-1', recordType: 'task_answer', routeVersionId: 'version-1', stationId: 'station-1',
        taskId: 'task-1', validation: { kind: 'submission_only' }, pointsAwarded: 0,
      }),
      setDoc(doc(db, 'reviews', 'review-1'), {
        id: 'review-1', organizationId: 'org-a', routeId: 'route-a', routeVersionId: 'version-1',
        submittedByUserId: 'creator-a', submittedAt: new Date('2026-01-02T00:00:00.000Z'),
        status: 'pending', createdAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
      setDoc(doc(db, 'routeSessions', 'session-1'), {
        id: 'session-1', organizationId: 'org-a', routeId: 'route-a', routeVersionId: 'version-1',
        createdByUserId: 'teacher-a', title: 'Class session', mode: 'learning', status: 'active',
        createdAt: new Date('2026-01-03T00:00:00.000Z'), openedAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
      setDoc(doc(db, 'routeSessions', 'session-1', 'participations', 'student-a'), {
        id: 'session-1_student-a', sessionId: 'session-1', routeId: 'route-a', routeVersionId: 'version-1',
        participantUserId: 'student-a', status: 'active', startedAt: new Date('2026-01-03T00:00:00.000Z'),
        completedStationIds: [], progressPercentage: 0, score: 0, updatedAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
      setDoc(doc(db, 'routeSessions', 'session-1', 'participations', 'creator-a'), {
        id: 'session-1_creator-a', sessionId: 'session-1', routeId: 'route-a', routeVersionId: 'version-1',
        participantUserId: 'creator-a', status: 'active', startedAt: new Date('2026-01-03T00:00:00.000Z'),
        completedStationIds: [], progressPercentage: 0, score: 0, updatedAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
    ]);
  });
});

after(async () => {
  await environment.cleanup();
});

test('unauthenticated users cannot read organization data', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'organizations', 'org-a')));
});

test('member can read their organization and own membership', async () => {
  const db = environment.authenticatedContext('student-a').firestore();
  await assertSucceeds(getDoc(doc(db, 'organizations', 'org-a')));
  await assertSucceeds(getDoc(doc(db, 'organizations', 'org-a', 'memberships', 'student-a')));
});

test('member from another organization is denied', async () => {
  const db = environment.authenticatedContext('student-b').firestore();
  await assertFails(getDoc(doc(db, 'organizations', 'org-a')));
  await assertFails(getDoc(doc(db, 'teams', 'team-a')));
});

test('student cannot create or promote an organization membership', async () => {
  const db = environment.authenticatedContext('student-a').firestore();
  await assertFails(setDoc(
    doc(db, 'organizations', 'org-a', 'memberships', 'student-a'),
    membership('org-a', 'student-a', 'teacher'),
  ));
  await assertFails(setDoc(
    doc(db, 'organizations', 'org-a', 'memberships', 'new-user'),
    membership('org-a', 'new-user', 'teacher'),
  ));
});

test('team access respects the organization boundary', async () => {
  const sameOrganization = environment.authenticatedContext('student-a').firestore();
  const otherOrganization = environment.authenticatedContext('student-b').firestore();
  await assertSucceeds(getDoc(doc(sameOrganization, 'teams', 'team-a')));
  await assertFails(getDoc(doc(otherOrganization, 'teams', 'team-a')));
});

test('active creator can manage their own team', async () => {
  const db = environment.authenticatedContext('creator-a').firestore();
  await assertSucceeds(updateDoc(doc(db, 'teams', 'creator-team'), {
    name: 'Creator updated team',
    updatedAt: serverTimestamp(),
  }));
});

test('creator with inactive organization membership cannot update their team', async () => {
  await environment.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'organizations', 'org-a', 'memberships', 'creator-a'), {
      status: 'disabled',
    });
  });
  const db = environment.authenticatedContext('creator-a').firestore();
  await assertFails(updateDoc(doc(db, 'teams', 'creator-team'), {
    name: 'Unauthorized update',
    updatedAt: serverTimestamp(),
  }));
});

test('inactive creator cannot add, update, or delete team members', async () => {
  await environment.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'organizations', 'org-a', 'memberships', 'creator-a'), {
      status: 'disabled',
    });
  });
  const db = environment.authenticatedContext('creator-a').firestore();
  await assertFails(setDoc(
    doc(db, 'teams', 'creator-team', 'members', 'new-member'),
    teamMember('creator-team', 'new-member'),
  ));
  await assertFails(updateDoc(doc(db, 'teams', 'creator-team', 'members', 'existing-member'), {
    roles: ['writer'],
  }));
  await assertFails(deleteDoc(doc(db, 'teams', 'creator-team', 'members', 'existing-member')));
});

test('active team manager also requires active organization membership', async () => {
  const activeDb = environment.authenticatedContext('manager-a').firestore();
  await assertSucceeds(updateDoc(doc(activeDb, 'teams', 'managed-team'), {
    name: 'Manager update',
    updatedAt: serverTimestamp(),
  }));
  await environment.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'organizations', 'org-a', 'memberships', 'manager-a'), {
      status: 'disabled',
    });
  });
  const inactiveDb = environment.authenticatedContext('manager-a').firestore();
  await assertFails(updateDoc(doc(inactiveDb, 'teams', 'managed-team'), {
    name: 'Inactive manager update',
    updatedAt: serverTimestamp(),
  }));
});

test('unauthorized student cannot add themselves to an arbitrary team as manager', async () => {
  const db = environment.authenticatedContext('student-a').firestore();
  await assertFails(setDoc(
    doc(db, 'teams', 'team-a', 'members', 'student-a'),
    teamMember('team-a', 'student-a', ['manager']),
  ));
});

test('organization member can create a team and manage its initial membership', async () => {
  const db = environment.authenticatedContext('student-a').firestore();
  const batch = writeBatch(db);
  batch.set(doc(db, 'teams', 'student-team'), {
    ...team('student-team', 'org-a', 'student-a'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'teams', 'student-team', 'members', 'student-a'), {
    ...teamMember('student-team', 'student-a', ['manager']),
    joinedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
  await assertSucceeds(updateDoc(doc(db, 'teams', 'student-team'), {
    name: 'Updated student team',
    updatedAt: serverTimestamp(),
  }));
});

test('mismatched team and member identities are rejected', async () => {
  const db = environment.authenticatedContext('teacher-a').firestore();
  await assertFails(setDoc(
    doc(db, 'teams', 'wrong-path-id'),
    team('different-id', 'org-a', 'teacher-a'),
  ));
  await assertFails(setDoc(
    doc(db, 'teams', 'team-a', 'members', 'student-a'),
    teamMember('different-team', 'student-a'),
  ));
});

test('unauthenticated user cannot read or create routes', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'routes', 'route-a')));
  await assertFails(setDoc(
    doc(db, 'routes', 'new-route'),
    route('new-route', 'org-a', 'creator-team', 'creator-a'),
  ));
});

test('user from another organization cannot read route or draft', async () => {
  const db = environment.authenticatedContext('student-b').firestore();
  await assertFails(getDoc(doc(db, 'routes', 'route-a')));
  await assertFails(getDoc(doc(db, 'routes', 'route-a', 'drafts', 'draft-a')));
});

test('active authorized creator can create route, current draft, and station atomically', async () => {
  const db = environment.authenticatedContext('creator-a').firestore();
  const newRoute = route('direct-route', 'org-a', 'creator-team', 'creator-a', 'direct-draft');
  const batch = writeBatch(db);
  batch.set(doc(db, 'routes', newRoute.id), {
    ...newRoute,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'routes', newRoute.id, 'drafts', newRoute.currentDraftId), {
    ...routeDraft(newRoute),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'routes', newRoute.id, 'drafts', newRoute.currentDraftId, 'stations', 'station-1'),
    draftStation(newRoute.id, newRoute.currentDraftId));
  await assertSucceeds(batch.commit());
});

test('authorized creator cannot create a route without its declared current draft', async () => {
  const db = environment.authenticatedContext('creator-a').firestore();
  await assertFails(setDoc(
    doc(db, 'routes', 'orphan-route'),
    route('orphan-route', 'org-a', 'creator-team', 'creator-a', 'missing-draft'),
  ));
});

test('unrelated student in the same organization cannot edit another team route', async () => {
  const db = environment.authenticatedContext('student-a').firestore();
  await assertFails(updateDoc(doc(db, 'routes', 'route-a'), {
    title: 'Unauthorized title',
    updatedAt: serverTimestamp(),
  }));
});

test('manager of a different team cannot edit the route', async () => {
  const db = environment.authenticatedContext('manager-a').firestore();
  await assertFails(updateDoc(doc(db, 'routes', 'route-a'), {
    title: 'Wrong team manager update',
    updatedAt: serverTimestamp(),
  }));
});

test('route organizationId cannot be changed', async () => {
  const db = environment.authenticatedContext('creator-a').firestore();
  await assertFails(updateDoc(doc(db, 'routes', 'route-a'), { organizationId: 'org-b' }));
});

test('route ownerTeamId and currentDraftId cannot be changed by a client', async () => {
  const db = environment.authenticatedContext('creator-a').firestore();
  await assertFails(updateDoc(doc(db, 'routes', 'route-a'), { ownerTeamId: 'managed-team' }));
  await assertFails(updateDoc(doc(db, 'routes', 'route-a'), { currentDraftId: 'forged-draft' }));
});

test('client cannot self-approve or forge version pointers', async () => {
  const db = environment.authenticatedContext('creator-a').firestore();
  await assertFails(updateDoc(doc(db, 'routes', 'route-a'), { status: 'approved' }));
  await assertFails(updateDoc(doc(db, 'routes', 'route-a'), { approvedVersionId: 'forged-version' }));
  await assertFails(updateDoc(doc(db, 'routes', 'route-a'), { latestSubmittedVersionId: 'forged-version' }));
});

test('draft route identity must match the parent route', async () => {
  const db = environment.authenticatedContext('creator-a').firestore();
  const malformed = { ...routeDraft(route('other-route', 'org-a', 'creator-team', 'creator-a'), 'draft-a'), id: 'draft-a' };
  await assertFails(setDoc(doc(db, 'routes', 'route-a', 'drafts', 'draft-a'), malformed));
});

test('draft must correspond to route currentDraftId', async () => {
  const db = environment.authenticatedContext('creator-a').firestore();
  const existingRoute = route('route-a', 'org-a', 'creator-team', 'creator-a', 'draft-a');
  await assertFails(setDoc(
    doc(db, 'routes', 'route-a', 'drafts', 'other-draft'),
    routeDraft(existingRoute, 'other-draft'),
  ));
});

test('draft station identity must match route and draft path', async () => {
  const db = environment.authenticatedContext('creator-a').firestore();
  await assertFails(setDoc(
    doc(db, 'routes', 'route-a', 'drafts', 'draft-a', 'stations', 'station-2'),
    draftStation('other-route', 'draft-a', 'station-2'),
  ));
  await assertFails(setDoc(
    doc(db, 'routes', 'route-a', 'drafts', 'draft-a', 'stations', 'station-2'),
    draftStation('route-a', 'other-draft', 'station-2'),
  ));
  await assertFails(setDoc(
    doc(db, 'routes', 'route-a', 'drafts', 'other-draft', 'stations', 'station-2'),
    draftStation('route-a', 'other-draft', 'station-2'),
  ));
});

test('authorized creator can update normal draft content', async () => {
  const db = environment.authenticatedContext('creator-a').firestore();
  await assertSucceeds(updateDoc(doc(db, 'routes', 'route-a', 'drafts', 'draft-a'), {
    content: { title: 'Updated draft', subject: 'History' },
    updatedByUserId: 'creator-a',
    updatedAt: serverTimestamp(),
  }));
});

test('inactive organization member loses draft edit authority', async () => {
  await environment.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'organizations', 'org-a', 'memberships', 'creator-a'), {
      status: 'disabled',
    });
  });
  const db = environment.authenticatedContext('creator-a').firestore();
  await assertFails(updateDoc(doc(db, 'routes', 'route-a', 'drafts', 'draft-a'), {
    content: { title: 'Unauthorized draft edit' },
    updatedByUserId: 'creator-a',
    updatedAt: serverTimestamp(),
  }));
});

test('cross-organization team identity mismatch is rejected', async () => {
  const db = environment.authenticatedContext('student-b').firestore();
  await assertFails(setDoc(
    doc(db, 'routes', 'mismatched-route'),
    route('mismatched-route', 'org-a', 'team-b', 'student-b'),
  ));
});

test('authorized creator and same-organization teacher can read exact submitted workflow records', async () => {
  const creatorDb = environment.authenticatedContext('creator-a').firestore();
  const teacherDb = environment.authenticatedContext('teacher-a').firestore();
  await assertSucceeds(getDoc(doc(creatorDb, 'routes', 'route-a', 'versions', 'version-1')));
  await assertSucceeds(getDoc(doc(creatorDb, 'reviews', 'review-1')));
  await assertSucceeds(getDoc(doc(teacherDb, 'reviews', 'review-1')));
  await assertSucceeds(getDoc(doc(teacherDb, 'routes', 'route-a', 'versions', 'version-1', 'stations', 'station-1')));
  await assertSucceeds(getDocs(query(
    collection(teacherDb, 'reviews'),
    where('organizationId', '==', 'org-a'),
    where('status', '==', 'pending'),
    orderBy('submittedAt', 'desc'),
  )));
  await assertSucceeds(getDocs(query(
    collection(creatorDb, 'reviews'),
    where('routeId', '==', 'route-a'),
    orderBy('submittedAt', 'desc'),
  )));
});

test('teacher from another organization cannot read the review queue', async () => {
  const db = environment.authenticatedContext('teacher-b').firestore();
  await assertFails(getDocs(query(
    collection(db, 'reviews'),
    where('organizationId', '==', 'org-a'),
    where('status', '==', 'pending'),
    orderBy('submittedAt', 'desc'),
  )));
});

test('protected AnswerKeys are unreadable to participant, creator, and teacher clients', async () => {
  for (const userId of ['student-a', 'creator-a', 'teacher-a']) {
    const db = environment.authenticatedContext(userId).firestore();
    await assertFails(getDoc(doc(db, 'routes', 'route-a', 'versions', 'version-1', 'answerKeys', 'task-1')));
  }
});

test('ordinary clients cannot create or mutate version and review workflow records', async () => {
  const creatorDb = environment.authenticatedContext('creator-a').firestore();
  const teacherDb = environment.authenticatedContext('teacher-a').firestore();
  await assertFails(setDoc(doc(creatorDb, 'routes', 'route-a', 'versions', 'forged-version'), {
    id: 'forged-version', routeId: 'route-a', status: 'approved',
  }));
  await assertFails(updateDoc(doc(creatorDb, 'routes', 'route-a', 'versions', 'version-1'), {
    status: 'approved',
  }));
  await assertFails(updateDoc(doc(teacherDb, 'reviews', 'review-1'), { status: 'approved' }));
});

test('same-organization participant reads session and own participation only', async () => {
  const db = environment.authenticatedContext('student-a').firestore();
  await assertSucceeds(getDoc(doc(db, 'routeSessions', 'session-1')));
  await assertSucceeds(getDoc(doc(db, 'routeSessions', 'session-1', 'participations', 'student-a')));
  await assertFails(getDoc(doc(db, 'routeSessions', 'session-1', 'participations', 'creator-a')));
});

test('participant reads only the route current approved public version while protected data stays denied', async () => {
  const db = environment.authenticatedContext('student-a').firestore();
  await assertSucceeds(getDoc(doc(db, 'routes', 'route-approved', 'versions', 'version-approved')));
  await assertSucceeds(getDoc(doc(db, 'routes', 'route-approved', 'versions', 'version-approved', 'stations', 'station-approved')));
  await assertFails(getDoc(doc(db, 'routes', 'route-a', 'versions', 'version-1')));
  await assertFails(getDoc(doc(db, 'routes', 'route-approved', 'versions', 'version-approved', 'answerKeys', 'task-1')));
});

test('same-organization teacher can inspect participation summaries', async () => {
  const db = environment.authenticatedContext('teacher-a').firestore();
  await assertSucceeds(getDocs(collection(db, 'routeSessions', 'session-1', 'participations')));
});

test('cross-organization and inactive users cannot read sessions or participations', async () => {
  const crossOrg = environment.authenticatedContext('student-b').firestore();
  await assertFails(getDoc(doc(crossOrg, 'routeSessions', 'session-1')));
  await assertFails(getDoc(doc(crossOrg, 'routeSessions', 'session-1', 'participations', 'student-a')));
  await environment.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'organizations', 'org-a', 'memberships', 'student-a'), { status: 'disabled' });
  });
  const inactive = environment.authenticatedContext('student-a').firestore();
  await assertFails(getDoc(doc(inactive, 'routeSessions', 'session-1')));
  await assertFails(getDoc(doc(inactive, 'routeSessions', 'session-1', 'participations', 'student-a')));
});

test('ordinary clients cannot create sessions or mutate participation identity, score, or progress', async () => {
  const participantDb = environment.authenticatedContext('student-a').firestore();
  const teacherDb = environment.authenticatedContext('teacher-a').firestore();
  await assertFails(setDoc(doc(teacherDb, 'routeSessions', 'forged-session'), {
    id: 'forged-session', organizationId: 'org-a', routeId: 'route-a', routeVersionId: 'version-1',
    createdByUserId: 'teacher-a', title: 'Forged', mode: 'learning', status: 'open',
  }));
  const participationRef = doc(participantDb, 'routeSessions', 'session-1', 'participations', 'student-a');
  await assertFails(updateDoc(participationRef, { score: 99 }));
  await assertFails(updateDoc(participationRef, { routeVersionId: 'other-version' }));
  await assertFails(updateDoc(participationRef, { completedStationIds: ['station-1'], progressPercentage: 100 }));
});
