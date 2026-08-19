import type {
  ContentBlock,
  ExperienceMode,
  LocationCoordinates,
  StationOrderMode,
  StationType,
  TaskType,
} from './index';

export type OrganizationRole = 'student' | 'teacher';
export type Vs1RouteVisibility = 'private' | 'class' | 'school';

export interface Vs1User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  status: 'active';
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: 'active' | 'disabled';
  createdAt: string;
}

export type TeamMemberRole =
  | 'manager'
  | 'researcher'
  | 'writer'
  | 'photographer'
  | 'station_designer'
  | 'question_designer'
  | 'route_planner';

export interface Vs1Team {
  id: string;
  organizationId: string;
  name: string;
  createdByUserId: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  roles: TeamMemberRole[];
  status: 'active' | 'removed';
  joinedAt: string;
}

export interface Vs1Route {
  id: string;
  organizationId: string;
  ownerTeamId: string;
  createdByUserId: string;
  title: string;
  status: 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'archived';
  currentDraftId: string;
  latestSubmittedVersionId?: string;
  approvedVersionId?: string;
  visibility: Vs1RouteVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface RouteContent {
  title: string;
  shortDescription: string;
  fullDescription: string;
  coverImageUrl?: string;
  supportedModes: ExperienceMode[];
  defaultMode: ExperienceMode;
  subject: string;
  topics: string[];
  learningObjectives: string[];
  ageGroups: string[];
  language: 'en' | 'he';
  estimatedDurationMinutes: number;
  estimatedDistanceKm: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  accessibilityInformation: string;
  safetyInstructions: string;
  participantInstructions: string;
  startLocation: LocationCoordinates;
  stationOrderMode: StationOrderMode;
}

export interface StationTriggerPublic {
  type: 'always_available' | 'previous_completed' | 'manual_start' | 'qr_code' | 'access_code' | 'scheduled_time' | 'teacher_unlock' | 'gps_location' | 'geofence';
  locationName?: string;
  availableFrom?: string;
  availableUntil?: string;
  prerequisiteStationIds?: string[];
  fallbackMethodEnabled?: boolean;
}

export interface TaskPublicOption {
  id: string;
  text: string;
}

export interface TaskPublic {
  id: string;
  type: TaskType;
  prompt: string;
  description?: string;
  options?: TaskPublicOption[];
  required: boolean;
  mediaAttachmentUrl?: string;
  hint?: string;
  displayPoints?: number;
  answerRevealPolicy?: 'immediate' | 'after_route' | 'never';
}

export interface RouteStationContent {
  title: string;
  shortLabel: string;
  description: string;
  instructions?: string;
  position: number;
  stationType: StationType;
  contentBlocks: ContentBlock[];
  trigger: StationTriggerPublic;
  tasks: TaskPublic[];
  estimatedTimeMinutes: number;
  required: boolean;
  allowSkip: boolean;
  allowRevisit: boolean;
  safetyNote?: string;
  accessibilityAlternative?: string;
  locationData?: LocationCoordinates;
}

export interface RouteStationDraft extends RouteStationContent {
  id: string;
  routeId: string;
}

export interface RouteStationSnapshot extends Readonly<RouteStationContent> {
  id: string;
  routeId: string;
  routeVersionId: string;
}

export interface RouteDraft {
  id: string;
  routeId: string;
  organizationId: string;
  ownerTeamId: string;
  basedOnVersionId?: string;
  content: RouteContent;
  stations: RouteStationDraft[];
  updatedByUserId: string;
  updatedAt: string;
}

export type AnswerValidation =
  | { kind: 'option_ids'; correctOptionIds: string[] }
  | { kind: 'accepted_text'; acceptedAnswers: string[]; caseSensitive: boolean }
  | { kind: 'submission_only' }
  | { kind: 'manual_review' };

export interface AnswerKey {
  id: string;
  routeVersionId: string;
  stationId: string;
  taskId: string;
  validation: AnswerValidation;
  pointsAwarded: number;
  attemptLimit?: number;
  allowRetry: boolean;
  penaltyPerAttempt: number;
  explanationByOptionId?: Record<string, string>;
}

export interface Vs1RouteVersion {
  id: string;
  routeId: string;
  organizationId: string;
  ownerTeamId: string;
  versionNumber: number;
  sourceDraftId: string;
  basedOnVersionId?: string;
  content: Readonly<RouteContent>;
  stationIds: readonly string[];
  createdByUserId: string;
  submittedAt: string;
  status: 'submitted' | 'changes_requested' | 'approved';
  approvedAt?: string;
  approvedByUserId?: string;
  visibility: Exclude<Vs1RouteVisibility, 'private'>;
}

export interface Review {
  id: string;
  organizationId: string;
  routeId: string;
  routeVersionId: string;
  submittedByUserId: string;
  submittedAt: string;
  assignedTeacherId?: string;
  status: 'pending' | 'changes_requested' | 'approved';
  decidedByUserId?: string;
  decidedAt?: string;
  decisionNote?: string;
  createdAt: string;
}

export interface Vs1RouteSession {
  id: string;
  organizationId: string;
  routeId: string;
  routeVersionId: string;
  createdByUserId: string;
  title: string;
  mode: ExperienceMode;
  status: 'open' | 'active' | 'completed' | 'cancelled';
  accessCodeHash?: string;
  assignedClassIds?: string[];
  createdAt: string;
  openedAt?: string;
  completedAt?: string;
}

export interface Participation {
  id: string;
  sessionId: string;
  routeId: string;
  routeVersionId: string;
  participantUserId: string;
  participantTeamId?: string;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  currentStationId?: string;
  completedStationIds: string[];
  progressPercentage: number;
  score: number;
  updatedAt: string;
}

export interface Vs1TaskResponse {
  id: string;
  participationId: string;
  sessionId: string;
  routeId: string;
  routeVersionId: string;
  stationId: string;
  taskId: string;
  answer: string | string[];
  submittedAt: string;
  updatedAt: string;
  evaluationStatus: 'pending' | 'evaluated' | 'manual_review';
  isCorrect?: boolean;
  pointsAwarded?: number;
  feedback?: string;
  attemptCount?: number;
}

export interface RouteVersionSnapshotBundle {
  version: Vs1RouteVersion;
  stations: RouteStationSnapshot[];
  answerKeys: AnswerKey[];
}
