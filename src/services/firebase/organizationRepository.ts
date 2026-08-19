import { doc, getDoc } from 'firebase/firestore';
import type { Organization } from '../../types/vs1';
import { getFirebaseServices } from './firebaseClient';
import { organizationConverter } from './firestoreConverters';

export class FirestoreOrganizationRepository {
  async getOrganization(organizationId: string): Promise<Organization | null> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDoc(doc(firestore, 'organizations', organizationId).withConverter(organizationConverter));
    return snapshot.exists() ? snapshot.data() : null;
  }
}

export const firestoreOrganizationRepository = new FirestoreOrganizationRepository();
