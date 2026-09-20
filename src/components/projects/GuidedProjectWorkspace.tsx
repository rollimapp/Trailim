import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  Circle,
  Clock3,
  FileText,
  MapPinned,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Pencil,
  Search,
  Send,
  Users,
} from 'lucide-react';

type StageStatus = 'done' | 'active' | 'locked';
type TeamStatus = 'working' | 'waiting' | 'revision' | 'approved';

interface ProjectStage {
  id: string;
  title: string;
  description: string;
  status: StageStatus;
  requirement: string;
}

interface ProjectTeam {
  id: string;
  name: string;
  members: string;
  topic: string;
  stage: string;
  status: TeamStatus;
  progress: number;
}

const stages: ProjectStage[] = [
  {
    id: 'topic',
    title: 'בחירת נושא',
    description: 'בחרו תופעה, מקום או סיפור באזור הפרויקט וחברו אותו לתוכן שנלמד.',
    status: 'done',
    requirement: 'נושא מאושר על ידי המורה',
  },
  {
    id: 'research',
    title: 'חקר מקדים',
    description: 'אספו מקורות אמינים ובנו את הבסיס התיאורטי לפני יצירת התחנות.',
    status: 'active',
    requirement: '2 מקורות לפחות + מושגים/תיאוריות רלוונטיים',
  },
  {
    id: 'stations',
    title: 'בניית תחנות',
    description: 'הפכו את החקר לתחנות שמחברות בין המקום, הידע והפעילות למשתתפים.',
    status: 'locked',
    requirement: '2–3 תחנות',
  },
  {
    id: 'field',
    title: 'בדיקת שטח',
    description: 'בדקו שהמיקום, התוכן והפעילות באמת עובדים במקום עצמו.',
    status: 'locked',
    requirement: 'תיעוד שטח ותיקונים',
  },
  {
    id: 'review',
    title: 'הגשה ומשוב',
    description: 'שלחו למורה, קבלו משוב ובצעו תיקונים לפני אישור.',
    status: 'locked',
    requirement: 'אישור מורה',
  },
  {
    id: 'tour',
    title: 'סיור ופרסום',
    description: 'התחנות המאושרות מתחברות למסלול כיתתי ומופעלות בסיור.',
    status: 'locked',
    requirement: 'סיור מודרך + מסלול מפורסם',
  },
];

const teams: ProjectTeam[] = [
  {
    id: 't1',
    name: 'קבוצה 1',
    members: 'נועה • איתי',
    topic: 'זהות וקהילה בנחלאות',
    stage: 'חקר מקדים',
    status: 'waiting',
    progress: 34,
  },
  {
    id: 't2',
    name: 'קבוצה 2',
    members: 'יעל • עומר • רועי',
    topic: 'ג׳נטריפיקציה ושינוי חברתי',
    stage: 'בניית תחנות',
    status: 'working',
    progress: 58,
  },
  {
    id: 't3',
    name: 'קבוצה 3',
    members: 'אורי',
    topic: 'שייכות ומרחב ציבורי',
    stage: 'הגשה ומשוב',
    status: 'revision',
    progress: 76,
  },
  {
    id: 't4',
    name: 'קבוצה 4',
    members: 'שירה • יהונתן',
    topic: 'קהילות מוצא ומסורת',
    stage: 'הגשה ומשוב',
    status: 'approved',
    progress: 100,
  },
];

const statusLabel: Record<TeamStatus, string> = {
  working: 'בעבודה',
  waiting: 'ממתין לאישור',
  revision: 'דורש תיקון',
  approved: 'אושר',
};

const statusClass: Record<TeamStatus, string> = {
  working: 'text-slate-700 bg-slate-100',
  waiting: 'text-amber-800 bg-amber-50',
  revision: 'text-rose-700 bg-rose-50',
  approved: 'text-emerald-800 bg-emerald-50',
};

interface GuidedProjectWorkspaceProps {
  onBack?: () => void;
}

