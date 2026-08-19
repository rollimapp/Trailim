import assert from 'node:assert/strict';
import test from 'node:test';
import type { AnswerKey, RouteVersionSnapshotBundle, Vs1RouteVersion } from '../types/vs1.ts';
import type { StorageLike } from './vs1WorkflowRepository.ts';
import { Vs1SessionRepository } from './vs1SessionRepository.ts';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) || null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const createHarness = (status: Vs1RouteVersion['status'] = 'approved') => {
  let id = 0;
  let time = 0;
  const version: Vs1RouteVersion = {
    id: 'version-1', routeId: 'route-1', organizationId: 'org-1', ownerTeamId: 'team-1',
    versionNumber: 1, sourceDraftId: 'draft-1', content: {
      title: 'Route', shortDescription: 'Short', fullDescription: 'Full', supportedModes: ['learning'],
      defaultMode: 'learning', subject: 'History', topics: [], learningObjectives: [], ageGroups: [],
      language: 'en', estimatedDurationMinutes: 10, estimatedDistanceKm: 1, difficulty: 'easy',
      accessibilityInformation: '', safetyInstructions: '', participantInstructions: '',
      startLocation: { latitude: 1, longitude: 2 }, stationOrderMode: 'linear',
    }, stationIds: ['station-1'], createdByUserId: 'student-1', submittedAt: '2026-01-01T00:00:00.000Z',
    status, visibility: 'class',
  };
  const snapshot: Omit<RouteVersionSnapshotBundle, 'answerKeys'> = {
    version,
    stations: [{
      id: 'station-1', routeId: 'route-1', routeVersionId: version.id, title: 'Station', shortLabel: 'S1',
      description: 'Description', position: 1, stationType: 'question', contentBlocks: [],
      trigger: { type: 'always_available' }, tasks: [{
        id: 'task-1', type: 'multiple_choice', prompt: 'Choose', options: [
          { id: 'a', text: 'A' }, { id: 'b', text: 'B' },
        ], required: true, displayPoints: 10,
      }], estimatedTimeMinutes: 5, required: true, allowSkip: false, allowRevisit: true,
    }],
  };
  const answerKeys: AnswerKey[] = [{
    id: 'answer-1', routeVersionId: version.id, stationId: 'station-1', taskId: 'task-1',
    validation: { kind: 'option_ids', correctOptionIds: ['a'] }, pointsAwarded: 10,
    allowRetry: false, penaltyPerAttempt: 0,
  }];
  const source = {
    getVersion: (versionId: string) => versionId === version.id ? structuredClone(version) : null,
    getParticipantSnapshot: (versionId: string) => versionId === version.id ? structuredClone(snapshot) : null,
    getAnswerKeys: (versionId: string) => versionId === version.id ? structuredClone(answerKeys) : [],
  };
  const repository = new Vs1SessionRepository(
    new MemoryStorage(), source,
    () => `2026-04-01T00:00:${String(time++).padStart(2, '0')}.000Z`,
    kind => `${kind}-${++id}`,
  );
  const createSession = () => repository.createSession({
    routeId: version.routeId, routeVersionId: version.id, organizationId: version.organizationId,
    createdByUserId: 'teacher-1', title: 'Class Session', mode: 'learning',
  });
  return { repository, version, createSession };
};

test('RouteSession cannot target an unapproved RouteVersion', () => {
  const harness = createHarness('submitted');
  assert.throws(() => harness.createSession(), /not approved/);
});

test('sessions remain separately and permanently bound to the approved version', () => {
  const harness = createHarness();
  const first = harness.createSession();
  const second = harness.createSession();
  assert.notEqual(first.id, second.id);
  assert.equal(harness.repository.getSession(first.id)!.routeVersionId, harness.version.id);
  assert.equal(harness.repository.getSession(second.id)!.routeVersionId, harness.version.id);
  harness.repository.updateSessionStatus(first.id, 'completed');
  assert.equal(harness.repository.getSession(first.id)!.routeVersionId, harness.version.id);
});

