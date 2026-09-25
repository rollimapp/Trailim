import React, { useMemo, useState } from 'react';
import { ArrowRight, Bot, Check, ChevronLeft, Loader2, PencilLine, Sparkles } from 'lucide-react';
import type { ProjectTemplate, TeacherProjectWizardAnswers } from '../../types/projectTemplate';
import { generateProjectTemplateWithAI } from '../../services/firebase/projectTemplateAI';

interface TeacherProjectCreatorProps {
  onBack: () => void;
  onCreated: (template: ProjectTemplate) => void;
}

type Mode = 'choose' | 'ai' | 'manual' | 'preview';

const defaultAnswers: TeacherProjectWizardAnswers = {
  subject: '',
  gradeLevel: '',
  projectGoal: '',
  generalTopic: '',
  locationContext: '',
  teamSize: { min: 1, max: 3 },
  stationCount: { min: 2, max: 3 },
  sourceCount: { min: 2 },
  conceptCount: { min: 5 },
  requireFieldWork: true,
  requireFieldVerificationBeforeOfficialTour: false,
  requireTeacherApprovalBetweenStages: true,
  requireFinalReport: true,
  requirePublishing: true,
  notes: '',
};

export const TeacherProjectCreator: React.FC<TeacherProjectCreatorProps> = ({ onBack, onCreated }) => {
  const [mode, setMode] = useState<Mode>('choose');
  const [answers, setAnswers] = useState<TeacherProjectWizardAnswers>(defaultAnswers);
  const [draft, setDraft] = useState<ProjectTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const canGenerate = useMemo(
    () => answers.projectGoal.trim().length > 8 && (answers.subject?.trim().length || 0) > 1,
    [answers.projectGoal, answers.subject],
  );

  const update = <K extends keyof TeacherProjectWizardAnswers>(
    key: K,
    value: TeacherProjectWizardAnswers[K],
  ) => setAnswers((current) => ({ ...current, [key]: value }));

  const generate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setError('');
    try {
      const result = await generateProjectTemplateWithAI(answers);
      setDraft(result);
      setMode('preview');
    } catch (err) {
      console.error(err);
      setError('לא הצלחנו ליצור את הפרויקט כרגע. בדוק את חיבור Firebase AI ונסה שוב.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (mode === 'choose') {
    return (
      <div dir="rtl" className="min-h-full bg-[#F6F4EE] text-[#183128]">
        <header className="h-20 border-b border-[#DDD8CB] bg-[#FBFAF6] px-10 flex items-center justify-between">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[#516159]">
            <ArrowRight size={18} />
            חזרה
          </button>
          <div className="text-sm font-bold tracking-[0.18em] text-[#315D4A]">TRAILIM</div>
        </header>

        <main className="max-w-5xl mx-auto px-8 py-16">
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E8EFEA] px-3 py-1.5 text-xs font-bold text-[#315D4A] mb-5">
              <Sparkles size={14} />
              יצירת פרויקט חדש
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-4">איך תרצה להתחיל?</h1>
            <p className="text-lg text-[#617068] leading-8">
              שתי הדרכים יוצרות אותו מבנה פרויקט. אפשר לערוך הכול לפני שמפרסמים לתלמידים.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => setMode('ai')}
              className="group text-right rounded-[28px] border border-[#CFC8B8] bg-white p-8 shadow-sm hover:-translate-y-1 hover:shadow-lg transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#1E5A45] text-white flex items-center justify-center mb-8">
                <Bot size={24} />
              </div>
              <h2 className="text-2xl font-black mb-3">בנו איתי בעזרת AI</h2>
              <p className="text-[#65726B] leading-7 mb-8">
                עונים על כמה שאלות קצרות, ו-Trailim בונה טיוטת פרויקט מסודרת לפי המבנה שלנו.
              </p>
              <span className="inline-flex items-center gap-2 font-bold text-[#1E5A45]">
                להתחיל
                <ChevronLeft size={18} />
              </span>
            </button>

            <button
              onClick={() => setMode('manual')}
              className="group text-right rounded-[28px] border border-[#CFC8B8] bg-[#FDFCF9] p-8 hover:-translate-y-1 hover:shadow-lg transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#E9E4D8] text-[#315D4A] flex items-center justify-center mb-8">
                <PencilLine size={24} />
              </div>
              <h2 className="text-2xl font-black mb-3">התחלה ידנית</h2>
              <p className="text-[#65726B] leading-7 mb-8">
                מתחילים מתבנית בסיסית ומגדירים לבד שלבים, דרישות ואישורים.
              </p>
              <span className="inline-flex items-center gap-2 font-bold text-[#315D4A]">
                לפתוח תבנית
                <ChevronLeft size={18} />
              </span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (mode === 'manual') {
    return (
      <div dir="rtl" className="min-h-full bg-[#F6F4EE] p-10 text-[#183128]">
        <button onClick={() => setMode('choose')} className="inline-flex items-center gap-2 font-semibold text-[#516159] mb-10">
          <ArrowRight size={18} />
          חזרה
        </button>
        <div className="max-w-3xl rounded-[28px] border border-[#D8D2C5] bg-white p-10">
          <h1 className="text-3xl font-black mb-3">בנייה ידנית</h1>
          <p className="text-[#66736B] leading-7">
            המסלול הידני ישתמש באותו ProjectTemplate. כרגע אנחנו מחברים קודם את מסלול ה-AI כדי לוודא שהארכיטקטורה וה-Firebase עובדים מקצה לקצה.
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'preview' && draft) {
    return (
      <div dir="rtl" className="min-h-full bg-[#F6F4EE] text-[#183128]">
        <header className="h-20 border-b border-[#DDD8CB] bg-[#FBFAF6] px-10 flex items-center justify-between">
          <button onClick={() => setMode('ai')} className="inline-flex items-center gap-2 text-sm font-semibold text-[#516159]">
            <ArrowRight size={18} />
            עריכת תשובות
          </button>
          <button
            onClick={() => onCreated(draft)}
            className="rounded-xl bg-[#1E5A45] text-white px-5 py-3 font-bold inline-flex items-center gap-2"
          >
            <Check size={18} />
            להשתמש בטיוטה
          </button>
        </header>
        <main className="max-w-5xl mx-auto px-8 py-10">
          <div className="mb-8">
            <div className="text-xs font-bold tracking-[0.14em] text-[#6B7A72] mb-2">טיוטה שנוצרה על ידי AI</div>
            <h1 className="text-4xl font-black mb-3">{draft.title}</h1>
            <p className="text-[#65726B] text-lg">{draft.description}</p>
          </div>

          <div className="grid gap-4">
            {draft.stages
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((stage, index) => (
                <div key={stage.id} className="rounded-2xl border border-[#D8D2C5] bg-white px-6 py-5 flex gap-5">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-[#E6EEE9] text-[#1E5A45] flex items-center justify-center font-black">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{stage.title}</h3>
                    <p className="text-[#66736B] mt-1">{stage.description}</p>
                    <div className="text-xs text-[#738079] mt-3">
                      {stage.approval.required ? 'כולל אישור מורה' : 'ללא שער אישור'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-full bg-[#F6F4EE] text-[#183128]">
      <header className="h-20 border-b border-[#DDD8CB] bg-[#FBFAF6] px-10 flex items-center justify-between">
        <button onClick={() => setMode('choose')} className="inline-flex items-center gap-2 text-sm font-semibold text-[#516159]">
          <ArrowRight size={18} />
          חזרה
        </button>
        <div className="text-sm font-bold text-[#315D4A]">AI PROJECT BUILDER</div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">ספר לי מה אתה רוצה שהתלמידים יעשו</h1>
          <p className="text-[#68756E]">לא צריך לנסח פרומפט. רק להגדיר את המסגרת הפדגוגית.</p>
        </div>

        <div className="rounded-[28px] border border-[#D8D2C5] bg-white p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <label className="space-y-2">
              <span className="text-sm font-bold">מקצוע</span>
              <input
                value={answers.subject || ''}
                onChange={(e) => update('subject', e.target.value)}
                placeholder="למשל: סוציולוגיה"
                className="w-full rounded-xl border border-[#D8D2C5] px-4 py-3 outline-none focus:border-[#3C725B]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">שכבה</span>
              <input
                value={answers.gradeLevel || ''}
                onChange={(e) => update('gradeLevel', e.target.value)}
                placeholder='למשל: י"ב'
                className="w-full rounded-xl border border-[#D8D2C5] px-4 py-3 outline-none focus:border-[#3C725B]"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold">מה מטרת הפרויקט?</span>
            <textarea
              value={answers.projectGoal}
              onChange={(e) => update('projectGoal', e.target.value)}
              placeholder="למשל: התלמידים יחקרו תופעה חברתית במקום אמיתי, יבנו תחנות ויובילו סיור לימודי."
              rows={4}
              className="w-full resize-none rounded-xl border border-[#D8D2C5] px-4 py-3 outline-none focus:border-[#3C725B]"
            />
          </label>

          <div className="grid grid-cols-2 gap-5">
            <label className="space-y-2">
              <span className="text-sm font-bold">נושא כללי</span>
              <input
                value={answers.generalTopic || ''}
                onChange={(e) => update('generalTopic', e.target.value)}
                placeholder="אופציונלי"
                className="w-full rounded-xl border border-[#D8D2C5] px-4 py-3 outline-none focus:border-[#3C725B]"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold">הקשר למקום</span>
              <input
                value={answers.locationContext || ''}
                onChange={(e) => update('locationContext', e.target.value)}
                placeholder="למשל: שכונה / עיר / אתר"
                className="w-full rounded-xl border border-[#D8D2C5] px-4 py-3 outline-none focus:border-[#3C725B]"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Toggle
              label="סיור או עבודת שטח"
              checked={answers.requireFieldWork}
              onChange={(value) => update('requireFieldWork', value)}
            />
            <Toggle
              label="בדיקת שטח מקדימה לפני הסיור הרשמי"
              checked={answers.requireFieldVerificationBeforeOfficialTour}
              onChange={(value) => update('requireFieldVerificationBeforeOfficialTour', value)}
            />
            <Toggle
              label="אישורי מורה בין שלבים"
              checked={answers.requireTeacherApprovalBetweenStages}
              onChange={(value) => update('requireTeacherApprovalBetweenStages', value)}
            />
            <Toggle
              label="דוח סופי"
              checked={answers.requireFinalReport}
              onChange={(value) => update('requireFinalReport', value)}
            />
          </div>

          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          <div className="pt-3 flex items-center justify-between">
            <p className="text-xs text-[#7A857F]">Trailim ייצור טיוטה בלבד. המורה מאשר ועורך לפני פרסום.</p>
            <button
              onClick={generate}
              disabled={!canGenerate || isGenerating}
              className="rounded-xl bg-[#1E5A45] disabled:bg-[#9BA9A2] text-white px-6 py-3 font-bold inline-flex items-center gap-2"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {isGenerating ? 'יוצר טיוטה...' : 'צור טיוטת פרויקט'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between gap-4 rounded-xl border border-[#DDD7CA] bg-[#FBFAF6] px-4 py-3 cursor-pointer">
    <span className="text-sm font-semibold leading-5">{label}</span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-[#1E5A45]"
    />
  </label>
);
