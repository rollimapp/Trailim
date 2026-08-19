import { 
  Place, 
  KnowledgeAsset, 
  RouteVersion, 
  VerificationRecord, 
  RouteHealthReport, 
  RouteHealthSummary, 
  RouteAdoption, 
  CommissionChallenge, 
  ChallengeSubmission 
} from '../types/domain';

export const mockPlaces: Place[] = [
  {
    id: 'place-jaffa-clock',
    name: 'Old Jaffa Clock Tower & Harbor Square',
    alternativeNames: ['Migdal HaSha\'at Jaffa', 'Jaffa Port Gate'],
    placeType: 'historical_site',
    latitude: 32.0549,
    longitude: 34.7547,
    city: 'Tel Aviv-Yafo',
    region: 'Center',
    country: 'Israel',
    generalAddress: 'Yefet St 14, Tel Aviv-Yafo',
    description: 'Built in 1906 to commemorate Ottoman Sultan Abdul Hamid II, standing at the entrance of historic Jaffa.',
    accessibilitySummary: 'Paved square, ramp accessible around clock tower base; cobbled sections near harbor.',
    activeStatus: 'active',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-07-20T14:30:00Z',
  },
  {
    id: 'place-carmel-ridge',
    name: 'Carmel Ridge Eco Reserve',
    alternativeNames: ['Ramat HaNadiv Ridge', 'Carmel Oak Woodland'],
    placeType: 'nature_reserve',
    latitude: 32.5562,
    longitude: 34.9458,
    city: 'Zikhron Ya\'akov / Haifa',
    region: 'North',
    country: 'Israel',
    generalAddress: 'Carmel Ridge Reserve Trailhead',
    description: 'Protected Mediterranean forest ecosystem showcasing native Kermes oak, terebinth trees, and limestone caves.',
    accessibilitySummary: 'Unpaved soil and rock paths. Main lookout point is wheelchair accessible via timber boardwalk.',
    activeStatus: 'active',
    createdAt: '2026-06-10T09:00:00Z',
    updatedAt: '2026-07-22T11:00:00Z',
  },
  {
    id: 'place-yarkon-springs',
    name: 'Tel Afek Yarkon Springs',
    alternativeNames: ['Antipatris Fortress & Yarkon Basin'],
    placeType: 'archaeological_site',
    latitude: 32.1064,
    longitude: 34.9288,
    city: 'Peta Tikva',
    region: 'Center',
    country: 'Israel',
    generalAddress: 'Yarkon National Park',
    description: 'Ancient Roman fortress guarding the headwaters of the Yarkon River, restored wetlands, and water mills.',
    accessibilitySummary: 'Paved main promenade around fortress moat, gravel access to wetland bird hide.',
    activeStatus: 'active',
    createdAt: '2026-06-15T08:00:00Z',
    updatedAt: '2026-07-25T16:00:00Z',
  }
];

export const mockKnowledgeAssets: KnowledgeAsset[] = [
  {
    id: 'ka-jaffa-water',
    placeId: 'place-jaffa-clock',
    type: 'historical_source',
    title: '19th-Century Ottoman Municipal Water Ledger',
    content: 'Archival records showing the construction of public sabil water fountains commissioned by Governor Mahmud Hamdi Pasha in 1895.',
    mediaUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800',
    sourceMetadata: {
      archiveName: 'Tel Aviv-Yafo Municipal Historical Archive',
      citation: 'Doc. #1895-JAF-WATER-04',
      rights: 'Public Domain / Educational License',
      year: 1895,
    },
    language: 'en',
    createdBy: 'teacher-1',
    contributorIds: ['student-1', 'student-2'],
    organizationId: 'org-heritage-board',
    visibility: 'public',
    verificationStatus: 'institution_verified',
    createdAt: '2026-06-20T10:00:00Z',
    updatedAt: '2026-07-15T12:00:00Z',
  },
  {
    id: 'ka-carmel-oak',
    placeId: 'place-carmel-ridge',
    type: 'fact',
    title: 'Kermes Oak (Quercus calliprinos) Drought Adaptations',
    content: 'Leaves feature thick waxy cuticles and spiny margins to reduce evapotranspiration during hot Mediterranean summers.',
    mediaUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800',
    sourceMetadata: {
      archiveName: 'Haifa University Botany Department Field Guide',
      citation: 'Flora of the Levant Vol. 2',
      year: 2024,
    },
    language: 'en',
    createdBy: 'teacher-1',
    contributorIds: [],
    organizationId: 'org-carmel-eco',
    visibility: 'public',
    verificationStatus: 'verified_by_educator',
    createdAt: '2026-06-25T11:00:00Z',
    updatedAt: '2026-07-10T14:00:00Z',
  }
];

export const mockRouteVersions: RouteVersion[] = [
  {
    id: 'rv-m1-v2',
    routeId: 'route-m1',
    versionNumber: 2,
    createdFromVersionId: 'rv-m1-v1',
    createdBy: 'student-1',
    stationConfiguration: ['station-m1-1', 'station-m1-2', 'station-m1-3', 'station-m1-4'],
    changeSummary: 'Updated Station 4 passcode trigger and added teacher-verified photo evidence task.',
    status: 'published',
    submittedAt: '2026-07-12T10:00:00Z',
    approvedAt: '2026-07-14T15:00:00Z',
    publishedAt: '2026-07-15T12:00:00Z',
    createdAt: '2026-07-10T09:00:00Z',
  }
];

