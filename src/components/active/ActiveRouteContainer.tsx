import React, { useState } from 'react';
import { useActiveRoute } from '../../context/ActiveRouteContext';
import { StationView } from './StationView';
import { RouteCompletionView } from '../route/RouteCompletionView';
import { X, Map, Award, Compass, Layers } from 'lucide-react';
import { MapPlaceholder } from '../common/MapPlaceholder';

interface ActiveRouteContainerProps {
  onReturnToExplore: () => void;
}

export const ActiveRouteContainer: React.FC<ActiveRouteContainerProps> = ({ onReturnToExplore }) => {
  const { 
    activeRoute, 
    activeStations, 
    currentStationIndex, 
    currentStation, 
    score, 
    isCompleted, 
    unlockedStationIds,
    exitRoute 
  } = useActiveRoute();

  const [showMapView, setShowMapView] = useState(false);

  if (!activeRoute || !currentStation) return null;

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] p-4">
        <RouteCompletionView onReturnToExplore={() => {
          exitRoute();
          onReturnToExplore();
        }} />
      </div>
    );
  }

  const progressPercent = activeStations.length 
    ? Math.round(((currentStationIndex + 1) / activeStations.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      
      {/* Sticky Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#1B4332] text-white shadow-md border-b border-[#2D6A4F] px-4 py-3">
        <div className="max-w-md mx-auto space-y-2">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm('Pause or exit route activity? Progress will be saved.')) {
                    exitRoute();
                    onReturnToExplore();
                  }
                }}
                className="p-1.5 rounded-lg bg-[#2D6A4F] hover:bg-emerald-800 text-slate-200 transition-colors"
                title="Pause or exit route"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="line-clamp-1">
                <span className="font-bold text-xs text-white block">{activeRoute.title}</span>
                <span className="text-[10px] text-emerald-300 font-semibold block">
                  Station {currentStationIndex + 1} of {activeStations.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Score Badge */}
              <div className="bg-[#2D6A4F] text-[#52B788] px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 border border-[#52B788]/40">
                <Award className="w-3.5 h-3.5" />
                <span>{score} PTS</span>
              </div>

              {/* Map Toggle */}
              <button
                onClick={() => setShowMapView(!showMapView)}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                  showMapView ? 'bg-[#52B788] text-[#081C15] border-white' : 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                }`}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#081C15] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#52B788] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

        </div>
      </header>

      {/* Main Execution Body */}
      <main className="flex-1 max-w-md mx-auto w-full p-4">
        {showMapView ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800">Route Map View</span>
              <button
                onClick={() => setShowMapView(false)}
                className="text-xs font-bold text-emerald-800 hover:underline"
              >
                Return to Station Cards
              </button>
            </div>
            <MapPlaceholder
              stations={activeStations}
              currentStationId={currentStation.id}
              completedStationIds={unlockedStationIds}
              startLocation={activeRoute.startLocation}
              heightClass="h-96"
            />
          </div>
        ) : (
          <StationView station={currentStation} />
        )}
      </main>

    </div>
  );
};