export const GuidedProjectWorkspace: React.FC<GuidedProjectWorkspaceProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'teacher' | 'student'>('teacher');
  const [selectedTeamId, setSelectedTeamId] = useState('t1');
  const [selectedStageId, setSelectedStageId] = useState('research');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFutureStages, setShowFutureStages] = useState(false);
  const [showCompletedStage, setShowCompletedStage] = useState(false);

  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0];
  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? stages[1];

  const visibleTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((team) =>
      [team.name, team.members, team.topic, team.stage].some((value) => value.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  return (
    <div dir="rtl" className="h-full min-h-0 bg-[#F7F7F4] text-slate-900">
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onBack} className="h-9 w-9 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="חזרה">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[17px] truncate">נחלאות דרך מדעי החברה</h1>
              <span className="text-[11px] font-semibold text-slate-500 border border-slate-200 rounded-md px-2 py-0.5">
                טיוטה
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">פרויקט מבוסס־מקום • כיתה י״ב • 1–3 תלמידים בצוות</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => setMode('teacher')}
              className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'teacher' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              תצוגת מורה
            </button>
            <button
              onClick={() => setMode('student')}
              className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              תצוגת תלמיד
            </button>
          </div>
          <button className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">
            תצוגה מקדימה
          </button>
          <button className="h-9 px-4 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F]">
            שמירת הפרויקט
          </button>
        </div>
      </header>

      <div className="h-[calc(100%-4rem)] min-h-0 grid grid-cols-[270px_minmax(0,1fr)_320px]">
        <aside className="border-l border-slate-200 bg-white min-h-0 overflow-y-auto">
          <div className="px-4 py-4 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">מהלך הפרויקט</p>
            <p className="text-xs text-slate-600 mt-1">התלמידים מתקדמים לפי השלבים והדרישות שהוגדרו.</p>
          </div>

          <nav className="py-2">
            {stages.map((stage, index) => {
              const active = stage.id === selectedStageId;
              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`w-full px-4 py-3 flex items-start gap-3 text-right border-r-2 transition-colors ${active ? 'bg-emerald-50/60 border-[#1B4332]' : 'border-transparent hover:bg-slate-50'}`}
                >
                  <div className="pt-0.5 shrink-0">
                    {stage.status === 'done' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    ) : stage.status === 'active' ? (
                      <div className="w-4 h-4 rounded-full border-4 border-emerald-700 bg-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-semibold">{index + 1}</span>
                      <span className={`text-sm font-semibold ${active ? 'text-slate-950' : 'text-slate-700'}`}>{stage.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-5">{stage.requirement}</p>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="m-4 border-t border-slate-100 pt-4 space-y-2">
            <button className="w-full h-9 flex items-center justify-between px-2 text-xs font-semibold text-slate-600 hover:text-slate-950">
              <span className="flex items-center gap-2"><MapPinned className="w-4 h-4" /> אזור הפרויקט</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-full h-9 flex items-center justify-between px-2 text-xs font-semibold text-slate-600 hover:text-slate-950">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> דרישות ותוצר</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </aside>

        <main className="min-w-0 min-h-0 overflow-y-auto">
          {mode === 'teacher' ? (
            <div className="max-w-[1040px] mx-auto px-7 py-6">
              <div className="flex items-end justify-between gap-6 mb-6">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 mb-1">שלב נוכחי • {selectedStage.title}</p>
                  <h2 className="text-2xl font-bold tracking-tight">מעקב אחרי עבודת התלמידים</h2>
                  <p className="text-sm text-slate-500 mt-1 max-w-2xl">{selectedStage.description}</p>
                </div>
                <button className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> עריכת דרישות השלב
                </button>
              </div>

              <div className="border-y border-slate-200 bg-white">
                <div className="h-12 px-4 flex items-center gap-3 border-b border-slate-100">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="חיפוש קבוצה, תלמיד או נושא"
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
                  />
                  <span className="text-xs text-slate-400">{visibleTeams.length} קבוצות</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {visibleTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`w-full grid grid-cols-[160px_minmax(220px,1fr)_150px_120px_120px] items-center gap-4 px-4 py-4 text-right hover:bg-slate-50 transition-colors ${selectedTeamId === team.id ? 'bg-emerald-50/40' : ''}`}
                    >
                      <div>
                        <p className="text-sm font-bold">{team.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{team.members}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{team.topic}</p>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-slate-500 rounded-full" style={{ width: `${team.progress}%` }} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{team.stage}</p>
                      <span className={`justify-self-start text-[11px] font-bold rounded-md px-2 py-1 ${statusClass[team.status]}`}>
                        {statusLabel[team.status]}
                      </span>
                      <span className="text-xs text-slate-500">{team.progress}% הושלם</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-[940px] mx-auto px-8 py-8">
              <div className="mb-8 border-b border-[#dedbd3] pb-5">
                <p className="text-xs font-bold text-[#2b755d] mb-1">המסלול שלך בפרויקט</p>
                <div className="flex items-end justify-between gap-8">
                  <div>
                    <h2 className="text-[31px] font-black tracking-tight">מנושא לסיור — צעד אחר צעד</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                      בכל פעם פתוחה רק התחנה שצריך לעבוד עליה עכשיו. השלמתם? התחנה הבאה נפתחת.
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-[12px] font-bold text-slate-500">שלב 2 מתוך 6</div>
                    <div className="text-[13px] text-[#2b755d] mt-1">חקר מקדים</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute right-[31px] top-8 h-[210px] w-[2px] bg-[#cfe1d9]" />

                <div className="relative grid grid-cols-[76px_minmax(0,1fr)] gap-4 items-start mb-4">
                  <div className="relative z-10 flex justify-center pt-1">
                    <div className="w-[58px] h-[58px] rounded-full border-[6px] border-[#F7F7F4] bg-[#1f6d54] text-white shadow-sm grid place-items-center">
                      <Check className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="border-b border-[#dfe7e2]">
                    <button
                      onClick={() => setShowCompletedStage((value) => !value)}
                      className="w-full py-3 flex items-center justify-between gap-6 text-right"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-bold">
                          <span className="text-emerald-700">הושלם</span>
                          <span className="text-slate-400">תחנה 1</span>
                        </div>
                        <h3 className="text-[18px] font-black mt-1">בחירת נושא</h3>
                        <p className="text-sm text-slate-500 mt-1">זהות וקהילה בנחלאות</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden xl:inline-flex items-center gap-2 text-xs font-bold text-[#1f6d54]">
                          <CheckCircle2 className="w-4 h-4" />
                          אושר על ידי המורה
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showCompletedStage ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {showCompletedStage && (
                      <div className="pb-5 pt-1 grid grid-cols-[minmax(0,1fr)_170px] gap-6">
                        <div>
                          <p className="text-sm leading-6 text-slate-600">
                            בחרתם נושא שמחבר בין מקום, תופעה חברתית והתוכן שנלמד. אפשר לחזור ולעדכן אותו כל עוד הפרויקט לא ננעל להגשה סופית.
                          </p>
                          <div className="mt-3 text-xs text-slate-500">
                            נושא מאושר: <strong className="text-slate-700">זהות וקהילה בנחלאות</strong>
                          </div>
                        </div>

                        <button className="h-10 self-start border border-[#cbd9d3] bg-white text-[#1f6d54] text-xs font-black flex items-center justify-center gap-2 hover:bg-[#f4f8f6]">
                          <Pencil className="w-3.5 h-3.5" />
                          עריכת הנושא
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative grid grid-cols-[76px_minmax(0,1fr)] gap-4 items-start">
                  <div className="relative z-10 flex justify-center pt-2">
                    <div className="w-[58px] h-[58px] rounded-full border-[6px] border-[#F7F7F4] bg-[#f3c872] text-[#5d4812] ring-4 ring-[#f8e8b8] shadow-sm grid place-items-center font-black">
                      2
                    </div>
                  </div>

                  <section className="bg-[#fffdf8] border-y border-[#ddd4bd] shadow-[0_16px_34px_-30px_rgba(37,62,51,.55)]">
                    <div className="px-6 py-5 flex items-start justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-bold">
                          <span className="text-amber-700">עכשיו</span>
                          <span className="text-slate-400">תחנה 2</span>
                        </div>
                        <h3 className="text-[22px] font-black mt-1">חקר מקדים</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-6">
                          אספו מקורות אמינים ובנו את הבסיס התיאורטי לפני יצירת התחנות.
                        </p>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="text-[11px] text-slate-400">נשאר להשלים</div>
                        <div className="text-sm font-black text-[#8c6615] mt-1">מקור אחד + 2 מושגים</div>
                      </div>
                    </div>

                    <div className="border-t border-[#ece5d6] grid grid-cols-2">
                      <div className="p-6 border-l border-[#ece5d6]">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[#2b755d]" />
                              <h4 className="text-sm font-black">מקורות</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">לפחות שני מקורות אמינים.</p>
                          </div>
                          <strong className="text-xs text-[#1f6d54]">1 / 2</strong>
                        </div>

                        <div className="mt-5 border-y border-[#e7e2d9] py-3">
                          <p className="text-sm font-bold">שינויים חברתיים בשכונות מרכז העיר</p>
                          <p className="text-xs text-slate-400 mt-1">מקור 1 • נוסף היום</p>
                        </div>

                        <button className="mt-3 text-xs font-black text-[#1f6d54] flex items-center gap-1.5">
                          <Plus className="w-4 h-4" /> הוספת מקור
                        </button>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#2b755d]" />
                              <h4 className="text-sm font-black">מושגים ותיאוריות</h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">בחרו והסבירו חמישה מושגים.</p>
                          </div>
                          <strong className="text-xs text-[#9b6a11]">3 / 5</strong>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-3 text-sm">
                          {['זהות', 'קהילה', 'נורמות'].map((concept) => (
                            <span key={concept} className="border-b border-[#b7c8c1] pb-1 font-bold text-slate-700">
                              {concept}
                            </span>
                          ))}
                          <button className="text-xs font-black text-[#1f6d54]">+ הוספת מושג</button>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-[#ece5d6] flex items-center justify-between gap-5">
                      <p className="text-xs text-slate-500">
                        התחנה הבאה תיפתח רק לאחר השלמת הדרישות ושליחה למורה.
                      </p>
                      <button className="h-10 px-4 border border-[#d8d3c9] bg-[#efeee9] text-slate-400 text-xs font-black cursor-not-allowed">
                        השלימו את הדרישות כדי להמשיך
                      </button>
                    </div>
                  </section>
                </div>

                <div className="relative grid grid-cols-[76px_minmax(0,1fr)] gap-4 items-start mt-6">
                  <div className="relative z-10 flex justify-center pt-1">
                    <div className="w-[42px] h-[42px] rounded-full border-[5px] border-[#F7F7F4] bg-[#e6e9e7] text-[#9aa5a0] grid place-items-center font-black">
                      3
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => setShowFutureStages((value) => !value)}
                      className="w-full flex items-center justify-between gap-4 py-4 border-y border-[#dddcd6] text-right hover:bg-white/40 transition"
                    >
                      <div>
                        <div className="text-[11px] font-bold text-slate-400">נעול כרגע</div>
                        <h3 className="text-[17px] font-black mt-1">מה בהמשך?</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          עוד 4 תחנות ייפתחו בהדרגה אחרי השלמת החקר המקדים.
                        </p>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showFutureStages ? 'rotate-180' : ''}`} />
                    </button>

                    {showFutureStages && (
                      <div className="border-b border-[#dddcd6] py-2">
                        {stages.slice(2).map((stage, index) => (
                          <div key={stage.id} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 py-3 border-b border-[#ecebe6] last:border-0">
                            <div className="w-7 h-7 rounded-full bg-[#eceeec] text-[#98a09c] grid place-items-center text-xs font-black">
                              {index + 3}
                            </div>
                            <div>
                              <div className="flex items-center justify-between gap-4">
                                <h4 className="text-sm font-black text-slate-500">{stage.title}</h4>
                                <span className="text-[11px] font-bold text-slate-400">נעול</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{stage.requirement}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <aside className="border-r border-slate-200 bg-white min-h-0 overflow-y-auto">
          {mode === 'teacher' ? (
            <>
              <div className="px-5 py-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">קבוצה נבחרת</p>
                    <h3 className="text-base font-bold mt-1">{selectedTeam.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{selectedTeam.members}</p>
                  </div>
                  <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="px-5 py-5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-700 mb-2">נושא הקבוצה</p>
                <p className="text-sm leading-6">{selectedTeam.topic}</p>
              </div>

              <div className="px-5 py-5 border-b border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-700">מצב נוכחי</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">שלב</span>
                  <span className="font-semibold">{selectedTeam.stage}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">התקדמות</span>
                  <span className="font-semibold">{selectedTeam.progress}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">סטטוס</span>
                  <span className={`font-bold rounded-md px-2 py-1 ${statusClass[selectedTeam.status]}`}>{statusLabel[selectedTeam.status]}</span>
                </div>
              </div>

              <div className="px-5 py-5 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquareText className="w-4 h-4 text-slate-500" />
                  <p className="text-xs font-bold">משוב למורה</p>
                </div>
                <textarea
                  rows={5}
                  placeholder="כתבו הערה לקבוצה..."
                  className="w-full resize-none rounded-lg border border-slate-200 p-3 text-xs outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
                <button className="mt-2 w-full h-9 rounded-lg border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50">
                  <Send className="w-3.5 h-3.5" /> שליחת משוב
                </button>
              </div>

              <div className="px-5 py-5">
                <button className="w-full h-10 rounded-lg bg-[#1B4332] text-white text-xs font-bold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> אישור השלב
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-5 py-5 border-b border-slate-100">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">הקבוצה שלי</p>
                <h3 className="text-base font-bold mt-1">זהות וקהילה בנחלאות</h3>
                <p className="text-xs text-slate-500 mt-1">נועה • איתי</p>
              </div>
              <div className="px-5 py-5 border-b border-slate-100">
                <p className="text-xs font-bold mb-3">מה צריך להשלים עכשיו?</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>נושא אושר על ידי המורה</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <Clock3 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>להוסיף מקור נוסף</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <Clock3 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>להשלים 2 מושגים נוספים</span>
                  </div>
                </div>
              </div>
              <div className="px-5 py-5 border-b border-slate-100">
                <p className="text-xs font-bold mb-2">למה זה נשמר?</p>
                <p className="text-xs leading-5 text-slate-500">
                  החומרים שתכתבו במהלך הפרויקט ישמשו גם לבניית התחנות וגם לטיוטת הדוח הסופי — אין צורך לכתוב את העבודה מחדש.
                </p>
              </div>

              <div className="p-4">
                <div className="relative overflow-hidden min-h-[210px] bg-[#173f35] text-white shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=700&q=80"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f2f28]/95 via-[#173f35]/40 to-transparent" />
                  <div className="relative h-full min-h-[210px] p-5 flex flex-col justify-end">
                    <div className="text-[11px] font-bold text-[#bfe9d6]">TRAILIM</div>
                    <div className="mt-2 text-[22px] leading-7 font-black max-w-[230px]">
                      יוצאים מהכיתה.<br />מגלים את המקום.
                    </div>
                    <div className="mt-2 text-xs text-white/75">למידה שמתחילה בעולם האמיתי.</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};
