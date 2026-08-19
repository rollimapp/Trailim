import {
  Firestore,
  Timestamp,
  type DocumentData,
  type Transaction,
} from 'firebase-admin/firestore';
import type { RouteStationDraft } from '../../src/types/vs1.js';
import type { ProtectedSubmissionInput } from '../../src/types/vs1Trusted.js';

export class WorkflowError extends Error {
  constructor(public readonly code: 'unauthenticated' | 'permission-denied' | 'failed-precondition' | 'invalid-argument', message: string) {
    super(message);
  }
}

const forbiddenPublicFields = new Set([
  'isCorrect',
  'correctAnswers',
  'acceptableAnswers',
  'correctOptionIds',
  'acceptedAnswers',
  'pointsAwarded',
  'attemptLimit',
  'allowRetry',
  'penaltyPerAttempt',
  'explanationByOptionId',
  'accessCode',
  'QRCodeValue',
]);

const sanitizePublicValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizePublicValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !forbiddenPublicFields.has(key))
      .map(([key, item]) => [key, sanitizePublicValue(item)]));
  }
  return value;
};

const requireString = (value: unknown, name: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new WorkflowError('invalid-argument', `${name} is required`);
  }
  return value;
};

const getMembership = async (transaction: Transaction, firestore: Firestore, organizationId: string, userId: string) => {
  const snapshot = await transaction.get(
    firestore.doc(`organizations/${organizationId}/memberships/${userId}`),
  );
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
  if (!teamSnapshot.exists || !team || team.organizationId !== route.organizationId) {
    throw new WorkflowError('failed-precondition', 'Route owner team does not match the organization');
  }
  if (membership.role === 'teacher' || team.createdByUserId === userId) return;
  const memberSnapshot = await transaction.get(firestore.doc(`teams/${route.ownerTeamId}/members/${userId}`));
  const member = memberSnapshot.data();
  if (!memberSnapshot.exists || member?.status !== 'active' || !member.roles?.includes('manager')) {
    throw new WorkflowError('permission-denied', 'Route team authority is required');
  }
};

const requireTeacher = async (
  transaction: Transaction,
  firestore: Firestore,
  organizationId: string,
  userId: string,
) => {
  const membership = await getMembership(transaction, firestore, organizationId, userId);
  if (membership.role !== 'teacher') {
    throw new WorkflowError('permission-denied', 'Teacher authority is required');
  }
};

const validateProtectedInput = (
  stations: Array<RouteStationDraft & { draftId?: string }>,
  input: ProtectedSubmissionInput,
) => {
  if (!input || !Array.isArray(input.answerKeys) || (input.triggers !== undefined && !Array.isArray(input.triggers))) {
    throw new WorkflowError('invalid-argument', 'Protected submission data is required');
  }
  if (input.answerKeys.some(item => !item || typeof item !== 'object') ||
      (input.triggers || []).some(item => !item || typeof item !== 'object')) {
    throw new WorkflowError('invalid-argument', 'Protected submission data is malformed');
  }
  const tasks = stations.flatMap(station => station.tasks.map(task => `${station.id}/${task.id}`));
  const taskIds = stations.flatMap(station => station.tasks.map(task => task.id));
  const expectedTasks = new Set(tasks);
  if (expectedTasks.size !== tasks.length || new Set(taskIds).size !== taskIds.length) {
    throw new WorkflowError('failed-precondition', 'Task IDs must be unique within the route draft');
  }
  const suppliedTasks = input.answerKeys.map(item => `${item.stationId}/${item.taskId}`);
  if (
    new Set(suppliedTasks).size !== suppliedTasks.length ||
    suppliedTasks.length !== expectedTasks.size ||
    suppliedTasks.some(item => !expectedTasks.has(item))
  ) {
    throw new WorkflowError('invalid-argument', 'Protected answer data must match every persisted draft task exactly');
  }
  if (input.answerKeys.some(item =>
    !item.validation ||
    !['option_ids', 'accepted_text', 'submission_only', 'manual_review'].includes(item.validation.kind) ||
    typeof item.pointsAwarded !== 'number' ||
    typeof item.allowRetry !== 'boolean' ||
    typeof item.penaltyPerAttempt !== 'number'
  )) {
    throw new WorkflowError('invalid-argument', 'Protected answer data is malformed');
  }

  const protectedStations = stations
    .filter(station => station.trigger?.type === 'qr_code' || station.trigger?.type === 'access_code')
    .map(station => station.id);
  const suppliedTriggers = input.triggers || [];
  if (
    suppliedTriggers.length !== protectedStations.length ||
    new Set(suppliedTriggers.map(item => item.stationId)).size !== suppliedTriggers.length ||
    suppliedTriggers.some(item => {
      const station = stations.find(candidate => candidate.id === item.stationId);
      return !station || station.trigger.type !== item.triggerType || typeof item.secret !== 'string' || item.secret.length === 0;
    })
  ) {
    throw new WorkflowError('invalid-argument', 'Protected trigger data must match every protected draft trigger exactly');
  }
};

