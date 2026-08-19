import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, Lock, Flag, Compass, Layers } from 'lucide-react';
import { Station, LocationCoordinates } from '../../types';

interface MapPlaceholderProps {
  stations?: Station[];
  currentStationId?: string;
  completedStationIds?: string[];
  startLocation?: LocationCoordinates;
  onSelectStation?: (station: Station) => void;
  heightClass?: string;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  stations = [],
  currentStationId,
  completedStationIds = [],
  startLocation,
  onSelectStation,
  heightClass = 'h-64'
}) => {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [viewType, setViewType] = useState<'map' | 'satellite'>('map');

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-900 group`}>
      
      {/* Background Stylized Map Pattern */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          viewType === 'satellite' ? 'opacity-90 bg-slate-950' : 'opacity-80 bg-[#E5E0D8]'
        }`}
        style={{
          backgroundImage: viewType === 'map'
            ? `radial-gradient(#C2B8A3 1.5px, transparent 1.5px), linear-gradient(to right, #D8D2C2 1px, transparent 1px), linear-gradient(to bottom, #D8D2C2 1px, transparent 1px)`
            : `radial-gradient(#1E293B 2px, transparent 2px)`,
          backgroundSize: '24px 24px, 48px 48px, 48px 48px'
        }}
      />

      {/* Simulated Roads & Topo Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
        <path d="M 20 180 Q 150 80, 280 140 T 500 90" fill="none" stroke={viewType === 'map' ? '#2D6A4F' : '#52B788'} strokeWidth="4" strokeDasharray="8 4" />
        <path d="M 50 40 Q 200 200, 380 80" fill="none" stroke={viewType === 'map' ? '#B8AF9E' : '#334155'} strokeWidth="3" />
      </svg>

      {/* Map Controls Header overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-10">
        <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-800 shadow-sm flex items-center gap-1.5 border border-slate-200">
          <Compass className="w-3.5 h-3.5 text-emerald-700 animate-spin" style={{ animationDuration: '10s' }} />
          <span>{startLocation?.locationName || 'Trailim Place-Based Map'}</span>
        </div>

        <button
          onClick={() => setViewType(viewType === 'map' ? 'satellite' : 'map')}
          className="bg-white/90 backdrop-blur-md p-1.5 rounded-lg text-slate-700 hover:bg-white text-xs font-semibold shadow-sm border border-slate-200 flex items-center gap-1"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-800" />
          <span className="hidden sm:inline">{viewType === 'map' ? 'Satellite' : 'Topo Map'}</span>
        </button>
      </div>

      {/* Pins layout container */}
      <div className="absolute inset-0 p-8 flex items-center justify-around pointer-events-auto">
        
        {/* Start Flag Marker */}
        <div className="relative group/pin flex flex-col items-center cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-300/50">
            <Flag className="w-4 h-4 fill-white" />
          </div>
          <span className="mt-1 px-2 py-0.5 bg-black/75 text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-xs">
            Start Point
          </span>
        </div>

        {/* Stations Pins */}
        {stations.map((st, index) => {
          const isCompleted = completedStationIds.includes(st.id);
          const isCurrent = currentStationId === st.id;
          const isSelected = selectedStation?.id === st.id;

          return (
            <div
              key={st.id}
              onClick={() => {
                setSelectedStation(st);
                if (onSelectStation) onSelectStation(st);
              }}
              className="relative group/pin flex flex-col items-center cursor-pointer transition-transform hover:scale-110 z-10"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-white ring-4 ring-amber-300 animate-bounce'
                    : isCompleted
                    ? 'bg-[#1B4332] text-white ring-2 ring-[#52B788]'
                    : 'bg-slate-700 text-slate-300 ring-2 ring-slate-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-[#52B788]" />
                ) : isCurrent ? (
                  <MapPin className="w-5 h-5 fill-white text-amber-500" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>

              {/* Station Label */}
              <div className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs whitespace-nowrap transition-colors ${
                isCurrent 
                  ? 'bg-amber-600 text-white' 
                  : isCompleted 
                  ? 'bg-[#1B4332] text-emerald-100' 
                  : 'bg-slate-800 text-slate-300'
              }`}>
                St. {index + 1}: {st.shortLabel || st.title}
              </div>

              {/* Popup details card */}
              {isSelected && (
                <div className="absolute bottom-12 bg-white text-slate-900 rounded-xl p-3 shadow-2xl border border-slate-200 w-48 text-left z-30 animate-in fade-in zoom-in-95">
                  <p className="text-[10px] uppercase font-extrabold text-emerald-800">Station {st.position}</p>
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{st.title}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{st.description}</p>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold">
                    <span className="text-emerald-700">{st.possiblePoints} pts</span>
                    <span className="text-slate-500">{st.estimatedTimeMinutes} mins</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* Bottom status badge */}
      <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-emerald-300 font-mono flex items-center gap-1.5 border border-emerald-900/50">
        <Navigation className="w-3 h-3 text-emerald-400" />
        <span>GPS Precision Mode Active • 5 Stations Mapped</span>
      </div>
    </div>
  );
};
