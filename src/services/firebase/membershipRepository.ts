import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import type { OrganizationMembership } from '../../types/vs1';
import { getFirebaseServices } from './firebaseClient';
import { membershipConverter } from './firestoreConverters';

export class FirestoreMembershipRepository {
  async getMembership(organizationId: string, userId: string): Promise<OrganizationMembership | null> {
    const { firestore } = getFirebaseServices();
    const reference = doc(firestore, 'organizations', organizationId, 'memberships', userId)
      .withConverter(membershipConverter);
    const snapshot = await getDoc(reference);
    return snapshot.exists() ? snapshot.data() : null;
  }

  async listMemberships(organizationId: string): Promise<OrganizationMembership[]> {
    const { firestore } = getFirebaseServices();
    const reference = collection(firestore, 'organizations', organizationId, 'memberships')
      .withConverter(membershipConverter);
    const snapshot = await getDocs(query(reference, orderBy('createdAt')));
    return snapshot.docs.map(item => item.data());
  }
}

export const firestoreMembershipRepository = new FirestoreMembershipRepository();
