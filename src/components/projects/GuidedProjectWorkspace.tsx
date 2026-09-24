import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  Circle,
  Clock3,
  Eye,
  FileText,
  ImagePlus,
  MapPin,
  Lightbulb,
  MapPinned,
  Maximize2,
  MessageSquareText,
  MoreHorizontal,
  Navigation,
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
    description: 'בחרו נושא, מושג או תיאוריה מתוך תחום הדעת וחברו אותו למקום או לתופעה שתרצו לחקור.',
    status: 'done',
    requirement: 'נושא ייחודי + נימוק קצר + אישור מורה',
  },
  {
    id: 'research',
    title: 'חקר מקדים',
    description: 'אספו מקורות אמינים, סכמו אותם והסבירו את המושגים או התיאוריות שילוו אתכם בסיור.',
    status: 'active',
    requirement: '2 מקורות לפחות + 5 מושגים/תיאוריות + אישור מורה',
  },
  {
    id: 'plan',
    title: 'תכנון פעילות ותחנות',
    description: 'תכננו מה המשתתפים יעשו בסיור ואיך כל תחנה תחבר בין המקום, המושגים והפעילות.',
    status: 'locked',
    requirement: 'פעילות מאושרת + 2–3 תחנות',
  },
  {
    id: 'field',
    title: 'סיור בשטח',
    description: 'צאו לסיור, ודאו שהתחנות עובדות, הפעילו את המשימות ותעדו תצפיות וממצאים.',
    status: 'locked',
    requirement: 'ביצוע הפעילות + תיעוד ממצאים',
  },
  {
    id: 'report',
    title: 'ניתוח, רפלקציה ודוח',
    description: 'חברו בין חמשת המושגים למה שחוויתם בשטח, השלימו רפלקציה אישית וצרו טיוטת עבודה.',
    status: 'locked',
    requirement: 'ניתוח 5 מושגים + רפלקציה + טיוטת עבודה',
  },
  {
    id: 'present',
    title: 'הצגה ופרסום',
    description: 'הציגו את התוצר, ענו על שאלות וקבלו אישור סופי לפרסום המסלול.',
    status: 'locked',
    requirement: 'הצגה + אישור מורה + מסלול מוכן לפרסום',
  },
]

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
    stage: 'תכנון פעילות ותחנות',
    status: 'working',
    progress: 58,
  },
  {
    id: 't3',
    name: 'קבוצה 3',
    members: 'אורי',
    topic: 'שייכות ומרחב ציבורי',
    stage: 'ניתוח, רפלקציה ודוח',
    status: 'revision',
    progress: 76,
  },
  {
    id: 't4',
    name: 'קבוצה 4',
    members: 'שירה • יהונתן',
    topic: 'קהילות מוצא ומסורת',
    stage: 'ניתוח, רפלקציה ודוח',
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


interface DraftStation {
  id: number;
  title: string;
  place: string;
  lat?: number;
  lng?: number;
  notice: string;
  concept: string;
  explanation: string;
  task: string;
}


let googlePlacesLoader: Promise<void> | null = null;

const loadGooglePlaces = (apiKey: string) => {
  if (typeof window === 'undefined' || !apiKey) {
    return Promise.reject(new Error('missing-api-key'));
  }

  const googleWindow = window as typeof window & { google?: any };
  if (googleWindow.google?.maps?.places) return Promise.resolve();
  if (googlePlacesLoader) return googlePlacesLoader;

  googlePlacesLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-trailim-google-maps="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('google-maps-load-failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=he&region=IL`;
    script.async = true;
    script.defer = true;
    script.dataset.trailimGoogleMaps = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('google-maps-load-failed'));
    document.head.appendChild(script);
  });

  return googlePlacesLoader;
};

