import { Route, Station, User, ReviewItem, RouteAnalytics, NotificationItem, Badge, RouteSession } from '../types';

export const mockBadges: Badge[] = [
  {
    id: 'badge-explorer-1',
    title: 'Heritage Discoverer',
    description: 'Completed your first Community Heritage Trail',
    icon: '🏛️',
    earnedAt: '2026-07-20T10:00:00Z',
    category: 'heritge'
  },
  {
    id: 'badge-creator-1',
    title: 'Junior Route Architect',
    description: 'Created and published a place-based learning route',
    icon: '🗺️',
    earnedAt: '2026-07-22T14:30:00Z',
    category: 'creator'
  },
  {
    id: 'badge-accuracy-1',
    title: 'Sharp Observer',
    description: 'Answered 5 observation questions correctly on the first attempt',
    icon: '🎯',
    earnedAt: '2026-07-25T09:15:00Z',
    category: 'accuracy'
  },
  {
    id: 'badge-scavenger-1',
    title: 'Photo Trailblazer',
    description: 'Submitted 3 photo evidence tasks during an outdoor quest',
    icon: '📸',
    earnedAt: '2026-07-26T16:00:00Z',
    category: 'scavenger'
  }
];

export const mockUsers: Record<string, User> = {
  'student-1': {
    id: 'student-1',
    name: 'Maya Lin',
    email: 'maya.lin@school.edu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    role: 'student',
    schoolId: 'school-101',
    schoolName: 'Greenwood High School',
    organizationId: 'org-edu-1',
    organizationName: 'District 7 Education Network',
    capabilities: {
      canCreateRoutes: true,
      canEditOwnRoutes: true,
      canEditOrgRoutes: false,
      canReviewSubmitted: false,
      canPublishDirectly: false,
      canAssignRoutes: false,
      canViewResults: true,
      canManageUsers: false,
    },
    totalPoints: 1250,
    completedRoutesCount: 4,
    createdRoutesCount: 2,
    earnedBadges: mockBadges,
    languagePreference: 'en',
  },
  'teacher-1': {
    id: 'teacher-1',
    name: 'Ms. Elena Vance (Educator)',
    email: 'elena.vance@school.edu',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    role: 'teacher',
    schoolId: 'school-101',
    schoolName: 'Greenwood High School',
    organizationId: 'org-edu-1',
    organizationName: 'District 7 Education Network',
    capabilities: {
      canCreateRoutes: true,
      canEditOwnRoutes: true,
      canEditOrgRoutes: true,
      canReviewSubmitted: true,
      canPublishDirectly: true,
      canAssignRoutes: true,
      canViewResults: true,
      canManageUsers: false,
    },
    totalPoints: 3400,
    completedRoutesCount: 12,
    createdRoutesCount: 6,
    earnedBadges: mockBadges,
    languagePreference: 'en',
  },
  'approver-1': {
    id: 'approver-1',
    name: 'Dr. David Miller (Curriculum Reviewer)',
    email: 'david.m@cityheritage.org',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    role: 'reviewer',
    organizationId: 'org-heritage',
    organizationName: 'Municipal Heritage & Education Council',
    capabilities: {
      canCreateRoutes: true,
      canEditOwnRoutes: true,
      canEditOrgRoutes: true,
      canReviewSubmitted: true,
      canPublishDirectly: true,
      canAssignRoutes: true,
      canViewResults: true,
      canManageUsers: true,
    },
    totalPoints: 4800,
    completedRoutesCount: 18,
    createdRoutesCount: 10,
    earnedBadges: mockBadges,
    languagePreference: 'en',
  }
};