test('same user in two sessions has isolated participation, responses, and completion', () => {
  const harness = createHarness();
  const firstSession = harness.createSession();
  const secondSession = harness.createSession();
  const first = harness.repository.joinSession(firstSession.id, 'participant-1');
  const second = harness.repository.joinSession(secondSession.id, 'participant-1');

  assert.notEqual(first.id, second.id);
  harness.repository.submitTaskResponse({ participationId: first.id, stationId: 'station-1', taskId: 'task-1', answer: 'a' });
  harness.repository.submitTaskResponse({ participationId: second.id, stationId: 'station-1', taskId: 'task-1', answer: 'b' });
  const firstState = harness.repository.getParticipantState(firstSession.id, 'participant-1')!;
  const secondState = harness.repository.getParticipantState(secondSession.id, 'participant-1')!;
  assert.notEqual(firstState.responses[0].id, secondState.responses[0].id);
  assert.equal(firstState.responses[0].pointsAwarded, 10);
  assert.equal(secondState.responses[0].pointsAwarded, 0);

  harness.repository.completeParticipation(first.id, {
    currentStationId: 'station-1', completedStationIds: ['station-1'], progressPercentage: 100, score: 10,
  });
  assert.equal(harness.repository.getParticipation(firstSession.id, 'participant-1')!.status, 'completed');
  assert.equal(harness.repository.getParticipation(secondSession.id, 'participant-1')!.status, 'active');
});

test('progress persists and resumes only for the matching session participation', () => {
  const harness = createHarness();
  const session = harness.createSession();
  const participation = harness.repository.joinSession(session.id, 'participant-1');
  harness.repository.updateProgress(participation.id, {
    currentStationId: 'station-1', completedStationIds: ['station-1'], progressPercentage: 50, score: 7,
  });

  const resumed = harness.repository.joinSession(session.id, 'participant-1');
  assert.equal(resumed.id, participation.id);
  assert.deepEqual(resumed.completedStationIds, ['station-1']);
  assert.equal(resumed.score, 7);
});

test('participant-facing state never exposes protected AnswerKeys', () => {
  const harness = createHarness();
  const session = harness.createSession();
  harness.repository.joinSession(session.id, 'participant-1');
  const state = harness.repository.getParticipantState(session.id, 'participant-1')!;

  assert.equal('answerKeys' in state, false);
  assert.equal(JSON.stringify(state).includes('correctOptionIds'), false);
  assert.equal(JSON.stringify(state.snapshot).includes('isCorrect'), false);
});

test('learning and challenge sessions for the same user and version remain separate', () => {
  const harness = createHarness();
  const learningSession = harness.createSession();
  const challengeSession = harness.repository.createSession({
    routeId: harness.version.routeId,
    routeVersionId: harness.version.id,
    organizationId: harness.version.organizationId,
    createdByUserId: 'teacher-1',
    title: 'Challenge Session',
    mode: 'challenge',
  });
  const learningParticipation = harness.repository.joinSession(learningSession.id, 'participant-1');
  const challengeParticipation = harness.repository.joinSession(challengeSession.id, 'participant-1');

  assert.equal(
    harness.repository.findActiveParticipation(harness.version.id, 'participant-1', 'learning')!.participation.id,
    learningParticipation.id,
  );
  assert.equal(
    harness.repository.findActiveParticipation(harness.version.id, 'participant-1', 'challenge')!.participation.id,
    challengeParticipation.id,
  );
  assert.notEqual(learningParticipation.id, challengeParticipation.id);
});

test('completed or cancelled parent sessions reject participant writes', () => {
  for (const status of ['completed', 'cancelled'] as const) {
    const harness = createHarness();
    const session = harness.createSession();
    const participation = harness.repository.joinSession(session.id, 'participant-1');
    harness.repository.updateSessionStatus(session.id, status);

    assert.throws(() => harness.repository.updateProgress(participation.id, {
      currentStationId: 'station-1', completedStationIds: [], progressPercentage: 0, score: 0,
    }), /parent session is not active/);
    assert.throws(() => harness.repository.submitTaskResponse({
      participationId: participation.id, stationId: 'station-1', taskId: 'task-1', answer: 'a',
    }), /parent session is not active/);
    assert.throws(() => harness.repository.completeParticipation(participation.id, {
      currentStationId: 'station-1', completedStationIds: ['station-1'], progressPercentage: 100, score: 10,
    }), /parent session is not active/);
  }
});

test('session lifecycle cannot reopen or reactivate a terminal session', () => {
  for (const terminalStatus of ['completed', 'cancelled'] as const) {
    const harness = createHarness();
    const session = harness.createSession();
    harness.repository.joinSession(session.id, 'participant-1');
    harness.repository.updateSessionStatus(session.id, terminalStatus);

    assert.throws(
      () => harness.repository.updateSessionStatus(session.id, 'active'),
      new RegExp(`invalid ${terminalStatus} to active transition`),
    );
    assert.equal(harness.repository.getSession(session.id)!.status, terminalStatus);
  }
});