const PlanStageStudent: React.FC = () => {
  const [activity, setActivity] = useState(
    'בכל תחנה נבקש מהמשתתפים להתבונן בסימנים של קהילה ושייכות במרחב, לבחור דוגמה אחת ולחבר אותה למושג שלמדנו.'
  );
  const [stations, setStations] = useState<DraftStation[]>([
    {
      id: 1,
      title: 'החצר והשכנות',
      place: 'רחוב אגריפס 78, ירושלים',
      notice: 'שימו לב למרפסות, לחצרות המשותפות ולמרחק בין הבתים.',
      concept: 'קהילה',
      explanation: 'המרחב הצפוף יוצר הזדמנויות רבות למפגש יומיומי בין שכנים ומחזק קשרים מקומיים.',
      task: 'מצאו פרט אחד במרחב שמעודד מפגש בין אנשים והסבירו למה.',
    },
    {
      id: 2,
      title: 'מסורת במרחב',
      place: 'נחלאות, ירושלים',
      notice: 'חפשו סימנים למסורת, בתי כנסת, שלטים או מנהגים שנוכחים במרחב.',
      concept: 'זהות',
      explanation: 'הסמלים המקומיים עוזרים לקהילה לספר לעצמה מי היא ולשמר זיכרון משותף.',
      task: 'בחרו סימן אחד וזהו איזו זהות הוא מבטא.',
    },
  ]);
  const [activeStationId, setActiveStationId] = useState(1);
  const [activePlanningField, setActivePlanningField] = useState<'notice' | 'concept' | 'task' | 'explanation'>('notice');
  const [mapPreviewPlace, setMapPreviewPlace] = useState('רחוב אגריפס 78, ירושלים');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [placesReady, setPlacesReady] = useState(false);
  const [placesUnavailable, setPlacesUnavailable] = useState(false);
  const placeInputRef = useRef<HTMLInputElement | null>(null);

  const activeStation = stations.find((station) => station.id === activeStationId) ?? stations[0];

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

    if (!apiKey) {
      setPlacesUnavailable(true);
      return;
    }

    let autocomplete: any;
    let listener: any;
    let cancelled = false;

    loadGooglePlaces(apiKey)
      .then(() => {
        if (cancelled || !placeInputRef.current) return;

        const googleWindow = window as typeof window & { google?: any };
        const google = googleWindow.google;
        if (!google?.maps?.places) {
          setPlacesUnavailable(true);
          return;
        }

        autocomplete = new google.maps.places.Autocomplete(placeInputRef.current, {
          fields: ['formatted_address', 'geometry', 'name'],
          componentRestrictions: { country: 'il' },
        });

        listener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const lat = place.geometry?.location?.lat?.();
          const lng = place.geometry?.location?.lng?.();
          const label = place.formatted_address || place.name || placeInputRef.current?.value || '';

          if (typeof lat !== 'number' || typeof lng !== 'number') return;

          setStations((current) =>
            current.map((station) =>
              station.id === activeStationId
                ? { ...station, place: label, lat, lng }
                : station,
            ),
          );
          setMapPreviewPlace('');
          setLocationError(null);
        });

        setPlacesReady(true);
        setPlacesUnavailable(false);
      })
      .catch(() => {
        if (!cancelled) setPlacesUnavailable(true);
      });

    return () => {
      cancelled = true;
      if (listener?.remove) listener.remove();
      if (autocomplete) autocomplete = null;
    };
  }, [activeStationId]);

  const updateActiveStation = (field: keyof DraftStation, value: string) => {
    setStations((current) =>
      current.map((station) =>
        station.id === activeStation.id ? { ...station, [field]: value } : station,
      ),
    );
  };

  const addStation = () => {
    if (stations.length >= 3) return;
    const nextId = Math.max(...stations.map((station) => station.id)) + 1;
    setStations((current) => [
      ...current,
      {
        id: nextId,
        title: 'תחנה חדשה',
        place: '',
        lat: undefined,
        lng: undefined,
        notice: '',
        concept: '',
        explanation: '',
        task: '',
      },
    ]);
    setActiveStationId(nextId);
  };

  const completeStations = stations.filter(
    (station) =>
      station.title.trim() &&
      station.place.trim() &&
      station.notice.trim() &&
      station.concept.trim() &&
      station.explanation.trim() &&
      station.task.trim(),
  ).length;

  const mapQuery =
    activeStation.lat != null && activeStation.lng != null
      ? `${activeStation.lat},${activeStation.lng}`
      : mapPreviewPlace.trim();

  const mapEmbedUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`
    : '';

  const googleMapsUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : 'https://www.google.com/maps';

  const previewTypedLocation = () => {
    setLocationError(null);
    setMapPreviewPlace(activeStation.place.trim());
  };

  const useCurrentLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('הדפדפן הזה לא תומך בזיהוי מיקום.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setStations((current) =>
          current.map((station) =>
            station.id === activeStation.id
              ? { ...station, lat, lng, place: station.place || 'המיקום הנוכחי' }
              : station,
          ),
        );
        setMapPreviewPlace('');
      },
      () => {
        setLocationError('לא הצלחנו לקבל את המיקום. בדקו שאישרתם הרשאת מיקום לדפדפן.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="w-full max-w-[1380px] mx-auto px-8 xl:px-10 py-8">
      <div className="mb-7 border-b border-[#dedbd3] pb-5">
        <div className="flex items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold mb-1">
              <span className="text-[#2b755d]">שלב 3 מתוך 6</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-700">תצוגת אבטיפוס</span>
            </div>
            <h2 className="text-[31px] font-black tracking-tight">תכנון פעילות ותחנות</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-6">
              עכשיו הופכים את החקר למסלול שמישהו אחר יוכל ללמוד ממנו. מגדירים פעילות אחת ובונים את התחנות שבהן היא תתרחש.
            </p>
          </div>
          <div className="text-left shrink-0">
            <div className="text-[11px] text-slate-400">דרישת המורה</div>
            <div className="text-sm font-black text-[#1f6d54] mt-1">פעילות + 2–3 תחנות</div>
          </div>
        </div>
      </div>

      <section className="bg-white border-y border-[#dfe4df]">
        <div className="px-6 py-5 border-b border-[#e7ebe7] grid grid-cols-[minmax(0,1fr)_240px] gap-7">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#2b755d]" />
              <h3 className="text-base font-black">הפעילות שתעבירו בסיור</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-5">
              כתבו בקצרה מה המשתתפים יעשו לאורך הסיור. זו הפעילות הקבוצתית שתוגש לאישור המורה.
            </p>
            <textarea
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
              rows={4}
              className="w-full resize-none border border-[#dfe4df] bg-[#fffefb] p-4 text-sm leading-7 outline-none focus:border-[#7ba690]"
            />
          </div>
          <aside className="border-r border-[#e7ebe7] pr-6">
            <p className="text-[11px] font-bold text-slate-400 mb-3">החקר שכבר עשיתם</p>
            <div className="space-y-2.5 text-xs">
              {['זהות', 'קהילה', 'נורמות', 'שייכות', 'מרחב ציבורי'].map((concept) => (
                <div key={concept} className="flex items-center justify-between border-b border-[#ecefe9] pb-2">
                  <span className="font-bold text-slate-700">{concept}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1f6d54]" />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-4 leading-5">
              אותם מושגים ימשיכו איתכם לתחנות ולניתוח הסופי — לא כותבים אותם מחדש.
            </p>
          </aside>
        </div>

        <div className="grid grid-cols-[220px_minmax(0,1fr)] min-h-[520px]">
          <aside className="bg-[#f8f7f2] border-l border-[#e6e3da] p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] font-bold text-slate-400">התחנות שלכם</div>
                <div className="text-sm font-black mt-1">{stations.length} מתוך 3</div>
              </div>
              <button
                onClick={addStation}
                disabled={stations.length >= 3}
                className="h-8 px-2.5 bg-[#1B4332] text-white text-[11px] font-black flex items-center gap-1.5 disabled:opacity-35"
              >
                <Plus className="w-3.5 h-3.5" /> תחנה
              </button>
            </div>

            <div className="space-y-2">
              {stations.map((station, index) => {
                const complete =
                  station.title.trim() &&
                  station.place.trim() &&
                  station.notice.trim() &&
                  station.concept.trim() &&
                  station.explanation.trim() &&
                  station.task.trim();
                const active = station.id === activeStation.id;
                return (
                  <button
                    key={station.id}
                    onClick={() => setActiveStationId(station.id)}
                    className={`w-full text-right p-3 border-r-2 transition-colors ${active ? 'bg-white border-[#1B4332]' : 'border-transparent hover:bg-white/60'}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 w-6 h-6 rounded-full grid place-items-center text-[11px] font-black shrink-0 ${complete ? 'bg-[#dcebe4] text-[#1f6d54]' : 'bg-[#ebece8] text-slate-500'}`}>
                        {complete ? <Check className="w-3.5 h-3.5" /> : index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate">{station.title || `תחנה ${index + 1}`}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-1">{station.place || 'עדיין לא נקבע מיקום'}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-[#e2e0d8]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">תחנות מוכנות</span>
                <strong>{completeStations} / {stations.length}</strong>
              </div>
              <div className="h-1.5 bg-[#e4e5e1] mt-2 overflow-hidden">
                <div
                  className="h-full bg-[#2b755d]"
                  style={{ width: `${stations.length ? (completeStations / stations.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </aside>

          <div className="p-6 xl:p-8">
            <div className="flex items-start justify-between gap-6 mb-5">
              <div>
                <div className="text-[11px] font-bold text-[#2b755d]">תחנה {stations.findIndex((station) => station.id === activeStation.id) + 1}</div>
                <input
                  value={activeStation.title}
                  onChange={(event) => updateActiveStation('title', event.target.value)}
                  className="mt-1 text-xl font-black bg-transparent border-0 outline-none w-full"
                  placeholder="שם התחנה"
                />
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>עורכים תחנה אחת בכל פעם</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>נשמר אוטומטית</span>
              </div>
            </div>

            <div className="border-y border-[#e6e9e4] py-5 mb-5">
              <div className="flex items-center justify-between gap-5 mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2b755d]" />
                  <h4 className="text-sm font-black">איפה התחנה נמצאת?</h4>
                </div>
                <span className="text-[11px] text-slate-400">המיקום יישמר כנקודה על המפה</span>
              </div>

              <div className="relative">
                <input
                  ref={placeInputRef}
                  value={activeStation.place}
                  onChange={(event) => updateActiveStation('place', event.target.value)}
                  className="w-full h-11 border border-[#dfe4df] px-3 pl-28 text-sm outline-none focus:border-[#7ba690]"
                  placeholder="התחילו להקליד מקום או כתובת, למשל נחלאות"
                  autoComplete="off"
                />
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 rounded-full ${placesReady ? 'bg-[#e7f3eb] text-[#1f6d54]' : 'bg-slate-100 text-slate-400'}`}>
                  {placesReady ? 'הצעות Google פעילות' : 'חיפוש מקום'}
                </span>
              </div>

              {placesUnavailable && (
                <p className="mt-2 text-[11px] text-amber-700">
                  הצעות בזמן ההקלדה יופעלו אחרי חיבור Google Places API. בינתיים אפשר להקליד כתובת ולהציג אותה במפה.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={previewTypedLocation}
                  className="h-10 border border-[#cad8d1] text-[#1f6d54] text-xs font-black flex items-center justify-center gap-2 hover:bg-[#f5f8f6]"
                >
                  <MapPinned className="w-4 h-4" /> הציגו את הכתובת במפה
                </button>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="h-10 border border-[#cad8d1] text-[#1f6d54] text-xs font-black flex items-center justify-center gap-2 hover:bg-[#f5f8f6]"
                >
                  <Navigation className="w-4 h-4" /> השתמשו במיקום הנוכחי
                </button>
              </div>

              {locationError && (
                <div className="mt-2 text-[11px] text-rose-600 font-semibold">{locationError}</div>
              )}

              <div className="mt-3 h-52 border border-[#d7e2da] relative overflow-hidden bg-[#eef3ef]">
                {mapEmbedUrl ? (
                  <>
                    <iframe
                      title="מפת התחנה"
                      src={mapEmbedUrl}
                      className="absolute inset-0 w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 border border-white shadow-sm px-3 py-2 text-[10px] font-black text-[#1f6d54] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> מפה אמיתית
                    </div>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-3 left-3 bg-white/95 border border-[#dce4df] shadow-sm px-3 py-2 text-[10px] font-black text-[#1f6d54] hover:bg-white"
                    >
                      פתיחה ב־Google Maps
                    </a>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-x-0 bottom-0 h-[58%] opacity-80">
                      <div className="absolute -right-10 bottom-[-34px] w-[330px] h-[120px] rounded-[50%] bg-[#cfe3d3]" />
                      <div className="absolute right-[180px] bottom-[-42px] w-[360px] h-[135px] rounded-[50%] bg-[#dce9da]" />
                      <div className="absolute left-[-40px] bottom-[-38px] w-[390px] h-[130px] rounded-[50%] bg-[#d4e3dc]" />
                    </div>
                    <div className="absolute right-[16%] top-[45%] w-[54%] border-t-[3px] border-dashed border-[#2b755d] rotate-[-6deg] opacity-85" />
                    <div className="absolute right-[14%] top-[40%] w-7 h-7 rounded-full bg-[#1B4332] text-white grid place-items-center shadow-md">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="absolute left-[7%] bottom-4 flex items-end gap-2 text-[#326c56] opacity-80">
                      <Users className="w-8 h-8" />
                      <Navigation className="w-5 h-5 -rotate-12 mb-1" />
                    </div>
                    <div className="absolute top-3 right-3 text-[10px] font-black tracking-wide text-[#2b755d] bg-white/75 px-2 py-1 rounded-full backdrop-blur-sm">
                      TRAILIM MAP
                    </div>
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="flex items-center gap-2 bg-white/92 px-4 py-2.5 shadow-sm border border-white text-xs font-bold text-slate-700">
                        <MapPin className="w-4 h-4 text-[#1f6d54]" /> הזינו כתובת או השתמשו במיקום הנוכחי
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#e4f0e8] text-[#1B4332] grid place-items-center">
                      <MapPinned className="w-4 h-4" />
                    </span>
                    <h4 className="text-[16px] font-black text-[#173f35]">תכנון התחנה במסלול</h4>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-1.5">עברו בין ארבעת הצעדים ובנו תחנה ברורה, משמעותית ומדויקת.</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="text-slate-400">התקדמות בתחנה</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#e8f3ec] text-[#1f6d54]">
                    {(['notice','concept','task','explanation'] as const).indexOf(activePlanningField) + 1} / 4
                  </span>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-4 gap-4">
                  {([
                    {
                      id: 'notice' as const,
                      number: 1,
                      title: 'מה רואים במרחב?',
                      subtitle: 'התבוננות במקום',
                      preview: activeStation.notice || 'תארו בקצרה מה המשתתפים צריכים לראות במקום.',
                      bg: 'from-[#f3fbf6] to-[#e9f5ee]',
                      border: 'border-[#cfe5d7]',
                      badge: 'bg-[#2f7b61]',
                      iconBg: 'bg-[#dff0e6]',
                      iconColor: 'text-[#1f6d54]',
                      icon: <Eye className="w-5 h-5" />,
                    },
                    {
                      id: 'concept' as const,
                      number: 2,
                      title: 'לאיזה מושג זה מתחבר?',
                      subtitle: 'חיבור לחקר',
                      preview: activeStation.concept ? `המושג שנבחר: ${activeStation.concept}` : 'בחרו מושג או תיאוריה מתוך החקר.',
                      bg: 'from-[#fcf8f0] to-[#f4ecde]',
                      border: 'border-[#eadcc4]',
                      badge: 'bg-[#b39a73]',
                      iconBg: 'bg-[#f1e5d0]',
                      iconColor: 'text-[#8f744d]',
                      icon: <Search className="w-5 h-5" />,
                    },
                    {
                      id: 'task' as const,
                      number: 3,
                      title: 'מה המשתתפים עושים כאן?',
                      subtitle: 'פעילות והתנסות',
                      preview: activeStation.task || 'הגדירו משימה, שאלה, תצפית או דיון קצר.',
                      bg: 'from-[#f2f7fc] to-[#e8f0f8]',
                      border: 'border-[#d5e2ef]',
                      badge: 'bg-[#6f8fac]',
                      iconBg: 'bg-[#dfeaf5]',
                      iconColor: 'text-[#587895]',
                      icon: <Users className="w-5 h-5" />,
                    },
                    {
                      id: 'explanation' as const,
                      number: 4,
                      title: 'ההסבר שלכם',
                      subtitle: 'המשמעות של התחנה',
                      preview: activeStation.explanation || 'הסבירו איך המקום מתחבר למושג שבחרתם.',
                      bg: 'from-[#f2faf6] to-[#e8f4ee]',
                      border: 'border-[#d2e6da]',
                      badge: 'bg-[#4f8d72]',
                      iconBg: 'bg-[#dcefe5]',
                      iconColor: 'text-[#3f775f]',
                      icon: <FileText className="w-5 h-5" />,
                    },
                  ]).map((card, index) => {
                    const active = activePlanningField === card.id;
                    return (
                      <div key={card.id} className="relative">
                        {index < 3 && (
                          <div className="absolute -left-[13px] top-1/2 -translate-y-1/2 z-20 hidden xl:flex w-6 h-6 rounded-full bg-white border border-[#d9e2dc] items-center justify-center shadow-sm">
                            <ArrowLeft className="w-3.5 h-3.5 text-[#6f8b7c]" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setActivePlanningField(card.id)}
                          className={`group relative w-full min-h-[218px] overflow-hidden text-right p-5 border bg-gradient-to-b transition-all duration-200 ${card.bg} ${active ? 'border-2 border-[#1B4332] shadow-[0_16px_34px_-22px_rgba(27,67,50,.7)] -translate-y-1' : card.border + ' hover:-translate-y-0.5 hover:shadow-md'}`}
                        >
                          {active && (
                            <span className="absolute top-0 right-0 bg-[#1B4332] text-white text-[9px] font-black px-3 py-1.5">
                              עכשיו
                            </span>
                          )}

                          <div className="flex items-start justify-between gap-3">
                            <span className={`w-12 h-12 rounded-full ${card.iconBg} ${card.iconColor} grid place-items-center border border-white/70 shadow-sm`}>
                              {card.icon}
                            </span>
                            <span className={`w-8 h-8 rounded-full ${active ? 'bg-[#1B4332]' : card.badge} text-white grid place-items-center text-xs font-black shadow-sm`}>
                              {card.number}
                            </span>
                          </div>

                          <div className="mt-4">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{card.subtitle}</div>
                            <h5 className="text-[15px] font-black mt-1.5 leading-6 text-slate-800">{card.title}</h5>
                            <p className="text-[12px] text-slate-500 mt-2.5 leading-5 line-clamp-3">{card.preview}</p>
                          </div>

                          <div className={`absolute bottom-0 right-0 left-0 h-1 ${active ? 'bg-[#1B4332]' : 'bg-transparent group-hover:bg-black/5'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 relative overflow-hidden border border-[#d9e3dc] bg-gradient-to-b from-[#fcfdfb] to-[#f7faf8] shadow-[0_12px_30px_-24px_rgba(27,67,50,.5)]">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-[#1B4332]" />
                <div className="p-5 pr-6">
                  {activePlanningField === 'notice' && (
                    <div>
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-[#dff0e6] text-[#1f6d54] grid place-items-center">
                            <Eye className="w-5 h-5" />
                          </span>
                          <div>
                            <div className="text-[11px] font-bold text-[#2b755d]">צעד 1 • התבוננות במקום</div>
                            <h5 className="text-[17px] font-black mt-0.5">מה המשתתפים צריכים לראות או להבין?</h5>
                          </div>
                        </div>
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                      </div>
                      <textarea
                        value={activeStation.notice}
                        onChange={(event) => updateActiveStation('notice', event.target.value)}
                        rows={4}
                        className="w-full resize-none border border-[#cbdcd3] bg-white p-4 text-sm leading-7 outline-none focus:border-[#2b755d] focus:ring-2 focus:ring-[#dcebe4]"
                        placeholder="למשל: שימו לב לאופן שבו המרחב מעודד מפגש..."
                      />
                      <p className="mt-2 text-[11px] text-slate-400">נסחו משהו שאפשר באמת לראות, לשמוע או לזהות במקום.</p>
                    </div>
                  )}

                  {activePlanningField === 'concept' && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-9 h-9 rounded-full bg-[#f1e5d0] text-[#8f744d] grid place-items-center">
                          <Search className="w-5 h-5" />
                        </span>
                        <div>
                          <div className="text-[11px] font-bold text-[#9c7c4f]">צעד 2 • חיבור לחקר</div>
                          <h5 className="text-[17px] font-black mt-0.5">לאיזה מושג או תיאוריה זה מתחבר?</h5>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">לא מקלידים מחדש — בוחרים מתוך המושגים שכבר שמרתם בחקר.</p>
                      <div className="flex flex-wrap gap-2">
                        {['זהות', 'קהילה', 'נורמות', 'שייכות', 'מרחב ציבורי'].map((concept) => {
                          const selected = activeStation.concept === concept;
                          return (
                            <button
                              key={concept}
                              type="button"
                              onClick={() => updateActiveStation('concept', concept)}
                              className={`px-4 py-2.5 text-xs font-black border transition-all ${selected ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-sm' : 'bg-white text-slate-600 border-[#e2d5bf] hover:border-[#bda987] hover:-translate-y-0.5'}`}
                            >
                              {concept}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activePlanningField === 'task' && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-9 h-9 rounded-full bg-[#dfeaf5] text-[#587895] grid place-items-center">
                          <Users className="w-5 h-5" />
                        </span>
                        <div>
                          <div className="text-[11px] font-bold text-[#607f9d]">צעד 3 • פעילות והתנסות</div>
                          <h5 className="text-[17px] font-black mt-0.5">מה המשתתפים עושים כאן?</h5>
                        </div>
                      </div>
                      <textarea
                        value={activeStation.task}
                        onChange={(event) => updateActiveStation('task', event.target.value)}
                        rows={4}
                        className="w-full resize-none border border-[#d2dfeb] bg-white p-4 text-sm leading-7 outline-none focus:border-[#7b9bb5] focus:ring-2 focus:ring-[#e3edf6]"
                        placeholder="שאלה, משימת תצפית, צילום, בחירה או דיון קצר..."
                      />
                    </div>
                  )}

                  {activePlanningField === 'explanation' && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-9 h-9 rounded-full bg-[#dcefe5] text-[#3f775f] grid place-items-center">
                          <FileText className="w-5 h-5" />
                        </span>
                        <div>
                          <div className="text-[11px] font-bold text-[#4f8d72]">צעד 4 • המשמעות של התחנה</div>
                          <h5 className="text-[17px] font-black mt-0.5">ההסבר שלכם</h5>
                        </div>
                      </div>
                      <textarea
                        value={activeStation.explanation}
                        onChange={(event) => updateActiveStation('explanation', event.target.value)}
                        rows={4}
                        className="w-full resize-none border border-[#d1e2d8] bg-white p-4 text-sm leading-7 outline-none focus:border-[#6e9e87] focus:ring-2 focus:ring-[#e2f0e8]"
                        placeholder="הסבירו במילים שלכם איך מה שרואים כאן קשור למושג."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#e6e9e4] flex items-center justify-between gap-5">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> המיקום נשמר עם התחנה</span>
                <span className="text-slate-300">•</span>
                <span>המדיה אינה חובה</span>
              </div>
              <button className="h-9 px-3 border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                <ImagePlus className="w-4 h-4" /> הוספת תמונה או וידאו
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#e6e9e4] flex items-center justify-between gap-6 bg-[#fbfbf8]">
          <div>
            <p className="text-xs font-black">לפני שליחה למורה</p>
            <p className="text-[11px] text-slate-500 mt-1">
              הפעילות הוגדרה • {stations.length} תחנות נוצרו • {completeStations} תחנות מלאות
            </p>
          </div>
          <button
            disabled={!activity.trim() || stations.length < 2 || completeStations < stations.length}
            className="h-10 px-5 bg-[#1B4332] text-white text-xs font-black disabled:bg-[#e7e8e4] disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            שליחה לאישור המורה
          </button>
        </div>
      </section>

      <div className="mt-4 text-[11px] text-slate-400">
        בתלמיד אמיתי השלב הזה ייפתח רק אחרי שהחקר המקדים הושלם ואושר. כאן הוא פתוח לצורך בדיקת העיצוב והזרימה.
      </div>
    </div>
  );
};

interface GuidedProjectWorkspaceProps {
  onBack?: () => void;
}

type ProjectMode = 'teacher' | 'student';

const readProjectLocation = (): { mode: ProjectMode; stage: string } => {
  if (typeof window === 'undefined') return { mode: 'teacher', stage: 'research' };

  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode');
  const stageParam = params.get('stage');

  const mode: ProjectMode = modeParam === 'student' ? 'student' : 'teacher';
  const stage = stages.some((item) => item.id === stageParam) ? (stageParam as string) : 'research';

  return { mode, stage };
};

export const GuidedProjectWorkspace: React.FC<GuidedProjectWorkspaceProps> = ({ onBack }) => {
  const initialProjectLocation = readProjectLocation();
  const [mode, setMode] = useState<ProjectMode>(initialProjectLocation.mode);
  const [selectedTeamId, setSelectedTeamId] = useState('t1');
  const [selectedStageId, setSelectedStageId] = useState(initialProjectLocation.stage);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFutureStages, setShowFutureStages] = useState(false);
  const [showCompletedStage, setShowCompletedStage] = useState(false);
  const [researchText, setResearchText] = useState(
    'זהות קהילתית מתארת את האופן שבו אדם מגדיר את עצמו כחלק מקבוצה או קהילה. במקרה של נחלאות, הזהות נבנית דרך מסורות, מוסדות מקומיים, קשרי שכנות והמרחב הפיזי עצמו.\n\nקהילה היא רשת של קשרים חברתיים בין אנשים החולקים מקום, מאפיינים או תחושת שייכות. נרצה לבדוק כיצד הקשרים האלה באים לידי ביטוי ברחוב ובמפגש בין תושבים ותיקים לחדשים.'
  );

  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0];
  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? stages[1];
  const researchWordCount = researchText.trim() ? researchText.trim().split(/\s+/).length : 0;

  const navigateProject = (nextMode: ProjectMode, nextStageId: string) => {
    if (nextMode === mode && nextStageId === selectedStageId) return;

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'project');
      url.searchParams.set('mode', nextMode);
      url.searchParams.set('stage', nextStageId);
      window.history.pushState(
        { trailimView: 'project', trailimMode: nextMode, trailimStage: nextStageId },
        '',
        url,
      );
    }

    setMode(nextMode);
    setSelectedStageId(nextStageId);
  };

  useEffect(() => {
    const syncProjectFromBrowserHistory = () => {
      const location = readProjectLocation();
      setMode(location.mode);
      setSelectedStageId(location.stage);
    };

    window.addEventListener('popstate', syncProjectFromBrowserHistory);
    return () => window.removeEventListener('popstate', syncProjectFromBrowserHistory);
  }, []);

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
              onClick={() => navigateProject('teacher', selectedStageId)}
              className={`px-3 py-1.5 rounded-md transition-colors ${mode === 'teacher' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              תצוגת מורה
            </button>
            <button
              onClick={() => navigateProject('student', selectedStageId)}
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
                  onClick={() => navigateProject(mode, stage.id)}
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
          ) : selectedStageId === 'plan' ? (
            <PlanStageStudent />
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

                    <div className="border-t border-[#ece5d6]">
                      <div className="px-6 py-4 bg-[#faf8f1] border-b border-[#ece5d6] flex items-center justify-between gap-6">
                        <div>
                          <div className="text-[11px] font-bold text-slate-400">דרישת המורה</div>
                          <p className="text-sm font-black mt-1">סקירה של 5 מושגים/תיאוריות • כ־250–350 מילים בסך הכול</p>
                          <p className="text-xs text-slate-500 mt-1">כתבו במילים שלכם. הטקסט הזה ייכנס אחר כך אוטומטית לרקע התאורטי בעבודה.</p>
                        </div>
                        <div className="text-left shrink-0">
                          <div className="text-[11px] text-slate-400">התקדמות בכתיבה</div>
                          <div className={`text-sm font-black mt-1 ${researchWordCount >= 250 ? 'text-[#1f6d54]' : 'text-[#9b6a11]'}`}>
                            {researchWordCount} / 250 מילים
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-[minmax(0,1fr)_245px] min-h-[430px]">
                        <div className="p-6 bg-white">
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div>
                              <h4 className="text-sm font-black">הסקירה שלכם</h4>
                              <p className="text-xs text-slate-500 mt-1">אפשר לכתוב ברצף כמו במסמך. אין צורך למלא קופסה נפרדת לכל מושג.</p>
                            </div>
                            <button className="h-8 px-3 border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                              <Maximize2 className="w-3.5 h-3.5" />
                              מסך כתיבה
                            </button>
                          </div>

                          <textarea
                            value={researchText}
                            onChange={(event) => setResearchText(event.target.value)}
                            className="w-full min-h-[315px] resize-none bg-transparent border-0 outline-none text-[15px] leading-8 text-slate-800 placeholder:text-slate-300"
                            placeholder="התחילו לכתוב כאן את הסקירה התאורטית שלכם..."
                          />

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span>נשמר אוטומטית</span>
                            <span>{researchWordCount} מילים</span>
                          </div>
                        </div>

                        <aside className="border-r border-[#ece5d6] bg-[#fcfbf7] p-5">
                          <div className="mb-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-[#2b755d]" />
                                <h4 className="text-sm font-black">מקורות</h4>
                              </div>
                              <strong className="text-xs text-[#1f6d54]">1 / 2</strong>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 leading-5">לכל מקור שומרים גם פרטים וגם כמה משפטים על מה למדתם ממנו.</p>

                            <div className="mt-4 border-y border-[#e7e2d9] py-3">
                              <p className="text-xs font-bold leading-5">שינויים חברתיים בשכונות מרכז העיר</p>
                              <p className="text-[11px] text-slate-400 mt-1">מקור 1 • נוסף היום</p>
                            </div>

                            <button className="mt-3 text-xs font-black text-[#1f6d54] flex items-center gap-1.5">
                              <Plus className="w-4 h-4" /> הוספת מקור
                            </button>
                          </div>

                          <div className="pt-5 border-t border-[#e7e2d9]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#2b755d]" />
                                <h4 className="text-sm font-black">מושגים</h4>
                              </div>
                              <strong className="text-xs text-[#9b6a11]">3 / 5</strong>
                            </div>

                            <div className="mt-4 space-y-2 text-xs">
                              {['זהות', 'קהילה', 'נורמות'].map((concept) => (
                                <div key={concept} className="flex items-center justify-between border-b border-[#ece8df] pb-2">
                                  <span className="font-bold text-slate-700">{concept}</span>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1f6d54]" />
                                </div>
                              ))}
                            </div>

                            <button className="mt-3 text-xs font-black text-[#1f6d54]">+ הוספת מושג</button>
                          </div>

                          <div className="mt-6 pt-5 border-t border-[#e7e2d9]">
                            <p className="text-[11px] font-bold text-slate-400 mb-3">לפני שליחה למורה</p>
                            <div className="space-y-2.5 text-xs">
                              <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#1f6d54] shrink-0" /><span>הסברתם 3 מתוך 5 מושגים</span></div>
                              <div className="flex items-start gap-2"><Clock3 className="w-4 h-4 text-amber-600 shrink-0" /><span>חסר מקור אחד</span></div>
                              <div className="flex items-start gap-2"><Clock3 className="w-4 h-4 text-amber-600 shrink-0" /><span>חסרים 2 מושגים</span></div>
                              <div className="flex items-start gap-2"><Clock3 className="w-4 h-4 text-amber-600 shrink-0" /><span>נדרשות לפחות 250 מילים</span></div>
                            </div>
                          </div>
                        </aside>
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-[#ece5d6] flex items-center justify-between gap-5">
                      <p className="text-xs text-slate-500">הטקסט שתכתבו כאן יישמר וייכנס בהמשך לטיוטת הדוח. 
                        התחנה הבאה — תכנון הפעילות והתחנות — תיפתח רק לאחר השלמת הדרישות ואישור המורה.
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
                          עוד 4 שלבים ייפתחו בהדרגה אחרי השלמת החקר המקדים.
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
