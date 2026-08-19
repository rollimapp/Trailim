export * from './domain';

export type UserRole = 
  | 'guest' 
  | 'student' 
  | 'participant' 
  | 'teacher' 
  | 'creator' 
  | 'reviewer' 
  | 'approver' 
  | 'admin';

export interface UserPermissions {
  canCreateRoutes: boolean;
  canEditOwnRoutes: boolean;
  canEditOrgRoutes: boolean;
  canReviewSubmitted: boolean;
  canPublishDirectly: boolean;
  canAssignRoutes: boolean;
  canViewResults: boolean;
  canManageUsers: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
  organizationId?: string;
  organizationName?: string;
  capabilities: UserPermissions;
  totalPoints: number;
  completedRoutesCount: number;
  createdRoutesCount: number;
  earnedBadges: Badge[];
  languagePreference: 'en' | 'he';
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt?: string;
  category: 'completion' | 'creator' | 'scavenger' | 'heritge' | 'speed' | 'accuracy';
}

export type RouteType =
  | 'educational_tour'
  | 'learning_trail'
  | 'scavenger_hunt'
  | 'treasure_hunt'
  | 'community_heritage'
  | 'historical_route'
  | 'nature_exploration'
  | 'school_activity'
  | 'student_assignment'
  | 'team_quest'
  | 'competitive_challenge'
  | 'museum_route'
  | 'city_route'
  | 'youth_movement'
  | 'orientation_route';

export type ExperienceMode = 'learning' | 'challenge' | 'community_tour' | 'assignment';

export type StationOrderMode = 'linear' | 'flexible' | 'random';

export type EnvironmentType = 'indoor' | 'outdoor' | 'hybrid';

export type PublishingStatus =
  | 'draft'
  | 'in_review'
  | 'submitted_to_teacher'
  | 'changes_requested'
  | 'teacher_approved'
  | 'published'
  | 'published_to_class'
  | 'published_to_school'
  | 'published_to_community'
  | 'expert_recommended'
  | 'archived';

export type RouteVisibility = 'private' | 'class' | 'school' | 'organization' | 'unlisted_link' | 'public_community';

export interface RouteTypeMetadata {
  id: RouteType;
  label: string;
  icon: string;
  description: string;
  defaultMode: ExperienceMode;
  recommendedScoring: boolean;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
  locationName?: string;
  radiusMeters?: number;
  city?: string;
  region?: string;
}

export type CollaboratorRole =
  | 'researcher'
  | 'writer'
  | 'photographer'
  | 'video_editor'
  | 'narrator'
  | 'station_designer'
  | 'question_designer'
  | 'route_planner'
  | 'team_manager'
  | 'presenter';

export interface RouteCollaborator {
  userId: string;
  userName: string;
  userAvatar?: string;
  avatar?: string;
  roles: CollaboratorRole[];
  contributionsDescription?: string;
  addedAt: string;
}

export interface TeamInfo {
  teamName: string;
  teamAvatar?: string;
  classId?: string;
  className?: string;
  schoolId?: string;
  schoolName?: string;
  members: RouteCollaborator[];
}

export type ExpertDomain =
  | 'history'
  | 'biology'
  | 'geography'
  | 'tour_guide'
  | 'outdoor_education'
  | 'museum_educator'
  | 'local_heritage'
  | 'environmental_science'
  | 'literature_arts';

export interface ExpertLike {
  id: string;
  expertUserId: string;
  expertName: string;
  expertAvatar?: string;
  routeId: string;
  expertDomain: ExpertDomain;
  expertRole: string;
  organizationName?: string;
  recommendationQuote?: string;
  createdAt: string;
}

export type RubricCategory =
  | 'research'
  | 'source_reliability'
  | 'educational_value'
  | 'clarity'
  | 'creativity'
  | 'media_quality'
  | 'station_design'
  | 'question_quality'
  | 'teamwork'
  | 'field_testing'
  | 'accessibility'
  | 'reflection';

export interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  scoreAchieved?: number;
  feedback?: string;
  category: RubricCategory;
}

// --- Field Verification & Ground Truth Types ---
export type FieldVerificationStatus =
  | 'not_tested'
  | 'planning_field_visit'
  | 'partially_tested'
  | 'field_tested'
  | 'changes_required'
  | 'verification_expired';

export type SafetyCheckStatus =
  | 'not_checked'
  | 'pending'
  | 'checked'
  | 'issue_found'
  | 'approved';

export type AccessibilityCheckStatus =
  | 'not_checked'
  | 'partially_accessible'
  | 'accessible'
  | 'alternative_provided'
  | 'issue_found';

export type TeacherFieldApprovalStatus =
  | 'pending'
  | 'approved'
  | 'changes_requested'
  | 'waived';