export const mockStations: Record<string, Station[]> = {
  'route-1': [
    {
      id: 'st-1-1',
      routeId: 'route-1',
      title: 'The Old Entrance',
      shortLabel: 'Station 1',
      description: 'Gather at the Old Town Square fountain to begin your historical exploration.',
      instructions: 'Look around the square and verify your arrival on-site.',
      position: 1,
      stationType: 'info',
      contentBlocks: [
        {
          id: 'cb-1-1',
          type: 'heading',
          order: 1,
          content: 'Uncovering Neighborhood History'
        },
        {
          id: 'cb-1-2',
          type: 'text',
          order: 2,
          content: 'This neighborhood was founded in 1892 by stone masons and railway workers. As you walk this 1.2km route, keep your eyes open for architectural clues embedded in the facades of buildings.'
        },
        {
          id: 'cb-1-3',
          type: 'image',
          order: 3,
          mediaUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
          caption: 'Old Town Square in 1910 — notice the horse-drawn trams.'
        },
        {
          id: 'cb-1-4',
          type: 'quote',
          order: 4,
          content: '“Every stone in this square tells a story of the hands that laid it.” — Elihu Reed, Master Mason (1895)'
        },
        {
          id: 'cb-1-[#]',
          type: 'tip',
          order: 5,
          title: 'Explorer Observation Tip',
          content: 'Look up! Most original stonework and inscriptions are located above second-floor window frames.'
        }
      ],
      trigger: {
        type: 'always_available'
      },
      tasks: [
        {
          id: 'task-1-1',
          type: 'observation',
          prompt: 'Confirm that you have arrived at the Old Town Square entrance.',
          description: 'Press the check-in button below when standing near the central fountain.',
          points: 10,
          required: true
        }
      ],
      possiblePoints: 10,
      estimatedTimeMinutes: 5,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      locationData: {
        latitude: 32.0853,
        longitude: 34.7818,
        locationName: 'Old Town Square Fountain',
        radiusMeters: 25
      },
      createdAt: '2026-07-01T10:00:00Z',
      updatedAt: '2026-07-01T10:00:00Z'
    },
    {
      id: 'st-1-2',
      routeId: 'route-1',
      title: 'What Was This Building Used For?',
      shortLabel: 'Station 2',
      description: 'Examine the stone archway preserved at 14 Heritage Way.',
      instructions: 'Inspect the keystone at the center top of the arch.',
      position: 2,
      stationType: 'question',
      contentBlocks: [
        {
          id: 'cb-2-1',
          type: 'heading',
          order: 1,
          content: 'Craftsmanship in Stone'
        },
        {
          id: 'cb-2-2',
          type: 'historical_source',
          order: 2,
          title: 'Primary Source Excerpt (1895 Archive)',
          content: '“The central keystone was carved by Master Mason Elihu Reed using local limestone. Each symbol represents a trade Guild supporting community construction.”'
        },
        {
          id: 'cb-2-3',
          type: 'image',
          order: 3,
          mediaUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=800',
          caption: 'Detail of stone keystone carving at 14 Heritage Way.'
        }
      ],
      trigger: {
        type: 'previous_completed'
      },
      tasks: [
        {
          id: 'task-1-2',
          type: 'multiple_choice',
          prompt: 'Which symbol is carved directly into the central keystone of the archway?',
          points: 20,
          options: [
            { id: 'opt-1', text: 'An anchor and compass', isCorrect: false, explanation: 'Incorrect — anchors were used at the harbor station.' },
            { id: 'opt-2', text: 'A chisel and mason square', isCorrect: true, explanation: 'Correct! The chisel and square represented the stonemasons Guild that built this workshop.' },
            { id: 'opt-3', text: 'A sheaf of wheat and sickle', isCorrect: false, explanation: 'Incorrect — agricultural symbols are found at the market station.' },
            { id: 'opt-4', text: 'A locomotive wheel', isCorrect: false, explanation: 'Incorrect — locomotive symbols belonged to the railway guild.' }
          ],
          required: true,
          hint: 'Look closely at the tool symbols etched inside the inner diamond shield.',
          hintCost: 5
        }
      ],
      possiblePoints: 20,
      estimatedTimeMinutes: 8,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      locationData: {
        latitude: 32.0861,
        longitude: 34.7825,
        locationName: '14 Heritage Way Arch',
        radiusMeters: 20
      },
      createdAt: '2026-07-01T10:00:00Z',
      updatedAt: '2026-07-01T10:00:00Z'
    },
    {
      id: 'st-1-3',
      routeId: 'route-1',
      title: 'A Resident Remembers',
      shortLabel: 'Station 3',
      description: 'Listen to oral history recordings of neighborhood merchants.',
      instructions: 'Watch the short video documentary clip and reflect on community changes.',
      position: 3,
      stationType: 'media',
      contentBlocks: [
        {
          id: 'cb-3-1',
          type: 'heading',
          order: 1,
          content: 'Oral History: 60 Years of Market Stories'
        },
        {
          id: 'cb-3-2',
          type: 'video',
          order: 2,
          mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          caption: 'Interview with Mr. Aaron Berg, 3rd generation bakery owner (1 min excerpt).'
        },
        {
          id: 'cb-3-3',
          type: 'quote',
          order: 3,
          content: '“The market wasn’t just a place to buy bread; it was the neighborhood newspaper before print presses existed here.”'
        }
      ],
      trigger: {
        type: 'previous_completed'
      },
      tasks: [
        {
          id: 'task-1-3',
          type: 'short_reflection',
          prompt: 'According to the oral story, how did the market foster community connection beyond selling goods?',
          description: 'Share your key reflection in 1-2 sentences.',
          points: 15,
          required: true,
          hint: 'Consider how news, mutual aid, and announcements were shared.'
        }
      ],
      possiblePoints: 15,
      estimatedTimeMinutes: 10,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      locationData: {
        latitude: 32.0870,
        longitude: 34.7832,
        locationName: 'Old Market Plaza',
        radiusMeters: 30
      },
      createdAt: '2026-07-01T10:00:00Z',
      updatedAt: '2026-07-01T10:00:00Z'
    },
    {
      id: 'st-1-4',
      routeId: 'route-1',
      title: 'Find the Hidden Detail',
      shortLabel: 'Station 4',
      description: 'Find a preserved historical element and submit photo evidence or text description.',
      instructions: 'Locate an original cast-iron streetlamp or brass plaque nearby.',
      position: 4,
      stationType: 'evidence',
      contentBlocks: [
        {
          id: 'cb-4-1',
          type: 'heading',
          order: 1,
          content: 'Field Photography & Observation Mission'
        },
        {
          id: 'cb-4-2',
          type: 'instruction',
          order: 2,
          content: 'In 1920, municipal workers installed 12 gas-lit cast-iron lamp posts. Three of them still remain in working order along this block.'
        },
        {
          id: 'cb-4-3',
          type: 'image',
          order: 3,
          mediaUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800',
          caption: 'Example of historic cast-iron streetlamp detailing.'
        }
      ],
      trigger: {
        type: 'qr_code',
        QRCodeValue: 'TRAIL4',
        accessCode: 'TRAIL4'
      },
      tasks: [
        {
          id: 'task-1-4',
          type: 'photo_upload',
          prompt: 'Take a photograph or describe the original cast-iron lamp post detail.',
          description: 'Submit a photo of the maker mark or base of the original lamp post outside the courtyard.',
          points: 25,
          required: true,
          hint: 'Look near the base of the lamppost outside the library courtyard.'
        }
      ],
      possiblePoints: 25,
      estimatedTimeMinutes: 10,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      locationData: {
        latitude: 32.0878,
        longitude: 34.7840,
        locationName: 'Library Courtyard',
        radiusMeters: 20
      },
      createdAt: '2026-07-01T10:00:00Z',
      updatedAt: '2026-07-01T10:00:00Z'
    },
    {
      id: 'st-1-5',
      routeId: 'route-1',
      title: 'What Story Should Be Preserved?',
      shortLabel: 'Station 5',
      description: 'Review your findings, earn your Heritage Discoverer badge, and submit final feedback.',
      instructions: 'Answer the final questions and route reflection to complete your tour.',
      position: 5,
      stationType: 'final',
      contentBlocks: [
        {
          id: 'cb-5-1',
          type: 'heading',
          order: 1,
          content: 'Route Conclusion & Preserving Memory'
        },
        {
          id: 'cb-5-2',
          type: 'text',
          order: 2,
          content: 'By documenting and researching these neighborhood stations, you are helping preserve community memory for future generations.'
        },
        {
          id: 'cb-5-3',
          type: 'creator_credit',
          order: 3,
          title: 'Created by Student Team "Urban Explorers"',
          content: 'Curated under mentorship of Ms. Elena Vance with support from the Municipal Heritage Office.'
        }
      ],
      trigger: {
        type: 'previous_completed'
      },
      tasks: [
        {
          id: 'task-1-5-mc',
          type: 'multiple_choice',
          prompt: 'Why was local limestone chosen by the 1892 stone masons?',
          points: 20,
          options: [
            { id: 'mc-5-1', text: 'It was imported from distant overseas quarries', isCorrect: false, explanation: 'Incorrect — transportation was limited in 1892.' },
            { id: 'mc-5-2', text: 'It was abundant locally and insulated well against summer heat', isCorrect: true, explanation: 'Correct! Local limestone kept indoor temperatures cool naturally.' },
            { id: 'mc-5-3', text: 'It was a temporary synthetic plaster material', isCorrect: false, explanation: 'Incorrect — the limestone blocks have survived over 130 years.' }
          ],
          required: true
        },
        {
          id: 'task-1-5-refl',
          type: 'short_reflection',
          prompt: 'What is one thing you noticed here that you would not have noticed from a classroom or screen?',
          description: 'Reflect on your physical experience in the field.',
          points: 15,
          required: true
        }
      ],
      possiblePoints: 35,
      estimatedTimeMinutes: 5,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      locationData: {
        latitude: 32.0885,
        longitude: 34.7845,
        locationName: 'Neighborhood Memorial Garden',
        radiusMeters: 30
      },
      createdAt: '2026-07-01T10:00:00Z',
      updatedAt: '2026-07-01T10:00:00Z'
    }
  ],
  'route-2': [
    {
      id: 'st-2-1',
      routeId: 'route-2',
      title: 'Canopy Layers Observation',
      shortLabel: 'Tree Canopy',
      description: 'Identify indigenous tree species and measure canopy density.',
      instructions: 'Use the observation guide to classify leaf patterns.',
      position: 1,
      stationType: 'observation',
      contentBlocks: [
        {
          id: 'cb-201',
          type: 'heading',
          order: 1,
          content: 'Urban Forest Biodiversity'
        },
        {
          id: 'cb-202',
          type: 'image',
          order: 2,
          mediaUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800',
          caption: 'Oak and Pine canopy interaction.'
        }
      ],
      trigger: { type: 'always_available' },
      tasks: [
        {
          id: 'task-2-1',
          type: 'multiple_choice',
          prompt: 'Which leaf shape belongs to the Mediterranean Oak trees in this grove?',
          points: 80,
          options: [
            { id: 'o1', text: 'Serrated oval leaf with prickly edge', isCorrect: true, explanation: 'Correct! Quercus calliprinos features small spiny leaves to conserve moisture.' },
            { id: 'o2', text: 'Needle cluster in groups of five', isCorrect: false },
            { id: 'o3', text: 'Heart-shaped smooth compound leaf', isCorrect: false }
          ],
          required: true
        }
      ],
      possiblePoints: 80,
      estimatedTimeMinutes: 10,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      locationData: { latitude: 32.0910, longitude: 34.7890, locationName: 'North Grove Entrance' },
      createdAt: '2026-07-05T10:00:00Z',
      updatedAt: '2026-07-05T10:00:00Z'
    }
  ],
  'route-3': [
    {
      id: 'st-3-1',
      routeId: 'route-3',
      title: 'The Clock Tower Clue',
      shortLabel: 'Clock Tower',
      description: 'Decode the secret numbers hidden on the historic dial.',
      instructions: 'Find the roman numeral corresponding to the renovation year.',
      position: 1,
      stationType: 'challenge',
      contentBlocks: [
        {
          id: 'cb-301',
          type: 'heading',
          order: 1,
          content: 'Race Against Time!'
        },
        {
          id: 'cb-302',
          type: 'image',
          order: 2,
          mediaUrl: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=800',
          caption: 'Historic Clock Tower.'
        }
      ],
      trigger: { type: 'always_available' },
      tasks: [
        {
          id: 'task-3-1',
          type: 'enter_code',
          prompt: 'Enter the 4-digit secret code carved into the brass plaque on the south pillar.',
          points: 120,
          correctAnswers: ['1906', '1906.'],
          required: true,
          hint: 'The year of the Ottoman governor build.'
        }
      ],
      possiblePoints: 120,
      estimatedTimeMinutes: 6,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      locationData: { latitude: 32.0550, longitude: 34.7550, locationName: 'Clock Tower Plaza' },
      createdAt: '2026-07-10T10:00:00Z',
      updatedAt: '2026-07-10T10:00:00Z'
    }
  ],
  'route-market-draft': [
    {
      id: 'st-market-1',
      routeId: 'route-market-draft',
      title: 'Market Square Entrance & Heritage Arch',
      shortLabel: 'Market Entrance',
      description: 'Historical entrance to the 19th-century trade market.',
      instructions: 'Read the trade historical summary and locate the stone keystone above the main arch.',
      position: 1,
      stationType: 'info',
      contentBlocks: [
        {
          id: 'cb-m1-1',
          type: 'heading',
          order: 1,
          content: 'Voices of the Old Market Entrance'
        },
        {
          id: 'cb-m1-2',
          type: 'text',
          order: 2,
          content: 'Built in 1892, this arched entrance served as the primary gateway for regional merchants, spice vendors, and stonemasons.'
        }
      ],
      trigger: { type: 'always_available' },
      tasks: [
        {
          id: 'task-m1-1',
          type: 'multiple_choice',
          prompt: 'Which year is carved into the central stone keystone above the archway?',
          points: 50,
          options: [
            { id: 'o1', text: '1892', isCorrect: true, explanation: 'Correct! The inscription 1892 marks the official completion of the central merchant arch.' },
            { id: 'o2', text: '1905', isCorrect: false },
            { id: 'o3', text: '1920', isCorrect: false }
          ],
          required: true
        }
      ],
      possiblePoints: 50,
      estimatedTimeMinutes: 5,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      locationData: { latitude: 32.0850, longitude: 34.7810, locationName: 'Old Market Gateway' },
      createdAt: '2026-07-27T08:00:00Z',
      updatedAt: '2026-07-27T08:00:00Z'
    },
    {
      id: 'st-market-2',
      routeId: 'route-market-draft',
      title: 'The Old Baker’s Stone Vault',
      shortLabel: 'Baker Vault',
      description: 'Examine the basalt stone oven arches used for traditional breadmaking.',
      instructions: 'Inspect the stone masonry oven structure.',
      position: 2,
      stationType: 'observation',
      contentBlocks: [
        {
          id: 'cb-m2-1',
          type: 'heading',
          order: 1,
          content: 'Community Breadmaking Vaults'
        }
      ],
      trigger: { type: 'previous_completed' },
      tasks: [
        {
          id: 'task-m2-1',
          type: 'observation',
          prompt: 'Count the number of stone ventilation flues above the main oven vault.',
          points: 50,
          required: true
        }
      ],
      possiblePoints: 50,
      estimatedTimeMinutes: 8,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      locationData: { latitude: 32.0855, longitude: 34.7815, locationName: 'Baker Street Vault' },
      createdAt: '2026-07-27T08:00:00Z',
      updatedAt: '2026-07-27T08:00:00Z'
    },
    {
      id: 'st-market-3',
      routeId: 'route-market-draft',
      title: 'Merchant Oral Histories & Spice Alley',
      shortLabel: 'Spice Alley',
      description: 'Listen to oral interview clips from 3rd generation market traders.',
      instructions: 'Listen to the audio recording and answer the reflection question.',
      position: 3,
      stationType: 'media',
      contentBlocks: [
        {
          id: 'cb-m3-1',
          type: 'heading',
          order: 1,
          content: 'Spice Market Oral Records'
        }
      ],
      trigger: { type: 'previous_completed' },
      tasks: [
        {
          id: 'task-m3-1',
          type: 'short_reflection',
          prompt: 'What tradition did the spice merchant describe preserving in their family shop?',
          points: 50,
          required: true
        }
      ],
      possiblePoints: 50,
      estimatedTimeMinutes: 10,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      locationData: { latitude: 32.0860, longitude: 34.7820, locationName: 'Spice Alley Alleyway' },
      createdAt: '2026-07-27T08:00:00Z',
      updatedAt: '2026-07-27T08:00:00Z'
    },
    {
      id: 'st-market-4',
      routeId: 'route-market-draft',
      title: 'Old Market Courtyard Cipher',
      shortLabel: 'Courtyard Cipher',
      description: 'Scan QR code or enter demo code "TRAIL4" to complete the route.',
      instructions: 'Enter demo unlock code "TRAIL4" to access the final station check.',
      position: 4,
      stationType: 'checkpoint',
      contentBlocks: [
        {
          id: 'cb-m4-1',
          type: 'heading',
          order: 1,
          content: 'Final Courtyard Check'
        }
      ],
      trigger: { type: 'qr_code', QRCodeValue: 'TRAIL4', accessCode: 'TRAIL4' },
      tasks: [
        {
          id: 'task-m4-1',
          type: 'enter_code',
          prompt: 'Enter the courtyard passcode found on the plaque.',
          points: 100,
          correctAnswers: ['TRAIL4', 'trail4'],
          required: true
        }
      ],
      possiblePoints: 100,
      estimatedTimeMinutes: 10,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      locationData: { latitude: 32.0865, longitude: 34.7825, locationName: 'Courtyard Plaza' },
      createdAt: '2026-07-27T08:00:00Z',
      updatedAt: '2026-07-27T08:00:00Z'
    }
  ]
};

