import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  MessageSquareText,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { ReviewItem, Route, Station } from '../../types';
import { dataService } from '../../services/dataService';
import { mergeVersionedAndLegacyReviews, toLegacyVersionPreview } from '../../services/vs1Adapters';
import { vs1WorkflowRepository } from '../../services/vs1WorkflowRepository';
import { useAuth } from '../../context/AuthContext';
import { firebaseVersionReviewGateway, isFirebaseVersionReviewEnabled } from '../../services/firebase/versionReviewGateway';
import { firestoreVersionReviewRepository } from '../../services/firebase/versionReviewRepository';
import { firestoreRouteDraftRepository } from '../../services/firebase/routeDraftRepository';

interface DesktopTeacherReviewProps {
  onBack: () => void;
  onPreviewRoute: (route: Route, stations?: Station[]) => void;
}

type FilterKey = 'pending' | 'changes' | 'approved';

const demoImages = [
  'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
];

export const DesktopTeacherReview: React.FC<DesktopTeacherReviewProps> = ({ onBack, onPreviewRoute }) => {
  const { currentUser } = useAuth();

  const getQueue = (): ReviewItem[] => {
    const versioned = vs1WorkflowRepository.getPendingReviews().map(review => {
      const version = vs1WorkflowRepository.getVersion(review.routeVersionId)!;
      const route = dataService.getRouteById(review.routeId);
      return {
        id: review.id,
        routeId: review.routeId,
        routeTitle: version.content.title,
        creatorId: review.submittedByUserId,
        creatorName: route?.creatorDisplayName || review.submittedByUserId,
        creatorRole: route?.creatorRole || 'student',
        schoolName: route?.schoolName,
        subject: version.content.subject,
        stationCount: version.stationIds.length,
        submittedAt: review.submittedAt,
        status: 'submitted' as const,
      };
    });

    const legacy = dataService.getReviewQueue().filter(review =>
      review.status === 'submitted' || review.status === 'in_review'
    );

    return mergeVersionedAndLegacyReviews(versioned, legacy);
  };

  const [queue, setQueue] = useState<ReviewItem[]>(getQueue());
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [feedback, setFeedback] = useState('');
  const [filter, setFilter] = useState<FilterKey>('pending');
  const [search, setSearch] = useState('');

  const loadFirebaseQueue = async () => {
    if (!isFirebaseVersionReviewEnabled()) return;
    try {
      const versionedReviews = await firestoreVersionReviewRepository.listPendingReviews('org-edu-1');
      const mappedReviews = await Promise.all(versionedReviews.map(async review => {
        const version = await firestoreVersionReviewRepository.getVersion(review.routeId, review.routeVersionId);
        const route = await firestoreRouteDraftRepository.getRoute(review.routeId);
        return {
          id: review.id,
          routeId: review.routeId,
          routeTitle: version?.content.title || 'מסלול ללא שם',
          creatorId: review.submittedByUserId,
          creatorName: review.submittedByUserId === 'student-1' ? 'Maya Lin' : 'Elena Vance',
          creatorRole: review.submittedByUserId === 'student-1' ? 'student' as const : 'teacher' as const,
          schoolName: route?.schoolName || 'בית הספר',
          subject: version?.content.subject || '',
          stationCount: version?.stationIds.length || 0,
          submittedAt: review.submittedAt,
          status: 'submitted' as const,
        };
      }));
      const legacy = dataService.getReviewQueue().filter(review =>
        review.status === 'submitted' || review.status === 'in_review'
      );
      setQueue(mergeVersionedAndLegacyReviews(mappedReviews, legacy));
    } catch (error) {
      console.error('Failed to load desktop review queue:', error);
    }
  };

  useEffect(() => {
    loadFirebaseQueue();
  }, [currentUser.id]);

  const visibleQueue = useMemo(() => {
    const q = search.trim().toLowerCase();
    return queue.filter(item => {
      const matchesSearch = !q || [item.routeTitle, item.creatorName, item.subject, item.schoolName || '']
        .some(value => value.toLowerCase().includes(q));
      return matchesSearch;
    });
  }, [queue, search]);

  const handlePreviewTrail = async (item: ReviewItem) => {
    const route = dataService.getRouteById(item.routeId);

    if (isFirebaseVersionReviewEnabled()) {
      try {
        const versionedReview = await firestoreVersionReviewRepository.getReview(item.id);
        if (versionedReview) {
          const version = await firestoreVersionReviewRepository.getVersion(item.routeId, versionedReview.routeVersionId);
          const stations = await firestoreVersionReviewRepository.getVersionStations(item.routeId, versionedReview.routeVersionId);
          if (version && stations && route) {
            const preview = toLegacyVersionPreview(route, { version, stations });
            onPreviewRoute(preview.route, preview.stations);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to preview route:', error);
      }
    }

    const versionedReview = vs1WorkflowRepository.getReview(item.id);
    const versionedSnapshot = versionedReview
      ? vs1WorkflowRepository.getParticipantSnapshot(versionedReview.routeVersionId)
      : null;
    const preview = route && versionedSnapshot ? toLegacyVersionPreview(route, versionedSnapshot) : null;

    if (preview) onPreviewRoute(preview.route, preview.stations);
    else if (route) onPreviewRoute(route);
  };

  const handleAction = async (action: 'approve' | 'request_changes') => {
    if (!selectedReview) return;

    if (isFirebaseVersionReviewEnabled()) {
      try {
        const versionedReview = await firestoreVersionReviewRepository.getReview(selectedReview.id);
        if (versionedReview) {
          if (action === 'request_changes') {
            await firebaseVersionReviewGateway.requestChanges(selectedReview.id, feedback);
            dataService.updateRouteStatus(selectedReview.routeId, 'changes_requested');
          } else {
            await firebaseVersionReviewGateway.approveVersion(versionedReview.routeVersionId, feedback);
            const legacyRoute = dataService.updateRouteStatus(selectedReview.routeId, 'published_to_class', currentUser.id);
            if (legacyRoute) dataService.saveRoute({ ...legacyRoute, teacherApproved: true });
          }
          await loadFirebaseQueue();
          setSelectedReview(null);
          setFeedback('');
          return;
        }
      } catch (error) {
        console.error('Desktop review action failed:', error);
        alert('לא הצלחנו לעדכן את הבדיקה. נסה שוב.');
        return;
      }
    }

    const versionedReview = vs1WorkflowRepository.getReview(selectedReview.id);
    if (versionedReview) {
      if (action === 'request_changes') {
        vs1WorkflowRepository.requestChanges(selectedReview.id, currentUser.id, feedback);
        dataService.updateRouteStatus(selectedReview.routeId, 'changes_requested');
      } else {
        vs1WorkflowRepository.approveVersion(versionedReview.routeVersionId, currentUser.id, feedback);
        const legacyRoute = dataService.updateRouteStatus(selectedReview.routeId, 'published_to_class', currentUser.id);
        if (legacyRoute) dataService.saveRoute({ ...legacyRoute, teacherApproved: true });
      }
    } else {
      dataService.processReview(selectedReview.id, action, feedback, currentUser.name);
    }

    setQueue(getQueue());
    setSelectedReview(null);
    setFeedback('');
  };

  const selectedIndex = selectedReview ? Math.max(0, queue.findIndex(item => item.id === selectedReview.id)) : 0;

  return (
    <div dir="rtl" className="h-full bg-[#f5f3ee] text-[#183047] overflow-auto">
      <header className="sticky top-0 z-20 h-[74px] bg-[#fbfaf7]/95 backdrop-blur border-b border-[#e5e0d7] px-7 flex items-center gap-5">
        <button
          onClick={onBack}
          className="h-10 px-3 rounded-[12px] border border-[#dfe5e1] bg-white text-sm font-bold hover:bg-[#f3f6f4] transition flex items-center gap-2"
        >
          <ArrowRight size={17} />
          חזרה לדף הבית
        </button>

        <div className="mr-2">
          <h1 className="text-[22px] font-black">בדיקות</h1>
          <p className="text-xs text-[#76848d] mt-0.5">{queue.length} עבודות מחכות לבדיקה</p>
        </div>

        <div className="relative mr-auto w-[420px] max-w-[38vw]">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#80909c]" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full h-11 rounded-[14px] border border-[#ddd9d0] bg-white pr-11 pl-4 outline-none shadow-sm text-sm"
            placeholder="חיפוש לפי קבוצה, פרויקט או נושא..."
          />
        </div>
      </header>

      <main className="max-w-[1450px] mx-auto p-6 space-y-5">
        <section className="relative overflow-hidden rounded-[22px] border border-black/5 min-h-[172px] bg-[#173f35] text-white shadow-[0_16px_36px_-28px_rgba(20,51,43,.65)]">
          <img
            src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#12382f]/95 via-[#17483a]/72 to-[#173f35]/25" />
          <div className="relative p-7 flex items-center justify-between gap-8">
            <div>
              <div className="text-[12px] font-bold text-[#bfe9d6] mb-2">TRAILIM למורים</div>
              <h2 className="text-[32px] font-black">כל מה שמחכה לך במקום אחד</h2>
              <p className="text-white/80 mt-2 max-w-2xl leading-7">
                עוברים עבודה־עבודה, נותנים משוב קצר ומחליטים אם לאשר או להחזיר לתיקון.
              </p>
            </div>
            <div className="shrink-0 rounded-[18px] bg-white/10 border border-white/15 px-6 py-5 min-w-[220px]">
              <div className="text-[38px] font-black leading-none">{queue.length}</div>
              <div className="text-sm text-white/80 mt-2">ממתינות לבדיקה עכשיו</div>
            </div>
          </div>
        </section>

        <section className="flex items-center gap-2">
          {([
            ['pending', 'ממתין לבדיקה', queue.length],
            ['changes', 'הוחזר לתיקון', 0],
            ['approved', 'אושר', 0],
          ] as Array<[FilterKey, string, number]>).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`h-10 px-4 rounded-[12px] text-sm font-bold border transition ${
                filter === key
                  ? 'bg-[#1f6d54] text-white border-[#1f6d54]'
                  : 'bg-white text-[#53616b] border-[#ddd9d0] hover:bg-[#faf9f6]'
              }`}
            >
              {label} <span className="mr-1 opacity-75">({count})</span>
            </button>
          ))}
        </section>

        {filter === 'pending' ? (
          <section className="grid grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
            <div className="bg-white rounded-[20px] border border-[#e5e0d7] shadow-[0_12px_28px_-24px_rgba(35,50,43,.45)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#eee9e1] flex items-center justify-between">
                <div>
                  <h3 className="text-[18px] font-black">עבודות שמחכות לבדיקה</h3>
                  <p className="text-xs text-[#7e8a96] mt-1">פתח עבודה, בדוק את התוכן ושלח משוב בלי לעבור בין מסכים מיותרים.</p>
                </div>
                <Clock3 size={20} className="text-[#62717a]" />
              </div>

              <div className="divide-y divide-[#eee9e1]">
                {visibleQueue.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <CheckCircle2 className="w-10 h-10 text-[#54a886] mx-auto" />
                    <h4 className="font-black mt-3">אין כרגע עבודות שמחכות לבדיקה</h4>
                    <p className="text-sm text-[#7e8a96] mt-1">כשתלמידים יגישו עבודה, היא תופיע כאן.</p>
                  </div>
                ) : (
                  visibleQueue.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedReview(item)}
                      className="w-full text-right px-5 py-4 hover:bg-[#fbfaf7] transition flex items-center gap-4"
                    >
                      <div className="w-[128px] h-[82px] rounded-[13px] overflow-hidden bg-[#ece8df] shrink-0">
                        <img src={demoImages[index % demoImages.length]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold bg-[#fff0d9] text-[#9a6113] rounded-full px-2.5 py-1">ממתין לבדיקה</span>
                          <span className="text-[11px] text-[#9aa4ab]">{new Date(item.submittedAt).toLocaleDateString('he-IL')}</span>
                        </div>
                        <h4 className="text-[16px] font-black mt-2 truncate">{item.routeTitle}</h4>
                        <p className="text-sm text-[#6f7d86] mt-1">
                          {item.creatorName}{item.schoolName ? ` • ${item.schoolName}` : ''}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[#89949b]">
                          <span className="flex items-center gap-1"><Users size={14} /> הגשת תלמידים</span>
                          <span className="flex items-center gap-1"><FileText size={14} /> {item.stationCount} תחנות</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span className="inline-flex items-center gap-2 rounded-[11px] bg-[#1f6d54] text-white px-4 py-2.5 text-sm font-black">
                          פתח לבדיקה
                          <ArrowRight size={16} className="rotate-180" />
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[19px] border border-[#e6dfd3] bg-[#f7efe1] p-5">
                <Sparkles size={19} className="text-[#2b755d]" />
                <h3 className="font-black mt-3">בדיקה פשוטה, לא עוד מערכת</h3>
                <p className="text-sm text-[#64716b] leading-6 mt-2">
                  פתח עבודה אחת, ראה מה התלמידים הגישו, כתוב משוב קצר וסיים בהחלטה אחת.
                </p>
              </div>

              <div className="rounded-[19px] border border-[#e5e0d7] bg-white p-5">
                <h3 className="font-black">מה חשוב לבדוק?</h3>
                <div className="mt-4 space-y-3 text-sm text-[#5f6c75]">
                  <div className="flex gap-2"><Check size={16} className="text-[#2c8063] mt-0.5" /> האם התוכן ברור ומבוסס?</div>
                  <div className="flex gap-2"><Check size={16} className="text-[#2c8063] mt-0.5" /> האם המקום והתחנות מתאימים?</div>
                  <div className="flex gap-2"><Check size={16} className="text-[#2c8063] mt-0.5" /> האם יש משהו שדורש תיקון לפני המשך?</div>
                </div>
              </div>
            </aside>
          </section>
        ) : (
          <section className="rounded-[20px] border border-[#e5e0d7] bg-white p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#5aa988] mx-auto" />
            <h3 className="font-black mt-3">האזור הזה יתחבר להיסטוריית הבדיקות</h3>
            <p className="text-sm text-[#7c888f] mt-1">כרגע ה־MVP מחבר את זרימת העבודות שממתינות לבדיקה.</p>
          </section>
        )}
      </main>

      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-[#10231e]/55 backdrop-blur-[2px] flex items-center justify-center p-6">
          <div className="w-full max-w-[920px] max-h-[90vh] overflow-hidden rounded-[22px] bg-[#fbfaf7] shadow-2xl border border-white/50">
            <div className="h-[72px] px-6 bg-white border-b border-[#e8e2d8] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-[#8b989f]">בדיקת עבודה</div>
                <h3 className="text-[19px] font-black mt-0.5">{selectedReview.routeTitle}</h3>
              </div>
              <button onClick={() => setSelectedReview(null)} className="h-9 w-9 rounded-full hover:bg-[#f1f0ec] grid place-items-center">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_300px] min-h-[520px]">
              <div className="p-6 overflow-auto border-l border-[#e8e2d8]">
                <div className="rounded-[18px] overflow-hidden h-[210px] bg-[#dedbd1]">
                  <img src={demoImages[selectedIndex % demoImages.length]} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[20px] font-black">{selectedReview.routeTitle}</h4>
                      <p className="text-sm text-[#738089] mt-1">{selectedReview.creatorName}</p>
                    </div>
                    <button
                      onClick={() => handlePreviewTrail(selectedReview)}
                      className="h-10 px-4 rounded-[11px] border border-[#dfe4df] bg-white text-sm font-bold flex items-center gap-2 hover:bg-[#f4f6f3]"
                    >
                      <Eye size={16} />
                      תצוגת המסלול
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-[14px] bg-[#f1f5f3] p-4">
                      <div className="text-[12px] text-[#7b878e]">תחנות</div>
                      <div className="text-[22px] font-black mt-1">{selectedReview.stationCount}</div>
                    </div>
                    <div className="rounded-[14px] bg-[#f7f1e6] p-4">
                      <div className="text-[12px] text-[#7b878e]">סטטוס</div>
                      <div className="text-sm font-black mt-2">ממתין לבדיקה</div>
                    </div>
                    <div className="rounded-[14px] bg-[#eef3f8] p-4">
                      <div className="text-[12px] text-[#7b878e]">הוגש</div>
                      <div className="text-sm font-black mt-2">{new Date(selectedReview.submittedAt).toLocaleDateString('he-IL')}</div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[16px] border border-[#e7e2d9] bg-white p-5">
                    <h5 className="font-black">תקציר להגשה</h5>
                    <p className="text-sm leading-7 text-[#65727b] mt-2">
                      המסלול כולל את התחנות והחומרים שהוגשו בגרסה הנוכחית. אפשר לפתוח תצוגה מלאה לפני קבלת החלטה.
                    </p>
                  </div>
                </div>
              </div>

              <aside className="p-5 bg-[#f8f6f1] overflow-auto">
                <div className="flex items-center gap-2">
                  <MessageSquareText size={18} />
                  <h4 className="font-black">משוב לתלמידים</h4>
                </div>
                <p className="text-xs text-[#7f8a91] mt-2">כתבו בקצרה מה טוב ומה כדאי לשפר.</p>

                <textarea
                  value={feedback}
                  onChange={event => setFeedback(event.target.value)}
                  rows={8}
                  placeholder="כתבו כאן משוב..."
                  className="mt-4 w-full resize-none rounded-[14px] border border-[#dcd7cf] bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#2b755d]/20"
                />

                <button
                  onClick={() => handleAction('approve')}
                  className="mt-5 w-full h-11 rounded-[12px] bg-[#1f6d54] text-white text-sm font-black flex items-center justify-center gap-2 hover:bg-[#195d48]"
                >
                  <Check size={17} />
                  אישור העבודה
                </button>

                <button
                  onClick={() => handleAction('request_changes')}
                  className="mt-2 w-full h-11 rounded-[12px] border border-[#d8c7b8] bg-white text-[#96543e] text-sm font-black hover:bg-[#fff8f4]"
                >
                  החזרה לתיקון
                </button>

                <div className="mt-5 pt-5 border-t border-[#e2ddd5] text-xs text-[#849097] leading-6">
                  לאחר אישור, העבודה תמשיך לשלב הבא בהתאם לזרימת הפרויקט.
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopTeacherReview;
