import React from 'react';
import { Route } from '../../types';
import { dataService } from '../../services/dataService';
import { Globe, Users, Sparkles, BookOpen, Heart, Award } from 'lucide-react';
import { RouteCard } from '../explore/RouteCard';

interface CommunityViewProps {
  onSelectRoute: (route: Route) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ onSelectRoute }) => {
  const publicRoutes = dataService.getRoutes().filter(r => r.publishingStatus === 'published');

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#081C15] text-white p-5 rounded-3xl shadow-lg space-y-2">
        <span className="text-[10px] font-extrabold uppercase bg-[#52B788] text-[#081C15] px-2.5 py-0.5 rounded-full">
          Trailim Community
        </span>
        <h1 className="font-display font-bold text-2xl text-white">Public Route Library</h1>
        <p className="text-xs text-emerald-100 max-w-sm">
          Discover student-created trails, municipal heritage routes, and educational templates shared by schools.
        </p>
      </div>

      {/* Featured Creators Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4 text-emerald-700" /> Featured School Networks & Creators
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900">Greenwood High School</h4>
            <p className="text-[10px] text-emerald-700 mt-0.5">8 Published Community Trails</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900">Municipal Heritage Council</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">12 Validated Historical Routes</p>
          </div>
        </div>
      </div>

      {/* Community Routes Grid */}
      <div className="space-y-3">
        <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-700" />
          <span>All Public Community Routes</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publicRoutes.map(route => (
            <RouteCard key={route.id} route={route} onSelect={onSelectRoute} />
          ))}
        </div>
      </div>

    </div>
  );
};
