export type ProjectStageKind =
  | 'topic'
  | 'research'
  | 'planning'
  | 'field_check'
  | 'field_tour'
  | 'analysis'
  | 'reflection'
  | 'report'
  | 'presentation'
  | 'publish'
  | 'custom';

export type ProjectFieldKind =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'source_list'
  | 'concept_list'
  | 'station_list'
  | 'media'
  | 'location'
  | 'reflection'
  | 'checkbox'
  | 'custom';

export type ReportSectionKey =
  | 'introduction'
  | 'theoretical_background'
  | 'planning'
  | 'field_findings'
  | 'analysis'
  | 'reflection'
  | 'bibliography'
  | 'appendix'
  | 'custom';

export interface CountRule {
  min?: number;
  max?: number;
}

export interface TextRule {
  minWords?: number;
  maxWords?: number;
  minCharacters?: number;
  maxCharacters?: number;
}

export interface ProjectFieldRequirement {
  id: string;
  kind: ProjectFieldKind;
  label: string;
  description?: string;
  required: boolean;
  count?: CountRule;
  text?: TextRule;
  mediaTypes?: Array<'photo' | 'video' | 'audio' | 'file'>;
  reportSection?: ReportSectionKey;
  individual?: boolean;
}

export interface ProjectStageApprovalConfig {
  required: boolean;
  reviewer: 'teacher';
  lockNextStageUntilApproved: boolean;
}

export interface FieldVerificationConfig {
  enabled: boolean;
  requirePhysicalPresence?: boolean;
  requireLocationVerification?: boolean;
  requirePhotoEvidence?: boolean;
  requireInstructionCheck?: boolean;
  requireCorrectionNote?: boolean;
}

export interface ProjectStageTemplate {
  id: string;
  kind: ProjectStageKind;
  order: number;
  title: string;
  description: string;
  studentInstruction: string;
  requirements: ProjectFieldRequirement[];
  approval: ProjectStageApprovalConfig;
  fieldVerification?: FieldVerificationConfig;
}

export interface TeamConfig {
  minSize: number;
  maxSize: number;
}

export interface ProjectTemplate {
  schemaVersion: 1;
  id: string;
  title: string;
  description: string;
  subject?: string;
  audience?: string;
  locale: 'he-IL' | 'en-US';
  team: TeamConfig;
  stages: ProjectStageTemplate[];
  reportEnabled: boolean;
  routePublishingRequired: boolean;
  tags: string[];
}

export interface ProjectConfig extends ProjectTemplate {
  templateId?: string;
  projectId: string;
  teacherId?: string;
  classId?: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface TeacherProjectWizardAnswers {
  subject?: string;
  gradeLevel?: string;
  projectGoal: string;
  generalTopic?: string;
  locationContext?: string;
  teamSize?: CountRule;
  stationCount?: CountRule;
  sourceCount?: CountRule;
  conceptCount?: CountRule;
  requireFieldWork: boolean;
  requireFieldVerificationBeforeOfficialTour: boolean;
  requireTeacherApprovalBetweenStages: boolean;
  requireFinalReport: boolean;
  requirePublishing: boolean;
  notes?: string;
}