export const mockRoutes: Route[] = [
  {
    id: 'route-market-draft',
    title: 'Voices of the Old Market',
    subtitle: 'A community heritage and trade oral history trail by Grade 8 storytellers',
    shortDescription: 'Explore 19th-century trade archways, spice merchant stories, and stone bakery vaults in the old city market.',
    fullDescription: 'Designed as a collaborative student project by Team Market Storytellers. Features primary research on local trade guilds, recorded oral history interviews with third-generation market vendors, and interactive field observation tasks.',
    coverImageUrl: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=1200',
    creatorId: 'student-1',
    creatorDisplayName: 'Maya Lin & Market Storytellers',
    creatorRole: 'student',
    isTeamProject: true,
    teamInfo: {
      teamName: 'Market Storytellers',
      schoolId: 'school-101',
      schoolName: 'Greenwood High School',
      className: 'Class 8A History',
      members: [
        {
          userId: 'student-1',
          userName: 'Maya Lin',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          roles: ['team_manager', 'route_planner'],
          contributionsDescription: 'Project coordinator & route mapper',
          addedAt: '2026-07-27T08:00:00Z'
        },
        {
          userId: 'student-2',
          userName: 'Liam Chen',
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
          roles: ['researcher', 'writer'],
          contributionsDescription: 'Researched trade guild archives',
          addedAt: '2026-07-27T08:00:00Z'
        },
        {
          userId: 'student-3',
          userName: 'Noa Levi',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
          roles: ['photographer', 'video_editor'],
          contributionsDescription: 'Field photography & audio interview clips',
          addedAt: '2026-07-27T08:00:00Z'
        },
        {
          userId: 'student-4',
          userName: 'Alex Rivera',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
          roles: ['question_designer', 'station_designer'],
          contributionsDescription: 'Created observation ciphers & station layout',
          addedAt: '2026-07-27T08:00:00Z'
        }
      ]
    },
    collaborators: [
      {
        userId: 'student-2',
        userName: 'Liam Chen',
        roles: ['researcher', 'writer'],
        addedAt: '2026-07-27T08:00:00Z'
      }
    ],
    schoolId: 'school-101',
    schoolName: 'Greenwood High School',
    routeType: 'community_heritage',
    supportedModes: ['community_tour', 'learning', 'challenge'],
    defaultMode: 'community_tour',
    subject: 'Community History & Heritage',
    topics: ['Trade Markets', 'Oral Histories', 'Architectural Vaults', 'Local Heritage'],
    tags: ['Student Project', 'Drafting Phase', 'Field Visit Pending', 'Oral History'],
    learningObjectives: [
      'Document local trade history through physical observation and merchant interviews.',
      'Construct accessible, multi-station outdoor learning paths for community members.'
    ],
    skills: ['Primary Research', 'Digital Storytelling', 'Field Investigation', 'Collaboration'],
    ageGroups: ['10-14 years', '15-18 years', 'Adults & Families'],
    recommendedGradeLevels: ['Grade 8', 'Grade 9'],
    language: 'en',
    estimatedDurationMinutes: 35,
    estimatedDistanceKm: 1.1,
    difficulty: 'easy',
    environmentType: 'outdoor',
    accessibilityInformation: 'Flat paved market alleyways with step-free access to all 4 stations.',
    safetyInstructions: 'Watch out for active market delivery carts in narrow lanes.',
    requiredEquipment: ['Smartphone with camera', 'Walking shoes'],
    participantInstructions: 'Follow the 4 stations in sequence and complete observation tasks.',
    startLocation: {
      latitude: 32.0850,
      longitude: 34.7810,
      locationName: 'Old Market Gateway',
      address: '1 Market Alley',
      city: 'Tel Aviv',
      region: 'Central District'
    },
    stationOrderMode: 'linear',
    stationIds: ['st-market-1', 'st-market-2', 'st-market-3', 'st-market-4'],
    totalPossiblePoints: 250,
    visibility: 'class',
    publishingStatus: 'draft',
    version: 1,
    createdAt: '2026-07-27T06:00:00Z',
    updatedAt: '2026-07-27T08:00:00Z',

    likesCount: 12,
    ratingsCount: 3,
    ratingAverage: 4.8,
    savesCount: 5,
    launchesCount: 8,
    completionsCount: 6,
    startsCount: 8,
    sharesCount: 1,
    expertLikesCount: 0,
    teacherRecommendationsCount: 0,
    teacherApproved: false,
    completionRatePercent: 75,

    // Field Verification Status
    fieldVerificationStatus: 'planning_field_visit',
    fieldTestedAt: '2026-07-27T07:30:00Z',
    originalEvidenceCount: 2,
    safetyCheckStatus: 'pending',
    accessibilityCheckStatus: 'accessible',
    timingVerified: true,
    distanceVerified: true,
    fieldReflection: 'Preliminary scout visit completed. Team scheduled for second full test walk this Friday.',
    teacherFieldApprovalStatus: 'pending',

    trustBadges: [
      {
        type: 'student_verified',
        label: 'Student Created',
        description: 'Created by Market Storytellers (Class 8A)',
        grantedAt: '2026-07-27T06:00:00Z',
        active: true
      }
    ],

    fieldEvidence: [
      {
        id: 'fe-market-1',
        routeId: 'route-market-draft',
        stationId: 'st-market-1',
        uploadedByUserId: 'student-3',
        uploadedByUserName: 'Noa Levi (Photographer)',
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=800',
        caption: 'Field photo of historic stone keystone at the entrance archway.',
        createdAt: '2026-07-27T07:15:00Z',
        verificationStatus: 'verified_by_team',
        teacherVisible: true,
        participantVisible: true,
        privacyLevel: 'participant_visible'
      }
    ],

    featuredStatus: false,
    allowGuestAccess: true,
    allowRouteDuplication: true,
    allowRouteRemixing: true,
    offlineAvailability: true,
    requiresLocationPermission: true
  },
  {
    id: 'route-1',
    title: 'Hidden Stories of the Mason Quarter',
    subtitle: 'An interactive community heritage trail crafted by Grade 9 student teams',
    shortDescription: 'Discover historic stone masonry, oral traditions, and neighborhood secrets in Tel Aviv’s oldest guild quarter.',
    fullDescription: 'Take an engaging 1.2 km walking journey through 5 interactive outdoor stations. Research created by Student Team "Urban Explorers" (Grade 9) in collaboration with municipal historians. Explore original stone arches, listen to audio interviews with long-time shopkeepers, and solve observation ciphers.',
    coverImageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200',
    creatorId: 'student-1',
    creatorDisplayName: 'Maya Lin & Team Urban Explorers',
    creatorRole: 'student',
    isTeamProject: true,
    teamInfo: {
      teamName: 'Urban Explorers (Class 9B)',
      schoolId: 'school-101',
      schoolName: 'Greenwood High School',
      members: [
        {
          userId: 'student-1',
          userName: 'Maya Lin',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          roles: ['route_planner', 'station_designer', 'team_manager'],
          contributionsDescription: 'Coordinated fieldwork, mapped GPS coordinates, and designed station 2 & 4 tasks.',
          addedAt: '2026-07-02T10:00:00Z'
        },
        {
          userId: 'student-2',
          userName: 'Liam Chen',
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
          roles: ['researcher', 'writer'],
          contributionsDescription: 'Researched municipal archives and transcribed 1895 builder receipts.',
          addedAt: '2026-07-02T10:00:00Z'
        },
        {
          userId: 'student-3',
          userName: 'Noa Levi',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
          roles: ['photographer', 'video_editor'],
          contributionsDescription: 'Shot high-resolution architectural facade imagery and edited oral interview audio clips.',
          addedAt: '2026-07-03T11:00:00Z'
        }
      ]
    },
    collaborators: [
      {
        userId: 'student-2',
        userName: 'Liam Chen',
        roles: ['researcher', 'writer'],
        addedAt: '2026-07-02T10:00:00Z'
      },
      {
        userId: 'student-3',
        userName: 'Noa Levi',
        roles: ['photographer', 'video_editor'],
        addedAt: '2026-07-03T11:00:00Z'
      }
    ],
    schoolId: 'school-101',
    schoolName: 'Greenwood High School',
    organizationId: 'org-edu-1',
    organizationName: 'District 7 Education Network',
    routeType: 'community_heritage',
    supportedModes: ['learning', 'challenge', 'community_tour'],
    defaultMode: 'community_tour',
    subject: 'History & Local Heritage',
    topics: ['Local Architecture', 'Oral History', 'Community Memory', 'Stonemasonry'],
    tags: ['Student Created', 'Walking Trail', 'Audio Included', 'Historical Sources'],
    learningObjectives: [
      'Analyze primary historical sources and architectural facades in real space.',
      'Evaluate how urban modernization transforms local trade and community identity.',
      'Practice field photography and observational documentation.'
    ],
    skills: ['Historical Thinking', 'Observational Skills', 'Digital Literacy', 'Community Research'],
    ageGroups: ['10-14 years', '15-18 years', 'Adults & Families'],
    recommendedGradeLevels: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    language: 'en',
    estimatedDurationMinutes: 45,
    estimatedDistanceKm: 1.2,
    difficulty: 'easy',
    environmentType: 'outdoor',
    accessibilityInformation: 'Wheelchair accessible paved sidewalks throughout. Audio transcripts available.',
    safetyInstructions: 'Stay on sidewalks at all times and cross roads only at pedestrian crosswalks.',
    requiredEquipment: ['Smartphone with camera', 'Comfortable walking shoes'],
    participantInstructions: 'Move through the 5 stations in order. Answer questions and take photo evidence when prompted.',
    teamInstructions: 'In Challenge Mode, form teams of 2-4 participants. Assign one team captain to submit photo tasks.',
    startLocation: {
      latitude: 32.0853,
      longitude: 34.7818,
      locationName: 'Old Mason Square Fountain',
      address: '12 Mason Way',
      city: 'Tel Aviv',
      region: 'Central District'
    },
    endLocation: {
      latitude: 32.0885,
      longitude: 34.7845,
      locationName: 'Neighborhood Memorial Garden',
      city: 'Tel Aviv'
    },
    stationOrderMode: 'linear',
    stationIds: ['st-1-1', 'st-1-2', 'st-1-3', 'st-1-4', 'st-1-5'],
    totalPossiblePoints: 500,
    visibility: 'public_community',
    publishingStatus: 'published_to_community',
    version: 1,
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-15T12:00:00Z',
    publishedAt: '2026-07-15T12:00:00Z',
    approvedBy: 'Ms. Elena Vance (Educator)',
    approvalDate: '2026-07-14T15:00:00Z',

    // Quality signals
    likesCount: 184,
    ratingsCount: 42,
    ratingAverage: 4.9,
    savesCount: 67,
    launchesCount: 198,
    completionsCount: 165,
    startsCount: 198,
    sharesCount: 34,
    expertLikesCount: 3,
    teacherRecommendationsCount: 5,
    teacherApproved: true,
    teacherApprovedBy: 'Ms. Elena Vance (Grade 9 History Lead)',
    institutionVerified: true,
    verifiedInstitutionName: 'Tel Aviv Municipal Heritage Board',
    completionRatePercent: 88,

    expertLikes: [
      {
        id: 'el-101',
        expertUserId: 'approver-1',
        expertName: 'Dr. David Miller',
        expertAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        routeId: 'route-1',
        expertDomain: 'history',
        expertRole: 'Senior Historian & Municipal Heritage Chair',
        organizationName: 'Municipal Heritage & Education Council',
        recommendationQuote: 'Outstanding student field research! The inclusion of primary stone mason receipts elevates this trail into a masterclass in place-based pedagogy.',
        createdAt: '2026-07-16T10:00:00Z'
      },
      {
        id: 'el-102',
        expertUserId: 'exp-202',
        expertName: 'Rina Ben-David',
        expertAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        routeId: 'route-1',
        expertDomain: 'local_heritage',
        expertRole: 'Licensed Israel Master Tour Guide',
        organizationName: 'Society for Preservation of Israel Heritage Sites',
        recommendationQuote: 'A delightful hidden-gem itinerary. Perfect for families seeking authentic neighborhood stories.',
        createdAt: '2026-07-18T14:30:00Z'
      }
    ],

    // Field Verification & Ground Truth
    fieldVerificationStatus: 'field_tested',
    fieldTestedAt: '2026-07-14T11:00:00Z',
    fieldTestedByUserIds: ['student-1', 'student-2', 'student-3'],
    fieldTestedByTeamId: 'team-urban-explorers',
    testedRouteVersion: 1,
    originalEvidenceCount: 6,
    safetyCheckStatus: 'approved',
    accessibilityCheckStatus: 'accessible',
    timingVerified: true,
    distanceVerified: true,
    routeTransitionsVerified: true,
    fieldReflection: 'Our student team walked the entire 1.2km loop together on July 14. We checked that the historical keystone at station 2 is clearly visible and confirmed step-free sidewalk access throughout.',
    teacherFieldApprovalStatus: 'approved',
    lastFieldUpdateAt: '2026-07-14T12:30:00Z',

    trustBadges: [
      {
        type: 'field_tested',
        label: 'Field Tested',
        description: 'Physically walked, timed, and verified on-site by student team',
        grantedAt: '2026-07-14T12:00:00Z',
        active: true
      },
      {
        type: 'student_verified',
        label: 'Student Created',
        description: 'Researched and documented by Grade 9 student team "Urban Explorers"',
        grantedAt: '2026-07-14T12:00:00Z',
        active: true
      },
      {
        type: 'teacher_approved',
        label: 'Teacher Approved',
        description: 'Reviewed and approved by Ms. Elena Vance (History Department Chair)',
        grantedByName: 'Ms. Elena Vance',
        grantedAt: '2026-07-14T15:00:00Z',
        active: true
      },
      {
        type: 'expert_recommended',
        label: 'Expert Recommended',
        description: 'Endorsed by Dr. David Miller (Municipal Heritage Chair)',
        grantedByName: 'Dr. David Miller',
        organizationName: 'Municipal Heritage Council',
        grantedAt: '2026-07-16T10:00:00Z',
        active: true
      },
      {
        type: 'institution_verified',
        label: 'Institution Verified',
        description: 'Validated by Tel Aviv Municipal Heritage Board',
        organizationName: 'Tel Aviv Municipal Heritage Board',
        grantedAt: '2026-07-15T12:00:00Z',
        active: true
      }
    ],

    fieldEvidence: [
      {
        id: 'fe-101',
        routeId: 'route-1',
        stationId: 'st-1-2',
        uploadedByUserId: 'student-3',
        uploadedByUserName: 'Noa Levi (Photographer)',
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=800',
        caption: 'Field photo of original stone keystone carved in 1895.',
        createdAt: '2026-07-14T10:30:00Z',
        locationMetadata: { latitude: 32.0861, longitude: 34.7825, verifiedOnSite: true, locationName: '14 Heritage Way Arch' },
        verificationStatus: 'verified_by_teacher',
        teacherVisible: true,
        participantVisible: true,
        privacyLevel: 'public'
      },
      {
        id: 'fe-102',
        routeId: 'route-1',
        stationId: 'st-1-3',
        uploadedByUserId: 'student-2',
        uploadedByUserName: 'Liam Chen (Researcher)',
        type: 'interview_excerpt',
        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        caption: 'On-site oral recording with Aaron Berg, 3rd generation bakery merchant.',
        createdAt: '2026-07-14T11:00:00Z',
        locationMetadata: { latitude: 32.0870, longitude: 34.7832, verifiedOnSite: true, locationName: 'Old Market Plaza' },
        verificationStatus: 'verified_by_teacher',
        teacherVisible: true,
        participantVisible: true,
        privacyLevel: 'public'
      },
      {
        id: 'fe-103',
        routeId: 'route-1',
        uploadedByUserId: 'student-1',
        uploadedByUserName: 'Maya Lin (Team Lead)',
        type: 'test_walk_report',
        caption: 'Field timing test: Total duration 42 minutes at normal walking pace. All crosswalks safe.',
        createdAt: '2026-07-14T11:45:00Z',
        verificationStatus: 'verified_by_teacher',
        teacherVisible: true,
        participantVisible: true,
        privacyLevel: 'public'
      }
    ],

    featuredStatus: true,
    allowGuestAccess: true,
    allowRouteDuplication: true,
    allowRouteRemixing: true,
    offlineAvailability: true,
    requiresLocationPermission: true,
    userHasLiked: true,
    userHasSaved: true
  },
  {
    id: 'route-2',
    title: 'Green Canopy: Carmel Ridge Botany Walk',
    subtitle: 'Botany, biodiversity & Mediterranean pine microclimates',
    shortDescription: 'Explore endemic plant ecology, pine canopy layers, and wildlife habitats on the Carmel slopes.',
    fullDescription: 'Designed for science classes and nature enthusiasts, this 1.8km route takes participants through 4 ecological microclimates along the Carmel Ridge in Haifa. Identify native oak and terebinth species, record bird calls, and measure soil temperatures in shaded ravines.',
    coverImageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1200',
    creatorId: 'teacher-1',
    creatorDisplayName: 'Ms. Elena Vance (Educator)',
    creatorRole: 'teacher',
    isTeamProject: false,
    schoolId: 'school-101',
    schoolName: 'Greenwood High School',
    routeType: 'nature_exploration',
    supportedModes: ['learning', 'challenge', 'assignment'],
    defaultMode: 'learning',
    subject: 'Ecology & Biology',
    topics: ['Botany', 'Microclimates', 'Mediterranean Ecology', 'Conservation'],
    tags: ['Nature Trail', 'Science Experiment', 'Outdoor Lab', 'Botanical Survey'],
    learningObjectives: ['Identify 4 native Mediterranean oak and terebinth species.', 'Measure microclimate humidity variations across mountain slopes.'],
    skills: ['Scientific Observation', 'Classification', 'Environmental Stewardship'],
    ageGroups: ['8-12 years', '12-16 years', 'Adults & Families'],
    recommendedGradeLevels: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'],
    language: 'en',
    estimatedDurationMinutes: 60,
    estimatedDistanceKm: 1.8,
    difficulty: 'easy',
    environmentType: 'outdoor',
    accessibilityInformation: 'Gravel nature trail with step-free alternative detours marked at station 3.',
    safetyInstructions: 'Wear sturdy footwear. Do not touch unfamiliar wild fungi or leave marked paths.',
    requiredEquipment: ['Smartphone', 'Notebook', 'Water bottle'],
    participantInstructions: 'Follow the botanical trail markers and inspect plant tags at each station stop.',
    startLocation: {
      latitude: 32.7940,
      longitude: 34.9890,
      locationName: 'Carmel National Park North Entrance',
      address: 'Pine Ridge Road',
      city: 'Haifa',
      region: 'Haifa District'
    },
    stationOrderMode: 'linear',
    stationIds: ['st-2-1'],
    totalPossiblePoints: 350,
    visibility: 'public_community',
    publishingStatus: 'published_to_community',
    version: 1,
    createdAt: '2026-07-05T10:00:00Z',
    updatedAt: '2026-07-18T11:00:00Z',
    publishedAt: '2026-07-18T11:00:00Z',

    likesCount: 142,
    ratingsCount: 31,
    ratingAverage: 4.8,
    savesCount: 52,
    launchesCount: 120,
    completionsCount: 104,
    startsCount: 120,
    sharesCount: 19,
    expertLikesCount: 2,
    teacherRecommendationsCount: 8,
    teacherApproved: true,
    teacherApprovedBy: 'Carmel Regional Science Coordinator',
    institutionVerified: true,
    verifiedInstitutionName: 'Israel Nature and Parks Authority Partner',
    completionRatePercent: 86,

    expertLikes: [
      {
        id: 'el-201',
        expertUserId: 'exp-301',
        expertName: 'Dr. Amos Stern',
        expertAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        routeId: 'route-2',
        expertDomain: 'biology',
        expertRole: 'Professor of Plant Ecology, Technion',
        organizationName: 'Israel Botanical Society',
        recommendationQuote: 'Rigorously structured botany prompts that encourage students to notice morphological adaptations in Mediterranean scrubland.',
        createdAt: '2026-07-19T09:00:00Z'
      }
    ],

    // Field Verification & Ground Truth
    fieldVerificationStatus: 'field_tested',
    fieldTestedAt: '2026-07-18T10:00:00Z',
    originalEvidenceCount: 4,
    safetyCheckStatus: 'approved',
    accessibilityCheckStatus: 'accessible',
    timingVerified: true,
    distanceVerified: true,
    fieldReflection: 'Verified ecology walking trail on Carmel Ridge. Checked nature trail markers and trail safety.',
    teacherFieldApprovalStatus: 'approved',

    trustBadges: [
      {
        type: 'field_tested',
        label: 'Field Tested',
        description: 'Verified on-site on Carmel Ridge Trail',
        grantedAt: '2026-07-18T10:00:00Z',
        active: true
      },
      {
        type: 'teacher_approved',
        label: 'Teacher Approved',
        description: 'Approved by Carmel Regional Science Lead',
        grantedAt: '2026-07-18T11:00:00Z',
        active: true
      },
      {
        type: 'expert_recommended',
        label: 'Expert Recommended',
        description: 'Endorsed by Dr. Amos Stern (Technion Plant Ecology Chair)',
        grantedByName: 'Dr. Amos Stern',
        grantedAt: '2026-07-19T09:00:00Z',
        active: true
      },
      {
        type: 'institution_verified',
        label: 'Institution Verified',
        description: 'Partnered with Israel Nature and Parks Authority',
        grantedAt: '2026-07-18T11:00:00Z',
        active: true
      }
    ],

    featuredStatus: true,
    allowGuestAccess: true,
    allowRouteDuplication: true,
    allowRouteRemixing: true,
    offlineAvailability: true,
    requiresLocationPermission: true
  },
  {
    id: 'route-3',
    title: 'Old Quarter Quest: Clock Tower Cipher Challenge',
    subtitle: 'A high-energy team challenge through ancient arches & stone alleys',
    shortDescription: 'Solve codes, locate stone inscriptions, and race against time in this fast-paced team quest in Old Jaffa.',
    fullDescription: 'Designed for youth movements, school trips, and competitive groups. Participants decode Ottoman ciphers, scan QR codes embedded on historic stone walls, and complete photo evidence tasks in teams.',
    coverImageUrl: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=1200',
    creatorId: 'teacher-1',
    creatorDisplayName: 'Ms. Elena Vance (Educator)',
    creatorRole: 'teacher',
    isTeamProject: false,
    schoolId: 'school-101',
    routeType: 'scavenger_hunt',
    supportedModes: ['challenge', 'community_tour'],
    defaultMode: 'challenge',
    subject: 'Social Studies & Teamwork',
    topics: ['Navigation', 'Cipher Solving', 'Team Leadership', 'Historical Landmarks'],
    tags: ['Scavenger Hunt', 'Competitive', 'Team Challenge', 'QR Codes'],
    learningObjectives: ['Develop spatial orientation and map decoding skills in historic urban settings.', 'Demonstrate collaborative team problem solving.'],
    skills: ['Problem Solving', 'Leadership', 'Map Reading'],
    ageGroups: ['12-16 years', '16+ years'],
    recommendedGradeLevels: ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'],
    language: 'en',
    estimatedDurationMinutes: 50,
    estimatedDistanceKm: 1.5,
    difficulty: 'moderate',
    environmentType: 'outdoor',
    accessibilityInformation: 'Narrow cobbled alleys with steps; step-free alternative routes indicated in app map.',
    safetyInstructions: 'Teams must stay together within line-of-sight at all times.',
    requiredEquipment: ['Smartphone with camera & QR reader'],
    participantInstructions: 'Scan station QR codes to unlock cipher questions and earn time bonus points.',
    startLocation: {
      latitude: 32.0550,
      longitude: 34.7550,
      locationName: 'Clock Tower Plaza',
      address: 'Clock Tower Square',
      city: 'Tel Aviv-Jaffa',
      region: 'Tel Aviv District'
    },
    stationOrderMode: 'flexible',
    stationIds: ['st-3-1'],
    totalPossiblePoints: 600,
    visibility: 'public_community',
    publishingStatus: 'published_to_community',
    version: 2,
    createdAt: '2026-07-10T10:00:00Z',
    updatedAt: '2026-07-20T14:00:00Z',
    publishedAt: '2026-07-20T14:00:00Z',

    likesCount: 215,
    ratingsCount: 58,
    ratingAverage: 4.9,
    savesCount: 94,
    launchesCount: 260,
    completionsCount: 235,
    startsCount: 260,
    sharesCount: 45,
    expertLikesCount: 1,
    teacherRecommendationsCount: 12,
    teacherApproved: true,
    teacherApprovedBy: 'District Youth Movement Coordinator',
    institutionVerified: true,
    verifiedInstitutionName: 'National Youth Leadership Network',
    completionRatePercent: 90,

    expertLikes: [
      {
        id: 'el-301',
        expertUserId: 'exp-401',
        expertName: 'Captain Yaron Katz',
        expertAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        routeId: 'route-3',
        expertDomain: 'outdoor_education',
        expertRole: 'Director of Outdoor Navigation & Field Leadership',
        organizationName: 'Israel Scout Movement (Tzofim)',
        recommendationQuote: 'An ideal blend of spatial reasoning, active teamwork, and historic appreciation. Highly recommended for youth trips!',
        createdAt: '2026-07-21T16:00:00Z'
      }
    ],

    // Field Verification & Ground Truth
    fieldVerificationStatus: 'field_tested',
    fieldTestedAt: '2026-07-20T14:00:00Z',
    originalEvidenceCount: 5,
    safetyCheckStatus: 'approved',
    accessibilityCheckStatus: 'partially_accessible',
    timingVerified: true,
    distanceVerified: true,
    fieldReflection: 'Tested in Old Jaffa with a scout group. QR triggers verified on historic stone walls.',
    teacherFieldApprovalStatus: 'approved',

    trustBadges: [
      {
        type: 'field_tested',
        label: 'Field Tested',
        description: 'Scout team field walk & QR trigger test passed',
        grantedAt: '2026-07-20T14:00:00Z',
        active: true
      },
      {
        type: 'teacher_approved',
        label: 'Teacher Approved',
        description: 'Approved by Youth Movement Coordinator',
        grantedAt: '2026-07-20T15:00:00Z',
        active: true
      },
      {
        type: 'expert_recommended',
        label: 'Expert Recommended',
        description: 'Endorsed by Captain Yaron Katz (Israel Scouts)',
        grantedByName: 'Captain Yaron Katz',
        grantedAt: '2026-07-21T16:00:00Z',
        active: true
      },
      {
        type: 'institution_verified',
        label: 'Institution Verified',
        description: 'Validated by National Youth Leadership Network',
        grantedAt: '2026-07-20T15:00:00Z',
        active: true
      }
    ],

    featuredStatus: true,
    allowGuestAccess: true,
    allowRouteDuplication: false,
    allowRouteRemixing: false,
    offlineAvailability: true,
    requiresLocationPermission: true
  },
  {
    id: 'route-4',
    title: 'Zikhron Ya’akov Pioneers Heritage Walk',
    subtitle: '1882 First Aliyah architecture, wine cellars & courtyard life',
    shortDescription: 'Explore historic stone courtyards, tiled roofs, and pioneer stories along HaNdivi Street.',
    fullDescription: 'Created by Student Team "Heritage Class 10" from Zikhron High School. Walk past 19th-century basalt stone homes, examine original wine presses, and learn how early agricultural pioneers established local community institutions.',
    coverImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=1200',
    creatorId: 'student-2',
    creatorDisplayName: 'Zikhron Grade 10 Heritage Team',
    creatorRole: 'student',
    isTeamProject: true,
    teamInfo: {
      teamName: 'Pioneer Researchers (Class 10A)',
      schoolId: 'school-202',
      schoolName: 'Zikhron Ya’akov High School',
      members: [
        {
          userId: 'student-4',
          userName: 'Eitan Bar',
          roles: ['researcher', 'writer'],
          addedAt: '2026-07-12T09:00:00Z'
        },
        {
          userId: 'student-5',
          userName: 'Tamar Golan',
          roles: ['photographer', 'narrator'],
          addedAt: '2026-07-12T09:00:00Z'
        }
      ]
    },
    schoolId: 'school-202',
    schoolName: 'Zikhron Ya’akov High School',
    routeType: 'community_heritage',
    supportedModes: ['learning', 'community_tour'],
    defaultMode: 'community_tour',
    subject: 'History & Citizenship',
    topics: ['First Aliyah', 'Pioneer Architecture', 'Agricultural History', 'Local Memory'],
    tags: ['Student Created', 'Heritage Walk', 'Courtyards', 'Architecture'],
    learningObjectives: ['Identify French-influenced 19th-century rural stone architecture.', 'Analyze how early agricultural cooperatives formed.'],
    skills: ['Historical Analysis', 'Oral History', 'Field Survey'],
    ageGroups: ['10-14 years', '15-18 years', 'Adults & Families'],
    recommendedGradeLevels: ['Grade 8', 'Grade 9', 'Grade 10'],
    language: 'he',
    estimatedDurationMinutes: 55,
    estimatedDistanceKm: 1.4,
    difficulty: 'easy',
    environmentType: 'outdoor',
    accessibilityInformation: 'Pedestrian promenade fully accessible. Rest benches available every 200m.',
    safetyInstructions: 'Pedestrian area; watch for delivery vehicles in morning hours.',
    requiredEquipment: ['Smartphone with camera'],
    participantInstructions: 'Walk along the historic promenade and inspect family courtyard crests.',
    startLocation: {
      latitude: 32.5710,
      longitude: 34.9530,
      locationName: 'Founder Square & Well',
      address: 'HaNdivi Street',
      city: 'Zikhron Ya’akov',
      region: 'Haifa District'
    },
    stationOrderMode: 'linear',
    stationIds: ['st-1-1'],
    totalPossiblePoints: 450,
    visibility: 'public_community',
    publishingStatus: 'published_to_community',
    version: 1,
    createdAt: '2026-07-12T09:00:00Z',
    updatedAt: '2026-07-22T10:00:00Z',
    publishedAt: '2026-07-22T10:00:00Z',

    likesCount: 96,
    ratingsCount: 24,
    ratingAverage: 4.9,
    savesCount: 41,
    launchesCount: 110,
    completionsCount: 98,
    startsCount: 110,
    sharesCount: 15,
    expertLikesCount: 2,
    teacherRecommendationsCount: 6,
    teacherApproved: true,
    teacherApprovedBy: 'Zikhron Heritage Museum Curator',
    institutionVerified: true,
    verifiedInstitutionName: 'First Aliyah Museum Partner',
    completionRatePercent: 89,

    expertLikes: [
      {
        id: 'el-401',
        expertUserId: 'exp-501',
        expertName: 'Dr. Michal Shapira',
        expertAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
        routeId: 'route-4',
        expertDomain: 'history',
        expertRole: 'First Aliyah Historical Research Chair',
        organizationName: 'First Aliyah Heritage Museum',
        recommendationQuote: 'An extraordinary student production that brings pioneer family accounts directly to life on the pedestrian street.',
        createdAt: '2026-07-23T11:00:00Z'
      }
    ],

    // Field Verification & Ground Truth
    fieldVerificationStatus: 'field_tested',
    fieldTestedAt: '2026-07-22T09:00:00Z',
    originalEvidenceCount: 5,
    safetyCheckStatus: 'approved',
    accessibilityCheckStatus: 'accessible',
    timingVerified: true,
    distanceVerified: true,
    fieldReflection: 'Walked and verified pioneer promenade in Zikhron Ya’akov with team Class 10A.',
    teacherFieldApprovalStatus: 'approved',

    trustBadges: [
      {
        type: 'field_tested',
        label: 'Field Tested',
        description: 'Physically walked and documented by Zikhron Grade 10 team',
        grantedAt: '2026-07-22T09:00:00Z',
        active: true
      },
      {
        type: 'student_verified',
        label: 'Student Created',
        description: 'Created by Pioneer Researchers (Class 10A)',
        grantedAt: '2026-07-22T09:00:00Z',
        active: true
      },
      {
        type: 'teacher_approved',
        label: 'Teacher Approved',
        description: 'Approved by Zikhron Heritage Lead',
        grantedAt: '2026-07-22T10:00:00Z',
        active: true
      },
      {
        type: 'expert_recommended',
        label: 'Expert Recommended',
        description: 'Endorsed by Dr. Michal Shapira (First Aliyah Museum)',
        grantedByName: 'Dr. Michal Shapira',
        grantedAt: '2026-07-23T11:00:00Z',
        active: true
      }
    ],

    featuredStatus: false,
    allowGuestAccess: true,
    allowRouteDuplication: true,
    allowRouteRemixing: true,
    offlineAvailability: true,
    requiresLocationPermission: true
  },
  {
    id: 'route-5',
    title: 'Student Project Draft: Underground Cisterns & Springs',
    subtitle: 'Collaborative student investigation into ancient water storage engineering',
    shortDescription: 'Student-created draft investigating 19th-century water cisterns and aqueduct conduits in Old Jerusalem.',
    fullDescription: 'Created by Student Team "Hydro History" (Grade 9) for their STEM History assignment. Currently submitted to teacher Ms. Elena Vance for rubric evaluation and publication feedback.',
    coverImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200',
    creatorId: 'student-1',
    creatorDisplayName: 'Maya Lin & Team Hydro History',
    creatorRole: 'student',
    isTeamProject: true,
    teamInfo: {
      teamName: 'Hydro History (Class 9A)',
      schoolId: 'school-101',
      schoolName: 'Greenwood High School',
      members: [
        {
          userId: 'student-1',
          userName: 'Maya Lin',
          roles: ['route_planner', 'station_designer'],
          addedAt: '2026-07-24T14:00:00Z'
        },
        {
          userId: 'student-2',
          userName: 'Liam Chen',
          roles: ['researcher', 'question_designer'],
          addedAt: '2026-07-24T14:00:00Z'
        }
      ]
    },
    collaborators: [
      {
        userId: 'student-2',
        userName: 'Liam Chen',
        roles: ['researcher', 'question_designer'],
        addedAt: '2026-07-24T14:00:00Z'
      }
    ],
    schoolId: 'school-101',
    schoolName: 'Greenwood High School',
    routeType: 'student_assignment',
    supportedModes: ['learning', 'assignment'],
    defaultMode: 'assignment',
    subject: 'STEM & History',
    topics: ['Hydrology', 'Aqueducts', 'Civil Engineering', 'Ancient Technology'],
    tags: ['Student Created', 'Awaiting Review', 'STEM Assignment', 'Rubric Evaluation'],
    learningObjectives: ['Understand ancient water storage mechanics and hydraulic slope calculations.'],
    skills: ['Research', 'Content Creation', 'Hydro-engineering Analysis'],
    ageGroups: ['12-16 years'],
    recommendedGradeLevels: ['Grade 9'],
    language: 'en',
    estimatedDurationMinutes: 40,
    estimatedDistanceKm: 1.0,
    difficulty: 'moderate',
    environmentType: 'hybrid',
    accessibilityInformation: 'Indoor exhibition section accessible; outdoor cistern entrance requires stairs.',
    safetyInstructions: 'Careful on damp stone stairways. Bring flashlight.',
    requiredEquipment: ['Flashlight or phone light'],
    participantInstructions: 'Examine cistern masonry and log reservoir volume calculations.',
    startLocation: {
      latitude: 31.7767,
      longitude: 35.2345,
      locationName: 'Historical Reservoir Entrance',
      address: 'Water Conduit Gate',
      city: 'Jerusalem',
      region: 'Jerusalem District'
    },
    stationOrderMode: 'linear',
    stationIds: [],
    totalPossiblePoints: 300,
    visibility: 'school',
    publishingStatus: 'submitted_to_teacher',
    version: 1,
    createdAt: '2026-07-24T14:00:00Z',
    updatedAt: '2026-07-26T09:00:00Z',

    likesCount: 18,
    ratingsCount: 4,
    ratingAverage: 4.5,
    savesCount: 12,
    launchesCount: 15,
    completionsCount: 12,
    startsCount: 15,
    sharesCount: 2,
    expertLikesCount: 0,
    teacherRecommendationsCount: 1,
    teacherApproved: false,
    completionRatePercent: 80,

    // Field Verification & Ground Truth (Draft in progress)
    fieldVerificationStatus: 'partially_tested',
    fieldTestedAt: '2026-07-25T14:00:00Z',
    originalEvidenceCount: 2,
    safetyCheckStatus: 'pending',
    accessibilityCheckStatus: 'partially_accessible',
    timingVerified: false,
    distanceVerified: true,
    fieldReflection: 'Preliminary field visit conducted by Team Hydro History on July 25. Verified cistern entrance coordinates; waiting for teacher safety review.',
    teacherFieldApprovalStatus: 'pending',

    trustBadges: [
      {
        type: 'student_verified',
        label: 'Student Created',
        description: 'Under development by Hydro History team (Class 9A)',
        grantedAt: '2026-07-24T14:00:00Z',
        active: true
      }
    ],

    fieldEvidence: [
      {
        id: 'fe-501',
        routeId: 'route-5',
        uploadedByUserId: 'student-1',
        uploadedByUserName: 'Maya Lin',
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800',
        caption: 'Field photo of historic masonry archway at ancient reservoir entrance.',
        createdAt: '2026-07-25T14:10:00Z',
        locationMetadata: { latitude: 31.7767, longitude: 35.2345, verifiedOnSite: true, locationName: 'Historical Reservoir Entrance' },
        verificationStatus: 'verified_by_team',
        teacherVisible: true,
        participantVisible: false,
        privacyLevel: 'teacher_only'
      }
    ],

    featuredStatus: false,
    allowGuestAccess: false,
    allowRouteDuplication: true,
    allowRouteRemixing: true,
    offlineAvailability: false,
    requiresLocationPermission: false
  }
];

