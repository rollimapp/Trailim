import React, { useState } from 'react';
import { Task } from '../../types';
import { useActiveRoute } from '../../context/ActiveRouteContext';
import { CheckCircle, XCircle, HelpCircle, Send, Award, Camera, KeyRound } from 'lucide-react';
import { MediaUploader } from '../common/MediaUploader';

interface TaskRendererProps {
  task: Task;
}

export const TaskRenderer: React.FC<TaskRendererProps> = ({ task }) => {
  const { submitTaskAnswer, progress } = useActiveRoute();
  
  const existingResponse = progress?.taskResponses[task.id];
  
  const [selectedOption, setSelectedOption] = useState<string>(
    typeof existingResponse?.answer === 'string' ? existingResponse.answer : ''
  );
  const [textInput, setTextInput] = useState<string>(
    typeof existingResponse?.answer === 'string' ? existingResponse.answer : ''
  );
  const [evidenceUrl, setEvidenceUrl] = useState<string>(existingResponse?.evidenceUrl || '');
  const [showHint, setShowHint] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<{ isCorrect?: boolean; feedback?: string } | null>(
    existingResponse ? { isCorrect: existingResponse.isCorrect, feedback: existingResponse.feedback } : null
  );

  const handleSubmitChoice = (optionId: string) => {
    setSelectedOption(optionId);
    const result = submitTaskAnswer(task.id, optionId);
    setFeedbackResult(result);
  };

  const handleSubmitTextOrCode = () => {
    if (!textInput.trim()) return;
    const result = submitTaskAnswer(task.id, textInput, evidenceUrl);
    setFeedbackResult(result);
  };

  const handleEvidenceUpload = (url: string) => {
    setEvidenceUrl(url);
    if (url) {
      const result = submitTaskAnswer(task.id, 'photo_submitted', url);
      setFeedbackResult(result);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border-2 border-emerald-600/30 shadow-sm space-y-4 my-4">
      
      {/* Header Task Type & Points */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-[10px] uppercase font-extrabold bg-[#E8F5E9] text-[#1B4332] px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-emerald-700" />
          {task.type.replace(/_/g, ' ')} • {task.points} Points
        </span>

        {task.hint && !showHint && (
          <button
            onClick={() => setShowHint(true)}
            className="text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3 text-amber-500" /> Need a Hint?
          </button>
        )}
      </div>

      {/* Task Prompt */}
      <div>
        <h4 className="font-bold text-xs text-slate-900 leading-snug">{task.prompt}</h4>
        {task.description && <p className="text-[11px] text-slate-500 mt-1">{task.description}</p>}
      </div>

      {/* Hint Banner */}
      {showHint && task.hint && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 animate-in fade-in">
          <span className="font-bold block text-[10px] uppercase text-amber-800">Hint</span>
          <p className="text-[11px] text-amber-950 mt-0.5">{task.hint}</p>
        </div>
      )}

      {/* Task Controls by Type */}
      {task.type === 'multiple_choice' && task.options && (
        <div className="space-y-2">
          {task.options.map(opt => {
            const isSelected = selectedOption === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSubmitChoice(opt.id)}
                disabled={!!existingResponse}
                className={`w-full p-3 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                  isSelected
                    ? feedbackResult?.isCorrect === false
                      ? 'bg-rose-50 border-rose-400 text-rose-950'
                      : 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>{opt.text}</span>
                {isSelected && (
                  feedbackResult?.isCorrect === false ? (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  )
                )}
              </button>
            );
          })}
        </div>
      )}

      {(task.type === 'open_text' || task.type === 'short_reflection') && (
        <div className="space-y-2">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={!!existingResponse}
            rows={3}
            placeholder="Type your reflection or answer here..."
            className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          />
          {!existingResponse && (
            <button
              onClick={handleSubmitTextOrCode}
              disabled={!textInput.trim()}
              className="px-4 py-2 bg-[#1B4332] text-white font-bold text-xs rounded-xl hover:bg-[#2D6A4F] flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> Submit Response
            </button>
          )}
        </div>
      )}

      {task.type === 'enter_code' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={!!existingResponse}
              placeholder="Enter 4-digit code..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
            {!existingResponse && (
              <button
                onClick={handleSubmitTextOrCode}
                className="px-4 py-2 bg-[#1B4332] text-white font-bold text-xs rounded-xl hover:bg-[#2D6A4F] flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" /> Unlock
              </button>
            )}
          </div>
        </div>
      )}

      {task.type === 'photo_upload' && (
        <div className="space-y-3">
          <MediaUploader
            label="Upload Field Photograph Evidence"
            acceptType="image"
            valueUrl={evidenceUrl}
            onChange={handleEvidenceUpload}
            helperText="Submit a clear photo matching the station prompt to log your points."
          />
        </div>
      )}

      {/* Feedback Alert Result */}
      {feedbackResult && (
        <div className={`p-3 rounded-xl border text-xs ${
          feedbackResult.isCorrect === false
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="font-bold flex items-center gap-1.5 mb-0.5">
            {feedbackResult.isCorrect === false ? (
              <XCircle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            )}
            <span>{feedbackResult.isCorrect ? 'Task Completed!' : 'Incorrect Attempt'}</span>
          </div>
          <p className="text-[11px] text-slate-700">{feedbackResult.feedback}</p>
        </div>
      )}

    </div>
  );
};