export const mockVerificationRecords: VerificationRecord[] = [
  {
    id: 'verif-m1-teacher',
    entityType: 'route_version',
    entityId: 'rv-m1-v2',
    routeId: 'route-m1',
    routeVersionId: 'rv-m1-v2',
    verificationType: 'teacher_content_approved',
    status: 'verified',
    verifiedByUserId: 'teacher-1',
    verifiedByOrganizationId: 'school-101',
    note: 'Curriculum requirements, historical primary sources, and rubric criteria fully met.',
    evidenceIds: [],
    verifiedAt: '2026-07-14T15:00:00Z',
  },
  {
    id: 'verif-m1-expert',
    entityType: 'route',
    entityId: 'route-m1',
    routeId: 'route-m1',
    verificationType: 'expert_recommended',
    status: 'verified',
    verifiedByUserId: 'expert-2',
    expertDomain: 'history',
    note: 'Outstanding historical inquiry into Ottoman infrastructure by Grade 9 student team.',
    evidenceIds: [],
    verifiedAt: '2026-07-16T11:00:00Z',
  }
];

export const mockHealthReports: RouteHealthReport[] = [
  {
    id: 'health-rep-1',
    routeId: 'route-m1',
    stationId: 'station-m1-4',
    reportType: 'timing_inaccurate',
    severity: 'low',
    description: 'Station 4 courtyard walk takes ~7 minutes instead of 4 minutes on busy weekends.',
    reportedBy: 'participant-user-5',
    createdAt: '2026-07-28T14:00:00Z',
    status: 'resolved',
    resolvedAt: '2026-07-29T10:00:00Z',
    resolutionNote: 'Adjusted station estimated time from 4 mins to 7 mins in draft version.',
  }
];

export const mockHealthSummaries: Record<string, RouteHealthSummary> = {
  'route-m1': {
    routeId: 'route-m1',
    healthStatus: 'healthy',
    lastFieldVerifiedAt: '2026-07-20T10:00:00Z',
    testedRouteVersionId: 'rv-m1-v2',
    openIssueCount: 0,
    nextRecommendedCheckAt: '2026-10-20T10:00:00Z',
  },
  'route-m2': {
    routeId: 'route-m2',
    healthStatus: 'healthy',
    lastFieldVerifiedAt: '2026-07-18T14:00:00Z',
    testedRouteVersionId: 'rv-m2-v1',
    openIssueCount: 0,
    nextRecommendedCheckAt: '2026-10-18T14:00:00Z',
  }
};

export const mockCommissionChallenges: CommissionChallenge[] = [
  {
    id: 'challenge-water-2026',
    title: 'Tel Aviv Municipal Heritage Challenge 2026: Water Infrastructure',
    brief: 'Create an interactive 4-5 station outdoor trail investigating historical sabil fountains, wellhouses, or early aqueducts in Tel Aviv-Yafo.',
    commissioningOrganizationId: 'org-heritage-board',
    commissioningOrganizationName: 'Tel Aviv Municipal Heritage Board',
    subject: 'History & Local Heritage',
    themes: ['Water Systems', 'Ottoman Era', 'Community Architecture'],
    targetAgeGroups: ['Middle School (Grades 7-9)', 'High School (Grades 10-12)'],
    geographicArea: 'Tel Aviv-Yafo Municipal Boundaries',
    requirements: [
      'Include at least 1 primary historical document or photo',
      'Conduct on-site test walk with student team photo evidence',
      'Provide accessibility alternative instructions for non-paved sections'
    ],
    publicationOpportunity: 'Winning student routes will be officially featured in the Tel Aviv Heritage Trail mobile directory and receive school commendation badges.',
    opensAt: '2026-09-01T08:00:00Z',
    submissionDeadline: '2026-11-15T23:59:00Z',
    status: 'active',
    submissionIds: ['sub-hydro-1']
  }
];

export const mockChallengeSubmissions: ChallengeSubmission[] = [
  {
    id: 'sub-hydro-1',
    challengeId: 'challenge-water-2026',
    teamId: 'team-hydro-1',
    routeId: 'route-m1',
    submittedVersionId: 'rv-m1-v2',
    submittedAt: '2026-07-15T12:00:00Z',
    status: 'shortlisted',
    reviewerFeedback: 'Excellent integration of primary water ledger sources and field testing.',
    selectedForPublication: true
  }
];

export const mockRouteAdoptions: RouteAdoption[] = [
  {
    id: 'adopt-carmel-1',
    originalRouteId: 'route-m2',
    originalVersionId: 'rv-m2-v1',
    adoptingTeamId: 'team-eco-9',
    organizationId: 'school-101',
    status: 'field_check_in_progress',
    adoptedAt: '2026-07-20T09:00:00Z',
    draftVersionId: 'rv-m2-v2-draft',
    purpose: 'Seasonal Autumn Flora & Fire Safety Check on Carmel Ridge Trail',
  }
];