export const mockRouteSessions: RouteSession[] = [
  {
    id: 'session-101',
    routeId: 'route-1',
    organizerId: 'teacher-1',
    title: 'Grade 9 Heritage Field Trip — Section A',
    mode: 'challenge',
    status: 'active',
    accessCode: 'TRL-901',
    joinLink: 'https://trailim.app/join/TRL-901',
    startTime: '2026-07-27T08:30:00Z',
    teamsEnabled: true,
    teamSize: 3,
    scoringConfiguration: {
      scoringEnabled: true,
      showScoreDuringRoute: true,
      showLeaderboard: true,
      pointsForCompletion: 200,
      timeBonusEnabled: true,
      hintPenalty: 10,
      retryPenalty: 5,
      leaderboardVisibility: 'public'
    },
    assignedClassIds: ['class-9a'],
    participantIds: ['student-1', 'student-2', 'student-3'],
    createdAt: '2026-07-26T18:00:00Z'
  }
];

export const mockReviewQueue: ReviewItem[] = [
  {
    id: 'rev-101',
    routeId: 'route-4',
    routeTitle: 'Student Project Draft: Water Systems & Cisterns',
    creatorId: 'student-1',
    creatorName: 'Maya Lin & Group B',
    creatorRole: 'student',
    schoolName: 'Greenwood High School',
    subject: 'STEM & History',
    stationCount: 4,
    submittedAt: '2026-07-26T09:15:00Z',
    status: 'submitted',
    generalFeedback: 'Initial submission for Grade 9 History & Engineering project.'
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Route Approved! 🎉',
    message: 'Your route "Hidden Stories of the Neighborhood" was approved by Dr. David Miller and is now published.',
    type: 'review_status',
    timestamp: '2026-07-25T14:20:00Z',
    read: false,
    linkRouteId: 'route-1'
  },
  {
    id: 'notif-2',
    title: 'New Class Assignment',
    message: 'Ms. Elena Vance assigned "Green Canopy: Urban Nature Exploration" to Grade 9 Science.',
    type: 'route_assigned',
    timestamp: '2026-07-24T09:00:00Z',
    read: true,
    linkRouteId: 'route-2'
  },
  {
    id: 'notif-3',
    title: 'Badge Earned! 🏆',
    message: 'You earned the "Heritage Discoverer" badge for completing your first community trail.',
    type: 'badge_earned',
    timestamp: '2026-07-20T10:00:00Z',
    read: true
  }
];

export const mockAnalytics: Record<string, RouteAnalytics> = {
  'route-1': {
    routeId: 'route-1',
    launchesCount: 142,
    participantsCount: 310,
    completionRatePercent: 88,
    averageScore: 420,
    averageCompletionTimeMinutes: 42,
    mostDifficultQuestionPrompt: 'Which symbol is carved directly into the central keystone?',
    mostSkippedStationTitle: 'None (0 skips)',
    mostUsedHintStationTitle: 'The Mason’s Arch & Engraving',
    uploadedSubmissionsCount: 118
  }
};
