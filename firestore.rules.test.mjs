import fs from 'node:fs';
import test, { after, before, beforeEach } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

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
