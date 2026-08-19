import React, { useState } from 'react';
import { Route } from '../../types';
import { Clock, MapPin, Award, Star, Bookmark, Play, CheckCircle2, ShieldCheck, Heart, Users, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';

interface RouteCardProps {
  route: Route;
  onSelect: (route: Route) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, onSelect }) => {
  const { savedRouteIds, toggleSaveRoute } = useAuth();
  const isSaved = savedRouteIds.includes(route.id) || route.userHasSaved;

  const [likesCount, setLikesCount] = useState(route.likesCount || 0);
  const [userHasLiked, setUserHasLiked] = useState(route.userHasLiked || false);

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = dataService.toggleLikeRoute(route.id);
    setLikesCount(result.likesCount);
    setUserHasLiked(result.userHasLiked);
  };

  // Distance from default user center (Tel Aviv 32.0853, 34.7818)
  const distanceKm = dataService.calculateDistanceKm(
    32.0853,
    34.7818,
    route.startLocation?.latitude || 32.0853,
    route.startLocation?.longitude || 34.7818
  );

  return (
    <div 
      onClick={() => onSelect(route)}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group flex flex-col h-full"
    >
      {/* Cover Image & Badges */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
        <img
          src={route.coverImageUrl}
          alt={route.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Left Badges Stack */}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-10">
          {/* Route Type Badge */}
          <div className="bg-[#1B4332]/90 backdrop-blur-md text-emerald-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md tracking-wider shadow-xs border border-emerald-700/50 uppercase">
            {route.routeType.replace(/_/g, ' ')}
          </div>

          {/* Student Team / Student Created Badge */}
          {route.isTeamProject ? (
            <div className="bg-sky-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
              <Users className="w-3 h-3" />
              <span>Student Team</span>
            </div>
          ) : route.creatorRole === 'student' ? (
            <div className="bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
              <GraduationCap className="w-3 h-3" />
              <span>Student Created</span>
            </div>
          ) : null}
        </div>

        {/* Top Right Actions */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {/* Save Bookmark Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveRoute(route.id);
            }}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
            aria-label="Save route"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : 'text-white'}`} />
          </button>
        </div>

        {/* Quality Badges Row Overlay */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Field Tested Badge */}
            {route.fieldVerificationStatus === 'field_tested' && (
              <span className="bg-[#1B4332]/95 backdrop-blur-md text-emerald-100 text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs border border-emerald-500/40">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                <span>Field Tested</span>
              </span>
            )}

            {/* Teacher Approved Badge */}
            {route.teacherApproved && (
              <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                <span>Teacher Approved</span>
              </span>
            )}

            {/* Expert Recommended Badge */}
            {(route.expertLikesCount || 0) > 0 && (
              <span className="bg-amber-500/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3 text-slate-900" />
                <span>{route.expertLikesCount} Expert Like{route.expertLikesCount > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>

          {(route.completionsCount || 0) > 0 && (
            <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-emerald-200">
              {route.completionsCount} completions
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold mb-1">
            <span className="truncate max-w-[150px]">{route.subject}</span>
            <span className="text-slate-500 font-semibold flex items-center gap-0.5">
              <MapPin className="w-3 h-3 text-emerald-700 inline" />
              {route.startLocation?.city || 'Local'} {distanceKm <= 50 ? `• ${distanceKm} km away` : ''}
            </span>
          </div>

          <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-[#1B4332] transition-colors line-clamp-1">
            {route.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
            {route.shortDescription}
          </p>
        </div>

        {/* Meta Stats Row */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {route.estimatedDurationMinutes}m
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {route.estimatedDistanceKm}km
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-[#1B4332] bg-[#E8F5E9] px-2 py-0.5 rounded-md">
            <Award className="w-3.5 h-3.5 text-emerald-700" />
            <span>{route.totalPossiblePoints} pts</span>
          </div>
        </div>

        {/* Creator & Social Actions Footnote */}
        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-50">
          <div className="flex items-center gap-1.5 truncate max-w-[170px]">
            {route.isTeamProject ? (
              <span className="font-bold text-sky-800 truncate">👥 {route.teamInfo?.teamName || route.creatorDisplayName}</span>
            ) : (
              <span className="font-semibold text-slate-700 truncate">By {route.creatorDisplayName.split(' ')[0]}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Interactive Single-Like Button */}
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                userHasLiked
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
              }`}
              title="Like this route (once per user)"
            >
              <Heart className={`w-3.5 h-3.5 ${userHasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{likesCount}</span>
            </button>

            {/* Start Button */}
            <span className="text-[#1B4332] font-extrabold flex items-center gap-1 bg-[#E8F5E9] px-2.5 py-1 rounded-lg hover:bg-[#D8EFE0]">
              Start <Play className="w-3 h-3 fill-[#1B4332]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
