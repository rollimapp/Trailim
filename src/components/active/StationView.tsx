import React, { useState } from 'react';
import { Station } from '../../types';
import { useActiveRoute } from '../../context/ActiveRouteContext';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { TaskRenderer } from './TaskRenderer';
import { QrCode, Lock, ArrowRight, ArrowLeft, CheckCircle2, MapPin, Eye, Volume2 } from 'lucide-react';

interface StationViewProps {
  station: Station;
}

export const StationView: React.FC<StationViewProps> = ({ station }) => {
  const { 
    activeStations, 
    currentStationIndex, 
    unlockedStationIds, 
    unlockStationWithCode, 
    nextStation, 
    prevStation 
  } = useActiveRoute();

  const [qrCodeInput, setQrCodeInput] = useState('');
  const [qrError, setQrError] = useState(false);

  const isUnlocked = unlockedStationIds.includes(station.id);
  const isLastStation = currentStationIndex === activeStations.length - 1;

  const handleUnlockCode = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockStationWithCode(station.id, qrCodeInput);
    if (!success) {
      setQrError(true);
    } else {
      setQrError(false);
    }
  };

  if (!isUnlocked && station.trigger.type === 'qr_code') {
    return (
      <div className="bg-white p-6 rounded-2xl border-2 border-amber-300 shadow-lg text-center space-y-4 max-w-md mx-auto my-6">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <QrCode className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">Locked Station {station.position}</span>
          <h3 className="font-bold text-base text-slate-900 mt-1">{station.title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Scan the QR code or enter the station access code at the physical location to unlock.
          </p>
        </div>

        <form onSubmit={handleUnlockCode} className="space-y-2">
          <input
            type="text"
            placeholder="Enter Station Code..."
            value={qrCodeInput}
            onChange={(e) => setQrCodeInput(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-center uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          />
          <p className="text-[11px] text-[#1B4332] font-extrabold bg-[#E8F5E9] py-1 px-2.5 rounded-lg inline-block border border-emerald-200">
            Demo code: TRAIL4
          </p>
          {qrError && (
            <p className="text-[11px] text-rose-600 font-bold block">Invalid code. Enter "TRAIL4" to unlock.</p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 bg-[#1B4332] text-white font-bold text-xs rounded-xl hover:bg-[#2D6A4F] shadow-sm cursor-pointer"
          >
            Unlock Station {station.position}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      
      {/* Station Header Badge */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
          <span className="uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            Station {station.position} of {activeStations.length}
          </span>
          <span className="bg-[#E8F5E9] text-[#1B4332] px-2.5 py-0.5 rounded-full font-extrabold text-[10px]">
            {station.possiblePoints} PTS
          </span>
        </div>

        <h2 className="font-display font-bold text-xl text-slate-900 leading-tight">
          {station.title}
        </h2>

        {station.description && (
          <p className="text-xs text-slate-600 leading-relaxed">
            {station.description}
          </p>
        )}
      </div>

      {/* Eyes Up, Screen Down Interaction Mode Banner */}
      {station.interactionMode && station.interactionMode !== 'standard' && (
        <div className="bg-[#E8F5E9] border border-emerald-300/80 p-3 rounded-2xl flex items-start gap-2.5 text-emerald-950">
          {station.interactionMode === 'look_around' ? (
            <Eye className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
              {station.interactionMode === 'look_around' ? 'Eyes Up — Look Around Mode' : 'Audio First Experience'}
            </span>
            <p className="text-[11px] text-emerald-900 leading-normal mt-0.5">
              {station.interactionMode === 'look_around'
                ? 'Put your phone down and inspect the site features carefully before answering.'
                : 'Listen to the audio source before completing your observation task.'}
            </p>
          </div>
        </div>
      )}

      {/* Render Content Blocks */}
      <div className="space-y-3">
        {station.contentBlocks.map(block => (
          <ContentBlockRenderer key={block.id} block={block} />
        ))}
      </div>

      {/* Render Tasks */}
      {station.tasks.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Station Tasks & Prompts</h3>
          {station.tasks.map(task => (
            <TaskRenderer key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Navigation Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={prevStation}
          disabled={currentStationIndex === 0}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all ${
            currentStationIndex === 0
              ? 'opacity-40 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>

        <button
          onClick={nextStation}
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#1B4332] text-white hover:bg-[#2D6A4F] flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
        >
          <span>{isLastStation ? 'Finish Route' : 'Next Station'}</span>
          {isLastStation ? <CheckCircle2 className="w-4 h-4 text-[#52B788]" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
};
