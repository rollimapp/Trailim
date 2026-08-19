import React, { useState } from 'react';
import { Route, Station, PublishingStatus } from '../../types';
import { CheckCircle2, AlertTriangle, Send, ShieldCheck, HelpCircle, FileText, Sparkles, X, ChevronRight } from 'lucide-react';

interface PreSubmissionChecklistProps {
  route: Route;
  stations: Station[];
  onSubmitForReview: (targetVisibility: string, noteToTeacher: string, reflections: Record<string, string>) => void;
  onNavigateToStep: (step: number) => void;
}

export const PreSubmissionChecklist: React.FC<PreSubmissionChecklistProps> = ({
  route,
  stations,
  onSubmitForReview,
  onNavigateToStep
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [requestedVisibility, setRequestedVisibility] = useState<'class' | 'school' | 'community'>('class');
  const [noteToTeacher, setNoteToTeacher] = useState('');

  // Team Reflection State
  const [reflections, setReflections] = useState({
    learningGoals: route.learningObjectives?.join(', ') || 'Discover local trade history and stone masonry.',
    fieldChanges: 'After visiting the site, we simplified station 3 instructions because the plaque text was partially worn.',
    problemSolved: 'Documented oral stories from local shopkeepers that were not recorded in standard history books.',
    teamRoles: 'Maya managed mapping, Liam researched archives, Noa took photos, and Alex recorded audio.',
    futureImprovements: 'Add audio transcripts in secondary languages for international visitors.'
  });

  // Checklist Validation
  const checks = [
    {
      id: 'title_desc',
      label: 'Route Title & Short Description',
      isComplete: !!route.title && !!route.shortDescription,
      isRequired: true,
      step: 1
    },
    {
      id: 'cover_image',
      label: 'Route Cover Image',
      isComplete: !!route.coverImageUrl,
      isRequired: true,
      step: 1
    },
    {
      id: 'min_stations',
      label: 'Minimum Stations Configured (2+)',
      isComplete: stations.length >= 2,
      isRequired: true,
      step: 4
    },
    {
      id: 'station_tasks',
      label: 'Station Tasks & Answer Keys Set',
      isComplete: stations.every(s => s.tasks && s.tasks.length > 0),
      isRequired: true,
      step: 5
    },
    {
      id: 'safety_info',
      label: 'Safety Guidelines for Participants',
      isComplete: !!route.safetyInstructions,
      isRequired: true,
      step: 3
    },
    {
      id: 'accessibility',
      label: 'Accessibility Information',
      isComplete: !!route.accessibilityInformation,
      isRequired: true,
      step: 3
    },
    {
      id: 'field_tested',
      label: 'On-Site Field Visit & Evidence',
      isComplete: route.fieldVerificationStatus === 'field_tested' || (route.fieldEvidence?.length || 0) > 0,
      isRequired: false,
      step: 4
    },
    {
      id: 'team_reflection',
      label: 'Team Project Reflection',
      isComplete: !!reflections.learningGoals && !!reflections.fieldChanges,
      isRequired: true,
      step: 5
    }
  ];

  const allRequiredComplete = checks.filter(c => c.isRequired).every(c => c.isComplete);

  const handleSubmit = () => {
    onSubmitForReview(requestedVisibility, noteToTeacher, reflections);
    setShowSubmitModal(false);
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-5 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-[10px] uppercase font-extrabold text-emerald-800 tracking-wider">Route Readiness Audit</span>
          <h3 className="font-display font-bold text-base text-slate-900">Pre-Submission Check & Reflection</h3>
        </div>

        <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${
          allRequiredComplete
            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          {allRequiredComplete ? 'Ready to Submit' : 'Checks Pending'}
        </span>
      </div>

      {/* Audit Checklist */}
      <div className="space-y-2">
        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Requirements Checklist</h4>
        
        <div className="space-y-1.5">
          {checks.map(item => (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                item.isComplete ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  item.isComplete ? 'bg-[#1B4332] text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.isComplete ? '✓' : '!'}
                </div>
                <div>
                  <span className={`font-bold text-xs ${item.isComplete ? 'text-slate-900' : 'text-slate-700'}`}>
                    {item.label}
                  </span>
                  {item.isRequired && <span className="text-rose-500 font-bold ml-1 text-[10px]">*Required</span>}
                </div>
              </div>

              {!item.isComplete && (
                <button
                  onClick={() => onNavigateToStep(item.step)}
                  className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-0.5 shrink-0"
                >
                  Fix in Step {item.step} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Team Reflection Form */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 border-b pb-2">
          <FileText className="w-4 h-4 text-emerald-800" />
          <h4 className="font-bold text-xs text-slate-900">Student Team Reflection</h4>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block font-bold text-slate-700 mb-1">What did your team want participants to learn?</label>
            <textarea
              value={reflections.learningGoals}
              onChange={(e) => setReflections({ ...reflections, learningGoals: e.target.value })}
              rows={2}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">What changed after your team visited the physical locations?</label>
            <textarea
              value={reflections.fieldChanges}
              onChange={(e) => setReflections({ ...reflections, fieldChanges: e.target.value })}
              rows={2}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">How were responsibilities divided across team members?</label>
            <textarea
              value={reflections.teamRoles}
              onChange={(e) => setReflections({ ...reflections, teamRoles: e.target.value })}
              rows={2}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>
        </div>
      </div>

      {/* Action Submit */}
      <div className="pt-2">
        <button
          onClick={() => setShowSubmitModal(true)}
          disabled={!allRequiredComplete}
          className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
            allRequiredComplete
              ? 'bg-[#1B4332] hover:bg-[#2D6A4F] text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" /> Submit Route to Teacher for Review
        </button>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display font-bold text-base text-slate-900">Submit Project to Teacher</h3>
              <button onClick={() => setShowSubmitModal(false)} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Publication Level</label>
                <div className="space-y-1.5">
                  {[
                    { id: 'class', label: 'Classroom Only', desc: 'Visible to classmates in Class 9B History' },
                    { id: 'school', label: 'School Network', desc: 'Available for all students & teachers at Greenwood High' },
                    { id: 'community', label: 'Public Community', desc: 'Discoverable in community heritage library (Requires Teacher Approval)' },
                  ].map(opt => (
                    <label key={opt.id} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        checked={requestedVisibility === opt.id}
                        onChange={() => setRequestedVisibility(opt.id as any)}
                        className="w-4 h-4 text-[#1B4332] mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{opt.label}</span>
                        <span className="text-[11px] text-slate-500">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note for Ms. Elena Vance (Educator)</label>
                <textarea
                  value={noteToTeacher}
                  onChange={(e) => setNoteToTeacher(e.target.value)}
                  placeholder="e.g. Hi Ms. Vance! Our team completed our field visit and tested station 4 codes..."
                  rows={3}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-[#1B4332] text-white font-bold rounded-xl hover:bg-[#2D6A4F]"
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
