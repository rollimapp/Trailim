import assert from 'node:assert/strict';
import test from 'node:test';
import type { Route, Station } from '../types/index.ts';
import { toRouteDraft, toVs1Route } from './vs1Adapters.ts';
import { type StorageLike, Vs1WorkflowRepository } from './vs1WorkflowRepository.ts';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) || null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const createLegacyFixture = (): { legacyRoute: Route; legacyStations: Station[] } => {
  const legacyStations: Station[] = [{
    id: 'station-1',
    routeId: 'route-1',
    title: 'Original station title',
    shortLabel: 'Station 1',
    description: 'A station',
    position: 1,
    stationType: 'question',
    contentBlocks: [],
    trigger: { type: 'always_available' },
    tasks: [{
      id: 'task-1',
      type: 'multiple_choice',
      prompt: 'Choose one',
      options: [
        { id: 'a', text: 'Correct', isCorrect: true },
        { id: 'b', text: 'Incorrect', isCorrect: false },
      ],
      points: 10,
      required: true,
    }],
    possiblePoints: 10,
    estimatedTimeMinutes: 5,
    required: true,
    allowSkip: false,
    allowRevisit: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }];
  const legacyRoute: Route = {
    id: 'route-1',
    title: 'Original route title',
    shortDescription: 'Short',
    fullDescription: 'Full',
    coverImageUrl: '',
    creatorId: 'student-1',
    creatorDisplayName: 'Student',
    creatorRole: 'student',
    organizationId: 'org-1',
    creatorTeamId: 'team-1',
    routeType: 'educational_tour',
    supportedModes: ['learning'],
    defaultMode: 'learning',
    subject: 'History',
    topics: ['History'],
    tags: [],
    learningObjectives: ['Observe'],
    skills: [],
    ageGroups: ['12-14'],
    recommendedGradeLevels: ['7'],
    language: 'en',
    estimatedDurationMinutes: 30,
    estimatedDistanceKm: 1,
    difficulty: 'easy',
    environmentType: 'outdoor',
    accessibilityInformation: '',
    safetyInstructions: '',
    requiredEquipment: [],
    participantInstructions: '',
    startLocation: { latitude: 1, longitude: 2 },
    stationOrderMode: 'linear',
    stationIds: ['station-1'],
    totalPossiblePoints: 10,
    visibility: 'class',
    publishingStatus: 'draft',
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    likesCount: 0,
    ratingsCount: 0,
    ratingAverage: 0,
    savesCount: 0,
    launchesCount: 0,
    completionsCount: 0,
    expertLikesCount: 0,
    teacherApproved: false,
    featuredStatus: false,
    allowGuestAccess: false,
    allowRouteDuplication: false,
    allowRouteRemixing: false,
    offlineAvailability: false,
    requiresLocationPermission: false,
    currentDraftVersionId: 'draft-route-1',
  };
  return { legacyRoute, legacyStations };
};

const createHarness = () => {
  let tick = 0;
  const repository = new Vs1WorkflowRepository(
    new MemoryStorage(),
    () => `2026-03-01T00:00:0${tick++}.000Z`,
    kind => `${kind}-${tick}`,
  );
  const { legacyRoute, legacyStations } = createLegacyFixture();
  const route = toVs1Route(legacyRoute);
  const draft = toRouteDraft(legacyRoute, legacyStations);
  repository.saveRoute(route);
  repository.saveDraft(draft);
  return { repository, legacyRoute, legacyStations, route, draft };
};

test('resubmit creates V2 while V1 content remains immutable', () => {
  const harness = createHarness();
  const first = harness.repository.submitDraft(
    harness.route, harness.draft, harness.legacyStations, 'student-1', 'class',
  );
  harness.repository.requestChanges(first.review.id, 'teacher-1', 'Revise station one');

  const revisedStations = structuredClone(harness.legacyStations);
  revisedStations[0].title = 'Revised station title';
  const revisedRoute = structuredClone(harness.legacyRoute);
  revisedRoute.title = 'Revised route title';
  const revisedDraft = toRouteDraft(revisedRoute, revisedStations);
  const second = harness.repository.resubmit(
    harness.route.id, revisedDraft, revisedStations, 'student-1', 'class',
  );

  assert.equal(first.snapshot.version.versionNumber, 1);
  assert.equal(second.snapshot.version.versionNumber, 2);
  assert.notEqual(second.snapshot.version.id, first.snapshot.version.id);
  assert.equal(second.snapshot.version.basedOnVersionId, first.snapshot.version.id);
  assert.equal(harness.repository.getParticipantSnapshot(first.snapshot.version.id)!.stations[0].title, harness.legacyStations[0].title);
  assert.equal(harness.repository.getParticipantSnapshot(second.snapshot.version.id)!.stations[0].title, 'Revised station title');
});

test('each review is bound to the exact submitted version', () => {
  const harness = createHarness();
  const submission = harness.repository.submitDraft(
    harness.route, harness.draft, harness.legacyStations, 'student-1', 'school',
  );

  assert.equal(submission.review.routeVersionId, submission.snapshot.version.id);
  assert.equal(harness.repository.getReview(submission.review.id)!.routeVersionId, submission.snapshot.version.id);
});

test('approval targets the latest pending version and updates route summary', () => {
  const harness = createHarness();
  const first = harness.repository.submitDraft(
    harness.route, harness.draft, harness.legacyStations, 'student-1', 'class',
  );
  harness.repository.requestChanges(first.review.id, 'teacher-1', 'Changes needed');
  const second = harness.repository.resubmit(
    harness.route.id, harness.draft, harness.legacyStations, 'student-1', 'class',
  );

  assert.throws(
    () => harness.repository.approveVersion(first.snapshot.version.id, 'teacher-1', 'Wrong version'),
    /latest pending submission/,
  );
  const approved = harness.repository.approveVersion(second.snapshot.version.id, 'teacher-1', 'Approved');
  assert.equal(approved.route.approvedVersionId, second.snapshot.version.id);
  assert.equal(approved.route.status, 'approved');
  assert.equal(approved.review.routeVersionId, second.snapshot.version.id);
  assert.equal(harness.repository.getVersion(first.snapshot.version.id)!.status, 'changes_requested');
});

test('protected answer keys are stored outside participant-visible snapshots', () => {
  const harness = createHarness();
  const submission = harness.repository.submitDraft(
    harness.route, harness.draft, harness.legacyStations, 'student-1', 'class',
  );
  const participantSnapshot = harness.repository.getParticipantSnapshot(submission.snapshot.version.id)!;
  const answerKeys = harness.repository.getAnswerKeys(submission.snapshot.version.id);

  assert.equal('answerKeys' in participantSnapshot, false);
  assert.equal(JSON.stringify(participantSnapshot).includes('isCorrect'), false);
  assert.ok(answerKeys.length > 0);
  assert.ok(answerKeys.some(key => key.validation.kind === 'option_ids'));
});
