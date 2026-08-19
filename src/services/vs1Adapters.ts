import type {
  ParticipantProgress,
  Route as LegacyRoute,
  Station as LegacyStation,
  Task as LegacyTask,
  TeamInfo,
} from '../types';
import type {
  AnswerKey,
  AnswerValidation,
  Participation,
  RouteContent,
  RouteDraft,
  RouteStationDraft,
  RouteStationSnapshot,
  RouteVersionSnapshotBundle,
  TaskPublic,
  TeamMember,
  TeamMemberRole,
  Vs1Route,
  Vs1RouteVersion,
  Vs1Team,
} from '../types/vs1';

const DEFAULT_ORGANIZATION_ID = 'local-org';

const mapStatus = (status: LegacyRoute['publishingStatus']): Vs1Route['status'] => {
  if (status === 'submitted_to_teacher' || status === 'in_review') return 'in_review';
  if (status === 'changes_requested') return 'changes_requested';
  if (
    status === 'published' ||
    status === 'teacher_approved' ||
    status === 'published_to_class' ||
    status === 'published_to_school' ||
    status === 'published_to_community' ||
    status === 'expert_recommended'
  ) return 'approved';
  if (status === 'archived') return 'archived';
  return 'draft';
};

const mapVisibility = (visibility: LegacyRoute['visibility']): Vs1Route['visibility'] => {
  if (visibility === 'class') return 'class';
  if (visibility === 'school' || visibility === 'organization') return 'school';
  return 'private';
};

const mapMemberRole = (role: TeamInfo['members'][number]['roles'][number]): TeamMemberRole | null => {
  if (role === 'team_manager') return 'manager';
  if (
    role === 'researcher' ||
    role === 'writer' ||
    role === 'photographer' ||
    role === 'station_designer' ||
    role === 'question_designer' ||
    role === 'route_planner'
  ) return role;
  return null;
};

export const toRouteContent = (route: LegacyRoute): RouteContent => ({
  title: route.title,
  shortDescription: route.shortDescription,
  fullDescription: route.fullDescription,
  coverImageUrl: route.coverImageUrl || undefined,
  supportedModes: [...route.supportedModes],
  defaultMode: route.defaultMode,
  subject: route.subject,
  topics: [...route.topics],
  learningObjectives: [...route.learningObjectives],
  ageGroups: [...route.ageGroups],
  language: route.language,
  estimatedDurationMinutes: route.estimatedDurationMinutes,
  estimatedDistanceKm: route.estimatedDistanceKm,
  difficulty: route.difficulty,
  accessibilityInformation: route.accessibilityInformation,
  safetyInstructions: route.safetyInstructions,
  participantInstructions: route.participantInstructions,
  startLocation: { ...route.startLocation },
  stationOrderMode: route.stationOrderMode,
});

export const toVs1Route = (
  route: LegacyRoute,
  organizationId = route.organizationId || route.schoolId || DEFAULT_ORGANIZATION_ID,
  ownerTeamId = route.creatorTeamId || `local-team-${route.id}`,
): Vs1Route => ({
  id: route.id,
  organizationId,
  ownerTeamId,
  createdByUserId: route.creatorId,
  title: route.title,
  status: mapStatus(route.publishingStatus),
  currentDraftId: route.currentDraftVersionId || `draft-${route.id}`,
  latestSubmittedVersionId: route.versionIds?.at(-1),
  approvedVersionId: route.currentPublishedVersionId,
  visibility: mapVisibility(route.visibility),
  createdAt: route.createdAt,
  updatedAt: route.updatedAt,
});

export const splitLegacyTask = (
  task: LegacyTask,
  routeVersionId: string,
  stationId: string,
): { publicTask: TaskPublic; answerKey: AnswerKey } => {
  let validation: AnswerValidation;

  if (task.options?.some(option => option.isCorrect)) {
    validation = {
      kind: 'option_ids',
      correctOptionIds: task.options.filter(option => option.isCorrect).map(option => option.id),
    };
  } else if ((task.correctAnswers?.length || 0) > 0 || (task.acceptableAnswers?.length || 0) > 0) {
    validation = {
      kind: 'accepted_text',
      acceptedAnswers: [...(task.correctAnswers || []), ...(task.acceptableAnswers || [])],
      caseSensitive: false,
    };
  } else if (task.type === 'open_text' || task.type === 'short_reflection') {
    validation = { kind: 'manual_review' };
  } else {
    validation = { kind: 'submission_only' };
  }

  const explanationByOptionId = Object.fromEntries(
    (task.options || [])
      .filter(option => option.explanation)
      .map(option => [option.id, option.explanation as string]),
  );

  return {
    publicTask: {
      id: task.id,
      type: task.type,
      prompt: task.prompt,
      description: task.description,
      options: task.options?.map(option => ({ id: option.id, text: option.text })),
      required: task.required,
      mediaAttachmentUrl: task.mediaAttachmentUrl,
      hint: task.hint,
      displayPoints: task.points,
      answerRevealPolicy: task.answerRevealPolicy,
    },
    answerKey: {
      id: `answer-${routeVersionId}-${stationId}-${task.id}`,
      routeVersionId,
      stationId,
      taskId: task.id,
      validation,
      pointsAwarded: task.points,
      attemptLimit: task.attemptLimit,
      allowRetry: task.allowRetry ?? false,
      penaltyPerAttempt: task.penaltyPerAttempt ?? 0,
      explanationByOptionId: Object.keys(explanationByOptionId).length ? explanationByOptionId : undefined,
    },
  };
};

