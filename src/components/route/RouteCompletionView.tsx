import React from 'react';
import { Award, CheckCircle2, Trophy, RotateCcw, Compass, Share2 } from 'lucide-react';
import { useActiveRoute } from '../../context/ActiveRouteContext';
import { LeaderboardView } from './LeaderboardView';

interface RouteCompletionViewProps {
  onReturnToExplore: () => void;
}

export const RouteCompletionView: React.FC<RouteCompletionViewProps> = ({ onReturnToExplore }) => {
  const { activeRoute, score, selectedMode, teamName, resetProgress } = useActiveRoute();

  return (
    <div className="max-w-md mx-auto space-y-6 py-6 pb-20 animate-in zoom-in-95">
      
      {/* Celebration Header Card */}
      <div className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#081C15] text-white p-6 rounded-3xl text-center space-y-3 shadow-xl">
        <div className="w-16 h-16 bg-[#52B788] text-[#081C15] rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
          <Trophy className="w-9 h-9" />
        </div>

        <div className="inline-block px-3 py-1 bg-emerald-900/80 rounded-full text-[10px] font-extrabold uppercase text-[#52B788] tracking-wider border border-emerald-700">
          Route Completed!
        </div>

        <h1 className="font-display font-bold text-2xl text-white">
          Congratulations!
        </h1>

        <p className="text-xs text-emerald-100 max-w-xs mx-auto">
          You completed <span className="font-bold">{activeRoute?.title}</span> in {selectedMode.replace(/_/g, ' ')} mode.
        </p>

        {/* Total Points Display */}
        <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 max-w-xs mx-auto border border-emerald-600/40">
          <span className="text-[10px] uppercase font-bold text-emerald-300 block">Total Earned Points</span>
          <span className="font-display font-extrabold text-3xl text-white block mt-0.5">{score} PTS</span>
        </div>
      </div>

      {/* Badges Earned */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 text-center">
        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">New Badge Earned</span>
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-left">
          <div className="text-3xl">🏛️</div>
          <div>
            <h4 className="font-bold text-xs text-emerald-900">Heritage Discoverer</h4>
            <p className="text-[11px] text-emerald-700">Completed community heritage route stations and verified submissions.</p>
          </div>
        </div>
      </div>

      {/* Leaderboard if Challenge Mode */}
      {selectedMode === 'challenge' && (
        <LeaderboardView currentScore={score} currentTeamName={teamName} />
      )}

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onReturnToExplore}
          className="w-full py-3.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Compass className="w-4 h-4" /> Return to Explore Routes
        </button>

        <button
          onClick={() => resetProgress()}
          className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 rounded-2xl font-semibold text-xs hover:bg-slate-50 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Replay Route
        </button>
      </div>

    </div>
  );
};
