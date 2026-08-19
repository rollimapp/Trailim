import React from 'react';
import { Route } from '../../types';
import { dataService } from '../../services/dataService';
import { BarChart3, Users, CheckCircle, Clock, Award, HelpCircle } from 'lucide-react';

interface AnalyticsViewProps {
  route: Route;
  onBack: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ route, onBack }) => {
  const analytics = dataService.getAnalytics(route.id);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      
      {/* Header */}
      <div className="bg-[#1B4332] text-white p-5 rounded-3xl shadow-lg space-y-1">
        <span className="text-[10px] font-extrabold uppercase bg-[#52B788] text-[#081C15] px-2.5 py-0.5 rounded-full">
          Creator Analytics
        </span>
        <h1 className="font-display font-bold text-xl text-white">{route.title}</h1>
        <p className="text-xs text-emerald-200">Real-time educational participation and completion metrics.</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-xs">
          <Users className="w-5 h-5 text-emerald-700 mx-auto" />
          <span className="font-display font-extrabold text-2xl text-slate-900 block">{analytics.participantsCount}</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold">Total Participants</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-700 mx-auto" />
          <span className="font-display font-extrabold text-2xl text-slate-900 block">{analytics.completionRatePercent}%</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold">Completion Rate</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-xs">
          <Clock className="w-5 h-5 text-emerald-700 mx-auto" />
          <span className="font-display font-extrabold text-2xl text-slate-900 block">{analytics.averageCompletionTimeMinutes}m</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold">Avg. Completion Time</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-xs">
          <Award className="w-5 h-5 text-emerald-700 mx-auto" />
          <span className="font-display font-extrabold text-2xl text-slate-900 block">{analytics.averageScore}</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold">Average Score</span>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Pedagogical Insights</h3>
        
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
          <span className="font-bold text-amber-900 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Most Challenging Task
          </span>
          <p className="text-amber-950 text-[11px] font-medium">{analytics.mostDifficultQuestionPrompt || 'Keystone symbol identification'}</p>
        </div>

        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
          <span className="font-bold text-emerald-900 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Field Submissions Logged
          </span>
          <p className="text-emerald-950 text-[11px] font-medium">{analytics.uploadedSubmissionsCount} verified photo/text evidence uploads</p>
        </div>
      </div>

      <button
        onClick={onBack}
        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs"
      >
        Return to Creator Studio
      </button>

    </div>
  );
};
