// Architectural domain models for Trailim's place-based knowledge platform

export type PlaceType = 
  | 'historical_site'
  | 'nature_reserve'
  | 'museum'
  | 'park'
  | 'urban_landmark'
  | 'archaeological_site'
  | 'water_body'
  | 'building'
  | 'viewpoint';

export type PlaceStatus = 'active' | 'temporary_closure' | 'archived';

export interface Place {
  id: string;
  name: string;
  alternativeNames: string[];
  placeType: PlaceType;
  latitude: number;
  longitude: number;
  city: string;
  region?: string;
  country: string;
  generalAddress?: string;
  description: string;
  accessibilitySummary?: string;
  activeStatus: PlaceStatus;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeAssetType =
  | 'story'
  | 'historical_source'
  | 'fact'
  | 'image'
  | 'video'
  | 'audio'
  | 'interview'
  | 'quotation'
  | 'observation'
  | 'document'
  | 'field_note';

export type KnowledgeAssetVisibility = 'public' | 'school' | 'private';

export type KnowledgeAssetVerification = 'unverified' | 'verified_by_educator' | 'institution_verified';

export interface KnowledgeAsset {
  id: string;
  placeId: string;
  type: KnowledgeAssetType;
  title: string;
  content: string;
  mediaUrl?: string;
  sourceMetadata?: {
    archiveName?: string;
    citation?: string;
    rights?: string;
    year?: number;
  } | string;
  language: 'en' | 'he';
  createdBy: string;
  contributorIds: string[];
  organizationId?: string;
  visibility: KnowledgeAssetVisibility;
  verificationStatus: KnowledgeAssetVerification;
  createdAt: string;
  updatedAt: string;
}

export interface RouteVersion {
  id: string;
  routeId: string;
  versionNumber: number;
  createdFromVersionId?: string;
  createdBy: string;
  stationConfiguration: string[];
  changeSummary: string;
  status: 'draft' | 'submitted' | 'approved' | 'published' | 'archived';
  submittedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdAt: string;
}

export type VerificationType =
  | 'field_tested'
  | 'student_verified'
  | 'teacher_content_approved'
  | 'teacher_field_approved'
  | 'expert_recommended'
  | 'institution_verified'
  | 'safety_reviewed'
  | 'accessibility_reviewed';

export interface VerificationRecord {
  id: string;
  entityType: 'route' | 'route_version' | 'station' | 'place' | 'knowledge_asset';
  entityId: string;
  routeId?: string;
  routeVersionId?: string;
  stationId?: string;
  verificationType: VerificationType;
  status: 'verified' | 'pending' | 'revoked';
  verifiedByUserId: string;
  verifiedByOrganizationId?: string;
  expertDomain?: string;
  note?: string;
  evidenceIds: string[];
  verifiedAt: string;
  expiresAt?: string;
  revokedAt?: string;
}

export type HealthReportType =
  | 'location_missing'
  | 'route_blocked'
  | 'qr_missing'
  | 'inaccurate_information'
  | 'broken_media'
  | 'safety_issue'
  | 'accessibility_issue'
  | 'timing_inaccurate'
  | 'temporary_closure'
  | 'other';

export type HealthReportSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RouteHealthReport {
  id: string;
  routeId: string;
  routeVersionId?: string;
  stationId?: string;
  reportType: HealthReportType;
  severity: HealthReportSeverity;
  description: string;
  reportedBy: string;
  createdAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolvedAt?: string;
  resolutionNote?: string;
}

export type HealthStatus = 'healthy' | 'minor_issues' | 'needs_recheck' | 'temporarily_unavailable' | 'archived';

export interface RouteHealthSummary {
  routeId: string;
  healthStatus: HealthStatus;
  lastFieldVerifiedAt?: string;
  testedRouteVersionId?: string;
  openIssueCount: number;
  nextRecommendedCheckAt?: string;
}

export type AdoptionStatus =
  | 'invited'
  | 'adopted'
  | 'field_check_in_progress'
  | 'revision_in_progress'
  | 'submitted'
  | 'approved'
  | 'completed';

export interface RouteAdoption {
  id: string;
  originalRouteId: string;
  originalVersionId: string;
  adoptingTeamId: string;
  organizationId?: string;
  status: AdoptionStatus;
  adoptedAt: string;
  draftVersionId?: string;
  purpose: string;
  submittedAt?: string;
  completedAt?: string;
}

export interface CommissionChallenge {
  id: string;
  title: string;
  brief: string;
  commissioningOrganizationId: string;
  commissioningOrganizationName: string;
  subject: string;
  themes: string[];
  targetAgeGroups: string[];
  geographicArea: string;
  requirements: string[];
  rubricId?: string;
  publicationOpportunity: string;
  opensAt: string;
  submissionDeadline: string;
  status: 'draft' | 'active' | 'closed' | 'archived';
  submissionIds: string[];
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  teamId: string;
  routeId: string;
  submittedVersionId: string;
  submittedAt: string;
  status: 'submitted' | 'in_review' | 'shortlisted' | 'awarded' | 'rejected';
  reviewerFeedback?: string;
  selectedForPublication: boolean;
}

export type StationInteractionMode = 'standard' | 'look_around' | 'audio_first' | 'observation';
