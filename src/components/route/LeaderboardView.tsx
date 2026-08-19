import React from 'react';
import { Trophy, Award, Medal, Users } from 'lucide-react';

interface LeaderboardViewProps {
  currentScore?: number;
  currentTeamName?: string;
}

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Mason Stone Explorers', score: 620, time: '38 mins', badge: '🏆 First Place' },
  { rank: 2, name: 'Heritage Detectives', score: 580, time: '41 mins', badge: '🥈 Second Place' },
  { rank: 3, name: 'Greenwood Group B', score: 510, time: '45 mins', badge: '🥉 Third Place' },
  { rank: 4, name: 'The Trailblazers (You)', score: 480, time: '42 mins', badge: 'Top 5' },
  { rank: 5, name: 'Eco Runners', score: 440, time: '49 mins', badge: 'Finisher' },
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ currentScore, currentTeamName }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-display font-bold text-base text-slate-900">Challenge Leaderboard</h3>
        </div>
        <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
          Live Session
        </span>
      </div>

      <div className="space-y-2">
        {MOCK_LEADERBOARD.map((item) => {
          const isUser = item.name.includes('You') || (currentTeamName && item.name.toLowerCase().includes(currentTeamName.toLowerCase()));
          return (
            <div
              key={item.rank}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                isUser
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/50 shadow-xs'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs ${
                  item.rank === 1 ? 'bg-amber-400 text-amber-950' : item.rank === 2 ? 'bg-slate-300 text-slate-800' : item.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {item.rank}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-800">{item.name}</div>
                  <div className="text-[10px] text-slate-400">{item.time}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-xs text-[#1B4332]">{item.score} pts</div>
                <div className="text-[10px] font-semibold text-slate-500">{item.badge}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
