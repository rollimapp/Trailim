import type { ExperienceMode } from '../types';
import type {
  AnswerKey,
  Participation,
  RouteVersionSnapshotBundle,
  Vs1RouteSession,
  Vs1RouteVersion,
  Vs1TaskResponse,
} from '../types/vs1';
import type { StorageLike } from './vs1WorkflowRepository';
import { vs1WorkflowRepository } from './vs1WorkflowRepository.ts';

interface VersionSource {
  getVersion(versionId: string): Vs1RouteVersion | null;
  getParticipantSnapshot(versionId: string): Omit<RouteVersionSnapshotBundle, 'answerKeys'> | null;
  getAnswerKeys(versionId: string): AnswerKey[];
}

interface SessionState {
  sessions: Vs1RouteSession[];
  participations: Participation[];
  responses: Vs1TaskResponse[];
}

interface CreateSessionInput {
  routeId: string;
  routeVersionId: string;
  organizationId: string;
  createdByUserId: string;
  title: string;
  mode: ExperienceMode;
}

interface ProgressUpdate {
  currentStationId?: string;
  completedStationIds: string[];
  progressPercentage: number;
  score: number;
}

interface SubmitResponseInput {
  participationId: string;
  stationId: string;
  taskId: string;
  answer: string | string[];
}

const STORAGE_KEY = 'trailim_vs1_sessions_participations_v1';
const EMPTY_STATE: SessionState = { sessions: [], participations: [], responses: [] };
const clone = <T>(value: T): T => structuredClone(value);

const createFallbackStorage = (): StorageLike => {
  const values = new Map<string, string>();
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
};

export class Vs1SessionRepository {
  private readonly storage: StorageLike;
  private readonly versions: VersionSource;
  private readonly now: () => string;
  private readonly createId: (kind: 'session' | 'participation' | 'response') => string;