export type FieldEvidenceType =
  | 'photo'
  | 'short_video'
  | 'audio_recording'
  | 'field_note'
  | 'interview_excerpt'
  | 'location_observation'
  | 'test_walk_report'
  | 'timing_record'
  | 'route_issue_report'
  | 'accessibility_note';

export type FieldEvidencePrivacy =
  | 'private_to_creator_team'
  | 'teacher_only'
  | 'school_only'
  | 'participant_visible'
  | 'public';

export interface FieldEvidence {
  id: string;
  routeId: string;
  stationId?: string;
  uploadedByUserId: string;
  uploadedByUserName: string;
  teamId?: string;
  type: FieldEvidenceType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption: string;
  createdAt: string;
  locationMetadata?: {
    latitude?: number;
    longitude?: number;
    locationName?: string;
    verifiedOnSite?: boolean;
  };
  verificationStatus: 'unverified' | 'verified_by_team' | 'verified_by_teacher';
  teacherVisible: boolean;
  participantVisible: boolean;
  privacyLevel: FieldEvidencePrivacy;
}

export type TrustBadgeType =
  | 'field_tested'
  | 'student_verified'
  | 'teacher_approved'
  | 'expert_recommended'
  | 'institution_verified';

export interface TrustBadge {
  type: TrustBadgeType;
  label: string;
  description: string;
  grantedByUserId?: string;
  grantedByName?: string;
  organizationId?: string;
  organizationName?: string;
  grantedAt: string;
  routeVersion?: number;
  domain?: string;
  note?: string;
  active: boolean;
  expirationDate?: string;
}

export interface CreatorFieldChecklist {
  routeInfoCompleted: boolean;
  studentTeamConfirmed: boolean;
  stationsDrafted: boolean;
  fieldVisitCompleted: boolean;
  originalMediaAdded: boolean;
  testWalkCompleted: boolean;
  safetyReviewed: boolean;
  accessibilityReviewed: boolean;
  reflectionSubmitted: boolean;
  readyForTeacherReview: boolean;
}

export interface RouteAssessment {
  id: string;
  routeId: string;
  teacherId: string;
  teacherName: string;
  overallScore?: number;
  maxScore?: number;
  criteriaScores: RubricCriteria[];
  generalFeedback?: string;
  groupGrade?: string;
  individualGrades?: Record<string, string>;
  selfReflection?: string;
  peerReflection?: string;
  assessedAt: string;
  
  // Field Verification Assessment Extensions
  fieldTestingVerified?: boolean;
  locationPresenceConfirmed?: boolean;
  realisticDurationConfirmed?: boolean;
  safetyConsideredConfirmed?: boolean;
  originalEvidenceVerified?: boolean;
  fieldFeedback?: string;
}

export interface Route {
  id: string;
  title: string;
  subtitle?: string;
  shortDescription: string;
  fullDescription: string;
  coverImageUrl: string;
  trailerVideoUrl?: string;
  creatorId: string;
  creatorDisplayName: string;
  creatorRole: UserRole;
  isTeamProject?: boolean;
  teamInfo?: TeamInfo;
  collaborators?: RouteCollaborator[];
  organizationId?: string;
  organizationName?: string;
  schoolId?: string;
  schoolName?: string;
  routeType: RouteType;
  supportedModes: ExperienceMode[];
  defaultMode: ExperienceMode;
  subject: string;
  topics: string[];
  tags: string[];
  learningObjectives: string[];
  skills: string[];
  ageGroups: string[];
  recommendedGradeLevels: string[];
  language: 'en' | 'he';
  estimatedDurationMinutes: number;
  estimatedDistanceKm: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  environmentType: EnvironmentType;
  accessibilityInformation: string;
  safetyInstructions: string;
  requiredEquipment: string[];
  participantInstructions: string;
  teamInstructions?: string;
  startLocation: LocationCoordinates;
  endLocation?: LocationCoordinates;
  stationOrderMode: StationOrderMode;
  stationIds: string[];
  totalPossiblePoints: number;
  visibility: RouteVisibility;
  publishingStatus: PublishingStatus;
  moderationStatus?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  approvedBy?: string;
  approvalDate?: string;
  
  // Social Signals & Quality Ratings
  likesCount: number;
  ratingsCount: number;
  ratingAverage: number;
  savesCount: number;
  launchesCount: number;
  completionsCount: number;
  startsCount?: number;
  sharesCount?: number;
  expertLikesCount: number;
  expertLikes?: ExpertLike[];
  teacherRecommendationsCount?: number;
  teacherApproved: boolean;
  teacherApprovedBy?: string;
  institutionVerified?: boolean;
  verifiedInstitutionName?: string;
  completionRatePercent?: number;

