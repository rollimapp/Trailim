import { Timestamp, collection, doc, getDoc, getDocs, orderBy, query, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { Participation, Vs1RouteSession } from '../../types/vs1';
import { getFirebaseServices } from './firebaseClient';

const timestamp = (value: unknown, field: string) => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  throw new Error(`Malformed Firestore session document: ${field} must be a timestamp`);
};

const sessionFromSnapshot = (snapshot: QueryDocumentSnapshot<DocumentData>): Vs1RouteSession => {
  const value = snapshot.data();
  if (value.id !== snapshot.id) throw new Error('Malformed Firestore RouteSession identity');
  return {
    ...value,
    createdAt: timestamp(value.createdAt, 'createdAt'),
    openedAt: value.openedAt ? timestamp(value.openedAt, 'openedAt') : undefined,
    completedAt: value.completedAt ? timestamp(value.completedAt, 'completedAt') : undefined,
  } as Vs1RouteSession;
};

const participationFromSnapshot = (sessionId: string, snapshot: QueryDocumentSnapshot<DocumentData>): Participation => {
  const value = snapshot.data();
  if (value.sessionId !== sessionId || value.participantUserId !== snapshot.id || value.id !== `${sessionId}_${snapshot.id}`) {
    throw new Error('Malformed Firestore Participation identity');
  }
  return {
    ...value,
    currentStationId: value.currentStationId || undefined,
    startedAt: timestamp(value.startedAt, 'startedAt'),
    completedAt: value.completedAt ? timestamp(value.completedAt, 'completedAt') : undefined,
    updatedAt: timestamp(value.updatedAt, 'updatedAt'),
  } as Participation;
};

export class FirestoreSessionParticipationRepository {
  async getSession(sessionId: string): Promise<Vs1RouteSession | null> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDoc(doc(firestore, 'routeSessions', sessionId));
    return snapshot.exists() ? sessionFromSnapshot(snapshot) : null;
  }

  async listManagedSessions(organizationId: string, createdByUserId: string): Promise<Vs1RouteSession[]> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDocs(query(
      collection(firestore, 'routeSessions'),
      where('organizationId', '==', organizationId),
      where('createdByUserId', '==', createdByUserId),
      orderBy('createdAt', 'desc'),
    ));
    return snapshot.docs.map(sessionFromSnapshot);
  }

  async getOwnParticipation(sessionId: string, participantUserId: string): Promise<Participation | null> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDoc(doc(firestore, 'routeSessions', sessionId, 'participations', participantUserId));
    return snapshot.exists() ? participationFromSnapshot(sessionId, snapshot) : null;
  }

  async listSessionParticipations(sessionId: string): Promise<Participation[]> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDocs(query(
      collection(firestore, 'routeSessions', sessionId, 'participations'),
      orderBy('startedAt'),
    ));
    return snapshot.docs.map(item => participationFromSnapshot(sessionId, item));
  }
}

export const firestoreSessionParticipationRepository = new FirestoreSessionParticipationRepository();
