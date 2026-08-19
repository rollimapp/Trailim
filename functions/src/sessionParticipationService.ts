import { Firestore, Timestamp, type DocumentData, type Transaction } from 'firebase-admin/firestore';
import { WorkflowError } from './versionReviewService.js';

type SessionStatus = 'open' | 'active' | 'completed' | 'cancelled';

const requireString = (value: unknown, name: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new WorkflowError('invalid-argument', `${name} is required`);
  }
  return value;
};

const getMembership = async (transaction: Transaction, firestore: Firestore, organizationId: string, userId: string) => {
  const snapshot = await transaction.get(firestore.doc(`organizations/${organizationId}/memberships/${userId}`));
  const membership = snapshot.data();
  if (!snapshot.exists || membership?.userId !== userId || membership.organizationId !== organizationId || membership.status !== 'active') {
    throw new WorkflowError('permission-denied', 'Active organization membership is required');
  }
  return membership;
};

const requireRouteAuthority = async (
  transaction: Transaction,
  firestore: Firestore,
  route: DocumentData,
  userId: string,
) => {
  const membership = await getMembership(transaction, firestore, route.organizationId, userId);
  const teamSnapshot = await transaction.get(firestore.doc(`teams/${route.ownerTeamId}`));
  const team = teamSnapshot.data();
  if (!teamSnapshot.exists || team?.organizationId !== route.organizationId) {
    throw new WorkflowError('failed-precondition', 'Route owner team does not match the organization');
  }
  if (membership.role === 'teacher') return;
  if (team?.createdByUserId === userId) return;
  const memberSnapshot = await transaction.get(firestore.doc(`teams/${route.ownerTeamId}/members/${userId}`));
  const member = memberSnapshot.data();
  if (!memberSnapshot.exists || member?.status !== 'active' || !member.roles?.includes('manager')) {
    throw new WorkflowError('permission-denied', 'Route team authority is required');
  }
};

const writableSession = (session: DocumentData | undefined) =>
  session?.status === 'open' || session?.status === 'active';

export interface CreateRouteSessionInput {
  routeId: string;
  routeVersionId: string;
  title: string;
  mode: 'learning' | 'challenge';
  assignedClassIds?: string[];
}

export interface ParticipationProgressInput {
  currentStationId?: string;
  completedStationIds: string[];
  progressPercentage: number;
}

export class SessionParticipationService {
  constructor(private readonly firestore: Firestore) {}

  async createRouteSession(input: CreateRouteSessionInput, userId: string) {
    requireString(input?.routeId, 'routeId');
    requireString(input?.routeVersionId, 'routeVersionId');
    requireString(input?.title, 'title');
    if (!['learning', 'challenge'].includes(input?.mode)) throw new WorkflowError('invalid-argument', 'mode is invalid');
    if (input.assignedClassIds !== undefined && (!Array.isArray(input.assignedClassIds) || input.assignedClassIds.some(id => typeof id !== 'string'))) {
      throw new WorkflowError('invalid-argument', 'assignedClassIds is invalid');
    }
    const firestore = this.firestore;
    return firestore.runTransaction(async transaction => {
      const routeRef = firestore.doc(`routes/${input.routeId}`);
      const versionRef = firestore.doc(`routes/${input.routeId}/versions/${input.routeVersionId}`);
      const routeSnapshot = await transaction.get(routeRef);
      const versionSnapshot = await transaction.get(versionRef);
      const route = routeSnapshot.data();
      const version = versionSnapshot.data();
      if (!routeSnapshot.exists || !route || !versionSnapshot.exists || !version) {
        throw new WorkflowError('failed-precondition', 'Route and RouteVersion are required');
      }
      await requireRouteAuthority(transaction, firestore, route, userId);
      if (
        version.id !== input.routeVersionId || version.routeId !== input.routeId ||
        version.organizationId !== route.organizationId || version.status !== 'approved' ||
        route.approvedVersionId !== input.routeVersionId
      ) throw new WorkflowError('failed-precondition', 'Session requires the route current approved version');

      const sessionRef = firestore.collection('routeSessions').doc();
      const now = Timestamp.now();
      transaction.create(sessionRef, {
        id: sessionRef.id,
        organizationId: route.organizationId,
        routeId: input.routeId,
        routeVersionId: input.routeVersionId,
        createdByUserId: userId,
        title: input.title,
        mode: input.mode,
        status: 'open',
        ...(input.assignedClassIds ? { assignedClassIds: input.assignedClassIds } : {}),
        createdAt: now,
        openedAt: now,
      });
      return { sessionId: sessionRef.id };
    });
  }

