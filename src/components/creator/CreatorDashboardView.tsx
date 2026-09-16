import React, { useState, useEffect } from 'react';
import { Route, PublishingStatus } from '../../types';
import { dataService } from '../../services/dataService';
import { domainService } from '../../services/domainService';
import { useAuth } from '../../context/AuthContext';
import { 
  PlusCircle, Edit3, Eye, FileText, Users, GraduationCap, 
  ShieldCheck, CheckCircle2, Award, Sparkles, AlertCircle, Clock, Send, ArrowRight, Building2, MapPin
} from 'lucide-react';
import { firestoreRouteDraftRepository } from '../../services/firebase/routeDraftRepository';
import { getFirebaseServices, isFirebaseConfigured } from '../../services/firebase/firebaseClient';

interface CreatorDashboardViewProps {
  onStartNewRoute: () => void;
  onEditRoute: (route: Route) => void;
  onPreviewRoute: (route: Route) => void;
}

type FilterTab = 'all' | 'drafts' | 'team' | 'submitted' | 'changes_requested' | 'approved';

export const CreatorDashboardView: React.FC<CreatorDashboardViewProps> = ({
  onStartNewRoute,
  onEditRoute,
  onPreviewRoute
}) => {
  const { currentUser } = useAuth();
  const [routes, setRoutes] = useState<Route[]>(dataService.getRoutes());
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  useEffect(() => {
    const draftsEnabled = import.meta.env.VITE_ENABLE_FIREBASE_ROUTE_DRAFTS === 'true';
    if (!draftsEnabled || !isFirebaseConfigured()) return;

    const loadFirebaseRoutes = async () => {
      try {
        const vs1Routes = await firestoreRouteDraftRepository.listRoutesByOrganization('org-edu-1');
        const legacyRoutesMapped = await Promise.all(vs1Routes.map(async (vr) => {
          const draft = await firestoreRouteDraftRepository.getDraft(vr.id, vr.currentDraftId);
          const stations = draft ? draft.stations : [];
          const legacyRoute = {
            id: vr.id,
            title: draft?.content.title || vr.title || 'Untitled Trail',
            shortDescription: draft?.content.shortDescription || '',
            fullDescription: draft?.content.fullDescription || '',
            coverImageUrl: draft?.content.coverImageUrl || '',
            supportedModes: draft?.content.supportedModes || ['learning'],
            defaultMode: draft?.content.defaultMode || 'learning',
            subject: draft?.content.subject || '',
            topics: draft?.content.topics || [],
            learningObjectives: draft?.content.learningObjectives || [],
            ageGroups: draft?.content.ageGroups || [],
            language: draft?.content.language || 'he',
            estimatedDurationMinutes: draft?.content.estimatedDurationMinutes || 30,
            estimatedDistanceKm: draft?.content.estimatedDistanceKm || 1,
            difficulty: draft?.content.difficulty || 'easy',
            accessibilityInformation: draft?.content.accessibilityInformation || '',
            safetyInstructions: draft?.content.safetyInstructions || '',
            participantInstructions: draft?.content.participantInstructions || '',
            startLocation: draft?.content.startLocation || { latitude: 32.0853, longitude: 34.7818 },
            stationOrderMode: draft?.content.stationOrderMode || 'linear',
            stationIds: stations.map(s => s.id),
            creatorId: vr.createdByUserId,
            creatorDisplayName: vr.createdByUserId === 'student-1' ? 'Maya Lin' : 'Elena Vance',
            creatorRole: vr.createdByUserId === 'student-1' ? 'student' : 'teacher',
            schoolId: vr.organizationId,
            schoolName: 'Greenwood High School',
            publishingStatus: vr.status === 'in_review' ? 'submitted_to_teacher' :
                             vr.status === 'changes_requested' ? 'changes_requested' :
                             vr.status === 'approved' ? 'teacher_approved' : 'draft',
            teacherApproved: vr.status === 'approved',
            currentDraftVersionId: vr.currentDraftId,
            currentPublishedVersionId: vr.approvedVersionId,
            versionIds: vr.latestSubmittedVersionId ? [vr.latestSubmittedVersionId] : [],
            createdAt: vr.createdAt,
            updatedAt: vr.updatedAt,
            isTeamProject: vr.ownerTeamId !== `local-team-${vr.id}`,
            creatorTeamId: vr.ownerTeamId,
          } as unknown as Route;
          return legacyRoute;
        }));
        setRoutes(legacyRoutesMapped);
      } catch (err) {
        console.error('Failed to load routes from Firebase:', err);
      }
    };

    if (getFirebaseServices().auth.currentUser) {
      loadFirebaseRoutes();
    }

    const unsubscribe = getFirebaseServices().auth.onAuthStateChanged((user) => {
      if (user) {
        loadFirebaseRoutes();
      }
    });

    return () => unsubscribe();
  }, [currentUser]);


  const [selectedRouteForRubric, setSelectedRouteForRubric] = useState<Route | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  // Rubric Form State
  const [rubricScore, setRubricScore] = useState<number>(92);
  const [gradeLetter, setGradeLetter] = useState<string>('A');
  const [rubricFeedback, setRubricFeedback] = useState<string>(
    'Outstanding student team project. Thorough historical station citations and excellent interactive media triggers.'
  );

  // Expert Endorsement Modal State
  const [selectedRouteForExpert, setSelectedRouteForExpert] = useState<Route | null>(null);
  const [expertDomain, setExpertDomain] = useState<'history' | 'ecology' | 'geography' | 'pedagogy'>('history');
  const [expertReason, setExpertReason] = useState<string>('Exemplary pedagogical design with high spatial fidelity.');

  // My created routes or team routes
  const myRoutes = routes.filter(r => r.creatorId === currentUser.id || r.schoolId === currentUser.schoolId || r.isTeamProject);

  const filteredRoutes = myRoutes.filter(route => {
    if (activeFilter === 'drafts') return route.publishingStatus === 'draft';
    if (activeFilter === 'team') return route.isTeamProject;
    if (activeFilter === 'submitted') return route.publishingStatus === 'submitted_to_teacher' || route.publishingStatus === 'in_review';
    if (activeFilter === 'changes_requested') return route.publishingStatus === 'changes_requested';
    if (activeFilter === 'approved') return route.teacherApproved || route.publishingStatus === 'published' || route.publishingStatus === 'published_to_community';
    return true;
  });

  const handleSaveAssessment = () => {
    if (!selectedRouteForRubric) return;
    const updated = {
      ...selectedRouteForRubric,
      latestAssessment: {
        id: `eval-${Date.now()}`,
        evaluatorId: currentUser.id,
        evaluatorName: currentUser.displayName,
        evaluatorRole: currentUser.role,
        evaluatedAt: new Date().toISOString(),
        totalScore: rubricScore,
        gradeLetter: gradeLetter,
        generalFeedback: rubricFeedback,
        criteriaScores: [
          { category: 'research_quality', score: 28, maxScore: 30, feedback: 'Rigorous citations' },
          { category: 'spatial_relevance', score: 25, maxScore: 25, feedback: 'Perfect station layout' },
          { category: 'media_engagement', score: 20, maxScore: 25, feedback: 'Interactive' },
          { category: 'peer_collaboration', score: 19, maxScore: 20, feedback: 'Balanced student team work' }
        ]
      },
      teacherApproved: true,
      publishingStatus: 'published_to_class' as PublishingStatus,
      approvalDate: new Date().toISOString()
    };
    dataService.saveRoute(updated as Route);
    setRoutes(dataService.getRoutes());
    setShowAssessmentModal(false);
    setSelectedRouteForRubric(null);
  };

  const handleAddExpertEndorsement = () => {
    if (!selectedRouteForExpert) return;
    dataService.addExpertLike(selectedRouteForExpert.id, {
      id: `exp-${Date.now()}`,
      expertId: currentUser.id,
      expertName: currentUser.displayName,
      expertTitle: 'Curriculum & History Specialist',
      organization: 'Tel Aviv Educational Heritage Council',
      expertDomain,
      recommendationReason: expertReason,
      endorsedAt: new Date().toISOString()
    });
    setRoutes(dataService.getRoutes());
    setSelectedRouteForExpert(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* Creator Studio Hero Banner */}
      <div className="bg-[#1B4332] text-white p-5 rounded-3xl shadow-lg flex flex-col justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-emerald-400 text-emerald-950 px-2.5 py-0.5 rounded-full tracking-wider">
            Student Creator Studio
          </span>
          <h1 className="font-display font-bold text-xl mt-1.5 text-white">
            Project-Based Learning & Trail Authoring
          </h1>
          <p className="text-xs text-emerald-100 max-w-sm mt-0.5 leading-relaxed">
            Co-create place-based routes with student team roles, field verification, and teacher rubric review.
          </p>
        </div>

        <button
          onClick={onStartNewRoute}
          className="py-3 px-4 bg-[#52B788] hover:bg-[#74C69D] text-[#081C15] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5px]" />
          Start New Route Project
        </button>
      </div>

      {/* Active Commissioned Challenge Brief */}
      {domainService.getCommissionChallenges().slice(0, 1).map(challenge => (
        <div key={challenge.id} className="bg-amber-50/90 border border-amber-200/90 p-4 rounded-3xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full tracking-wider">
              <Building2 className="w-3 h-3" /> Commissioned Challenge
            </span>
            <span className="text-[10px] font-semibold text-amber-800">Ends Nov 15</span>
          </div>
          <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">{challenge.title}</h3>
          <p className="text-xs text-slate-600 line-clamp-2">{challenge.brief}</p>
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              {challenge.publicationOpportunity}
            </span>
            <button 
              onClick={onStartNewRoute}
              className="text-[11px] font-bold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1 cursor-pointer"
            >
              Accept Brief <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl text-[11px] font-bold text-slate-600 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'All Projects' },
          { id: 'drafts', label: 'Drafts' },
          { id: 'team', label: 'Team Projects' },
          { id: 'submitted', label: 'In Review' },
          { id: 'changes_requested', label: 'Needs Revision' },
          { id: 'approved', label: 'Approved' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as FilterTab)}
            className={`py-1.5 px-3 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === tab.id ? 'bg-[#1B4332] text-white shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Project Cards List */}
      <div className="space-y-3">
        {filteredRoutes.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
            <PlusCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-700">No project routes found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Start a new route project or adjust your filter selection above.
            </p>
            <button
              onClick={onStartNewRoute}
              className="py-2.5 px-4 bg-[#1B4332] text-white rounded-xl font-bold text-xs hover:bg-[#2D6A4F] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Start New Route
            </button>
          </div>
        ) : (
          filteredRoutes.map(route => {
            const stations = dataService.getStationsForRoute(route.id);
            const isDraft = route.publishingStatus === 'draft';
            const isSubmitted = route.publishingStatus === 'submitted_to_teacher' || route.publishingStatus === 'in_review';
            const isChangesRequested = route.publishingStatus === 'changes_requested';
            const isApproved = route.teacherApproved || route.publishingStatus === 'published' || route.publishingStatus === 'published_to_community' || route.publishingStatus === 'published_to_class';

            return (
              <div key={route.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-all">
                
                {/* Card Header & Metadata */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img src={route.coverImageUrl} alt={route.title} className="w-16 h-16 rounded-2xl object-cover shrink-0 bg-slate-100 border border-slate-200" />
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : isSubmitted
                            ? 'bg-sky-100 text-sky-950 border-sky-300'
                            : isChangesRequested
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {isDraft ? 'Draft — In Progress' : isChangesRequested ? 'Needs Revision' : route.publishingStatus.replace(/_/g, ' ')}
                        </span>

                        {route.isTeamProject && (
                          <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Users className="w-3 h-3 text-emerald-700" /> {route.teamInfo?.teamName || 'Student Team'}
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">{route.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {stations.length} Stations • {route.estimatedDurationMinutes} mins • {route.subject}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onPreviewRoute(route)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border border-slate-200 shrink-0 cursor-pointer"
                    title="Preview Trail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar for draft routes */}
                {isDraft && (
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-600">Route Project Progress</span>
                      <span className="text-emerald-800">45% Complete</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#1B4332] h-full rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Edited 2 hours ago</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isChangesRequested ? (
                      <button
                        onClick={() => onEditRoute(route)}
                        className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Review Feedback
                      </button>
                    ) : (
                      <button
                        onClick={() => onEditRoute(route)}
                        className="py-1.5 px-3.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> {isDraft ? 'Resume Project' : 'Open Studio'}
                      </button>
                    )}

                    {/* Teacher Assessment Button */}
                    {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
                      <button
                        onClick={() => {
                          setSelectedRouteForRubric(route);
                          setShowAssessmentModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-[11px] flex items-center gap-1 border border-emerald-200 cursor-pointer"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Assess & Grade</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Teacher Assessment Modal */}
      {showAssessmentModal && selectedRouteForRubric && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                <span>Rubric Assessment: {selectedRouteForRubric.title}</span>
              </h3>
              <button onClick={() => setShowAssessmentModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Total Score (0 - 100)</label>
                <input
                  type="number"
                  value={rubricScore}
                  onChange={(e) => setRubricScore(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Grade Letter</label>
                <select
                  value={gradeLetter}
                  onChange={(e) => setGradeLetter(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="A+">A+ (Exemplary)</option>
                  <option value="A">A (Proficient)</option>
                  <option value="B">B (Developing)</option>
                  <option value="C">C (Needs Improvement)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Constructive Feedback & Rubric Notes</label>
                <textarea
                  rows={3}
                  value={rubricFeedback}
                  onChange={(e) => setRubricFeedback(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAssessmentModal(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssessment}
                className="flex-1 py-2.5 bg-[#1B4332] text-white rounded-xl font-bold text-xs shadow-md"
              >
                Save & Approve Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expert Endorsement Modal */}
      {selectedRouteForExpert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Expert Recommendation Seal</span>
              </h3>
              <button onClick={() => setSelectedRouteForExpert(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expert Field / Domain</label>
                <select
                  value={expertDomain}
                  onChange={(e) => setExpertDomain(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="history">Historical Accuracy</option>
                  <option value="ecology">Environmental Science</option>
                  <option value="geography">Spatial Geography</option>
                  <option value="pedagogy">Pedagogical Excellence</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Recommendation Statement</label>
                <textarea
                  rows={3}
                  value={expertReason}
                  onChange={(e) => setExpertReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedRouteForExpert(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpertEndorsement}
                className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Attach Expert Endorsement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
