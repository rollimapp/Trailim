import type { Station as LegacyStation } from '../types';
import type {
  AnswerKey,
  Review,
  RouteDraft,
  RouteStationSnapshot,
  RouteVersionSnapshotBundle,
  TeamMember,
  Vs1Route,
  Vs1RouteVersion,
  Vs1Team,
} from '../types/vs1';
import { createRouteVersionSnapshot } from './vs1Adapters.ts';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface WorkflowState {
  routes: Vs1Route[];
  drafts: RouteDraft[];
  versions: Vs1RouteVersion[];
  stationSnapshots: Record<string, RouteStationSnapshot[]>;
  answerKeys: Record<string, AnswerKey[]>;
  reviews: Review[];
}

interface TeamState {
  teams: Vs1Team[];
  members: TeamMember[];
}

const WORKFLOW_KEY = 'trailim_vs1_versioned_workflow_v1';
const TEAMS_KEY = 'trailim_vs1_teams_v1';

const EMPTY_WORKFLOW: WorkflowState = {
  routes: [],
  drafts: [],
  versions: [],
  stationSnapshots: {},
  answerKeys: {},
  reviews: [],
};

const EMPTY_TEAMS: TeamState = { teams: [], members: [] };

const clone = <T>(value: T): T => structuredClone(value);

const createFallbackStorage = (): StorageLike => {
  const values = new Map<string, string>();
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
};

export class Vs1WorkflowRepository {
  private readonly storage: StorageLike;
  private readonly now: () => string;
  private readonly createId: (kind: 'version' | 'review') => string;

  constructor(
    storage: StorageLike,
    now: () => string = () => new Date().toISOString(),
    createId: (kind: 'version' | 'review') => string = kind => `${kind}-${Date.now()}`,
  ) {
    this.storage = storage;
    this.now = now;
    this.createId = createId;
  }

  private readWorkflow(): WorkflowState {
    const stored = this.storage.getItem(WORKFLOW_KEY);
    return stored ? JSON.parse(stored) : clone(EMPTY_WORKFLOW);
  }

  private writeWorkflow(state: WorkflowState) {
    this.storage.setItem(WORKFLOW_KEY, JSON.stringify(state));
  }

  private readTeams(): TeamState {
    const stored = this.storage.getItem(TEAMS_KEY);
    return stored ? JSON.parse(stored) : clone(EMPTY_TEAMS);
  }

  private writeTeams(state: TeamState) {
    this.storage.setItem(TEAMS_KEY, JSON.stringify(state));
  }

  saveTeam(team: Vs1Team, members: TeamMember[]) {
    const state = this.readTeams();
    state.teams = [...state.teams.filter(item => item.id !== team.id), clone(team)];
    state.members = [...state.members.filter(item => item.teamId !== team.id), ...clone(members)];
    this.writeTeams(state);
  }

  getTeam(teamId: string): { team: Vs1Team; members: TeamMember[] } | null {
    const state = this.readTeams();
    const team = state.teams.find(item => item.id === teamId);
    return team ? clone({ team, members: state.members.filter(item => item.teamId === teamId) }) : null;
  }

  saveRoute(route: Vs1Route): Vs1Route {
    const state = this.readWorkflow();
    state.routes = [...state.routes.filter(item => item.id !== route.id), clone(route)];
    this.writeWorkflow(state);
    return clone(route);
  }

  getRoute(routeId: string): Vs1Route | null {
    const route = this.readWorkflow().routes.find(item => item.id === routeId);
    return route ? clone(route) : null;
  }

  saveDraft(draft: RouteDraft): RouteDraft {
    const state = this.readWorkflow();
    state.drafts = [...state.drafts.filter(item => item.id !== draft.id), clone(draft)];
    this.writeWorkflow(state);
    return clone(draft);
  }

  getDraft(routeId: string): RouteDraft | null {
    const draft = this.readWorkflow().drafts.find(item => item.routeId === routeId);
    return draft ? clone(draft) : null;
  }

