import React from 'react';
import { Compass, BookOpen, PlusCircle, Globe, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';

export type MainTab = 'explore' | 'activity' | 'create' | 'community' | 'profile' | 'review_queue';

interface BottomNavProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useAuth();
  
  // Pending review queue count for reviewers/teachers
  const reviewQueue = dataService.getReviewQueue();
  const pendingCount = reviewQueue.filter(r => r.status === 'submitted').length;
  const canReview = currentUser.capabilities.canReviewSubmitted;

  return (
    <nav className="fixed sm:absolute bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-lg px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shrink-0">
      <div className="flex items-center justify-around w-full">
        
        {/* Explore Tab */}
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'explore'
              ? 'text-[#1B4332] font-bold bg-[#E8F5E9]'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Compass className={`w-5 h-5 ${activeTab === 'explore' ? 'stroke-[2.5px] text-[#1B4332]' : ''}`} />
          <span className="text-[11px] mt-0.5">Explore</span>
        </button>

        {/* My Activity Tab */}
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'activity'
              ? 'text-[#1B4332] font-bold bg-[#E8F5E9]'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${activeTab === 'activity' ? 'stroke-[2.5px] text-[#1B4332]' : ''}`} />
          <span className="text-[11px] mt-0.5">Activity</span>
        </button>

        {/* Creator Studio Tab */}
        <button
          onClick={() => setActiveTab('create')}
          className={`relative flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'create'
              ? 'text-[#1B4332] font-bold bg-[#E8F5E9]'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <PlusCircle className={`w-5 h-5 ${activeTab === 'create' ? 'stroke-[2.5px] text-[#1B4332]' : ''}`} />
          </div>
          <span className="text-[11px] mt-0.5">Create</span>
        </button>

        {/* Review Queue Tab (visible for teachers & reviewers) */}
        {canReview && (
          <button
            onClick={() => setActiveTab('review_queue')}
            className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'review_queue'
                ? 'text-amber-800 font-bold bg-amber-50'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className="relative">
              <ShieldCheck className={`w-5 h-5 ${activeTab === 'review_queue' ? 'stroke-[2.5px] text-amber-800' : ''}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-amber-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Review</span>
          </button>
        )}

        {/* Community Tab */}
        <button
          onClick={() => setActiveTab('community')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'community'
              ? 'text-[#1B4332] font-bold bg-[#E8F5E9]'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Globe className={`w-5 h-5 ${activeTab === 'community' ? 'stroke-[2.5px] text-[#1B4332]' : ''}`} />
          <span className="text-[11px] mt-0.5">Community</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'profile'
              ? 'text-[#1B4332] font-bold bg-[#E8F5E9]'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5px] text-[#1B4332]' : ''}`} />
          <span className="text-[11px] mt-0.5">Profile</span>
        </button>

      </div>
    </nav>
  );
};
