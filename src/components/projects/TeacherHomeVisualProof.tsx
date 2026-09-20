import React from 'react';
import {
  Home,
  FolderKanban,
  ClipboardCheck,
  Users,
  PlusCircle,
  Compass,
  Bell,
  Search,
  BookOpen,
  ArrowLeft,
  ArrowUpLeft,
  MapPin,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';

const projects = [
  {
    title: 'מים במדבר — אתגרים ופתרונות',
    meta: 'כיתה י״ב • 3 קבוצות • 5 תחנות',
    progress: 45,
    status: 'פעיל',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'סיפורים נסתרים ברחוב המוסלמי',
    meta: 'כיתה י״ב • 4 קבוצות • 5 תחנות',
    progress: 70,
    status: 'פעיל',
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'חופי תל אביב — טבע, עיר ואנשים',
    meta: 'כיתה י״א • 4 קבוצות • 6 תחנות',
    progress: 20,
    status: 'בתכנון',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  },
];

const nav = [
  [Home, 'דף הבית', true],
  [FolderKanban, 'הפרויקטים שלי', false],
  [ClipboardCheck, 'בדיקות', false, '2'],
  [Users, 'תלמידים', false],
  [PlusCircle, 'יצירת פרויקט', false],
  [Compass, 'גילוי מסלולים', false],
  [Users, 'קהילה', false],
] as const;

export const TeacherHomeVisualProof: React.FC = () => {
  return (
    <div dir="rtl" className="min-h-screen bg-[#f6f4ef] text-[#183047] font-sans overflow-auto">
      <div className="min-h-screen grid grid-cols-[240px_minmax(0,1fr)]">
        <aside className="relative bg-[#163f35] text-white px-4 py-5 overflow-hidden">
          <div className="flex items-center gap-3 px-2 pb-7 border-b border-white/10">
            <div className="h-11 w-11 rounded-full border border-white/60 grid place-items-center text-2xl">◉</div>
            <div>
              <div className="font-serif font-bold text-[25px] tracking-wide">TRAILIM</div>
              <div className="text-[11px] text-white/70">למידה מבוססת מקום</div>
            </div>
          </div>

          <nav className="mt-5 space-y-1.5">
            {nav.map(([Icon, label, active, badge]) => (
              <button
                key={label}
                className={`w-full h-12 flex items-center gap-3 rounded-[14px] px-4 text-right transition ${active ? 'bg-[#3d725f] shadow-inner' : 'hover:bg-white/7'}`}
              >
                <Icon size={19} strokeWidth={1.9} />
                <span className="font-semibold text-[15px]">{label}</span>
                {badge && <span className="mr-auto bg-[#ef4b32] h-6 min-w-6 px-1.5 rounded-full grid place-items-center text-xs font-bold">{badge}</span>}
              </button>
            ))}
          </nav>

          <div className="absolute inset-x-0 bottom-0 h-[310px] pointer-events-none">
            <img
              className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-luminosity"
              src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=700&q=80"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#173d35] via-[#173d35]/35 to-transparent" />
            <div className="absolute bottom-8 right-5 left-5 rotate-[-3deg] text-[22px] leading-9 font-serif italic text-[#f1e8d3]">
              ״מגלים מקום,<br />שואלים שאלות,<br />לומדים אחרת״
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="h-[82px] bg-[#fbfaf7] border-b border-[#e7e2d8] px-7 flex items-center gap-5">
            <div className="flex items-center gap-3 min-w-[205px]">
              <div className="h-11 w-11 rounded-full overflow-hidden bg-[#d9ddd7]">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80" className="w-full h-full object-cover" alt="" />
              </div>
              <div>
                <div className="font-bold text-[15px]">אלנה ונס</div>
                <div className="text-xs text-[#7a8792]">מורה</div>
              </div>
            </div>

            <button className="relative h-10 w-10 rounded-full grid place-items-center hover:bg-black/5">
              <Bell size={20} />
              <span className="absolute -top-0.5 -left-0.5 w-5 h-5 bg-[#ef4b32] text-white text-[10px] rounded-full grid place-items-center font-bold">2</span>
            </button>

            <div className="relative flex-1 max-w-[610px] mr-2">
              <Search size={19} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7d8ca0]" />
              <input className="w-full h-12 rounded-[16px] border border-[#ddd9d0] bg-white pr-12 pl-4 outline-none shadow-sm text-sm" placeholder="חפש פרויקטים, מסלולים, תלמידים..." />
            </div>

            <button className="mr-auto px-4 h-11 rounded-[14px] border border-[#dfe7e2] bg-[#f4f8f5] text-sm">
              חזרה לאפליקציה<br /><span className="font-bold">גלה מסלולים</span>
            </button>
          </header>

          <div className="p-6 space-y-4">
            <section className="relative h-[218px] rounded-[22px] overflow-hidden shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1800&q=85"
                className="absolute inset-0 w-full h-full object-cover"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/25 to-black/5" />
              <div className="absolute inset-y-0 right-0 w-[57%] p-9 text-white flex flex-col justify-center">
                <div className="text-[44px] font-black leading-none mb-4">בוקר טוב, אלנה ☀</div>
                <div className="text-[23px] leading-9 max-w-xl">כאן מתחילים להפוך מקומות<br />לחוויות משמעותיות של למידה</div>
              </div>
              <div className="absolute left-8 top-8 rotate-[-7deg] bg-[#f5ead8]/95 text-[#2c3f48] px-6 py-5 shadow-lg font-serif italic text-[23px] leading-8">
                מקומות אמיתיים.<br />אנשים אמיתיים.<br />למידה עמוקה יותר.
              </div>
            </section>

            <section className="grid grid-cols-3 gap-4">
              <div className="rounded-[18px] bg-[#e8f5ef] px-6 h-[116px] flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-[#d6eee4] grid place-items-center text-[#126b52]"><Users size={33} /></div>
                <div><div className="text-[31px] font-black leading-none">4</div><div className="font-semibold mt-1">קבוצות פעילות</div><button className="text-[#167157] text-sm font-bold mt-2">צפייה בקבוצות ←</button></div>
              </div>
              <div className="rounded-[18px] bg-[#fff0e9] px-6 h-[116px] flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-[#ffe0d7] grid place-items-center text-[#a23625]"><ClipboardCheck size={31} /></div>
                <div><div className="text-[31px] font-black leading-none text-[#7e2418]">2</div><div className="font-semibold mt-1">עבודות מחכות לבדיקה</div><button className="text-[#c53b27] text-sm font-bold mt-2">מעבר לבדיקה ←</button></div>
              </div>
              <div className="rounded-[18px] bg-[#eaf2fa] px-6 h-[116px] flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-[#dbeaf6] grid place-items-center text-[#245c8f]"><BookOpen size={31} /></div>
                <div><div className="text-[31px] font-black leading-none">3</div><div className="font-semibold mt-1">פרויקטים פעילים</div><button className="text-[#245f9e] text-sm font-bold mt-2">פתיחת פרויקט ←</button></div>
              </div>
            </section>

            <section className="bg-white rounded-[19px] border border-[#e8e3da] shadow-sm p-4">
              <div className="flex items-center justify-between px-1 mb-3">
                <div className="flex items-center gap-2"><BookOpen size={21} /><h2 className="text-[20px] font-black">הפרויקטים שלי</h2></div>
                <button className="text-[#346599] text-sm font-semibold flex items-center gap-1">צפייה בכל הפרויקטים <ArrowLeft size={15} /></button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {projects.map((p) => (
                  <article key={p.title} className="overflow-hidden rounded-[15px] border border-[#e4ded4] bg-[#fdfcf9] shadow-sm">
                    <div className="relative h-[112px]">
                      <img src={p.image} className="h-full w-full object-cover" alt="" />
                      <span className="absolute top-3 right-3 rounded-full bg-[#dcefe4] px-3 py-1 text-xs font-bold text-[#194c3b]">{p.status}</span>
                    </div>
                    <div className="p-3">
                      <div className="font-black text-[15px] leading-6">{p.title}</div>
                      <div className="text-[12px] text-[#7e8a96] mt-1">{p.meta}</div>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-xs font-bold w-8">{p.progress}%</span>
                        <div className="h-2 flex-1 rounded-full bg-[#d9e1e6] overflow-hidden">
                          <div className="h-full rounded-full bg-[#6fcba7]" style={{ width: `${p.progress}%` }} />
                        </div>
                        <button className="w-7 h-7 rounded-full bg-[#f1f3f4] grid place-items-center"><MoreHorizontal size={15} /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-[1.25fr_.9fr] gap-4 pb-5">
              <div className="bg-white rounded-[19px] border border-[#e8e3da] shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[19px] font-black flex items-center gap-2"><ClipboardCheck size={20} />הגשות אחרונות</h2>
                  <button className="text-[#346599] text-sm font-semibold">צפייה בכל ההגשות ←</button>
                </div>
                {[
                  ['תחנה 3 — השער העתיק', 'קבוצה 1 • לפני שעה', 'ממתין לבדיקה'],
                  ['מקורות מידע', 'קבוצה 2 • לפני 3 שעות', 'ממתין לבדיקה'],
                  ['סיכום תחנה 1', 'קבוצה 4 • אתמול', 'מאושר'],
                ].map((r, i) => (
                  <div key={r[0]} className={`flex items-center gap-3 py-2.5 ${i < 2 ? 'border-b border-[#eee9e1]' : ''}`}>
                    <div className="w-14 h-12 rounded-[9px] overflow-hidden bg-[#ece8df]"><img src={projects[i].image} className="w-full h-full object-cover" alt="" /></div>
                    <div className="flex-1"><div className="font-bold text-sm">{r[0]}</div><div className="text-xs text-[#87929b] mt-0.5">{r[1]}</div></div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${i === 2 ? 'bg-[#dff3e9] text-[#216447]' : 'bg-[#fff1cf] text-[#9b6310]'}`}>{r[2]}</span>
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden rounded-[19px] border border-[#eadfcb] bg-[#f7efdf] min-h-[235px] p-6">
                <div className="absolute left-0 bottom-0 w-1/2 h-2/3 opacity-25">
                  <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=700&q=80" className="w-full h-full object-cover" alt="" />
                </div>
                <Sparkles className="text-[#276c57]" />
                <div className="mt-5 max-w-[80%] font-serif text-[25px] leading-10 text-[#34463f]">״כל מקום יכול להפוך לכיתה כשמתחילים להסתכל אחרת.״</div>
                <div className="mt-4 text-sm text-[#6f7b75]">הפרויקט הבא שלך מתחיל במקום אמיתי.</div>
                <button className="mt-5 inline-flex items-center gap-2 rounded-[12px] bg-[#1f6d54] text-white px-4 py-2.5 text-sm font-bold">
                  יצירת פרויקט חדש <ArrowUpLeft size={16} />
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherHomeVisualProof;
