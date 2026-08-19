import React, { useState } from 'react';
import { Route, Station } from '../../types';
import { AlertCircle, CheckCircle2, MessageSquare, ArrowRight, Send, Check } from 'lucide-react';

interface TeacherFeedbackViewProps {
  route: Route;
  stations: Station[];
  onEditStation: (stationIndex: number) => void;
  onResubmitToTeacher: () => void;
}

export const TeacherFeedbackView: React.FC<TeacherFeedbackViewProps> = ({
  route,
  stations,
  onEditStation,
  onResubmitToTeacher
}) => {
  const [resolvedItems, setResolvedItems] = useState<Record<string, boolean>>({
    'item-1': false,
    'item-2': false,
    'item-3': false,
  });

  const feedbackList = [
    {
      id: 'item-1',
      stationIndex: 1,
      stationTitle: stations[1]?.title || 'Station 2',
      category: 'Clarification Needed',
      comment: 'Please clarify the instructions at Station 2 regarding the stone mason inscription. The current wording is slightly ambiguous.'
    },
    {
      id: 'item-2',
      stationIndex: 2,
      stationTitle: stations[2]?.title || 'Station 3',
      category: 'Media Verification',
      comment: 'Replace the generic web photo with an original photograph taken during your team field visit.'
    },
    {
      id: 'item-3',
      stationIndex: 3,
      stationTitle: stations[3]?.title || 'Station 4',
      category: 'Accessibility Note',
      comment: 'Add an explicit accessibility note confirming step-free sidewalk access or alternative detour.'
    }
  ];

  const handleToggleResolved = (id: string) => {
    setResolvedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allResolved = feedbackList.every(f => resolvedItems[f.id]);

  return (
    <div className="bg-amber-50/90 p-5 rounded-3xl border border-amber-200 space-y-4 text-xs">
      
      {/* Banner */}
      <div className="flex items-start gap-3 border-b border-amber-200 pb-3">
        <div className="w-9 h-9 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-extrabold text-amber-900 tracking-wider">Teacher Review Update</span>
          <h3 className="font-display font-bold text-base text-amber-950">Changes Requested by Ms. Elena Vance</h3>
          <p className="text-[11px] text-amber-900 mt-0.5">
            Your teacher reviewed your route submission and requested a few small revisions before approval.
          </p>
        </div>
      </div>

      {/* Feedback Checklist */}
      <div className="space-y-2">
        <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">Feedback & Revision Checklist</h4>

        <div className="space-y-2">
          {feedbackList.map((item) => {
            const isResolved = resolvedItems[item.id];
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isResolved ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-amber-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => handleToggleResolved(item.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                        isResolved ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isResolved && '✓'}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{item.stationTitle}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-extrabold">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-1 leading-snug">{item.comment}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onEditStation(item.stationIndex)}
                    className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 shrink-0 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200"
                  >
                    Edit Station <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resubmit Action */}
      <div className="pt-2 border-t border-amber-200">
        <button
          onClick={onResubmitToTeacher}
          disabled={!allResolved}
          className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
            allResolved
              ? 'bg-[#1B4332] hover:bg-[#2D6A4F] text-white'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" /> Resubmit Revised Project to Teacher
        </button>
      </div>

    </div>
  );
};