  // Field Verification & Ground Truth Model
  fieldVerificationStatus?: FieldVerificationStatus;
  fieldTestedAt?: string;
  fieldTestedByUserIds?: string[];
  fieldTestedByTeamId?: string;
  testedRouteVersion?: number;
  originalEvidenceCount?: number;
  safetyCheckStatus?: SafetyCheckStatus;
  accessibilityCheckStatus?: AccessibilityCheckStatus;
  timingVerified?: boolean;
  distanceVerified?: boolean;
  routeTransitionsVerified?: boolean;
  fieldReflection?: string;
  teacherFieldApprovalStatus?: TeacherFieldApprovalStatus;
  fieldVerificationExpiresAt?: string;
  lastFieldUpdateAt?: string;

  // Evidence & Trust Seals
  fieldEvidence?: FieldEvidence[];
  trustBadges?: TrustBadge[];

  featuredStatus: boolean;
  allowGuestAccess: boolean;
  allowRouteDuplication: boolean;
  allowRouteRemixing: boolean;
  offlineAvailability: boolean;
  requiresLocationPermission: boolean;

  // Domain Architecture Extensions
  currentDraftVersionId?: string;
  currentPublishedVersionId?: string;
  versionIds?: string[];
  creatorTeamId?: string;
  healthStatus?: 'healthy' | 'minor_issues' | 'needs_recheck' | 'temporarily_unavailable' | 'archived';
  openIssueCount?: number;
  lastFieldVerifiedAt?: string;
  testedRouteVersionId?: string;
  nextRecommendedCheckAt?: string;

  // Local user state flags (computed or toggled in UI)
  userHasLiked?: boolean;
  userHasSaved?: boolean;

  // Assessment reference
  latestAssessment?: RouteAssessment;
}

export type DiscoveryCategory =
  | 'for_you'
  | 'near_me'
  | 'my_school'
  | 'my_city'
  | 'nationwide'
  | 'expert_recommended'
  | 'new_and_promising'
  | 'popular'
  | 'community_heritage'
  | 'nature'
  | 'competitive'
  | 'student_created';

export interface RouteFilterOptions {
  searchQuery?: string;
  category?: DiscoveryCategory;
  cityRegion?: string;
  maxDistanceKm?: number;
  subject?: string;
  ageGroup?: string;
  routeType?: RouteType;
  environmentType?: EnvironmentType;
  teacherApprovedOnly?: boolean;
  expertRecommendedOnly?: boolean;
  studentCreatedOnly?: boolean;
  minRating?: number;
  sortBy?: 'recommended' | 'distance' | 'likes' | 'expert_likes' | 'rating' | 'newest' | 'completions';
}

export type StationType =
  | 'info'
  | 'observation'
  | 'question'
  | 'media'
  | 'challenge'
  | 'reflection'
  | 'evidence'
  | 'checkpoint'
  | 'final';

export type ContentBlockType =
  | 'heading'
  | 'text'
  | 'rich_text'
  | 'instruction'
  | 'quote'
  | 'historical_source'
  | 'fact_card'
  | 'warning'
  | 'tip'
  | 'image'
  | 'image_gallery'
  | 'video'
  | 'embedded_video'
  | 'audio'
  | 'map_preview'
  | 'location_hint'
  | 'callout'
  | 'creator_credit';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
  title?: string;
  content?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  transcript?: string;
  required?: boolean;
}

export type TaskType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'true_false'
  | 'open_text'
  | 'short_reflection'
  | 'observation'
  | 'photo_upload'
  | 'video_upload'
  | 'audio_recording'
  | 'qr_scan'
  | 'number_answer'
  | 'enter_code'
  | 'find_location';

export interface TaskOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface Task {
  id: string;
  type: TaskType;
  prompt: string;
  description?: string;
  options?: TaskOption[];
  correctAnswers?: string[];
  acceptableAnswers?: string[];
  explanation?: string;
  points: number;
  attemptLimit?: number;
  allowRetry?: boolean;
  penaltyPerAttempt?: number;
  required: boolean;
  mediaAttachmentUrl?: string;
  hint?: string;
  hintCost?: number;
  answerRevealPolicy?: 'immediate' | 'after_route' | 'never';
}

export type TriggerType =
  | 'always_available'
  | 'previous_completed'
  | 'manual_start'
  | 'qr_code'
  | 'access_code'
  | 'scheduled_time'
  | 'teacher_unlock'
  | 'gps_location'
  | 'geofence';