export class VersionReviewService {
  constructor(private readonly firestore: Firestore) {}

  submitDraft(routeId: string, userId: string, protectedInput: ProtectedSubmissionInput) {
    return this.createSubmission(routeId, userId, protectedInput, 'draft');
  }

  resubmit(routeId: string, userId: string, protectedInput: ProtectedSubmissionInput) {
    return this.createSubmission(routeId, userId, protectedInput, 'changes_requested');
  }

  private async createSubmission(
    routeId: string,
    userId: string,
    protectedInput: ProtectedSubmissionInput,
    requiredStatus: 'draft' | 'changes_requested',
  ) {
    requireString(routeId, 'routeId');
    requireString(userId, 'userId');
    const firestore = this.firestore;
    return firestore.runTransaction(async transaction => {
      const routeRef = firestore.doc(`routes/${routeId}`);
      const routeSnapshot = await transaction.get(routeRef);
      const route = routeSnapshot.data();
      if (!routeSnapshot.exists || !route) throw new WorkflowError('failed-precondition', 'Route not found');
      await requireRouteAuthority(transaction, firestore, route, userId);
      if (route.status !== requiredStatus) {
        throw new WorkflowError('failed-precondition', `Route must be ${requiredStatus} before submission`);
      }

      const draftRef = firestore.doc(`routes/${routeId}/drafts/${route.currentDraftId}`);
      const draftSnapshot = await transaction.get(draftRef);
      const draft = draftSnapshot.data();
      if (
        !draftSnapshot.exists || !draft || draft.id !== route.currentDraftId || draft.routeId !== routeId ||
        draft.organizationId !== route.organizationId || draft.ownerTeamId !== route.ownerTeamId
      ) {
        throw new WorkflowError('failed-precondition', 'Current draft identity is incoherent');
      }
      if (requiredStatus === 'changes_requested' && draft.basedOnVersionId !== route.latestSubmittedVersionId) {
        throw new WorkflowError('failed-precondition', 'Revision draft is not based on the latest reviewed version');
      }

      const stationsQuery = firestore.collection(`routes/${routeId}/drafts/${draft.id}/stations`).orderBy('position');
      const stationsSnapshot = await transaction.get(stationsQuery);
      const stations = stationsSnapshot.docs.map(item => item.data() as RouteStationDraft & { draftId?: string });
      if (stations.some(station => station.id === undefined || station.routeId !== routeId || station.draftId !== draft.id)) {
        throw new WorkflowError('failed-precondition', 'Draft station identity is incoherent');
      }
      validateProtectedInput(stations, protectedInput);

      const versionsQuery = firestore.collection(`routes/${routeId}/versions`)
        .orderBy('versionNumber', 'desc').limit(1);
      const versionsSnapshot = await transaction.get(versionsQuery);
      const versionNumber = versionsSnapshot.empty ? 1 : Number(versionsSnapshot.docs[0].data().versionNumber) + 1;
      const versionRef = firestore.collection(`routes/${routeId}/versions`).doc();
      const reviewRef = firestore.collection('reviews').doc();
      const now = Timestamp.now();
      const version = {
        id: versionRef.id,
        routeId,
        organizationId: route.organizationId,
        ownerTeamId: route.ownerTeamId,
        versionNumber,
        sourceDraftId: draft.id,
        basedOnVersionId: draft.basedOnVersionId || null,
        content: sanitizePublicValue(draft.content),
        stationIds: stations.map(station => station.id),
        createdByUserId: userId,
        submittedAt: now,
        status: 'submitted',
        visibility: route.visibility === 'school' ? 'school' : 'class',
      };
      transaction.create(versionRef, version);
      stations.forEach(station => {
        const { draftId: _draftId, ...stationData } = station;
        transaction.create(versionRef.collection('stations').doc(station.id), {
          ...sanitizePublicValue(stationData) as DocumentData,
          routeVersionId: versionRef.id,
        });
      });
      protectedInput.answerKeys.forEach(answer => {
        transaction.create(versionRef.collection('answerKeys').doc(answer.taskId), {
          id: answer.taskId,
          recordType: 'task_answer',
          routeVersionId: versionRef.id,
          stationId: answer.stationId,
          taskId: answer.taskId,
          validation: answer.validation,
          pointsAwarded: answer.pointsAwarded,
          attemptLimit: answer.attemptLimit ?? null,
          allowRetry: answer.allowRetry,
          penaltyPerAttempt: answer.penaltyPerAttempt,
          explanationByOptionId: answer.explanationByOptionId ?? null,
        });
      });
      (protectedInput.triggers || []).forEach(trigger => {
        transaction.create(versionRef.collection('answerKeys').doc(`trigger_${trigger.stationId}`), {
          id: `trigger_${trigger.stationId}`,
          recordType: 'station_trigger',
          routeVersionId: versionRef.id,
          stationId: trigger.stationId,
          triggerType: trigger.triggerType,
          secret: trigger.secret,
        });
      });
      transaction.create(reviewRef, {
        id: reviewRef.id,
        organizationId: route.organizationId,
        routeId,
        routeVersionId: versionRef.id,
        submittedByUserId: userId,
        submittedAt: now,
        status: 'pending',
        createdAt: now,
      });
      transaction.update(routeRef, {
        status: 'in_review',
        latestSubmittedVersionId: versionRef.id,
        updatedAt: now,
      });
      return { routeVersionId: versionRef.id, reviewId: reviewRef.id, versionNumber };
    });
  }