  async updateRouteSessionStatus(sessionId: string, nextStatus: SessionStatus, userId: string) {
    requireString(sessionId, 'sessionId');
    if (!['active', 'completed', 'cancelled'].includes(nextStatus)) throw new WorkflowError('invalid-argument', 'nextStatus is invalid');
    const firestore = this.firestore;
    return firestore.runTransaction(async transaction => {
      const sessionRef = firestore.doc(`routeSessions/${sessionId}`);
      const sessionSnapshot = await transaction.get(sessionRef);
      const session = sessionSnapshot.data();
      if (!sessionSnapshot.exists || !session) throw new WorkflowError('failed-precondition', 'Session not found');
      const routeSnapshot = await transaction.get(firestore.doc(`routes/${session.routeId}`));
      const route = routeSnapshot.data();
      if (!route || route.organizationId !== session.organizationId) throw new WorkflowError('failed-precondition', 'Session route identity is incoherent');
      await requireRouteAuthority(transaction, firestore, route, userId);
      const allowed: Record<SessionStatus, SessionStatus[]> = {
        open: ['active', 'completed', 'cancelled'], active: ['completed', 'cancelled'], completed: [], cancelled: [],
      };
      if (session.status === nextStatus) return { sessionId, status: nextStatus };
      if (!allowed[session.status as SessionStatus]?.includes(nextStatus)) {
        throw new WorkflowError('failed-precondition', `Invalid ${session.status} to ${nextStatus} transition`);
      }
      transaction.update(sessionRef, {
        status: nextStatus,
        ...(nextStatus === 'completed' || nextStatus === 'cancelled' ? { completedAt: Timestamp.now() } : {}),
      });
      return { sessionId, status: nextStatus };
    });
  }

  async joinRouteSession(sessionId: string, userId: string) {
    requireString(sessionId, 'sessionId');
    const firestore = this.firestore;
    return firestore.runTransaction(async transaction => {
      const sessionRef = firestore.doc(`routeSessions/${sessionId}`);
      const sessionSnapshot = await transaction.get(sessionRef);
      const session = sessionSnapshot.data();
      if (!sessionSnapshot.exists || !session || !writableSession(session)) {
        throw new WorkflowError('failed-precondition', 'Session is not open or active');
      }
      await getMembership(transaction, firestore, session.organizationId, userId);
      const participationRef = sessionRef.collection('participations').doc(userId);
      const existing = await transaction.get(participationRef);
      if (existing.exists) {
        const participation = existing.data();
        if (participation?.participantUserId !== userId || participation.sessionId !== sessionId) {
          throw new WorkflowError('failed-precondition', 'Existing participation identity is incoherent');
        }
        return { participationId: participation.id, resumed: true };
      }
      const now = Timestamp.now();
      const id = `${sessionId}_${userId}`;
      transaction.create(participationRef, {
        id, sessionId, routeId: session.routeId, routeVersionId: session.routeVersionId,
        participantUserId: userId,
        status: 'active', startedAt: now, completedStationIds: [], progressPercentage: 0, score: 0, updatedAt: now,
      });
      if (session.status === 'open') transaction.update(sessionRef, { status: 'active' });
      return { participationId: id, resumed: false };
    });
  }