export interface StationTrigger {
  type: TriggerType;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  QRCodeValue?: string;
  accessCode?: string;
  availableFrom?: string;
  availableUntil?: string;
  prerequisiteStationIds?: string[];
  minimumScoreRequired?: number;
  manualUnlockRole?: UserRole;
  fallbackMethodEnabled?: boolean;
}

export interface Station {
  id: string;
  routeId: string;
  title: string;
  shortLabel: string;
  description: string;
  instructions?: string;
  position: number;
  stationType: StationType;
  contentBlocks: ContentBlock[];
  trigger: StationTrigger;
  tasks: Task[];
  possiblePoints: number;
  estimatedTimeMinutes: number;
  required: boolean;
  optional?: boolean;
  hiddenUntilUnlocked?: boolean;
  allowSkip: boolean;
  allowRevisit: boolean;
  safetyNote?: string;
  accessibilityAlternative?: string;
  locationData?: LocationCoordinates;
  
  // Field Verification Station Properties
  stationFieldChecked?: boolean;
  stationFieldCheckedAt?: string;
  originalEvidenceIds?: string[];
  locationConfirmed?: boolean;
  triggerTested?: boolean;
  stationSafetyNote?: string;
  stationAccessibilityNote?: string;
  stationTimingEstimateVerified?: boolean;
  stationIssueStatus?: 'none' | 'minor_issue' | 'recheck_required';

  // Domain Architecture Station Properties
  placeId?: string;
  knowledgeAssetIds?: string[];
  completionRule?: 'tasks_completed' | 'qr_scanned' | 'code_entered' | 'location_visited' | 'manual';
  interactionMode?: 'standard' | 'look_around' | 'audio_first' | 'observation';

  createdAt: string;
  updatedAt: string;
}

export interface ScoringConfiguration {
  scoringEnabled: boolean;
  showScoreDuringRoute: boolean;
  showLeaderboard: boolean;
  pointsForCompletion: number;
  timeBonusEnabled: boolean;
  hintPenalty: number;
  retryPenalty: number;
  leaderboardVisibility: 'public' | 'class_only' | 'hidden';
}

export interface RouteSession {
  id: string;
  routeId: string;
  organizerId: string;
  organizationId?: string;
  title: string;
  mode: ExperienceMode;
  status: 'draft' | 'scheduled' | 'open' | 'active' | 'paused' | 'completed' | 'cancelled';
  accessCode: string;
  joinLink: string;
  startTime?: string;
  endTime?: string;
  teamsEnabled: boolean;
  teamSize?: number;
  scoringConfiguration: ScoringConfiguration;
  assignedClassIds?: string[];
  participantIds: string[];
  createdAt: string;
}

export interface TaskResponse {
  taskId: string;
  stationId: string;
  answer: string | string[];
  isCorrect?: boolean;
  pointsEarned: number;
  evidenceUrl?: string;
  evidenceType?: 'photo' | 'video' | 'audio' | 'text';
  submittedAt: string;
  feedback?: string;
  status: 'approved' | 'pending_review' | 'revision_requested' | 'rejected';
}

export interface ParticipantProgress {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  routeId: string;
  sessionId?: string;
  teamId?: string;
  teamName?: string;
  mode: ExperienceMode;
  startedAt: string;
  completedAt?: string;
  currentStationId: string;
  completedStationIds: string[];
  score: number;
  progressPercentage: number;
  taskResponses: Record<string, TaskResponse>;
  earnedBadgeIds: string[];
  status: 'joined' | 'active' | 'completed' | 'abandoned';
}

export interface Team {
  id: string;
  sessionId: string;
  name: string;
  avatar: string;
  color: string;
  captainId: string;
  memberNames: string[];
  score: number;
  currentStationId: string;
  completedStationCount: number;
}

export interface ReviewItem {
  id: string;
  routeId: string;
  routeTitle: string;
  creatorId: string;
  creatorName: string;
  creatorRole: UserRole;
  schoolName?: string;
  subject: string;
  stationCount: number;
  submittedAt: string;
  status: 'submitted' | 'in_review' | 'changes_requested' | 'approved' | 'rejected';
  generalFeedback?: string;
  stationComments?: Record<string, string>;
  reviewerId?: string;
  reviewerName?: string;
}

export interface RouteAnalytics {
  routeId: string;
  launchesCount: number;
  participantsCount: number;
  completionRatePercent: number;
  averageScore: number;
  averageCompletionTimeMinutes: number;
  mostDifficultQuestionPrompt?: string;
  mostSkippedStationTitle?: string;
  mostUsedHintStationTitle?: string;
  uploadedSubmissionsCount: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'route_assigned' | 'review_status' | 'badge_earned' | 'team_invite' | 'comment';
  timestamp: string;
  read: boolean;
  linkRouteId?: string;
}
