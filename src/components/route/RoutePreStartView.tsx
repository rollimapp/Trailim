import React, { useState } from 'react';
import { Route, ExperienceMode } from '../../types';
import { ArrowLeft, Users, ShieldAlert, Camera, MapPin, Play, Clock, Sparkles, Wifi, ShieldCheck, Compass, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useActiveRoute } from '../../context/ActiveRouteContext';
import { usePermissions } from '../../context/PermissionContext';

interface RoutePreStartViewProps {
  route: Route;
  mode: ExperienceMode;
  onBack: () => void;
  onLaunch: () => void;
}

export const RoutePreStartView: React.FC<RoutePreStartViewProps> = ({
  route,
  mode,
  onBack,
  onLaunch
}) => {
  const { currentUser } = useAuth();
  const { startRoute } = useActiveRoute();
  const { locationStatus, requestLocationPermission } = usePermissions();
  const [teamName, setTeamName] = useState<string>('The Trailblazers');
  const [participantType, setParticipantType] = useState<'individual' | 'team'>('team');
  const [acceptedSafety, setAcceptedSafety] = useState<boolean>(true);
  const [locationOption, setLocationOption] = useState<'gps' | 'simulated'>('simulated');

  const handleStart = () => {
    if (!acceptedSafety) return;
    startRoute(route, mode, participantType === 'team' ? teamName : currentUser.name);
    onLaunch();
  };

  return (
    <div className="max-w-md mx-auto space-y-5 pb-20 animate-in fade-in">
      
      {/* Header Bar */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-xs">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 leading-tight">Pre-Start Briefing</h2>
          <p className="text-xs text-emerald-800 font-semibold">{route.title}</p>
        </div>
      </div>

      {/* Selected Experience Mode Banner */}
      <div className="bg-[#1B4332] text-white p-4 rounded-2xl shadow-sm space-y-2 border border-[#2D6A4F]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-[#52B788] tracking-wider block">Selected Mode</span>
            <h3 className="font-bold text-base capitalize text-white flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-4 h-4 text-[#52B788]" />
              {mode.replace(/_/g, ' ')} Mode
            </h3>
          </div>
          <span className="px-3 py-1 bg-[#52B788] text-[#081C15] font-extrabold text-xs rounded-full">
            Ready to Start
          </span>
        </div>
        <p className="text-xs text-emerald-100/90 leading-relaxed">
          {mode === 'learning' 
            ? 'Focus on careful observation, oral history transcripts, and thoughtful reflection answers.'
            : mode === 'challenge' 
            ? 'Complete stations quickly, answer correctly on first attempts, and log points for the leaderboard!'
            : 'Self-paced tour mode designed for casual neighborhood walking.'}
        </p>
      </div>

      {/* Quick Route Context Stats */}
      <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-center">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Est. Duration</span>
          <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-emerald-700" /> ~{route.estimatedDurationMinutes} mins
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Distance</span>
          <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" /> {route.estimatedDistanceKm} km
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Trust Level</span>
          <span className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
          </span>
        </div>
      </div>

      {/* Learning Objectives & Instructions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
        <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-700" /> Learning Goals & Instructions
        </h3>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
          {route.learningObjectives.map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>
      </div>

      {/* Equipment Needed */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
        <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider">Equipment & Preparation</h3>
        <div className="flex flex-wrap gap-1.5">
          {route.requiredEquipment.map((eq, i) => (
            <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold">
              ✓ {eq}
            </span>
          ))}
        </div>
      </div>

      {/* Challenge Mode Team Setup */}
      {mode === 'challenge' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-700" /> Leaderboard Participation
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setParticipantType('individual')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl border ${
                participantType === 'individual' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              Solo Explorer
            </button>
            <button
              onClick={() => setParticipantType('team')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl border ${
                participantType === 'team' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              Team Squad
            </button>
          </div>

          {participantType === 'team' && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Mason Explorers"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
          )}
        </div>
      )}

      {/* Location Access & Connection Options */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider">Location & Status</h3>
          <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
            <Wifi className="w-3 h-3 text-emerald-600" />
            <span>Online • Cached</span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <button
            onClick={() => {
              if (locationStatus === 'granted') {
                setLocationOption('gps');
              } else {
                requestLocationPermission(
                  'verify your starting position on-site before launching the trail',
                  () => setLocationOption('gps'),
                  () => setLocationOption('simulated')
                );
              }
            }}
            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between ${
              locationOption === 'gps' ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <div>
                <div className="text-xs">Use Real GPS Location</div>
                <div className="text-[10px] text-slate-500 font-normal">Triggers stations via device coordinates</div>
              </div>
            </div>
            {locationOption === 'gps' && <span className="text-emerald-700 font-extrabold text-xs">Active ✓</span>}
          </button>

          <button
            onClick={() => setLocationOption('simulated')}
            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between ${
              locationOption === 'simulated' ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-700" />
              <div>
                <div className="text-xs">Continue Without Location (Demo Mode)</div>
                <div className="text-[10px] text-slate-500 font-normal">Simulates distances and manual station triggers</div>
              </div>
            </div>
            {locationOption === 'simulated' && <span className="text-emerald-700 font-extrabold text-xs">Active ✓</span>}
          </button>
        </div>
      </div>

      {/* Safety Acceptance */}
      <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 space-y-2">
        <h3 className="font-bold text-xs uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-600" /> Participant Safety Briefing
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed">
          {route.safetyInstructions}
        </p>
        <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs font-bold text-amber-950">
          <input
            type="checkbox"
            checked={acceptedSafety}
            onChange={(e) => setAcceptedSafety(e.target.checked)}
            className="w-4 h-4 text-[#1B4332] rounded focus:ring-emerald-500"
          />
          <span>I agree to follow safety guidelines and remain aware of my surroundings.</span>
        </label>
      </div>

      {/* Launch Button */}
      <button
        onClick={handleStart}
        disabled={!acceptedSafety}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
          acceptedSafety
            ? 'bg-[#1B4332] hover:bg-[#2D6A4F] text-white cursor-pointer active:scale-98'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
      >
        <Play className="w-5 h-5 fill-current" />
        Start Now ({mode.replace(/_/g, ' ')})
      </button>

    </div>
  );
};
