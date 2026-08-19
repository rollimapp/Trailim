import { Timestamp, type DocumentData, type FirestoreDataConverter, type QueryDocumentSnapshot, type SnapshotOptions } from 'firebase/firestore';
import type { Organization, OrganizationMembership, TeamMember, Vs1Team } from '../../types/vs1';

const toIsoString = (value: unknown): string => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  throw new Error('Firestore timestamp field is missing or invalid');
};

const data = (snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions) => snapshot.data(options);

export const organizationConverter: FirestoreDataConverter<Organization> = {
  toFirestore: organization => ({ ...organization }),
  fromFirestore: (snapshot, options) => data(snapshot, options) as Organization,
};

export const membershipConverter: FirestoreDataConverter<OrganizationMembership> = {
  toFirestore: membership => ({ ...membership, createdAt: Timestamp.fromDate(new Date(membership.createdAt as string)) }),
  fromFirestore: (snapshot, options) => {
    const value = data(snapshot, options);
    return { ...value, createdAt: toIsoString(value.createdAt) } as OrganizationMembership;
  },
};

export const teamConverter: FirestoreDataConverter<Vs1Team> = {
  toFirestore: team => ({
    ...team,
    createdAt: Timestamp.fromDate(new Date(team.createdAt as string)),
    updatedAt: Timestamp.fromDate(new Date(team.updatedAt as string)),
  }),
  fromFirestore: (snapshot, options) => {
    const value = data(snapshot, options);
    return {
      ...value,
      createdAt: toIsoString(value.createdAt),
      updatedAt: toIsoString(value.updatedAt),
    } as Vs1Team;
  },
};

export const teamMemberConverter: FirestoreDataConverter<TeamMember> = {
  toFirestore: member => ({ ...member, joinedAt: Timestamp.fromDate(new Date(member.joinedAt as string)) }),
  fromFirestore: (snapshot, options) => {
    const value = data(snapshot, options);
    return { ...value, joinedAt: toIsoString(value.joinedAt) } as TeamMember;
  },
};
