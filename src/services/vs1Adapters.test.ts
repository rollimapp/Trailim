import assert from 'node:assert/strict';
import test from 'node:test';
import type { Route, Station, Task } from '../types';
import { createRouteVersionSnapshot, splitLegacyTask, toRouteDraft } from './vs1Adapters.ts';

const protectedTask: Task = {
  id: 'task-1',
  type: 'multiple_choice',
  prompt: 'Which answer is correct?',
  options: [
    { id: 'a', text: 'Answer A', isCorrect: true, explanation: 'Protected explanation' },
    { id: 'b', text: 'Answer B', isCorrect: false },
  ],
  correctAnswers: ['Answer A'],
  acceptableAnswers: ['A'],
  points: 25,
  attemptLimit: 2,
  allowRetry: true,
  penaltyPerAttempt: 5,
  required: true,
};

const station: Station = {
  id: 'station-1',
  routeId: 'route-1',
  title: 'Station One',
  shortLabel: 'Station 1',
  description: 'A station',
  position: 1,
  stationType: 'question',
  contentBlocks: [],
  trigger: { type: 'access_code', accessCode: 'SECRET', QRCodeValue: 'SECRET-QR' },
  tasks: [protectedTask],
  possiblePoints: 25,
  estimatedTimeMinutes: 5,
  required: true,
  allowSkip: false,
  allowRevisit: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const route = {
  id: 'route-1',
  title: 'Route One',
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
  totalPossiblePoints: 25,
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
} satisfies Route;

test('splitLegacyTask removes protected answers and scoring authority from the public task', () => {
  const { publicTask, answerKey } = splitLegacyTask(protectedTask, 'version-1', station.id);
  const serializedPublicTask = JSON.stringify(publicTask);

  assert.deepEqual(publicTask.options, [
    { id: 'a', text: 'Answer A' },
    { id: 'b', text: 'Answer B' },
  ]);
  assert.equal(serializedPublicTask.includes('isCorrect'), false);
  assert.equal(serializedPublicTask.includes('correctAnswers'), false);
  assert.equal(serializedPublicTask.includes('acceptableAnswers'), false);
  assert.equal(serializedPublicTask.includes('Protected explanation'), false);
  assert.equal(serializedPublicTask.includes('attemptLimit'), false);
  assert.equal(serializedPublicTask.includes('penaltyPerAttempt'), false);
  assert.deepEqual(answerKey.validation, { kind: 'option_ids', correctOptionIds: ['a'] });
  assert.equal(answerKey.pointsAwarded, 25);
  assert.equal(answerKey.penaltyPerAttempt, 5);
  assert.deepEqual(answerKey.explanationByOptionId, { a: 'Protected explanation' });
});

test('createRouteVersionSnapshot freezes an independent public snapshot and protected answer keys', () => {
  const draft = toRouteDraft(route, [station]);
  const snapshot = createRouteVersionSnapshot({
    draft,
    legacyStations: [station],
    versionId: 'version-1',
    versionNumber: 1,
    submittedByUserId: 'student-1',
    submittedAt: '2026-02-01T00:00:00.000Z',
    visibility: 'class',
  });

  route.title = 'Edited after submit';
  station.title = 'Edited station after submit';
  protectedTask.options![0].text = 'Edited answer after submit';

  assert.equal(snapshot.version.content.title, 'Route One');
  assert.deepEqual(snapshot.version.stationIds, ['station-1']);
  assert.equal(snapshot.stations[0].title, 'Station One');
  assert.equal(snapshot.stations[0].tasks[0].options![0].text, 'Answer A');
  assert.equal(JSON.stringify(snapshot.stations).includes('SECRET'), false);
  assert.equal(JSON.stringify(snapshot.stations).includes('isCorrect'), false);
  assert.equal(snapshot.answerKeys[0].routeVersionId, 'version-1');
  assert.deepEqual(snapshot.answerKeys[0].validation, { kind: 'option_ids', correctOptionIds: ['a'] });
});
