import { Timestamp, collection, doc, getDoc, getDocs, orderBy, query, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { Participation, Vs1RouteSession, Vs1TaskResponse } from '../../types/vs1';
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

const responseFromSnapshot = (sessionId: string, participationId: string, snapshot: QueryDocumentSnapshot<DocumentData>): Vs1TaskResponse => {
  const value = snapshot.data();
  if (value.id !== snapshot.id || value.sessionId !== sessionId || value.participationId !== participationId) {
    throw new Error('Malformed Firestore TaskResponse identity');
  }
  return {
    ...value,
    submittedAt: timestamp(value.submittedAt, 'submittedAt'),
    updatedAt: timestamp(value.updatedAt, 'updatedAt'),
  } as Vs1TaskResponse;
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


  async listOwnResponses(sessionId: string, participantUserId: string): Promise<Vs1TaskResponse[]> {
    const { firestore } = getFirebaseServices();
    const participationId = `${sessionId}_${participantUserId}`;
    const snapshot = await getDocs(query(
      collection(firestore, 'routeSessions', sessionId, 'participations', participantUserId, 'responses'),
      orderBy('updatedAt'),
    ));
    const list = snapshot.docs.map(item => responseFromSnapshot(sessionId, participationId, item));
    await Promise.all(snapshot.docs.map(async (item, index) => {
      const data = item.data();
      if (data.revealPolicy && data.revealPolicy !== 'immediate') {
        const response = list[index];
        try {
          const privateSnap = await getDoc(doc(
            firestore,
            'routeSessions',
            sessionId,
            'participations',
            participantUserId,
            'responses',
            response.id,
            'privateEvaluation',
            'record'
          ));
          if (privateSnap.exists()) {
            const privateData = privateSnap.data();
            response.isCorrect = privateData.isCorrect;
            response.pointsAwarded = privateData.pointsAwarded;
            response.feedback = privateData.feedback;
          }
        } catch (e) {
          // Ignored: read is restricted by security rules prior to completion
        }
      }
    }));
    return list;
  }

  async listActiveSessions(organizationId: string, routeVersionId: string, mode: string): Promise<Vs1RouteSession[]> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDocs(query(
      collection(firestore, 'routeSessions'),
      where('organizationId', '==', organizationId),
      where('routeVersionId', '==', routeVersionId),
      where('mode', '==', mode),
      where('status', 'in', ['open', 'active'])
    ));
    return snapshot.docs.map(sessionFromSnapshot);
  }

  async findActiveParticipation(routeVersionId: string, participantUserId: string, mode: string, organizationId?: string): Promise<{ session: Vs1RouteSession; participation: Participation } | null> {
    const { firestore } = getFirebaseServices();
    const orgId = organizationId || 'org-edu-1';
    const sessionsQuery = query(
      collection(firestore, 'routeSessions'),
      where('organizationId', '==', orgId),
      where('routeVersionId', '==', routeVersionId),
      where('mode', '==', mode)
    );
    const snapshot = await getDocs(sessionsQuery);
    for (const docSnap of snapshot.docs) {
      const session = { id: docSnap.id, ...docSnap.data() } as Vs1RouteSession;
      if (session.status !== 'open' && session.status !== 'active') continue;
      const partDocRef = doc(firestore, 'routeSessions', session.id, 'participations', participantUserId);
      const partSnap = await getDoc(partDocRef);
      if (partSnap.exists()) {
        const participation = {
          ...partSnap.data(),
          currentStationId: partSnap.data().currentStationId || undefined,
        } as Participation;
        if (participation.status === 'active') {
          return { session, participation };
        }
      }
    }
    return null;
  }
}

export const firestoreSessionParticipationRepository = new FirestoreSessionParticipationRepository();
