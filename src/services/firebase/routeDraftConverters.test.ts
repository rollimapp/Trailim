import assert from 'node:assert/strict';
import test from 'node:test';
import { Timestamp } from 'firebase/firestore';
import type { RouteDraft, RouteStationDraft } from '../../types/vs1.ts';
import {
  draftAuthoringWriteData,
  draftStationConverter,
  draftStationWriteData,
  draftWriteData,
  routeConverter,
} from './routeDraftConverters.ts';

const fakeSnapshot = (id: string, value: Record<string, unknown>) => ({
  id,
  data: () => value,
}) as never;

test('draft adapter stores stations separately with explicit draft identity', () => {
  const station = { id: 'station-1', routeId: 'route-1' } as RouteStationDraft;
  const draft = {
    id: 'draft-1',
    routeId: 'route-1',
    organizationId: 'org-1',
    ownerTeamId: 'team-1',
    content: {},
    stations: [station],
    updatedByUserId: 'user-1',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as RouteDraft;

  const storedDraft = draftWriteData(draft);
  const storedStation = draftStationWriteData(station, draft.id);
  assert.equal('stations' in storedDraft, false);
  assert.equal(storedStation.draftId, draft.id);
  assert.equal(storedStation.routeId, draft.routeId);
});

test('authoring draft updates cannot clear or replace protected workflow metadata', () => {
  const draft = {
    id: 'draft-1',
    routeId: 'route-1',
    organizationId: 'org-1',
    ownerTeamId: 'team-1',
    basedOnVersionId: 'version-1',
    content: { title: 'Edited title' },
    stations: [],
    updatedByUserId: 'user-1',
    updatedAt: '2026-01-02T00:00:00.000Z',
  } as RouteDraft;

  const update = draftAuthoringWriteData(draft);
  assert.deepEqual(Object.keys(update).sort(), ['content', 'updatedAt', 'updatedByUserId']);
  assert.equal('basedOnVersionId' in update, false);
  assert.equal('routeId' in update, false);
  assert.equal('ownerTeamId' in update, false);
});

test('route converter rejects an id that does not match the document path', () => {
  assert.throws(() => routeConverter.fromFirestore(fakeSnapshot('route-1', {
    id: 'route-2',
    organizationId: 'org-1',
    ownerTeamId: 'team-1',
    currentDraftId: 'draft-1',
    createdByUserId: 'user-1',
    title: 'Route',
    status: 'draft',
    visibility: 'private',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }), {}), /id does not match document path/);
});

test('draft station converter rejects mismatched route or draft identity', () => {
  const converter = draftStationConverter('route-1', 'draft-1');
  assert.throws(() => converter.fromFirestore(fakeSnapshot('station-1', {
    id: 'station-1',
    routeId: 'route-1',
    draftId: 'other-draft',
  }), {}), /identity does not match document path/);
});