export const toRouteStationDraft = (station: LegacyStation): RouteStationDraft => ({
  id: station.id,
  routeId: station.routeId,
  title: station.title,
  shortLabel: station.shortLabel,
  description: station.description,
  instructions: station.instructions,
  position: station.position,
  stationType: station.stationType,
  contentBlocks: station.contentBlocks.map(block => ({ ...block })),
  trigger: {
    type: station.trigger.type,
    locationName: station.locationData?.locationName,
    availableFrom: station.trigger.availableFrom,
    availableUntil: station.trigger.availableUntil,
    prerequisiteStationIds: station.trigger.prerequisiteStationIds
      ? [...station.trigger.prerequisiteStationIds]
      : undefined,
    fallbackMethodEnabled: station.trigger.fallbackMethodEnabled,
  },
  tasks: station.tasks.map(task => splitLegacyTask(task, 'draft', station.id).publicTask),
  estimatedTimeMinutes: station.estimatedTimeMinutes,
  required: station.required,
  allowSkip: station.allowSkip,
  allowRevisit: station.allowRevisit,
  safetyNote: station.safetyNote,
  accessibilityAlternative: station.accessibilityAlternative,
  locationData: station.locationData ? { ...station.locationData } : undefined,
});

export const toRouteDraft = (
  route: LegacyRoute,
  stations: LegacyStation[],
  updatedByUserId = route.creatorId,
): RouteDraft => {
  const identity = toVs1Route(route);
  return {
    id: identity.currentDraftId,
    routeId: route.id,
    organizationId: identity.organizationId,
    ownerTeamId: identity.ownerTeamId,
    basedOnVersionId: route.currentPublishedVersionId,
    content: toRouteContent(route),
    stations: stations.map(toRouteStationDraft),
    updatedByUserId,
    updatedAt: route.updatedAt,
  };
};

export const toVs1Team = (
  teamInfo: TeamInfo,
  teamId: string,
  organizationId: string,
  createdByUserId: string,
  timestamp: string,
): { team: Vs1Team; members: TeamMember[] } => ({
  team: {
    id: teamId,
    organizationId,
    name: teamInfo.teamName,
    createdByUserId,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  members: teamInfo.members.map(member => ({
    id: `${teamId}_${member.userId}`,
    teamId,
    userId: member.userId,
    roles: member.roles.map(mapMemberRole).filter((role): role is TeamMemberRole => role !== null),
    status: 'active',
    joinedAt: member.addedAt,
  })),
});

export interface SnapshotInput {
  draft: RouteDraft;
  legacyStations: LegacyStation[];
  versionId: string;
  versionNumber: number;
  submittedByUserId: string;
  submittedAt: string;
  visibility: 'class' | 'school';
}

const assertLegacyStationsMatchDraft = (
  draftStations: RouteStationDraft[],
  legacyStations: LegacyStation[],
) => {
  const legacyById = new Map(legacyStations.map(station => [station.id, station]));
  if (legacyById.size !== legacyStations.length || legacyStations.length !== draftStations.length) {
    throw new Error('Cannot snapshot route draft: legacy station identities do not match the submitted draft');
  }

  for (const draftStation of draftStations) {
    const legacyStation = legacyById.get(draftStation.id);
    if (!legacyStation || JSON.stringify(toRouteStationDraft(legacyStation)) !== JSON.stringify(draftStation)) {
      throw new Error(`Cannot snapshot route draft: legacy station ${draftStation.id} does not match the submitted draft`);
    }
  }
};

export const createRouteVersionSnapshot = ({
  draft,
  legacyStations,
  versionId,
  versionNumber,
  submittedByUserId,
  submittedAt,
  visibility,
}: SnapshotInput): RouteVersionSnapshotBundle => {
  assertLegacyStationsMatchDraft(draft.stations, legacyStations);

  const legacyById = new Map(legacyStations.map(station => [station.id, station]));
  const answerKeys: AnswerKey[] = [];
  const stations: RouteStationSnapshot[] = draft.stations.map(draftStation => {
    const legacyStation = legacyById.get(draftStation.id)!;
    legacyStation.tasks.forEach(task => {
      answerKeys.push(splitLegacyTask(task, versionId, draftStation.id).answerKey);
    });

    return {
      ...structuredClone(draftStation),
      routeVersionId: versionId,
    };
  });

  const version: Vs1RouteVersion = {
    id: versionId,
    routeId: draft.routeId,
    organizationId: draft.organizationId,
    ownerTeamId: draft.ownerTeamId,
    versionNumber,
    sourceDraftId: draft.id,
    basedOnVersionId: draft.basedOnVersionId,
    content: structuredClone(draft.content),
    stationIds: stations.map(station => station.id),
    createdByUserId: submittedByUserId,
    submittedAt,
    status: 'submitted',
    visibility,
  };

  return structuredClone({ version, stations, answerKeys });
};

export const toParticipation = (
  progress: ParticipantProgress,
  sessionId: string,
  routeVersionId: string,
  updatedAt: string,
): Participation => ({
  id: progress.id,
  sessionId,
  routeId: progress.routeId,
  routeVersionId,
  participantUserId: progress.userId,
  participantTeamId: progress.teamId,
  status: progress.status === 'completed' ? 'completed' : progress.status === 'abandoned' ? 'abandoned' : 'active',
  startedAt: progress.startedAt,
  completedAt: progress.completedAt,
  currentStationId: progress.currentStationId || undefined,
  completedStationIds: [...progress.completedStationIds],
  progressPercentage: progress.progressPercentage,
  score: progress.score,
  updatedAt,
});