  submitDraft(
    route: Vs1Route,
    draft: RouteDraft,
    legacyStations: LegacyStation[],
    submittedByUserId: string,
    visibility: 'class' | 'school',
  ): { route: Vs1Route; review: Review; snapshot: RouteVersionSnapshotBundle } {
    if (route.id !== draft.routeId || route.currentDraftId !== draft.id) {
      throw new Error('Cannot submit draft: route identity does not match the draft');
    }

    const state = this.readWorkflow();
    const existingVersions = state.versions.filter(item => item.routeId === route.id);
    const versionNumber = existingVersions.reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1;
    const versionId = this.createId('version');
    const submittedAt = this.now();
    const snapshot = createRouteVersionSnapshot({
      draft,
      legacyStations,
      versionId,
      versionNumber,
      submittedByUserId,
      submittedAt,
      visibility,
    });
    const review: Review = {
      id: this.createId('review'),
      organizationId: route.organizationId,
      routeId: route.id,
      routeVersionId: versionId,
      submittedByUserId,
      submittedAt,
      status: 'pending',
      createdAt: submittedAt,
    };
    const updatedRoute: Vs1Route = {
      ...route,
      title: draft.content.title,
      status: 'in_review',
      latestSubmittedVersionId: versionId,
      visibility,
      updatedAt: submittedAt,
    };

    state.routes = [...state.routes.filter(item => item.id !== route.id), updatedRoute];
    state.drafts = [...state.drafts.filter(item => item.id !== draft.id), clone(draft)];
    state.versions.push(snapshot.version);
    state.stationSnapshots[versionId] = snapshot.stations;
    state.answerKeys[versionId] = snapshot.answerKeys;
    state.reviews.push(review);
    this.writeWorkflow(state);

    return clone({ route: updatedRoute, review, snapshot });
  }

  resubmit(
    routeId: string,
    draft: RouteDraft,
    legacyStations: LegacyStation[],
    submittedByUserId: string,
    visibility: 'class' | 'school',
  ) {
    const route = this.getRoute(routeId);
    if (!route || route.status !== 'changes_requested' || !route.latestSubmittedVersionId) {
      throw new Error('Cannot resubmit route: changes have not been requested');
    }

    const revisedDraft: RouteDraft = {
      ...draft,
      basedOnVersionId: route.latestSubmittedVersionId,
      updatedByUserId: submittedByUserId,
      updatedAt: this.now(),
    };
    return this.submitDraft(route, revisedDraft, legacyStations, submittedByUserId, visibility);
  }

  requestChanges(reviewId: string, decidedByUserId: string, decisionNote: string) {
    const state = this.readWorkflow();
    const review = state.reviews.find(item => item.id === reviewId);
    if (!review || review.status !== 'pending') throw new Error('Cannot request changes: review is not pending');
    const version = state.versions.find(item => item.id === review.routeVersionId);
    const route = state.routes.find(item => item.id === review.routeId);
    if (!version || !route || route.latestSubmittedVersionId !== version.id) {
      throw new Error('Cannot request changes: review does not target the latest submitted version');
    }

    const decidedAt = this.now();
    review.status = 'changes_requested';
    review.decidedByUserId = decidedByUserId;
    review.decidedAt = decidedAt;
    review.decisionNote = decisionNote;
    version.status = 'changes_requested';
    route.status = 'changes_requested';
    route.updatedAt = decidedAt;
    const draft = state.drafts.find(item => item.id === route.currentDraftId);
    if (draft) draft.basedOnVersionId = version.id;
    this.writeWorkflow(state);
    return clone({ route, review, version });
  }

  approveVersion(versionId: string, decidedByUserId: string, decisionNote: string) {
    const state = this.readWorkflow();
    const version = state.versions.find(item => item.id === versionId);
    const review = state.reviews.find(item => item.routeVersionId === versionId && item.status === 'pending');
    const route = version ? state.routes.find(item => item.id === version.routeId) : undefined;
    if (!version || !review || !route || route.latestSubmittedVersionId !== versionId) {
      throw new Error('Cannot approve version: it is not the latest pending submission');
    }

    const approvedAt = this.now();
    version.status = 'approved';
    version.approvedAt = approvedAt;
    version.approvedByUserId = decidedByUserId;
    review.status = 'approved';
    review.decidedByUserId = decidedByUserId;
    review.decidedAt = approvedAt;
    review.decisionNote = decisionNote;
    route.status = 'approved';
    route.approvedVersionId = versionId;
    route.updatedAt = approvedAt;
    this.writeWorkflow(state);
    return clone({ route, review, version });
  }

  getReview(reviewId: string): Review | null {
    const review = this.readWorkflow().reviews.find(item => item.id === reviewId);
    return review ? clone(review) : null;
  }

  getPendingReviews(): Review[] {
    return clone(this.readWorkflow().reviews.filter(item => item.status === 'pending'));
  }

  getVersion(versionId: string): Vs1RouteVersion | null {
    const version = this.readWorkflow().versions.find(item => item.id === versionId);
    return version ? clone(version) : null;
  }

  getParticipantSnapshot(versionId: string): Omit<RouteVersionSnapshotBundle, 'answerKeys'> | null {
    const state = this.readWorkflow();
    const version = state.versions.find(item => item.id === versionId);
    const stations = state.stationSnapshots[versionId];
    return version && stations ? clone({ version, stations }) : null;
  }

  getAnswerKeys(versionId: string): AnswerKey[] {
    return clone(this.readWorkflow().answerKeys[versionId] || []);
  }
}

const browserStorage = typeof window === 'undefined' ? createFallbackStorage() : window.localStorage;
export const vs1WorkflowRepository = new Vs1WorkflowRepository(browserStorage);
