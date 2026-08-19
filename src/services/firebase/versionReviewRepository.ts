import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Review, RouteStationSnapshot, Vs1RouteVersion } from '../../types/vs1';
import { getFirebaseServices } from './firebaseClient';

const timestamp = (value: unknown, field: string) => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  throw new Error(`Malformed Firestore workflow document: ${field} must be a timestamp`);
};

const versionFromSnapshot = (snapshot: QueryDocumentSnapshot<DocumentData>): Vs1RouteVersion => {
  const value = snapshot.data();
  if (value.id !== snapshot.id || value.routeId !== snapshot.ref.parent.parent?.id) {
    throw new Error('Malformed Firestore RouteVersion identity');
  }
  return {
    ...value,
    basedOnVersionId: value.basedOnVersionId || undefined,
    submittedAt: timestamp(value.submittedAt, 'submittedAt'),
    approvedAt: value.approvedAt ? timestamp(value.approvedAt, 'approvedAt') : undefined,
  } as Vs1RouteVersion;
};

const reviewFromSnapshot = (snapshot: QueryDocumentSnapshot<DocumentData>): Review => {
  const value = snapshot.data();
  if (value.id !== snapshot.id) throw new Error('Malformed Firestore Review identity');
  return {
    ...value,
    submittedAt: timestamp(value.submittedAt, 'submittedAt'),
    createdAt: timestamp(value.createdAt, 'createdAt'),
    decidedAt: value.decidedAt ? timestamp(value.decidedAt, 'decidedAt') : undefined,
  } as Review;
};

export class FirestoreVersionReviewRepository {
  async listPendingReviews(organizationId: string): Promise<Review[]> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDocs(query(
      collection(firestore, 'reviews'),
      where('organizationId', '==', organizationId),
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'desc'),
    ));
    return snapshot.docs.map(reviewFromSnapshot);
  }

  async listRouteReviews(routeId: string): Promise<Review[]> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDocs(query(
      collection(firestore, 'reviews'),
      where('routeId', '==', routeId),
      orderBy('submittedAt', 'desc'),
    ));
    return snapshot.docs.map(reviewFromSnapshot);
  }

  async getReview(reviewId: string): Promise<Review | null> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDoc(doc(firestore, 'reviews', reviewId));
    return snapshot.exists() ? reviewFromSnapshot(snapshot) : null;
  }

  async getVersion(routeId: string, routeVersionId: string): Promise<Vs1RouteVersion | null> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDoc(doc(firestore, 'routes', routeId, 'versions', routeVersionId));
    return snapshot.exists() ? versionFromSnapshot(snapshot) : null;
  }

  async getVersionStations(routeId: string, routeVersionId: string): Promise<RouteStationSnapshot[]> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDocs(query(
      collection(firestore, 'routes', routeId, 'versions', routeVersionId, 'stations'),
      orderBy('position'),
    ));
    return snapshot.docs.map(item => {
      const value = item.data();
      if (value.id !== item.id || value.routeId !== routeId || value.routeVersionId !== routeVersionId) {
        throw new Error('Malformed Firestore version station identity');
      }
      return value as RouteStationSnapshot;
    });
  }
}

export const firestoreVersionReviewRepository = new FirestoreVersionReviewRepository();
