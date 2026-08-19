import {
  Timestamp,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore';
import type { RouteDraft, RouteStationDraft, Vs1Route } from '../../types/vs1';

const toIsoString = (value: unknown, field: string): string => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  throw new Error(`Malformed Firestore document: ${field} must be a timestamp`);
};

const withoutUndefined = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(withoutUndefined);
  if (value && typeof value === 'object' && !(value instanceof Timestamp)) {
    return Object.fromEntries(
      Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, withoutUndefined(item)]),
    );
  }
  return value;
};

const requireString = (value: DocumentData, field: string): string => {
  if (typeof value[field] !== 'string' || value[field].length === 0) {
    throw new Error(`Malformed Firestore document: ${field} must be a non-empty string`);
  }
  return value[field];
};

const requireArray = (value: DocumentData, field: string) => {
  if (!Array.isArray(value[field])) {
    throw new Error(`Malformed Firestore document: ${field} must be an array`);
  }
};

export const routeWriteData = (route: Vs1Route, create: boolean): DocumentData => withoutUndefined({
  ...route,
  createdAt: create ? Timestamp.fromDate(new Date(route.createdAt)) : route.createdAt,
  updatedAt: Timestamp.fromDate(new Date(route.updatedAt)),
}) as DocumentData;

export const draftWriteData = (draft: RouteDraft): DocumentData => withoutUndefined({
  ...draft,
  stations: undefined,
  updatedAt: Timestamp.fromDate(new Date(draft.updatedAt)),
}) as DocumentData;

export const draftStationWriteData = (station: RouteStationDraft, draftId: string): DocumentData =>
  withoutUndefined({ ...station, draftId }) as DocumentData;

export const routeConverter: FirestoreDataConverter<Vs1Route> = {
  toFirestore: route => routeWriteData(route as Vs1Route, true),
  fromFirestore: (snapshot, options) => {
    const value = snapshot.data(options);
    if (requireString(value, 'id') !== snapshot.id) {
      throw new Error('Malformed Firestore route: id does not match document path');
    }
    requireString(value, 'organizationId');
    requireString(value, 'ownerTeamId');
    requireString(value, 'currentDraftId');
    requireString(value, 'createdByUserId');
    requireString(value, 'title');
    if (!['draft', 'in_review', 'changes_requested', 'approved', 'archived'].includes(value.status)) {
      throw new Error('Malformed Firestore route: invalid status');
    }
    if (!['private', 'class', 'school'].includes(value.visibility)) {
      throw new Error('Malformed Firestore route: invalid visibility');
    }
    return {
      ...value,
      createdAt: toIsoString(value.createdAt, 'createdAt'),
      updatedAt: toIsoString(value.updatedAt, 'updatedAt'),
    } as Vs1Route;
  },
};

export const routeDraftConverter = (routeId: string): FirestoreDataConverter<Omit<RouteDraft, 'stations'>> => ({
  toFirestore: draft => draftWriteData(draft as RouteDraft),
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions) => {
    const value = snapshot.data(options);
    if (requireString(value, 'id') !== snapshot.id || requireString(value, 'routeId') !== routeId) {
      throw new Error('Malformed Firestore draft: route or draft identity does not match document path');
    }
    requireString(value, 'organizationId');
    requireString(value, 'ownerTeamId');
    requireString(value, 'updatedByUserId');
    if (!value.content || typeof value.content !== 'object' || Array.isArray(value.content)) {
      throw new Error('Malformed Firestore draft: content must be an object');
    }
    return {
      ...value,
      updatedAt: toIsoString(value.updatedAt, 'updatedAt'),
    } as Omit<RouteDraft, 'stations'>;
  },
});

export const draftStationConverter = (
  routeId: string,
  draftId: string,
): FirestoreDataConverter<RouteStationDraft> => ({
  toFirestore: station => draftStationWriteData(station as RouteStationDraft, draftId),
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions) => {
    const value = snapshot.data(options);
    if (
      requireString(value, 'id') !== snapshot.id ||
      requireString(value, 'routeId') !== routeId ||
      requireString(value, 'draftId') !== draftId
    ) {
      throw new Error('Malformed Firestore draft station: identity does not match document path');
    }
    requireString(value, 'title');
    if (!Number.isInteger(value.position)) {
      throw new Error('Malformed Firestore draft station: position must be an integer');
    }
    requireArray(value, 'contentBlocks');
    requireArray(value, 'tasks');
    if (!value.trigger || typeof value.trigger !== 'object' || Array.isArray(value.trigger)) {
      throw new Error('Malformed Firestore draft station: trigger must be an object');
    }
    const { draftId: _draftId, ...station } = value;
    return station as RouteStationDraft;
  },
});
