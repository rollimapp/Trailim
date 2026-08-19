import React, { useState } from 'react';
import { Route, Station, ExperienceMode, RouteType, ContentBlock, Task, StationType, TriggerType } from '../../types';
import { dataService } from '../../services/dataService';
import { toRouteDraft, toVs1Route, toVs1Team } from '../../services/vs1Adapters';
import { vs1WorkflowRepository } from '../../services/vs1WorkflowRepository';
import { useAuth } from '../../context/AuthContext';
import { MediaUploader } from '../common/MediaUploader';
import { NewTeamModal } from './NewTeamModal';
import { StationTemplateModal, StationTemplate } from './StationTemplateModal';
import { FieldWorkHub } from './FieldWorkHub';
import { PreSubmissionChecklist } from './PreSubmissionChecklist';
import { TeacherFeedbackView } from './TeacherFeedbackView';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, Save, Send, Plus, Trash2, 
  GripVertical, Eye, Sparkles, MapPin, Layers, HelpCircle, Film, Users,
  Footprints, ShieldCheck, FileText, Check, AlertCircle
} from 'lucide-react';

interface RouteBuilderContainerProps {
  initialRoute?: Route | null;
  onClose: () => void;
  onPreview: (route: Route) => void;
}

export const RouteBuilderContainer: React.FC<RouteBuilderContainerProps> = ({
  initialRoute,
  onClose,
  onPreview
}) => {
  const { currentUser } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showTeamModal, setShowTeamModal] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);

  // Form State
  const [routeData, setRouteData] = useState<Partial<Route>>(initialRoute || {
    id: `route-${Date.now()}`,
    title: 'Voices of the Old Market',
    subtitle: 'A community heritage and trade oral history trail by Grade 8 storytellers',
    shortDescription: 'Explore 19th-century trade archways, spice merchant stories, and stone bakery vaults in the old city market.',
    fullDescription: 'Designed as a collaborative student project by Team Market Storytellers. Features primary research on local trade guilds, recorded oral history interviews with third-generation market vendors, and interactive field observation tasks.',
    coverImageUrl: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=1200',
    creatorId: currentUser.id,
    creatorDisplayName: currentUser.name,
    creatorRole: currentUser.role,
    schoolId: currentUser.schoolId,
    schoolName: currentUser.schoolName,
    isTeamProject: true,
    teamInfo: {
      teamName: 'Market Storytellers',
      schoolName: currentUser.schoolName || 'Greenwood High School',
      className: 'Class 8A History',
      members: [
        {
          userId: currentUser.id,
          userName: currentUser.name,
          avatar: currentUser.avatar,
          roles: ['team_manager', 'route_planner'],
          contributionsDescription: 'Project coordinator & route mapper',
          addedAt: new Date().toISOString()
        }
      ]
    },
    routeType: 'community_heritage',
    supportedModes: ['learning', 'challenge', 'community_tour'],
    defaultMode: 'community_tour',
    subject: 'Community History & Heritage',
    topics: ['Trade Markets', 'Oral Histories', 'Architectural Vaults'],
    tags: ['Student Project', 'Drafting Phase', 'Field Visit Pending'],
    learningObjectives: ['Document local trade history through physical observation and merchant interviews.'],
    skills: ['Primary Research', 'Digital Storytelling', 'Field Investigation'],
    ageGroups: ['10-14 years', '15-18 years'],
    recommendedGradeLevels: ['Grade 8', 'Grade 9'],
    language: 'en',
    estimatedDurationMinutes: 35,
    estimatedDistanceKm: 1.1,
    difficulty: 'easy',
    environmentType: 'outdoor',
    accessibilityInformation: 'Flat paved market alleyways with step-free access to all stations.',
    safetyInstructions: 'Watch out for active market delivery carts in narrow lanes.',
    requiredEquipment: ['Smartphone with camera', 'Walking shoes'],
    participantInstructions: 'Follow the 4 stations in sequence and complete observation tasks.',
    startLocation: { latitude: 32.0850, longitude: 34.7810, locationName: 'Old Market Gateway' },
    stationOrderMode: 'linear',
    stationIds: [],
    totalPossiblePoints: 250,
    visibility: 'class',
    publishingStatus: 'draft',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ratingAverage: 0,
    ratingCount: 0,
    launchesCount: 0,
    completionsCount: 0,
    featuredStatus: false,
    allowGuestAccess: true,
    allowRouteDuplication: true,
    allowRouteRemixing: true,
    offlineAvailability: true,
    requiresLocationPermission: true
  });

  const [stations, setStations] = useState<Station[]>(
    initialRoute ? dataService.getStationsForRoute(initialRoute.id) : [
      {
        id: `st-${Date.now()}-1`,
        routeId: routeData.id || '',
        title: 'Market Square Entrance & Heritage Arch',
        shortLabel: 'Market Entrance',
        description: 'Historical entrance to the 19th-century trade market.',
        instructions: 'Read the trade historical summary and locate the stone keystone above the main arch.',
        position: 1,
        stationType: 'info',
        contentBlocks: [
          {
            id: `cb-1`,
            type: 'heading',
            order: 1,
            content: 'Voices of the Old Market Entrance'
          },
          {
            id: `cb-2`,
            type: 'text',
            order: 2,
            content: 'Built in 1892, this arched entrance served as the primary gateway for regional merchants.'
          }
        ],
        trigger: { type: 'always_available' },
        tasks: [
          {
            id: `t-1`,
            type: 'multiple_choice',
            prompt: 'Which year is carved into the central stone keystone above the archway?',
            points: 50,
            options: [
              { id: 'o1', text: '1892', isCorrect: true, explanation: 'Correct! The inscription 1892 marks the official completion.' },
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `st-${Date.now()}-2`,
        routeId: routeData.id || '',
        title: 'The Old Baker’s Stone Vault',
        shortLabel: 'Baker Vault',
        description: 'Examine the basalt stone oven arches used for traditional breadmaking.',
        instructions: 'Inspect the stone masonry oven structure.',
        position: 2,
        stationType: 'observation',
        contentBlocks: [
          {
            id: `cb-3`,
            type: 'heading',
            order: 1,
            content: 'Community Breadmaking Vaults'
          }
        ],
        trigger: { type: 'previous_completed' },
        tasks: [
          {
            id: `t-2`,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `st-${Date.now()}-3`,
        routeId: routeData.id || '',
        title: 'Old Market Courtyard Cipher',
        shortLabel: 'Courtyard Cipher',
        description: 'Scan QR code or enter demo code "TRAIL4" to complete the route.',
        instructions: 'Enter demo unlock code "TRAIL4" to access the final station check.',
        position: 3,
        stationType: 'checkpoint',
        contentBlocks: [
          {
            id: `cb-4`,
            type: 'heading',
            order: 1,
            content: 'Final Courtyard Check'
          }
        ],
        trigger: { type: 'qr_code', QRCodeValue: 'TRAIL4', accessCode: 'TRAIL4' },
        tasks: [
          {
            id: `t-3`,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  );

  const [activeStationIndex, setActiveStationIndex] = useState<number>(0);

  const prepareVersionedDraft = (fullRoute: Route) => {
    const existingRoute = vs1WorkflowRepository.getRoute(fullRoute.id);
    const mappedRoute = toVs1Route(fullRoute);
    const workflowRoute = existingRoute ? {
      ...mappedRoute,
      latestSubmittedVersionId: existingRoute.latestSubmittedVersionId,
      approvedVersionId: existingRoute.approvedVersionId,
    } : mappedRoute;
    const draft = toRouteDraft(fullRoute, stations, currentUser.id);

    if (fullRoute.teamInfo) {
      const team = toVs1Team(
        fullRoute.teamInfo,
        workflowRoute.ownerTeamId,
        workflowRoute.organizationId,
        currentUser.id,
        fullRoute.updatedAt,
      );
      vs1WorkflowRepository.saveTeam(team.team, team.members);
    }

    vs1WorkflowRepository.saveDraft(draft);
    return { existingRoute, workflowRoute, draft };
  };

  const handleSaveDraft = () => {
    const fullRoute: Route = {
      ...(routeData as Route),
      stationIds: stations.map(s => s.id),
      updatedAt: new Date().toISOString()
    };

    dataService.saveRoute(fullRoute);
    stations.forEach(s => dataService.saveStation(s));
    const { workflowRoute } = prepareVersionedDraft(fullRoute);
    vs1WorkflowRepository.saveRoute(workflowRoute);
    alert('Project draft saved successfully!');
  };

  const handleSelectTemplate = (template: StationTemplate) => {
    const newStation: Station = {
      id: `st-${Date.now()}`,
      routeId: routeData.id || '',
      title: template.defaultTitle,
      shortLabel: `Station ${stations.length + 1}`,
      description: template.description,
      instructions: template.defaultInstructions,
      position: stations.length + 1,
      stationType: template.stationType,
      contentBlocks: template.defaultBlocks.map((b, idx) => ({
        id: `cb-${Date.now()}-${idx}`,
        type: b.type as any,
        order: idx + 1,
        content: b.content
      })),
      trigger: { 
        type: template.defaultTrigger, 
        accessCode: template.id === 'qr_checkpoint' ? 'TRAIL4' : undefined,
        QRCodeValue: template.id === 'qr_checkpoint' ? 'TRAIL4' : undefined
      },
      tasks: template.defaultTasks.map((t, idx) => ({
        id: `task-${Date.now()}-${idx}`,
        type: t.type as any,
        prompt: t.prompt,
        points: t.points,
        required: true,
        options: t.type === 'multiple_choice' ? [
          { id: 'o1', text: 'Correct Answer Option', isCorrect: true, explanation: 'Correct explanation' },
          { id: 'o2', text: 'Distractor Option A', isCorrect: false },
          { id: 'o3', text: 'Distractor Option B', isCorrect: false }
        ] : undefined
      })),
      possiblePoints: 50,
      estimatedTimeMinutes: 8,
      required: true,
      allowSkip: false,
      allowRevisit: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...stations, newStation];
    setStations(updated);
    setActiveStationIndex(updated.length - 1);
    setShowTemplateModal(false);
  };

  const handleDeleteStation = (index: number) => {
    if (stations.length <= 1) {
      alert('A route must have at least 1 station.');
      return;
    }
    const updated = stations.filter((_, i) => i !== index);
    setStations(updated);
    setActiveStationIndex(Math.max(0, index - 1));
  };

  const handleSubmitForReview = (targetVisibility: string, noteToTeacher: string, reflections: Record<string, string>) => {
    const fullRoute: Route = {
      ...(routeData as Route),
      stationIds: stations.map(s => s.id),
      publishingStatus: 'submitted_to_teacher',
      visibility: targetVisibility as any,
      updatedAt: new Date().toISOString()
    };

    dataService.saveRoute(fullRoute);
    stations.forEach(s => dataService.saveStation(s));
    const { existingRoute, workflowRoute, draft } = prepareVersionedDraft(fullRoute);
    const visibility = targetVisibility === 'school' ? 'school' : 'class';
    const submission = existingRoute?.status === 'changes_requested'
      ? vs1WorkflowRepository.resubmit(fullRoute.id, draft, stations, currentUser.id, visibility)
      : vs1WorkflowRepository.submitDraft(workflowRoute, draft, stations, currentUser.id, visibility);
    dataService.saveRoute({
      ...fullRoute,
      currentDraftVersionId: draft.id,
      versionIds: [...(fullRoute.versionIds || []), submission.snapshot.version.id],
    });

    alert(`Submitted project to teacher Ms. Elena Vance! Status: Submitted for Review.`);
    onClose();
  };

  const handleResubmitToTeacher = () => {
    const fullRoute: Route = {
      ...(routeData as Route),
      publishingStatus: 'submitted_to_teacher',
      updatedAt: new Date().toISOString()
    };

    dataService.saveRoute(fullRoute);
    stations.forEach(s => dataService.saveStation(s));
    const { existingRoute, workflowRoute, draft } = prepareVersionedDraft(fullRoute);
    const submission = existingRoute?.status === 'changes_requested'
      ? vs1WorkflowRepository.resubmit(fullRoute.id, draft, stations, currentUser.id, fullRoute.visibility === 'school' ? 'school' : 'class')
      : vs1WorkflowRepository.submitDraft(workflowRoute, draft, stations, currentUser.id, fullRoute.visibility === 'school' ? 'school' : 'class');
    dataService.saveRoute({
      ...fullRoute,
      currentDraftVersionId: draft.id,
      versionIds: [...(fullRoute.versionIds || []), submission.snapshot.version.id],
    });
    alert('Resubmitted revised project to teacher!');
    onClose();
  };

  const activeStation = stations[activeStationIndex];

  return (
    <div className="space-y-4 pb-20 animate-in fade-in">
      
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-all"
            title="Exit Studio"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-emerald-800">Route Creator Studio</span>
            <h2 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
              {routeData.title || 'Untitled Learning Trail'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>

      {/* Workflow Step Tabs */}
      <div className="flex justify-between items-center bg-slate-100 p-1 rounded-2xl text-[11px] font-bold text-slate-600 overflow-x-auto scrollbar-none">
        {[
          { step: 1, label: '1. Basics' },
          { step: 2, label: '2. Student Team' },
          { step: 3, label: '3. Stations' },
          { step: 4, label: '4. Field Work Hub' },
          { step: 5, label: '5. Readiness' },
        ].map(s => (
          <button
            key={s.step}
            onClick={() => setCurrentStep(s.step)}
            className={`py-1.5 px-3 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              currentStep === s.step
                ? 'bg-[#1B4332] text-white shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* STEP 1: ROUTE OVERVIEW & BASICS */}
      {currentStep === 1 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 text-xs">
          <h3 className="font-display font-bold text-base text-slate-900 border-b pb-2">Step 1: Route Overview & Metadata</h3>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Route Title</label>
              <input
                type="text"
                value={routeData.title || ''}
                onChange={(e) => setRouteData({ ...routeData, title: e.target.value })}
                placeholder="e.g. Voices of the Old Market"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Short Description</label>
              <textarea
                value={routeData.shortDescription || ''}
                onChange={(e) => setRouteData({ ...routeData, shortDescription: e.target.value })}
                rows={2}
                placeholder="Summary for route card..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Area</label>
                <input
                  type="text"
                  value={routeData.subject || ''}
                  onChange={(e) => setRouteData({ ...routeData, subject: e.target.value })}
                  placeholder="e.g. Community History"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Route Type</label>
                <select
                  value={routeData.routeType}
                  onChange={(e) => setRouteData({ ...routeData, routeType: e.target.value as RouteType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800"
                >
                  <option value="community_heritage">Community Heritage</option>
                  <option value="educational_tour">Educational Tour</option>
                  <option value="scavenger_hunt">Scavenger Hunt</option>
                  <option value="nature_exploration">Nature Exploration</option>
                  <option value="student_assignment">Student Assignment</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Est. Duration (Mins)</label>
                <input
                  type="number"
                  value={routeData.estimatedDurationMinutes || 35}
                  onChange={(e) => setRouteData({ ...routeData, estimatedDurationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Est. Distance (KM)</label>
                <input
                  type="number"
                  step="0.1"
                  value={routeData.estimatedDistanceKm || 1.1}
                  onChange={(e) => setRouteData({ ...routeData, estimatedDistanceKm: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Safety Instructions for Walkers</label>
              <textarea
                value={routeData.safetyInstructions || ''}
                onChange={(e) => setRouteData({ ...routeData, safetyInstructions: e.target.value })}
                rows={2}
                placeholder="e.g. Stay on sidewalks; cross streets at marked crosswalks..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Accessibility Information</label>
              <textarea
                value={routeData.accessibilityInformation || ''}
                onChange={(e) => setRouteData({ ...routeData, accessibilityInformation: e.target.value })}
                rows={2}
                placeholder="e.g. Wheelchair accessible flat sidewalks throughout..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <MediaUploader
              label="Route Cover Image"
              acceptType="image"
              valueUrl={routeData.coverImageUrl}
              onChange={(url) => setRouteData({ ...routeData, coverImageUrl: url })}
            />
          </div>
        </div>
      )}

      {/* STEP 2: STUDENT TEAM & ROLES */}
      {currentStep === 2 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-emerald-800">Collaborative Team Setup</span>
              <h3 className="font-display font-bold text-base text-slate-900">Student Team & Roles</h3>
            </div>

            <button
              onClick={() => setShowTeamModal(true)}
              className="py-1.5 px-3 bg-[#1B4332] text-white rounded-xl font-bold text-xs hover:bg-[#2D6A4F] flex items-center gap-1 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" /> Edit Team
            </button>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1 text-emerald-950">
            <h4 className="font-bold text-xs">{routeData.teamInfo?.teamName || 'Market Storytellers'}</h4>
            <p className="text-[11px] text-emerald-800">
              {routeData.teamInfo?.className || 'Class 8A History'} • {routeData.teamInfo?.schoolName || 'Greenwood High School'}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Assigned Student Team Members</h4>
            
            <div className="space-y-2">
              {routeData.teamInfo?.members?.map(m => (
                <div key={m.userId} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt={m.userName} className="w-8 h-8 rounded-full object-cover border border-slate-300" />
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{m.userName}</h5>
                      <p className="text-[10px] text-slate-500">{m.contributionsDescription || 'Team contributor'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {m.roles.map(r => (
                      <span key={r} className="px-2 py-0.5 bg-[#1B4332] text-white font-bold rounded-md text-[9px]">
                        {r.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: STATIONS & CONTENT EDITOR */}
      {currentStep === 3 && (
        <div className="space-y-4">
          
          {/* Station List Controls */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-display font-bold text-base text-slate-900">Ordered Route Stations</h3>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="py-1.5 px-3 bg-[#1B4332] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Station
              </button>
            </div>

            <div className="space-y-2">
              {stations.map((st, index) => (
                <div
                  key={st.id}
                  onClick={() => setActiveStationIndex(index)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    activeStationIndex === index
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-400/50'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{st.title}</h4>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {st.contentBlocks.length} Blocks • {st.tasks.length} Tasks
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStation(index);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Station Detail Editor */}
          {activeStation && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800">Editing Station {activeStationIndex + 1}</span>
                  <h3 className="font-bold text-sm text-slate-900">{activeStation.title}</h3>
                </div>
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg font-bold text-slate-700">
                  {activeStation.possiblePoints} PTS
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Station Title</label>
                <input
                  type="text"
                  value={activeStation.title}
                  onChange={(e) => {
                    const updated = [...stations];
                    updated[activeStationIndex].title = e.target.value;
                    setStations(updated);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Participant Instructions on Location</label>
                <textarea
                  value={activeStation.instructions}
                  onChange={(e) => {
                    const updated = [...stations];
                    updated[activeStationIndex].instructions = e.target.value;
                    setStations(updated);
                  }}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              {/* Station Trigger Configuration */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">Station Unlock Rule / Trigger</label>
                <select
                  value={activeStation.trigger.type}
                  onChange={(e) => {
                    const updated = [...stations];
                    updated[activeStationIndex].trigger = { type: e.target.value as TriggerType };
                    setStations(updated);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs"
                >
                  <option value="always_available">Available Immediately</option>
                  <option value="previous_completed">Previous Station Completed</option>
                  <option value="qr_code">Passcode / QR Code Entry</option>
                  <option value="teacher_unlock">Teacher Manual Unlock</option>
                </select>

                {activeStation.trigger.type === 'qr_code' && (
                  <div className="pt-1 space-y-1">
                    <label className="block font-bold text-slate-700 text-[11px]">Passcode / Code Value</label>
                    <input
                      type="text"
                      value={activeStation.trigger.accessCode || activeStation.trigger.QRCodeValue || 'TRAIL4'}
                      onChange={(e) => {
                        const updated = [...stations];
                        updated[activeStationIndex].trigger = {
                          ...updated[activeStationIndex].trigger,
                          accessCode: e.target.value,
                          QRCodeValue: e.target.value
                        };
                        setStations(updated);
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold uppercase"
                    />
                    <p className="text-[10px] text-emerald-800 font-semibold">Demo code: TRAIL4</p>
                  </div>
                )}
              </div>

              {/* Content Blocks */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Content Blocks ({activeStation.contentBlocks.length})</span>
                  <button
                    onClick={() => {
                      const updated = [...stations];
                      updated[activeStationIndex].contentBlocks.push({
                        id: `cb-${Date.now()}`,
                        type: 'text',
                        order: updated[activeStationIndex].contentBlocks.length + 1,
                        content: 'New paragraph content...'
                      });
                      setStations(updated);
                    }}
                    className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Text Block
                  </button>
                </div>

                {activeStation.contentBlocks.map((block, bIdx) => (
                  <div key={block.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>Block {bIdx + 1}: {block.type}</span>
                      <button
                        onClick={() => {
                          const updated = [...stations];
                          updated[activeStationIndex].contentBlocks.splice(bIdx, 1);
                          setStations(updated);
                        }}
                        className="text-rose-500 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                    <textarea
                      value={block.content}
                      onChange={(e) => {
                        const updated = [...stations];
                        updated[activeStationIndex].contentBlocks[bIdx].content = e.target.value;
                        setStations(updated);
                      }}
                      rows={2}
                      className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: FIELD WORK HUB */}
      {currentStep === 4 && (
        <FieldWorkHub
          route={routeData as Route}
          stations={stations}
          onUpdateRoute={(updated) => setRouteData(updated)}
          onUpdateStations={(updated) => setStations(updated)}
        />
      )}

      {/* STEP 5: READINESS & SUBMISSION */}
      {currentStep === 5 && (
        routeData.publishingStatus === 'changes_requested' ? (
          <TeacherFeedbackView
            route={routeData as Route}
            stations={stations}
            onEditStation={(idx) => {
              setActiveStationIndex(idx);
              setCurrentStep(3);
            }}
            onResubmitToTeacher={handleResubmitToTeacher}
          />
        ) : (
          <PreSubmissionChecklist
            route={routeData as Route}
            stations={stations}
            onSubmitForReview={handleSubmitForReview}
            onNavigateToStep={(s) => setCurrentStep(s)}
          />
        )
      )}

      {/* Navigation Footer Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs border ${
            currentStep === 1 ? 'opacity-40 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-700'
          }`}
        >
          Previous Step
        </button>

        {currentStep < 5 && (
          <button
            onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
            className="px-5 py-2.5 bg-[#1B4332] text-white font-bold text-xs rounded-xl hover:bg-[#2D6A4F] flex items-center gap-1 shadow-xs cursor-pointer"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Modals */}
      {showTeamModal && (
        <NewTeamModal
          initialTeamInfo={routeData.teamInfo}
          onSave={(teamInfo) => {
            setRouteData({ ...routeData, teamInfo });
            setShowTeamModal(false);
          }}
          onClose={() => setShowTeamModal(false)}
        />
      )}

      {showTemplateModal && (
        <StationTemplateModal
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

    </div>
  );
};
