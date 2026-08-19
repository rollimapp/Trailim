import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import type { RouteDraft, RouteStationDraft, Vs1Route } from '../../types/vs1';
import { getFirebaseServices } from './firebaseClient';
import {
  draftStationConverter,
  draftStationWriteData,
  draftWriteData,
  routeConverter,
  routeDraftConverter,
  routeWriteData,
} from './routeDraftConverters';

export class FirestoreRouteDraftRepository {
  constructor(private readonly getFirestore: () => Firestore = () => getFirebaseServices().firestore) {}

  async createRouteWithDraft(route: Vs1Route, draft: RouteDraft): Promise<void> {
    if (
      route.id !== draft.routeId ||
      route.currentDraftId !== draft.id ||
      route.organizationId !== draft.organizationId ||
      route.ownerTeamId !== draft.ownerTeamId ||
      draft.stations.some(station => station.routeId !== route.id)
    ) {
      throw new Error('Cannot create route draft: route and draft identity do not match');
    }
    const firestore = this.getFirestore();
    const batch = writeBatch(firestore);
    const { latestSubmittedVersionId: _latestVersion, approvedVersionId: _approvedVersion, ...routeIdentity } = route;
    batch.set(doc(firestore, 'routes', route.id), {
      ...routeWriteData({ ...routeIdentity, status: 'draft' }, true),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(firestore, 'routes', route.id, 'drafts', draft.id), {
      ...draftWriteData(draft),
      updatedAt: serverTimestamp(),
    });
    draft.stations.forEach(station => {
      batch.set(
        doc(firestore, 'routes', route.id, 'drafts', draft.id, 'stations', station.id),
        draftStationWriteData(station, draft.id),
      );
    });
    await batch.commit();
  }

  async getRoute(routeId: string): Promise<Vs1Route | null> {
    const firestore = this.getFirestore();
    const snapshot = await getDoc(doc(firestore, 'routes', routeId).withConverter(routeConverter));
    return snapshot.exists() ? snapshot.data() : null;
  }

  async listRoutesByOrganization(organizationId: string): Promise<Vs1Route[]> {
    const firestore = this.getFirestore();
    const reference = collection(firestore, 'routes').withConverter(routeConverter);
    const snapshot = await getDocs(query(
      reference,
      where('organizationId', '==', organizationId),
      orderBy('updatedAt', 'desc'),
    ));
    return snapshot.docs.map(item => item.data());
  }

  async listRoutesByTeam(organizationId: string, ownerTeamId: string): Promise<Vs1Route[]> {
    const firestore = this.getFirestore();
    const reference = collection(firestore, 'routes').withConverter(routeConverter);
    const snapshot = await getDocs(query(
      reference,
      where('organizationId', '==', organizationId),
      where('ownerTeamId', '==', ownerTeamId),
      orderBy('updatedAt', 'desc'),
    ));
    return snapshot.docs.map(item => item.data());
  }

  async updateRouteAuthoring(routeId: string, title: string): Promise<void> {
    const firestore = this.getFirestore();
    await updateDoc(doc(firestore, 'routes', routeId), { title, updatedAt: serverTimestamp() });
  }

  async getCurrentDraft(routeId: string): Promise<RouteDraft | null> {
    const route = await this.getRoute(routeId);
    return route ? this.getDraft(routeId, route.currentDraftId) : null;
  }

  async getDraft(routeId: string, draftId: string): Promise<RouteDraft | null> {
    const firestore = this.getFirestore();
    const draftSnapshot = await getDoc(
      doc(firestore, 'routes', routeId, 'drafts', draftId).withConverter(routeDraftConverter(routeId)),
    );
    if (!draftSnapshot.exists()) return null;
    const stationReference = collection(
      firestore,
      'routes', routeId,
      'drafts', draftId,
      'stations',
    ).withConverter(draftStationConverter(routeId, draftId));
    const stationSnapshot = await getDocs(query(stationReference, orderBy('position')));
    return { ...draftSnapshot.data(), stations: stationSnapshot.docs.map(item => item.data()) };
  }

  async saveDraft(draft: RouteDraft): Promise<void> {
    if (draft.stations.some(station => station.routeId !== draft.routeId)) {
      throw new Error('Cannot save route draft: station route identity does not match the draft');
    }
    const firestore = this.getFirestore();
    const stationsReference = collection(firestore, 'routes', draft.routeId, 'drafts', draft.id, 'stations');
    const existingStations = await getDocs(stationsReference);
    const incomingIds = new Set(draft.stations.map(station => station.id));
    const batch = writeBatch(firestore);
    batch.set(doc(firestore, 'routes', draft.routeId, 'drafts', draft.id), {
      ...draftWriteData(draft),
      updatedAt: serverTimestamp(),
    });
    existingStations.docs.filter(item => !incomingIds.has(item.id)).forEach(item => batch.delete(item.ref));
    draft.stations.forEach(station => {
      batch.set(
        doc(firestore, 'routes', draft.routeId, 'drafts', draft.id, 'stations', station.id),
        draftStationWriteData(station, draft.id),
      );
    });
    await batch.commit();
  }

  async saveStation(routeId: string, draftId: string, station: RouteStationDraft): Promise<void> {
    if (station.routeId !== routeId) {
      throw new Error('Cannot save draft station: route identity does not match the parent path');
    }
    const firestore = this.getFirestore();
    await setDoc(
      doc(firestore, 'routes', routeId, 'drafts', draftId, 'stations', station.id),
      draftStationWriteData(station, draftId),
    );
  }

  async deleteStation(routeId: string, draftId: string, stationId: string): Promise<void> {
    const firestore = this.getFirestore();
    await deleteDoc(doc(firestore, 'routes', routeId, 'drafts', draftId, 'stations', stationId));
  }
}

export const firestoreRouteDraftRepository = new FirestoreRouteDraftRepository();
