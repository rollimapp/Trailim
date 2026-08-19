import React, { useState } from 'react';
import { Route, Station, FieldEvidence } from '../../types';
import { 
  CheckCircle2, Circle, Camera, Video, Mic, MapPin, 
  Footprints, Clock, AlertTriangle, ShieldCheck, Eye, Plus, Play, Sparkles, Check, FileText
} from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext';

interface FieldWorkHubProps {
  route: Route;
  stations: Station[];
  onUpdateRoute: (updatedRoute: Route) => void;
  onUpdateStations: (updatedStations: Station[]) => void;
}

export const FieldWorkHub: React.FC<FieldWorkHubProps> = ({
  route,
  stations,
  onUpdateRoute,
  onUpdateStations
}) => {
  const { locationStatus, requestLocationPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<'checklist' | 'evidence' | 'simulator' | 'report'>('checklist');

  // Local checklist state
  const [checklist, setChecklist] = useState({
    locationsPlanned: true,
    firstVisitDone: true,
    originalMediaAdded: (route.fieldEvidence?.length || 0) > 0,
    testWalkDone: route.fieldVerificationStatus === 'field_tested',
    timingVerified: route.timingVerified || false,
    distanceVerified: route.distanceVerified || false,
    safetyChecked: route.safetyCheckStatus === 'approved',
    accessibilityChecked: route.accessibilityCheckStatus === 'accessible',
    routeRevised: true,
    readyForReview: route.publishingStatus === 'submitted_to_teacher'
  });

  // Simulator mode state
  const [simActiveStationIndex, setSimActiveStationIndex] = useState(0);
  const [simTimer, setSimTimer] = useState(0);
  const [simRunning, setSimRunning] = useState(false);
  const [simVisitedStations, setSimVisitedStations] = useState<number[]>([]);
  const [simLoggedNotes, setSimLoggedNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');

  // Evidence state
  const [evidenceList, setEvidenceList] = useState<FieldEvidence[]>(
    route.fieldEvidence || [
      {
        id: 'fe-market-1',
        routeId: route.id,
        stationId: stations[0]?.id || 'st-1',
        uploadedByUserId: 'student-3',
        uploadedByUserName: 'Noa Levi (Photographer)',
        type: 'photo',
        mediaUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
        caption: 'Original field photo of Baker Archway keystone.',
        createdAt: new Date().toISOString(),
        verificationStatus: 'verified_by_team',
        teacherVisible: true,
        participantVisible: true,
        privacyLevel: 'participant_visible'
      }
    ]
  );

  const [newCaption, setNewCaption] = useState('');
  const [newEvidenceType, setNewEvidenceType] = useState<'photo' | 'short_video' | 'audio_recording' | 'field_note'>('photo');

  const handleToggleChecklist = (key: keyof typeof checklist) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);

    const isFullyTested = updated.testWalkDone && updated.firstVisitDone && updated.safetyChecked;
    onUpdateRoute({
      ...route,
      fieldVerificationStatus: isFullyTested ? 'field_tested' : 'partially_tested',
      timingVerified: updated.timingVerified,
      distanceVerified: updated.distanceVerified,
      safetyCheckStatus: updated.safetyChecked ? 'approved' : 'pending',
      accessibilityCheckStatus: updated.accessibilityChecked ? 'accessible' : 'partially_accessible'
    });
  };

  const handleAddEvidence = () => {
    if (!newCaption.trim()) return;

    const sampleImages = [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=800'
    ];

    const newEv: FieldEvidence = {
      id: `fe-${Date.now()}`,
      routeId: route.id,
      stationId: stations[simActiveStationIndex]?.id,
      uploadedByUserId: 'student-1',
      uploadedByUserName: 'Maya Lin (Team Lead)',
      type: newEvidenceType,
      mediaUrl: sampleImages[Math.floor(Math.random() * sampleImages.length)],
      caption: newCaption,
      createdAt: new Date().toISOString(),
      verificationStatus: 'verified_by_team',
      teacherVisible: true,
      participantVisible: true,
      privacyLevel: 'participant_visible'
    };

    const updated = [newEv, ...evidenceList];
    setEvidenceList(updated);
    setNewCaption('');

    onUpdateRoute({
      ...route,
      fieldEvidence: updated,
      originalEvidenceCount: updated.length
    });
  };

  const handleSimVisited = (idx: number) => {
    if (!simVisitedStations.includes(idx)) {
      setSimVisitedStations([...simVisitedStations, idx]);
    }
  };

  const handleSimAddNote = () => {
    if (!newNote.trim()) return;
    setSimLoggedNotes([...simLoggedNotes, `Station ${simActiveStationIndex + 1}: ${newNote}`]);
    setNewNote('');
  };

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-200 space-y-4">
      {/* Field Work Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
            <Footprints className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">Creator Field Work Hub</h3>
            <p className="text-[11px] text-slate-500">Ground-truth verification & team test walk</p>
          </div>
        </div>

        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
          route.fieldVerificationStatus === 'field_tested'
            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          {route.fieldVerificationStatus === 'field_tested' ? '✓ Field Verified' : 'Field Visit Pending'}
        </span>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl text-[11px] font-bold text-slate-600">
        {[
          { id: 'checklist', label: 'Field Checklist' },
          { id: 'evidence', label: `Evidence (${evidenceList.length})` },
          { id: 'simulator', label: 'Field Visit Mode' },
          { id: 'report', label: 'Test Walk Report' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === t.id ? 'bg-[#1B4332] text-white shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FIELD CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-3 text-xs">
          <p className="text-[11px] text-slate-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
            A high-quality learning trail requires physical verification on-site. Complete all items before submitting to your teacher.
          </p>

          <div className="space-y-2">
            {[
              { key: 'locationsPlanned', title: 'Route Path & GPS Coordinates Planned', desc: 'Station coordinates set and checked on map.' },
              { key: 'firstVisitDone', title: 'On-Site Location Scouting', desc: 'Team visited all stations physically in person.' },
              { key: 'originalMediaAdded', title: 'Original Field Media Collected', desc: 'Uploaded real photographs or recorded audio at location.' },
              { key: 'testWalkDone', title: 'Complete Test Walk Completed', desc: 'Walked the entire route from Start to Station Final.' },
              { key: 'timingVerified', title: 'Walking Time & Pacing Verified', desc: 'Confirmed realistic duration (e.g. 35 mins).' },
              { key: 'distanceVerified', title: 'Walking Distance Verified', desc: 'Measured real walking distance (e.g. 1.1 km).' },
              { key: 'safetyChecked', title: 'Safety Hazards Inspected', desc: 'Crosswalks, traffic, and physical hazards checked.' },
              { key: 'accessibilityChecked', title: 'Accessibility Inspected', desc: 'Step-free sidewalks & ramps verified.' },
              { key: 'routeRevised', title: 'Post-Visit Route Revisions Made', desc: 'Refined questions and text based on field observations.' },
              { key: 'readyForReview', title: 'Ready for Teacher Approval', desc: 'All field data updated in project file.' },
            ].map(item => {
              const isChecked = checklist[item.key as keyof typeof checklist];
              return (
                <div
                  key={item.key}
                  onClick={() => handleToggleChecklist(item.key as keyof typeof checklist)}
                  className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    isChecked ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isChecked ? 'bg-[#1B4332] text-white' : 'border border-slate-300 bg-white text-transparent'
                  }`}>
                    ✓
                  </div>
                  <div>
                    <h5 className={`font-bold text-xs ${isChecked ? 'text-emerald-950' : 'text-slate-800'}`}>{item.title}</h5>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FIELD EVIDENCE */}
      {activeTab === 'evidence' && (
        <div className="space-y-4 text-xs">
          {/* Add New Evidence Form */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-800" /> Upload Original Field Evidence
            </h4>

            <div className="flex gap-2">
              <select
                value={newEvidenceType}
                onChange={(e) => setNewEvidenceType(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs"
              >
                <option value="photo">📷 Photo</option>
                <option value="short_video">🎥 Short Video</option>
                <option value="audio_recording">🎙️ Audio Note</option>
                <option value="field_note">📝 Field Note</option>
              </select>

              <input
                type="text"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Caption or description of site..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#1B4332]"
              />

              <button
                onClick={handleAddEvidence}
                className="px-3 py-1.5 bg-[#1B4332] text-white font-bold rounded-xl text-xs hover:bg-[#2D6A4F] shrink-0 cursor-pointer"
              >
                Upload
              </button>
            </div>
          </div>

          {/* Evidence Grid */}
          <div className="grid grid-cols-1 gap-2.5">
            {evidenceList.map(ev => (
              <div key={ev.id} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex gap-3 items-center">
                {ev.mediaUrl ? (
                  <img src={ev.mediaUrl} alt={ev.caption} className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider">{ev.type}</span>
                    <span className="text-slate-400">{new Date(ev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="font-semibold text-xs text-slate-800 leading-snug">{ev.caption}</p>
                  <p className="text-[10px] text-slate-500">Uploaded by {ev.uploadedByUserName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SIMULATOR FIELD VISIT MODE */}
      {activeTab === 'simulator' && (
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[#1B4332] text-white rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-200">Creator Field Walk Simulator</span>
              <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded">
                Station {simActiveStationIndex + 1} of {stations.length}
              </span>
            </div>
            <h4 className="font-display font-bold text-sm">{stations[simActiveStationIndex]?.title || 'Station Title'}</h4>
            <p className="text-[11px] text-emerald-100">{stations[simActiveStationIndex]?.instructions || 'Follow station instructions on location.'}</p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  if (locationStatus === 'granted') {
                    handleSimVisited(simActiveStationIndex);
                  } else {
                    requestLocationPermission(
                      'verify physical on-site station arrival during field testing',
                      () => handleSimVisited(simActiveStationIndex),
                      () => handleSimVisited(simActiveStationIndex)
                    );
                  }
                }}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                  simVisitedStations.includes(simActiveStationIndex)
                    ? 'bg-emerald-400 text-slate-950 font-extrabold'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {simVisitedStations.includes(simActiveStationIndex) ? '✓ Location Confirmed' : '📍 Confirm Arrival'}
              </button>

              <button
                onClick={() => setSimActiveStationIndex((prev) => Math.min(stations.length - 1, prev + 1))}
                disabled={simActiveStationIndex >= stations.length - 1}
                className="px-3 py-1.5 bg-white text-slate-900 rounded-xl font-bold text-xs disabled:opacity-50"
              >
                Next Station →
              </button>
            </div>
          </div>

          {/* Log Field Observations */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800 text-xs">Log Field Note / Roadblock for Station {simActiveStationIndex + 1}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Sidewalk construction near entrance, adjust hint..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
              />
              <button
                onClick={handleSimAddNote}
                className="px-3 py-1.5 bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Save Note
              </button>
            </div>

            {simLoggedNotes.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Logged Notes:</span>
                {simLoggedNotes.map((n, idx) => (
                  <div key={idx} className="p-2 bg-white rounded-lg border text-[11px] font-medium text-slate-700">
                    {n}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TEST WALK REPORT */}
      {activeTab === 'report' && (
        <div className="space-y-3 text-xs">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-emerald-950">
            <h4 className="font-display font-bold text-sm text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-800" /> Test Walk Summary Report
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-500 block">Tested Distance:</span>
                <span className="font-bold">{route.estimatedDistanceKm || 1.1} km</span>
              </div>
              <div>
                <span className="text-slate-500 block">Actual Walk Time:</span>
                <span className="font-bold">{route.estimatedDurationMinutes || 35} mins</span>
              </div>
              <div>
                <span className="text-slate-500 block">Field Evidence:</span>
                <span className="font-bold">{evidenceList.length} items verified</span>
              </div>
              <div>
                <span className="text-slate-500 block">Safety Status:</span>
                <span className="font-bold text-emerald-800">Approved</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <h5 className="font-bold text-xs text-slate-800">Team Field Reflection Summary</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Our team completed the full 1.2km walk on location. We verified step-free sidewalk access at all 4 stops, tested the demo unlock code "TRAIL4" at Station 4, and confirmed high audio legibility for oral recordings.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
