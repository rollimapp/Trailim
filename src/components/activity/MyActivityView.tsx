import React, { useState } from 'react';
import { Route } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Trophy, Award, Clock, CheckCircle2, Bookmark, Play } from 'lucide-react';
import { RouteCard } from '../explore/RouteCard';

interface MyActivityViewProps {
  onSelectRoute: (route: Route) => void;
}

export const MyActivityView: React.FC<MyActivityViewProps> = ({ onSelectRoute }) => {
  const { currentUser, savedRouteIds } = useAuth();
  const [activeTab, setActiveTab] = useState<'completed' | 'saved' | 'badges'>('completed');

  const allRoutes = dataService.getRoutes();
  const savedRoutes = allRoutes.filter(r => savedRouteIds.includes(r.id));
  const completedRoutes = allRoutes.filter(r => r.completionsCount > 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Activity Overview Header */}
      <div className="bg-[#1B4332] text-white p-5 rounded-3xl shadow-lg space-y-3">
        <div className="flex items-center gap-3">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-12 h-12 rounded-full border-2 border-[#52B788] object-cover" />
          <div>
            <h1 className="font-display font-bold text-xl text-white">{currentUser.name}</h1>
            <p className="text-xs text-emerald-200">{currentUser.schoolName || 'District Student'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-[#081C15]/50 backdrop-blur-md p-3 rounded-2xl text-center border border-[#2D6A4F]">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Points</span>
            <span className="font-display font-extrabold text-lg text-white block">{currentUser.totalPoints}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Completed</span>
            <span className="font-display font-extrabold text-lg text-white block">{currentUser.completedRoutesCount}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Badges</span>
            <span className="font-display font-extrabold text-lg text-white block">{currentUser.earnedBadges.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveTab('completed')}
          className={`py-2 px-4 border-b-2 transition-colors ${
            activeTab === 'completed' ? 'border-[#1B4332] text-[#1B4332]' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Completed ({completedRoutes.length})
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`py-2 px-4 border-b-2 transition-colors ${
            activeTab === 'saved' ? 'border-[#1B4332] text-[#1B4332]' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Saved ({savedRoutes.length})
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`py-2 px-4 border-b-2 transition-colors ${
            activeTab === 'badges' ? 'border-[#1B4332] text-[#1B4332]' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Badges ({currentUser.earnedBadges.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'completed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completedRoutes.map(route => (
            <RouteCard key={route.id} route={route} onSelect={onSelectRoute} />
          ))}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedRoutes.map(route => (
            <RouteCard key={route.id} route={route} onSelect={onSelectRoute} />
          ))}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 gap-3">
          {currentUser.earnedBadges.map(badge => (
            <div key={badge.id} className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-xs">
              <div className="text-3xl mb-1">{badge.icon}</div>
              <h4 className="font-bold text-xs text-slate-900">{badge.title}</h4>
              <p className="text-[10px] text-slate-500 leading-tight">{badge.description}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