  constructor(
    storage: StorageLike,
    versions: VersionSource,
    now: () => string = () => new Date().toISOString(),
    createId: (kind: 'session' | 'participation' | 'response') => string = kind => `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  ) {
    this.storage = storage;
    this.versions = versions;
    this.now = now;
    this.createId = createId;
  }

  private read(): SessionState {
    const stored = this.storage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : clone(EMPTY_STATE);
  }

  private write(state: SessionState) {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  createSession(input: CreateSessionInput): Vs1RouteSession {
    const version = this.versions.getVersion(input.routeVersionId);
    if (!version || version.status !== 'approved') {
      throw new Error('Cannot create session: route version is not approved');
    }
    if (version.routeId !== input.routeId || version.organizationId !== input.organizationId) {
      throw new Error('Cannot create session: route version identity does not match');
    }

    const createdAt = this.now();
    const session: Vs1RouteSession = {
      id: this.createId('session'),
      organizationId: input.organizationId,
      routeId: input.routeId,
      routeVersionId: input.routeVersionId,
      createdByUserId: input.createdByUserId,
      title: input.title,
      mode: input.mode,
      status: 'open',
      createdAt,
      openedAt: createdAt,
    };
    const state = this.read();
    state.sessions.push(session);
    this.write(state);
    return clone(session);
  }

  getSession(sessionId: string): Vs1RouteSession | null {
    const session = this.read().sessions.find(item => item.id === sessionId);
    return session ? clone(session) : null;
  }

  updateSessionStatus(sessionId: string, status: Vs1RouteSession['status']): Vs1RouteSession {
    const state = this.read();
    const session = state.sessions.find(item => item.id === sessionId);
    if (!session) throw new Error('Cannot update session: session not found');
    session.status = status;
    if (status === 'completed' || status === 'cancelled') session.completedAt = this.now();
    this.write(state);
    return clone(session);
  }

  joinSession(sessionId: string, participantUserId: string, participantTeamId?: string): Participation {
    const state = this.read();
    const session = state.sessions.find(item => item.id === sessionId);
    if (!session || (session.status !== 'open' && session.status !== 'active')) {
      throw new Error('Cannot join session: session is not open');
    }
    const existing = state.participations.find(item =>
      item.sessionId === sessionId && item.participantUserId === participantUserId
    );
    if (existing) return clone(existing);

    const startedAt = this.now();
    const participation: Participation = {
      id: this.createId('participation'),
      sessionId,
      routeId: session.routeId,
      routeVersionId: session.routeVersionId,
      participantUserId,
      participantTeamId,
      status: 'active',
      startedAt,
      completedStationIds: [],
      progressPercentage: 0,
      score: 0,
      updatedAt: startedAt,
    };
    session.status = 'active';
    state.participations.push(participation);
    this.write(state);
    return clone(participation);
  }

  findActiveParticipation(routeVersionId: string, participantUserId: string, mode: ExperienceMode) {
    const state = this.read();
    const participation = [...state.participations].reverse().find(item =>
      item.routeVersionId === routeVersionId &&
      item.participantUserId === participantUserId &&
      item.status === 'active' &&
      state.sessions.some(session =>
        session.id === item.sessionId &&
        session.mode === mode &&
        (session.status === 'open' || session.status === 'active')
      )
    );
    if (!participation) return null;
    const session = state.sessions.find(item => item.id === participation.sessionId);
    return session && (session.status === 'open' || session.status === 'active')
      ? clone({ session, participation })
      : null;
  }

  getParticipation(sessionId: string, participantUserId: string): Participation | null {
    const participation = this.read().participations.find(item =>
      item.sessionId === sessionId && item.participantUserId === participantUserId
    );
    return participation ? clone(participation) : null;
  }

  private getWritableParticipation(state: SessionState, participationId: string, action: string) {
    const participation = state.participations.find(item => item.id === participationId);
    const session = participation ? state.sessions.find(item => item.id === participation.sessionId) : undefined;
    if (!participation || participation.status !== 'active') {
      throw new Error(`Cannot ${action}: participation is not active`);
    }
    if (!session || (session.status !== 'open' && session.status !== 'active')) {
      throw new Error(`Cannot ${action}: parent session is not active`);
    }
    return participation;
  }

  updateProgress(participationId: string, progress: ProgressUpdate): Participation {
    const state = this.read();
    const participation = this.getWritableParticipation(state, participationId, 'update progress');
    participation.currentStationId = progress.currentStationId;
    participation.completedStationIds = [...progress.completedStationIds];
    participation.progressPercentage = progress.progressPercentage;
    participation.score = progress.score;
    participation.updatedAt = this.now();
    this.write(state);
    return clone(participation);
  }

  completeParticipation(participationId: string, progress: ProgressUpdate): Participation {
    const state = this.read();
    const participation = this.getWritableParticipation(state, participationId, 'complete participation');
    const completedAt = this.now();
    Object.assign(participation, {
      ...progress,
      completedStationIds: [...progress.completedStationIds],
      status: 'completed' as const,
      completedAt,
      updatedAt: completedAt,
    });
    this.write(state);
    return clone(participation);
  }

  abandonParticipation(participationId: string): Participation {
    const state = this.read();
    const participation = state.participations.find(item => item.id === participationId);
    if (!participation || participation.status !== 'active') {
      throw new Error('Cannot abandon participation: participation is not active');
    }
    participation.status = 'abandoned';
    participation.updatedAt = this.now();
    this.write(state);
    return clone(participation);
  }

  submitTaskResponse(input: SubmitResponseInput): Vs1TaskResponse {
    const state = this.read();
    const participation = this.getWritableParticipation(state, input.participationId, 'submit response');
    const key = this.versions.getAnswerKeys(participation.routeVersionId).find(item =>
      item.stationId === input.stationId && item.taskId === input.taskId
    );
    if (!key) throw new Error('Cannot submit response: protected task definition not found');

    let isCorrect: boolean | undefined;
    let pointsAwarded = 0;
    let evaluationStatus: Vs1TaskResponse['evaluationStatus'] = 'evaluated';
    if (key.validation.kind === 'option_ids') {
      isCorrect = key.validation.correctOptionIds.includes(String(input.answer));
      pointsAwarded = isCorrect ? key.pointsAwarded : 0;
    } else if (key.validation.kind === 'accepted_text') {
      const answer = String(input.answer);
      isCorrect = key.validation.acceptedAnswers.some(accepted =>
        key.validation.kind === 'accepted_text' &&
        (key.validation.caseSensitive ? accepted === answer : accepted.toLowerCase() === answer.toLowerCase())
      );
      pointsAwarded = isCorrect ? key.pointsAwarded : 0;
    } else if (key.validation.kind === 'manual_review') {
      evaluationStatus = 'manual_review';
    } else {
      isCorrect = true;
      pointsAwarded = key.pointsAwarded;
    }

    const submittedAt = this.now();
    const existing = state.responses.find(item =>
      item.participationId === participation.id &&
      item.stationId === input.stationId &&
      item.taskId === input.taskId
    );
    const response: Vs1TaskResponse = {
      id: existing?.id || this.createId('response'),
      participationId: participation.id,
      sessionId: participation.sessionId,
      routeVersionId: participation.routeVersionId,
      stationId: input.stationId,
      taskId: input.taskId,
      answer: clone(input.answer),
      submittedAt: existing?.submittedAt || submittedAt,
      updatedAt: submittedAt,
      evaluationStatus,
      isCorrect,
      pointsAwarded,
    };
    state.responses = [...state.responses.filter(item => item.id !== response.id), response];
    this.write(state);
    return clone(response);
  }

  getParticipantState(sessionId: string, participantUserId: string) {
    const state = this.read();
    const session = state.sessions.find(item => item.id === sessionId);
    const participation = state.participations.find(item =>
      item.sessionId === sessionId && item.participantUserId === participantUserId
    );
    if (!session || !participation) return null;
    const snapshot = this.versions.getParticipantSnapshot(session.routeVersionId);
    if (!snapshot) return null;
    return clone({
      session,
      participation,
      responses: state.responses.filter(item => item.participationId === participation.id),
      snapshot,
    });
  }
}

const browserStorage = typeof window === 'undefined' ? createFallbackStorage() : window.localStorage;
export const vs1SessionRepository = new Vs1SessionRepository(browserStorage, vs1WorkflowRepository);
