import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ActiveRouteProvider, useActiveRoute } from './context/ActiveRouteContext';
import { PermissionProvider } from './context/PermissionContext';
import { Header } from './components/common/Header';
import { BottomNav, MainTab } from './components/common/BottomNav';
import { ExploreView } from './components/explore/ExploreView';
import { RouteDetailView } from './components/route/RouteDetailView';
import { RoutePreStartView } from './components/route/RoutePreStartView';
import { ActiveRouteContainer } from './components/active/ActiveRouteContainer';
import { CreatorDashboardView } from './components/creator/CreatorDashboardView';
import { RouteBuilderContainer } from './components/creator/RouteBuilderContainer';
import { ReviewQueueView } from './components/review/ReviewQueueView';
import { MyActivityView } from './components/activity/MyActivityView';
import { CommunityView } from './components/community/CommunityView';
import { ProfileView } from './components/profile/ProfileView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { Route, ExperienceMode } from './types';

const MainContent: React.FC = () => {
  const { activeRoute } = useActiveRoute();
  
  const [activeTab, setActiveTab] = useState<MainTab>('explore');
  const [selectedRouteForDetail, setSelectedRouteForDetail] = useState<Route | null>(null);
  const [preStartMode, setPreStartMode] = useState<ExperienceMode | null>(null);
  const [isBuildingRoute, setIsBuildingRoute] = useState<boolean>(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [analyticsRoute, setAnalyticsRoute] = useState<Route | null>(null);

  const showStandardNav = !selectedRouteForDetail && !isBuildingRoute && !analyticsRoute;

  return (
    <div className="h-[100dvh] w-full bg-slate-900 text-[#1D242B] font-sans flex items-center justify-center p-0 sm:py-6 sm:px-4 overflow-hidden">
      {/* Mobile App Shell Frame */}
      <div className="w-full sm:w-[410px] md:w-[430px] h-full sm:h-[860px] sm:max-h-[92vh] max-h-[100dvh] bg-[#FAF9F6] relative flex flex-col sm:rounded-[48px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] sm:border-[10px] sm:border-slate-800 overflow-hidden">
        
        {/* Hardware Notch / Camera Pill on Desktop */}
        <div className="hidden sm:flex absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-800 rounded-b-xl z-50 pointer-events-none items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 mr-2" />
          <div className="w-8 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Active Route Override or Standard Main Views */}
        {activeRoute ? (
          <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col h-full min-h-0">
            <ActiveRouteContainer
              onReturnToExplore={() => {
                setSelectedRouteForDetail(null);
                setPreStartMode(null);
                setActiveTab('explore');
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative min-h-0">
            {/* Header Bar */}
            <Header />

            {/* Scrollable View Content */}
            <main className={`flex-1 overflow-y-auto scrollbar-none p-3.5 space-y-4 min-h-0 ${showStandardNav ? 'pb-24 pb-[calc(5.5rem+env(safe-area-inset-bottom))]' : ''}`}>
              
              {/* Pre-Start Briefing Screen */}
              {selectedRouteForDetail && preStartMode ? (
                <RoutePreStartView
                  route={selectedRouteForDetail}
                  mode={preStartMode}
                  onBack={() => setPreStartMode(null)}
                  onLaunch={() => {
                    // ActiveRouteContext handles launching
                  }}
                />
              ) : selectedRouteForDetail ? (
                /* Route Detail Overview Screen */
                <RouteDetailView
                  route={selectedRouteForDetail}
                  onBack={() => setSelectedRouteForDetail(null)}
                  onStartRoute={(mode) => setPreStartMode(mode)}
                />
              ) : isBuildingRoute ? (
                /* Route Builder / Creator Wizard */
                <RouteBuilderContainer
                  initialRoute={editingRoute}
                  onClose={() => {
                    setIsBuildingRoute(false);
                    setEditingRoute(null);
                  }}
                  onPreview={(route) => {
                    setSelectedRouteForDetail(route);
                    setIsBuildingRoute(false);
                  }}
                />
              ) : analyticsRoute ? (
                /* Route Analytics Screen */
                <AnalyticsView
                  route={analyticsRoute}
                  onBack={() => setAnalyticsRoute(null)}
                />
              ) : (
                /* Tab Navigation Views */
                <>
                  {activeTab === 'explore' && (
                    <ExploreView
                      onSelectRoute={(route) => setSelectedRouteForDetail(route)}
                    />
                  )}

                  {activeTab === 'activity' && (
                    <MyActivityView
                      onSelectRoute={(route) => setSelectedRouteForDetail(route)}
                    />
                  )}

                  {activeTab === 'create' && (
                    <CreatorDashboardView
                      onStartNewRoute={() => {
                        setEditingRoute(null);
                        setIsBuildingRoute(true);
                      }}
                      onEditRoute={(route) => {
                        setEditingRoute(route);
                        setIsBuildingRoute(true);
                      }}
                      onPreviewRoute={(route) => setSelectedRouteForDetail(route)}
                    />
                  )}

                  {activeTab === 'review_queue' && (
                    <ReviewQueueView
                      onPreviewRoute={(route) => setSelectedRouteForDetail(route)}
                    />
                  )}

                  {activeTab === 'community' && (
                    <CommunityView
                      onSelectRoute={(route) => setSelectedRouteForDetail(route)}
                    />
                  )}

                  {activeTab === 'profile' && (
                    <ProfileView />
                  )}
                </>
              )}

            </main>

            {/* Bottom Mobile Navigation Bar */}
            {!selectedRouteForDetail && !isBuildingRoute && !analyticsRoute && (
              <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PermissionProvider>
        <ActiveRouteProvider>
          <MainContent />
        </ActiveRouteProvider>
      </PermissionProvider>
    </AuthProvider>
  );
}

export default App;
