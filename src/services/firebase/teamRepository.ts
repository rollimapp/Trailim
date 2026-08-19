import {
  collection,
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
} from 'firebase/firestore';
import type { TeamMember, Vs1Team } from '../../types/vs1';
import { getFirebaseServices } from './firebaseClient';
import { teamConverter, teamMemberConverter } from './firestoreConverters';

export class FirestoreTeamRepository {
  async createTeam(team: Vs1Team, members: TeamMember[] = []): Promise<void> {
    const { firestore } = getFirebaseServices();
    const batch = writeBatch(firestore);
    batch.set(doc(firestore, 'teams', team.id), {
      ...team,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    members.forEach(member => {
      batch.set(doc(firestore, 'teams', team.id, 'members', member.userId), {
        ...member,
        joinedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  async getTeam(teamId: string): Promise<Vs1Team | null> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDoc(doc(firestore, 'teams', teamId).withConverter(teamConverter));
    return snapshot.exists() ? snapshot.data() : null;
  }

  async listTeams(organizationId: string): Promise<Vs1Team[]> {
    const { firestore } = getFirebaseServices();
    const reference = collection(firestore, 'teams').withConverter(teamConverter);
    const snapshot = await getDocs(query(
      reference,
      where('organizationId', '==', organizationId),
      orderBy('createdAt'),
    ));
    return snapshot.docs.map(item => item.data());
  }

  async updateTeam(teamId: string, changes: Pick<Vs1Team, 'name' | 'status'>): Promise<void> {
    const { firestore } = getFirebaseServices();
    await updateDoc(doc(firestore, 'teams', teamId), { ...changes, updatedAt: serverTimestamp() });
  }

  async getMember(teamId: string, userId: string): Promise<TeamMember | null> {
    const { firestore } = getFirebaseServices();
    const snapshot = await getDoc(
      doc(firestore, 'teams', teamId, 'members', userId).withConverter(teamMemberConverter),
    );
    return snapshot.exists() ? snapshot.data() : null;
  }

  async listMembers(teamId: string): Promise<TeamMember[]> {
    const { firestore } = getFirebaseServices();
    const reference = collection(firestore, 'teams', teamId, 'members').withConverter(teamMemberConverter);
    const snapshot = await getDocs(query(reference, orderBy('joinedAt')));
    return snapshot.docs.map(item => item.data());
  }

  async addMember(teamId: string, member: TeamMember): Promise<void> {
    const { firestore } = getFirebaseServices();
    await setDoc(doc(firestore, 'teams', teamId, 'members', member.userId), {
      ...member,
      joinedAt: serverTimestamp(),
    });
  }

  async updateMember(
    teamId: string,
    userId: string,
    changes: Pick<TeamMember, 'roles' | 'status'>,
  ): Promise<void> {
    const { firestore } = getFirebaseServices();
    await updateDoc(doc(firestore, 'teams', teamId, 'members', userId), changes);
  }
}

export const firestoreTeamRepository = new FirestoreTeamRepository();
