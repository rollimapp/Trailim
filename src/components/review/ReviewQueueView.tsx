import React, { useState, useEffect } from 'react';
import { ReviewItem, Route, Station } from '../../types';
import { dataService } from '../../services/dataService';
import { mergeVersionedAndLegacyReviews, toLegacyVersionPreview } from '../../services/vs1Adapters';
import { vs1WorkflowRepository } from '../../services/vs1WorkflowRepository';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, CheckCircle2, AlertCircle, Eye, MessageSquare, Clock, Send } from 'lucide-react';
import { firebaseVersionReviewGateway, isFirebaseVersionReviewEnabled } from '../../services/firebase/versionReviewGateway';
import { firestoreVersionReviewRepository } from '../../services/firebase/versionReviewRepository';
import { firestoreRouteDraftRepository } from '../../services/firebase/routeDraftRepository';

interface ReviewQueueViewProps {
  onPreviewRoute: (route: Route, stations?: Station[]) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({ onPreviewRoute }) => {
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

  const loadFirebaseQueue = async () => {
    if (isFirebaseVersionReviewEnabled()) {
      try {
        const versionedReviews = await firestoreVersionReviewRepository.listPendingReviews('org-edu-1');
        const mappedReviews = await Promise.all(versionedReviews.map(async (review) => {
          const version = await firestoreVersionReviewRepository.getVersion(review.routeId, review.routeVersionId);
          const route = await firestoreRouteDraftRepository.getRoute(review.routeId);
          return {
            id: review.id,
            routeId: review.routeId,
            routeTitle: version?.content.title || 'Untitled Trail',
            creatorId: review.submittedByUserId,
            creatorName: review.submittedByUserId === 'student-1' ? 'Maya Lin' : 'Elena Vance',
            creatorRole: review.submittedByUserId === 'student-1' ? 'student' as const : 'teacher' as const,
            schoolName: 'Greenwood High School',
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
      } catch (err) {
        console.error('Failed to load pending reviews from Firebase:', err);
      }
    }
  };

  useEffect(() => {
    loadFirebaseQueue();
  }, [currentUser]);

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
      } catch (err) {
        console.error('Failed to load version preview:', err);
        alert('Failed to preview trail: ' + (err as Error).message);
        return;
      }
    }

    const versionedReview = vs1WorkflowRepository.getReview(item.id);
    const versionedSnapshot = versionedReview
      ? vs1WorkflowRepository.getParticipantSnapshot(versionedReview.routeVersionId)
      : null;
    const preview = route && versionedSnapshot
      ? toLegacyVersionPreview(route, versionedSnapshot)
      : null;
    if (preview) {
      onPreviewRoute(preview.route, preview.stations);
    } else if (route) {
      onPreviewRoute(route);
    }
  };

  const handleAction = async (action: 'approve' | 'request_changes' | 'reject') => {
    if (!selectedReview) return;

    if (isFirebaseVersionReviewEnabled() && action !== 'reject') {
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
          alert(`Review updated: ${action.replace('_', ' ').toUpperCase()}`);
          return;
        }
      } catch (err) {
        console.error('Firebase review action failed:', err);
        alert('Failed to update review: ' + (err as Error).message);
        return;
      }
    }

    const versionedReview = vs1WorkflowRepository.getReview(selectedReview.id);
    if (versionedReview && action !== 'reject') {
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
    alert(`Review updated: ${action.replace('_', ' ').toUpperCase()}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-950 text-white p-5 rounded-3xl shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full tracking-wider">
            Review Queue
          </span>
          <h1 className="font-display font-bold text-xl mt-1 text-white">
            Moderation & Route Quality Control
          </h1>
          <p className="text-xs text-amber-100 max-w-sm mt-0.5">
            Review student-submitted learning trails, provide constructive feedback, or approve for public publishing.
          </p>
        </div>
        <ShieldCheck className="w-10 h-10 text-amber-300 opacity-80 shrink-0" />
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-700" />
          <span>Pending Submissions ({queue.length})</span>
        </h2>

        {queue.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">All submissions reviewed!</h3>
            <p className="text-xs text-slate-500">There are no pending student routes awaiting moderation at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map(item => {
              const route = dataService.getRouteById(item.routeId);
              const versionedReview = vs1WorkflowRepository.getReview(item.id);
              const versionedSnapshot = versionedReview
                ? vs1WorkflowRepository.getParticipantSnapshot(versionedReview.routeVersionId)
                : null;
              const preview = route && versionedSnapshot
                ? toLegacyVersionPreview(route, versionedSnapshot)
                : null;
              return (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        {item.status.replace('_', ' ')}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">{item.routeTitle}</h3>
                      <p className="text-xs text-slate-500">
                        Submitted by <span className="font-semibold text-slate-800">{item.creatorName}</span> ({item.schoolName})
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-3">
                    {route && (
                      <button
                        onClick={() => handlePreviewTrail(item)}
                        className="py-1.5 px-3 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview Trail
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedReview(item)}
                      className="py-1.5 px-3 bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-amber-900"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Review & Moderate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Dialog Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-900">
                Moderate: {selectedReview.routeTitle}
              </h3>
              <button onClick={() => setSelectedReview(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            {/* Dual Review Verification Checklist */}
            <div className="space-y-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="font-extrabold uppercase text-[10px] text-slate-500 block">Review Criteria</span>
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-emerald-700 focus:ring-emerald-600" />
                <span>1. Educational Content & Station Rubric Approved</span>
              </label>
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-emerald-700 focus:ring-emerald-600" />
                <span>2. Field Visit & On-Site Evidence Verified</span>
              </label>
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-emerald-700 focus:ring-emerald-600" />
                <span>3. Safety & Accessibility Compliance Checked</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Constructive Educator Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Provide helpful suggestions or approval note..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-700"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handleAction('approve')}
                className="w-full py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 shadow-xs"
              >
                Approve Field-Ready Trail
              </button>
              <button
                onClick={() => handleAction('request_changes')}
                className="w-full py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 shadow-xs"
              >
                Request Revision Changes
              </button>
              <button
                onClick={() => setSelectedReview(null)}
                className="w-full py-2 text-slate-600 font-semibold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
