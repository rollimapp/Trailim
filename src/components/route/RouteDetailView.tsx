import React, { useState } from 'react';
import { Route, ExperienceMode } from '../../types';
import { 
  ArrowLeft, Clock, MapPin, Award, Star, ShieldAlert, CheckCircle2, 
  Users, Bookmark, Play, Share2, Sparkles, Map, BookOpen, ShieldCheck, Heart, GraduationCap, MessageSquareQuote
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useActiveRoute } from '../../context/ActiveRouteContext';
import { dataService } from '../../services/dataService';
import { MapPlaceholder } from '../common/MapPlaceholder';

interface RouteDetailViewProps {
  route: Route;
  onBack: () => void;
  onStartRoute: (mode: ExperienceMode) => void;
}

export const RouteDetailView: React.FC<RouteDetailViewProps> = ({
  route,
  onBack,
  onStartRoute
}) => {
  const { savedRouteIds, toggleSaveRoute } = useAuth();
  const [selectedMode, setSelectedMode] = useState<ExperienceMode>(route.defaultMode || 'community_tour');
  const [activeTab, setActiveTab] = useState<'overview' | 'stations' | 'team_experts' | 'map'>('overview');

  const [likesCount, setLikesCount] = useState(route.likesCount || 0);
  const [userHasLiked, setUserHasLiked] = useState(route.userHasLiked || false);

  const stations = dataService.getStationsForRoute(route.id);
  const isSaved = savedRouteIds.includes(route.id) || route.userHasSaved;

  const handleToggleLike = () => {
    const res = dataService.toggleLikeRoute(route.id);
    setLikesCount(res.likesCount);
    setUserHasLiked(res.userHasLiked);
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in">
      
      {/* Top Header Back Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#1B4332] transition-colors py-1.5 px-3 rounded-xl bg-white border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>

        <div className="flex gap-2">
          {/* Single-Like Button */}
          <button
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              userHasLiked 
                ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-rose-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${userHasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={() => toggleSaveRoute(route.id)}
            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-700 hover:text-emerald-800 shadow-xs"
            title="Save Route"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Cover Card */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-md">
        <img
          src={route.coverImageUrl}
          alt={route.title}
          className="w-full h-52 sm:h-64 object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="bg-[#1B4332] text-white text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-md shadow-xs border border-emerald-600">
            {route.routeType.replace(/_/g, ' ')}
          </span>
          {route.isTeamProject && (
            <span className="bg-sky-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
              <Users className="w-3 h-3" /> Student Team
            </span>
          )}
          {route.teacherApproved && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3 h-3" /> Teacher Approved
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-white space-y-1 z-10">
          <h1 className="font-display font-bold text-xl sm:text-2xl leading-tight">
            {route.title}
          </h1>
          <p className="text-xs text-slate-200 line-clamp-1 font-medium">
            {route.subtitle || route.shortDescription}
          </p>
          <div className="text-[11px] text-emerald-300 pt-0.5 font-semibold flex items-center gap-2">
            <span>By {route.isTeamProject ? route.teamInfo?.teamName : route.creatorDisplayName}</span>
            <span>•</span>
            <span>{route.schoolName || 'Community Creator'}</span>
          </div>
        </div>
      </div>

      {/* Quick Specs Bar */}
      <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
          <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-emerald-700" /> {route.estimatedDurationMinutes}m
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance</span>
          <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" /> {route.estimatedDistanceKm}km
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Stations</span>
          <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" /> {stations.length}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Points</span>
          <span className="text-xs font-bold text-[#1B4332] flex items-center justify-center gap-1 mt-0.5">
            <Award className="w-3.5 h-3.5 text-emerald-700" /> {route.totalPossiblePoints}
          </span>
        </div>
      </div>

      {/* Experience Mode Selector */}
      <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-4 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold uppercase tracking-wider text-[#52B788] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Select Experience Mode
          </label>
          <span className="text-[10px] text-emerald-200">Tailored rules</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'community_tour', label: 'Tour Mode', desc: 'Self-guided walk' },
            { id: 'learning', label: 'Learning', desc: 'Reflections & QA' },
            { id: 'challenge', label: 'Challenge', desc: 'Points & Speed' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMode(m.id as ExperienceMode)}
              className={`p-2 rounded-xl text-left transition-all border ${
                selectedMode === m.id
                  ? 'bg-white text-[#081C15] font-bold border-white shadow-md'
                  : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800/80 border-emerald-700/50'
              }`}
            >
              <div className="text-xs font-bold">{m.label}</div>
              <div className="text-[9px] opacity-80 mt-0.5 line-clamp-1">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-3 whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-[#1B4332] text-[#1B4332]' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Overview & Objectives
        </button>
        <button
          onClick={() => setActiveTab('stations')}
          className={`py-2 px-3 whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'stations' ? 'border-[#1B4332] text-[#1B4332]' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Stations ({stations.length})
        </button>
        <button
          onClick={() => setActiveTab('team_experts')}
          className={`py-2 px-3 whitespace-nowrap border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === 'team_experts' ? 'border-[#1B4332] text-[#1B4332]' : 'border-transparent hover:text-slate-800'
          }`}
        >
          <span>Team & Experts</span>
          {(route.expertLikesCount || 0) > 0 && (
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[10px] rounded-full">
              {route.expertLikesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`py-2 px-3 whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'map' ? 'border-[#1B4332] text-[#1B4332]' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Route Map
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          
          {/* Trust Badges Bar */}
          {route.trustBadges && route.trustBadges.length > 0 && (
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Verified Trust Seals ({route.trustBadges.length})</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {route.trustBadges.map((badge, idx) => (
                  <div key={idx} className="bg-[#E8F5E9] border border-emerald-300 text-[#1B4332] px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <div>
                      <div className="leading-tight">{badge.label}</div>
                      <div className="text-[9px] text-emerald-800/80 font-normal">{badge.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Field Verification Ground Truth Card */}
          <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white p-4 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-emerald-600/50 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Field-Tested Verification</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                route.fieldVerificationStatus === 'field_tested' 
                  ? 'bg-emerald-400 text-slate-950' 
                  : 'bg-amber-300 text-slate-950'
              }`}>
                {route.fieldVerificationStatus === 'field_tested' ? '✓ Field Tested' : 'Field Visit Pending'}
              </span>
            </div>

            <p className="text-xs text-emerald-100 leading-relaxed">
              {route.fieldReflection || 'This trail has been physically walked by the student creator team. Coordinates, timing, and accessibility were inspected on-site.'}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-black/20 p-2.5 rounded-xl border border-emerald-600/40">
              <div>
                <span className="text-emerald-300 block text-[10px]">Safety Check</span>
                <span className="font-bold capitalize">{route.safetyCheckStatus || 'Approved'}</span>
              </div>
              <div>
                <span className="text-emerald-300 block text-[10px]">Accessibility Check</span>
                <span className="font-bold capitalize">{route.accessibilityCheckStatus || 'Accessible'}</span>
              </div>
              <div>
                <span className="text-emerald-300 block text-[10px]">Timing Verified</span>
                <span className="font-bold">{route.timingVerified ? 'Yes (Walked Pace)' : 'Estimated'}</span>
              </div>
              <div>
                <span className="text-emerald-300 block text-[10px]">Teacher Field Approval</span>
                <span className="font-bold capitalize">{route.teacherFieldApprovalStatus || 'Approved'}</span>
              </div>
            </div>
          </div>

          {/* Original Field Evidence Gallery */}
          {route.fieldEvidence && route.fieldEvidence.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
                <span>Original Field Evidence ({route.fieldEvidence.length})</span>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">On-Site Media</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {route.fieldEvidence.map((evidence) => (
                  <div key={evidence.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                    {evidence.mediaUrl && evidence.type === 'photo' && (
                      <img src={evidence.mediaUrl} alt={evidence.caption} className="w-full h-28 object-cover rounded-lg" />
                    )}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-800">{evidence.uploadedByUserName}</span>
                      <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold capitalize">{evidence.type.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">"{evidence.caption}"</p>
                    {evidence.locationMetadata?.locationName && (
                      <div className="text-[9px] text-emerald-800 font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-700" />
                        <span>{evidence.locationMetadata.locationName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-900">About this Route</h3>
            <p>{route.fullDescription}</p>
          </div>

          {/* Teacher Assessment Seal (if available) */}
          {route.latestAssessment && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2 text-emerald-950">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs uppercase text-emerald-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-700" /> Educator Assessment
                </span>
                <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Score: {route.latestAssessment.totalScore} / 100 ({route.latestAssessment.gradeLetter})
                </span>
              </div>
              <p className="text-xs italic text-emerald-800">
                "{route.latestAssessment.generalFeedback}"
              </p>
              <div className="text-[10px] font-bold text-emerald-700 pt-1">
                Evaluated by {route.latestAssessment.evaluatorName} ({route.latestAssessment.evaluatorRole})
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Learning Objectives
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              {route.learningObjectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>

          {/* Safety & Equipment */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2 text-amber-900">
            <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1 text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Safety & Equipment
            </h3>
            <p className="text-xs">{route.safetyInstructions}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {route.requiredEquipment.map((eq, i) => (
                <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-semibold">
                  {eq}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stations' && (
        <div className="space-y-3">
          {stations.map((st, idx) => (
            <div key={st.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900">{st.title}</h4>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                    {st.stationType}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{st.description}</p>
                <div className="mt-2 text-[10px] text-emerald-800 font-semibold flex gap-3">
                  <span>{st.possiblePoints} Points</span>
                  <span>~{st.estimatedTimeMinutes} mins</span>
                  <span>Trigger: {st.trigger.type.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team & Expert Recommendations Tab */}
      {activeTab === 'team_experts' && (
        <div className="space-y-4 text-xs">
          {/* Expert Endorsements */}
          <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <h3 className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Expert Recommendations ({route.expertLikes?.length || 0})</span>
              </h3>
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                Verified Experts
              </span>
            </div>

            {(!route.expertLikes || route.expertLikes.length === 0) ? (
              <p className="text-amber-800 text-xs italic">No expert recommendations logged yet for this route.</p>
            ) : (
              <div className="space-y-3">
                {route.expertLikes.map((exp, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        {exp.expertName}
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-extrabold uppercase">
                        {exp.expertDomain.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">{exp.expertTitle} • {exp.organization}</div>
                    <p className="text-slate-700 text-xs italic pt-1 flex items-start gap-1">
                      <MessageSquareQuote className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      "{exp.recommendationReason}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Team Roster */}
          {route.isTeamProject && route.collaborators && (
            <div className="bg-sky-50/80 border border-sky-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
                <h3 className="font-bold text-sm text-sky-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-700" />
                  <span>Student Creators Team: {route.teamInfo?.teamName}</span>
                </h3>
                <span className="text-[10px] text-sky-800 font-bold bg-sky-200/80 px-2 py-0.5 rounded-full">
                  Grade {route.teamInfo?.gradeLevel || 'Secondary'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {route.collaborators.map((collab, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl border border-sky-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{collab.userName}</div>
                      <div className="text-[10px] text-slate-500">{collab.contributionCount} stations & contributions</div>
                    </div>
                    <span className="text-[10px] bg-sky-100 text-sky-900 px-2 py-0.5 rounded font-extrabold uppercase">
                      {collab.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'map' && (
        <MapPlaceholder
          stations={stations}
          startLocation={route.startLocation}
          heightClass="h-72"
        />
      )}

      {/* Sticky Bottom Launch Bar */}
      <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl shrink-0 -mx-4 -mb-24 mt-4">
        <button
          onClick={() => onStartRoute(selectedMode)}
          className="w-full py-3.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 min-h-[48px]"
        >
          <Play className="w-4 h-4 fill-white" />
          Start in {selectedMode.replace(/_/g, ' ').toUpperCase()} Mode
        </button>
      </div>

    </div>
  );
};
