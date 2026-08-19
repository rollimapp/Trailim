import { Firestore, Timestamp, type DocumentData, type Transaction } from 'firebase-admin/firestore';
import { Buffer } from 'node:buffer';
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

const responseDocumentId = (stationId: string, taskId: string) =>
  Buffer.from(JSON.stringify([stationId, taskId])).toString('base64url');

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

  async submitTaskResponse(sessionId: string, stationId: string, taskId: string, answer: unknown, userId: string, submissionId: string) {
    requireString(sessionId, 'sessionId');
    requireString(stationId, 'stationId');
    requireString(taskId, 'taskId');
    requireString(submissionId, 'submissionId');
    const firestore = this.firestore;
    return firestore.runTransaction(async transaction => {
      const sessionRef = firestore.doc(`routeSessions/${sessionId}`);
      const participationRef = sessionRef.collection('participations').doc(userId);
      const sessionSnapshot = await transaction.get(sessionRef);
      const participationSnapshot = await transaction.get(participationRef);
      const session = sessionSnapshot.data();
      const participation = participationSnapshot.data();
      if (!sessionSnapshot.exists || !session || !writableSession(session)) {
        throw new WorkflowError('failed-precondition', 'Parent session is terminal');
      }
      if (!participationSnapshot.exists || !participation || participation.status !== 'active') {
        throw new WorkflowError('failed-precondition', 'Participation is not active');
      }
      if (participation.id !== `${sessionId}_${userId}` || participation.participantUserId !== userId ||
        participation.sessionId !== sessionId || participation.routeId !== session.routeId ||
        participation.routeVersionId !== session.routeVersionId) {
        throw new WorkflowError('failed-precondition', 'Participation identity is incoherent');
      }
      await getMembership(transaction, firestore, session.organizationId, userId);

      const versionRef = firestore.doc(`routes/${session.routeId}/versions/${session.routeVersionId}`);
      const stationRef = versionRef.collection('stations').doc(stationId);
      const keyRef = versionRef.collection('answerKeys').doc(taskId);
      const versionSnapshot = await transaction.get(versionRef);
      const stationSnapshot = await transaction.get(stationRef);
      const keySnapshot = await transaction.get(keyRef);
      const version = versionSnapshot.data();
      const station = stationSnapshot.data();
      const key = keySnapshot.data();
      if (!versionSnapshot.exists || !version || version.id !== session.routeVersionId ||
        version.routeId !== session.routeId || !Array.isArray(version.stationIds) ||
        !version.stationIds.includes(stationId)) {
        throw new WorkflowError('failed-precondition', 'Bound RouteVersion station is invalid');
      }
      if (!stationSnapshot.exists || !station || station.id !== stationId || station.routeId !== session.routeId ||
        station.routeVersionId !== session.routeVersionId || !Array.isArray(station.tasks)) {
        throw new WorkflowError('failed-precondition', 'Version station identity is incoherent');
      }
      const publicTaskIds = station.tasks.map((item: unknown) => item && typeof item === 'object' ? (item as DocumentData).id : null);
      if (publicTaskIds.some((id: unknown) => typeof id !== 'string') || new Set(publicTaskIds).size !== publicTaskIds.length) {
        throw new WorkflowError('failed-precondition', 'Version station task identities are incoherent');
      }
      const tasks = station.tasks.filter((item: unknown) => item && typeof item === 'object' && (item as DocumentData).id === taskId);
      if (tasks.length !== 1) throw new WorkflowError('failed-precondition', 'Task must exist exactly once in the version station');
      const task = tasks[0] as DocumentData;
      if (!keySnapshot.exists || !key || key.recordType !== 'task_answer' || key.routeVersionId !== session.routeVersionId ||
        key.stationId !== stationId || key.taskId !== taskId || !key.validation) {
        throw new WorkflowError('failed-precondition', 'Protected AnswerKey identity is incoherent');
      }

      const responseRef = participationRef.collection('responses').doc(responseDocumentId(stationId, taskId));
      const privateRef = responseRef.collection('privateEvaluation').doc('record');

      const previousSnapshot = await transaction.get(responseRef);
      const previous = previousSnapshot.data();
      if (previousSnapshot.exists && (!previous || previous.id !== responseRef.id ||
        previous.participationId !== participation.id || previous.sessionId !== sessionId ||
        previous.routeId !== session.routeId || previous.routeVersionId !== session.routeVersionId ||
        previous.stationId !== stationId || previous.taskId !== taskId)) {
        throw new WorkflowError('failed-precondition', 'Existing TaskResponse identity is incoherent');
      }

      const privateSnapshot = await transaction.get(privateRef);
      const privateData = privateSnapshot.data();

      if (submissionId && typeof submissionId === 'string') {
        let cached = null;
        if (privateData && privateData.processedSubmissions && typeof privateData.processedSubmissions === 'object') {
          cached = privateData.processedSubmissions[submissionId];
        }
        if (!cached && previous?.lastSubmissionId === submissionId) {
          cached = {
            evaluationStatus: previous.evaluationStatus,
            isCorrect: previous.isCorrect,
            pointsAwarded: previous.pointsAwarded,
            attemptCount: previous.attemptCount,
            feedback: previous.feedback,
          };
        }
        if (cached) {
          const revealPolicy = task.answerRevealPolicy || 'immediate';
          const showCorrectness = revealPolicy === 'immediate';
          return {
            responseId: responseRef.id,
            evaluationStatus: cached.evaluationStatus,
            attemptCount: cached.attemptCount,
            score: participation.score,
            ...(showCorrectness ? {
              isCorrect: cached.isCorrect,
              pointsAwarded: cached.pointsAwarded,
              feedback: cached.feedback,
            } : {})
          };
        }
      }

      const attemptCount = Number(previous?.attemptCount || 0) + 1;
      if (previousSnapshot.exists && key.allowRetry !== true) {
        throw new WorkflowError('failed-precondition', 'Retry is not allowed');
      }
      if (Number.isInteger(key.attemptLimit) && key.attemptLimit > 0 && attemptCount > key.attemptLimit) {
        throw new WorkflowError('failed-precondition', 'Attempt limit exceeded');
      }

      let normalizedAnswer: string | string[];
      let evaluationStatus: 'evaluated' | 'manual_review' = 'evaluated';
      let isCorrect: boolean | undefined;
      let awarded = 0;
      const validation = key.validation as DocumentData;
      if (validation.kind === 'option_ids') {
        const submitted = typeof answer === 'string' ? [answer] : Array.isArray(answer) ? answer : null;
        if (!submitted || submitted.some(item => typeof item !== 'string') || new Set(submitted).size !== submitted.length) {
          throw new WorkflowError('invalid-argument', 'Option answer must contain unique option IDs');
        }
        const publicOptions = Array.isArray(task.options) ? task.options.map((item: DocumentData) => item?.id) : [];
        if (submitted.some(item => !publicOptions.includes(item))) throw new WorkflowError('invalid-argument', 'Unknown option ID');
        const correct = Array.isArray(validation.correctOptionIds) ? validation.correctOptionIds : [];
        isCorrect = submitted.length === correct.length && submitted.every(item => correct.includes(item));
        normalizedAnswer = submitted;
      } else if (validation.kind === 'accepted_text') {
        if (typeof answer !== 'string') throw new WorkflowError('invalid-argument', 'Text answer is required');
        normalizedAnswer = answer;
        const accepted = Array.isArray(validation.acceptedAnswers) ? validation.acceptedAnswers : [];
        isCorrect = accepted.some((item: unknown) => typeof item === 'string' &&
          (validation.caseSensitive ? item === answer : item.toLowerCase() === answer.toLowerCase()));
      } else if (validation.kind === 'submission_only') {
        if (typeof answer !== 'string' && !Array.isArray(answer)) throw new WorkflowError('invalid-argument', 'Submission answer is malformed');
        normalizedAnswer = answer as string | string[];
        awarded = Number(key.pointsAwarded) || 0;
      } else if (validation.kind === 'manual_review') {
        if (typeof answer !== 'string' && !Array.isArray(answer)) throw new WorkflowError('invalid-argument', 'Manual-review answer is malformed');
        normalizedAnswer = answer as string | string[];
        evaluationStatus = 'manual_review';
      } else {
        throw new WorkflowError('failed-precondition', 'Unsupported AnswerKey validation');
      }
      if (isCorrect === true) {
        awarded = Math.max(0, (Number(key.pointsAwarded) || 0) - (Number(key.penaltyPerAttempt) || 0) * (attemptCount - 1));
      }
      const previousAward = Math.max(0, Number(privateData?.pointsAwarded) || 0);
      const currentScore = Math.max(0, Number(participation.score) || 0);
      const nextScore = Math.max(0, currentScore - previousAward + awarded);
      const now = Timestamp.now();

      const revealPolicy = task.answerRevealPolicy || 'immediate';
      const showCorrectness = revealPolicy === 'immediate';
      const feedback = isCorrect === undefined ? 'Pending teacher review' : (isCorrect ? 'Correct!' : 'Incorrect answer');

      const publicResponse = {
        id: responseRef.id, participationId: participation.id, sessionId,
        routeId: session.routeId, routeVersionId: session.routeVersionId, stationId, taskId,
        answer: normalizedAnswer, submittedAt: previous?.submittedAt || now, updatedAt: now,
        evaluationStatus, attemptCount,
        revealPolicy,
        lastSubmissionId: submissionId || null,
        ...(showCorrectness ? {
          pointsAwarded: awarded,
          feedback,
          ...(isCorrect === undefined ? {} : { isCorrect })
        } : {})
      };

      const oldProcessed = privateData?.processedSubmissions || {};
      const nextProcessed = {
        ...oldProcessed,
        [submissionId]: {
          attemptCount,
          evaluationStatus,
          pointsAwarded: awarded,
          feedback,
          score: nextScore,
          ...(isCorrect === undefined ? {} : { isCorrect })
        }
      };

      const maxHistory = Math.max(100, (Number(key.attemptLimit) || 0) * 2);
      const keys = Object.keys(nextProcessed);
      if (keys.length > maxHistory) {
        delete nextProcessed[keys[0]];
      }

      const privateEvaluation = {
        id: 'record',
        revealPolicy,
        evaluationStatus,
        pointsAwarded: awarded,
        feedback,
        processedSubmissions: nextProcessed,
        updatedAt: now,
        ...(isCorrect === undefined ? {} : { isCorrect })
      };

      if (previousSnapshot.exists) transaction.set(responseRef, publicResponse);
      else transaction.create(responseRef, publicResponse);

      transaction.set(privateRef, privateEvaluation);

      transaction.update(participationRef, { score: nextScore, updatedAt: now });

      return {
        responseId: responseRef.id,
        evaluationStatus,
        attemptCount,
        score: nextScore,
        ...(showCorrectness ? {
          isCorrect,
          pointsAwarded: awarded,
          feedback
        } : {})
      };
    });
  }
}