  async requestChanges(reviewId: string, teacherUserId: string, feedback: string) {
    requireString(feedback, 'feedback');
    const firestore = this.firestore;
    return firestore.runTransaction(async transaction => {
      const reviewRef = firestore.doc(`reviews/${reviewId}`);
      const reviewSnapshot = await transaction.get(reviewRef);
      const review = reviewSnapshot.data();
      if (!reviewSnapshot.exists || !review) throw new WorkflowError('failed-precondition', 'Review not found');
      await requireTeacher(transaction, firestore, review.organizationId, teacherUserId);
      const routeRef = firestore.doc(`routes/${review.routeId}`);
      const versionRef = firestore.doc(`routes/${review.routeId}/versions/${review.routeVersionId}`);
      const routeSnapshot = await transaction.get(routeRef);
      const versionSnapshot = await transaction.get(versionRef);
      const route = routeSnapshot.data();
      if (
        !route || !versionSnapshot.exists || review.status !== 'pending' || route.status !== 'in_review' ||
        route.latestSubmittedVersionId !== review.routeVersionId
      ) throw new WorkflowError('failed-precondition', 'Review is not the current pending submission');
      const currentDraftRef = firestore.doc(`routes/${review.routeId}/drafts/${route.currentDraftId}`);
      const draftSnapshot = await transaction.get(currentDraftRef);
      if (!draftSnapshot.exists) throw new WorkflowError('failed-precondition', 'Current draft not found');
      const now = Timestamp.now();
      transaction.update(reviewRef, {
        status: 'changes_requested', decidedByUserId: teacherUserId, decidedAt: now, decisionNote: feedback,
      });
      transaction.update(versionRef, { status: 'changes_requested' });
      transaction.update(currentDraftRef, { basedOnVersionId: review.routeVersionId, updatedAt: now });
      transaction.update(routeRef, { status: 'changes_requested', updatedAt: now });
      return { routeVersionId: review.routeVersionId };
    });
  }

  async approveVersion(routeVersionId: string, teacherUserId: string, feedback = '') {
    const firestore = this.firestore;
    return firestore.runTransaction(async transaction => {
      const reviewQuery = firestore.collection('reviews')
        .where('routeVersionId', '==', routeVersionId).where('status', '==', 'pending').limit(1);
      const reviewSnapshot = await transaction.get(reviewQuery);
      if (reviewSnapshot.empty) throw new WorkflowError('failed-precondition', 'Pending review not found');
      const reviewRef = reviewSnapshot.docs[0].ref;
      const review = reviewSnapshot.docs[0].data();
      await requireTeacher(transaction, firestore, review.organizationId, teacherUserId);
      const routeRef = firestore.doc(`routes/${review.routeId}`);
      const versionRef = firestore.doc(`routes/${review.routeId}/versions/${routeVersionId}`);
      const routeSnapshot = await transaction.get(routeRef);
      const versionSnapshot = await transaction.get(versionRef);
      const route = routeSnapshot.data();
      if (
        !route || !versionSnapshot.exists || route.status !== 'in_review' ||
        route.latestSubmittedVersionId !== routeVersionId
      ) throw new WorkflowError('failed-precondition', 'Version is not the current pending submission');
      const now = Timestamp.now();
      transaction.update(reviewRef, {
        status: 'approved', decidedByUserId: teacherUserId, decidedAt: now, decisionNote: feedback,
      });
      transaction.update(versionRef, {
        status: 'approved', approvedByUserId: teacherUserId, approvedAt: now,
      });
      transaction.update(routeRef, {
        status: 'approved', approvedVersionId: routeVersionId, updatedAt: now,
      });
      return { routeVersionId };
    });
  }
}