  async updateParticipationProgress(sessionId: string, progress: ParticipationProgressInput, userId: string) {
    requireString(sessionId, 'sessionId');
    if (!progress || !Array.isArray(progress.completedStationIds) || progress.completedStationIds.some(id => typeof id !== 'string') ||
      typeof progress.progressPercentage !== 'number') {
      throw new WorkflowError('invalid-argument', 'Progress is invalid');
    }
    const firestore = this.firestore;
    return firestore.runTransaction(async transaction => {
      const sessionRef = firestore.doc(`routeSessions/${sessionId}`);
      const participationRef = sessionRef.collection('participations').doc(userId);
      const sessionSnapshot = await transaction.get(sessionRef);
      const participationSnapshot = await transaction.get(participationRef);
      const session = sessionSnapshot.data();
      const participation = participationSnapshot.data();
      if (!sessionSnapshot.exists || !session || !writableSession(session)) throw new WorkflowError('failed-precondition', 'Parent session is terminal');
      if (!participationSnapshot.exists || participation?.participantUserId !== userId || participation.status !== 'active') {
        throw new WorkflowError('permission-denied', 'Active owned participation is required');
      }
      const versionSnapshot = await transaction.get(
        firestore.doc(`routes/${session.routeId}/versions/${session.routeVersionId}`),
      );
      const version = versionSnapshot.data();
      if (!versionSnapshot.exists || !version || version.id !== session.routeVersionId ||
        version.routeId !== session.routeId || !Array.isArray(version.stationIds)) {
        throw new WorkflowError('failed-precondition', 'Session RouteVersion identity is incoherent');
      }
      const stationIds = new Set<string>(version.stationIds);
      if (stationIds.size !== version.stationIds.length) {
        throw new WorkflowError('failed-precondition', 'RouteVersion station identity is incoherent');
      }
      if (new Set(progress.completedStationIds).size !== progress.completedStationIds.length) {
        throw new WorkflowError('invalid-argument', 'Completed station IDs must be unique');
      }
      if (progress.completedStationIds.some(stationId => !stationIds.has(stationId))) {
        throw new WorkflowError('invalid-argument', 'Completed station does not belong to the RouteVersion');
      }
      if (progress.currentStationId !== undefined && !stationIds.has(progress.currentStationId)) {
        throw new WorkflowError('invalid-argument', 'Current station does not belong to the RouteVersion');
      }
      const progressPercentage = stationIds.size === 0
        ? 0
        : (progress.completedStationIds.length / stationIds.size) * 100;
      transaction.update(participationRef, {
        currentStationId: progress.currentStationId ?? null,
        completedStationIds: progress.completedStationIds,
        progressPercentage,
        updatedAt: Timestamp.now(),
      });
      return { participationId: participation.id };
    });
  }

  async abandonParticipation(sessionId: string, userId: string) {
    const firestore = this.firestore;
    return firestore.runTransaction(async transaction => {
      const sessionRef = firestore.doc(`routeSessions/${requireString(sessionId, 'sessionId')}`);
      const participationRef = sessionRef.collection('participations').doc(userId);
      const sessionSnapshot = await transaction.get(sessionRef);
      const participationSnapshot = await transaction.get(participationRef);
      const participation = participationSnapshot.data();
      if (!sessionSnapshot.exists || !writableSession(sessionSnapshot.data())) throw new WorkflowError('failed-precondition', 'Parent session is terminal');
      if (!participationSnapshot.exists || participation?.participantUserId !== userId) throw new WorkflowError('permission-denied', 'Owned participation is required');
      if (participation.status === 'abandoned') return { participationId: participation.id };
      if (participation.status !== 'active') throw new WorkflowError('failed-precondition', 'Participation is terminal');
      transaction.update(participationRef, { status: 'abandoned', updatedAt: Timestamp.now() });
      return { participationId: participation.id };
    });
  }
}
