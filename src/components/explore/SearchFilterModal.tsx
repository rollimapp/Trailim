import React, { useState } from 'react';
import { X, Filter, Check, MapPin, Search } from 'lucide-react';
import { RouteType, EnvironmentType } from '../../types';
import { usePermissions } from '../../context/PermissionContext';

interface FilterState {
  routeType?: string;
  subject?: string;
  environment?: EnvironmentType;
  duration?: 'short' | 'medium' | 'long';
  cityRegion?: string;
}

interface SearchFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
}

const ROUTE_TYPES: { id: RouteType; label: string }[] = [
  { id: 'community_heritage', label: 'Community Heritage' },
  { id: 'educational_tour', label: 'Educational Tour' },
  { id: 'scavenger_hunt', label: 'Scavenger Hunt' },
  { id: 'nature_exploration', label: 'Nature Exploration' },
  { id: 'school_activity', label: 'School Activity' },
  { id: 'student_assignment', label: 'Student Assignment' },
];

const SUBJECTS = [
  'All Subjects',
  'History & Heritage',
  'Ecology & Science',
  'Social Studies & Team Building',
  'STEM & History',
  'Art & Literature'
];

export const SearchFilterModal: React.FC<SearchFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters
}) => {
  const { locationStatus, requestLocationPermission, selectedCity, setSelectedCity } = usePermissions();
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const empty: FilterState = {};
    setLocalFilters(empty);
    onApplyFilters(empty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-[#1B4332] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#52B788]" />
            <h2 className="font-bold text-base">Filter Learning Trails</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#2D6A4F] text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          
          {/* Location & City Context */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Geographic Location
            </label>
            <div className="space-y-2">
              <button
                onClick={() => {
                  requestLocationPermission('use current GPS location to filter nearest routes', () => {
                    setLocalFilters(prev => ({ ...prev, cityRegion: undefined }));
                  });
                }}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                  locationStatus === 'granted'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#1B4332]" />
                  <span>Use Current Location</span>
                </div>
                <span className="text-[10px] uppercase font-extrabold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                  {locationStatus === 'granted' ? 'GPS Active' : 'Request GPS'}
                </span>
              </button>

              <div className="flex gap-2 items-center">
                <span className="text-[11px] text-slate-400 font-medium">Or select city:</span>
                <select
                  value={localFilters.cityRegion || selectedCity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCity(val);
                    setLocalFilters(prev => ({ ...prev, cityRegion: val }));
                  }}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="Tel Aviv">Tel Aviv-Yafo</option>
                  <option value="Jerusalem">Jerusalem</option>
                  <option value="Haifa">Haifa / Carmel</option>
                  <option value="Petah Tikva">Petah Tikva / Yarkon</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Route Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Route Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROUTE_TYPES.map(rt => (
                <button
                  key={rt.id}
                  onClick={() => setLocalFilters(prev => ({
                    ...prev,
                    routeType: prev.routeType === rt.id ? undefined : rt.id
                  }))}
                  className={`p-2 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                    localFilters.routeType === rt.id
                      ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{rt.label}</span>
                  {localFilters.routeType === rt.id && <Check className="w-3.5 h-3.5 text-[#52B788]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Subject Focus
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(subj => {
                const isSelected = subj === 'All Subjects' ? !localFilters.subject : localFilters.subject === subj;
                return (
                  <button
                    key={subj}
                    onClick={() => setLocalFilters(prev => ({
                      ...prev,
                      subject: subj === 'All Subjects' ? undefined : subj
                    }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-[#1B4332] text-white border-[#1B4332]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Environment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Environment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['outdoor', 'indoor', 'hybrid'] as EnvironmentType[]).map(env => (
                <button
                  key={env}
                  onClick={() => setLocalFilters(prev => ({
                    ...prev,
                    environment: prev.environment === env ? undefined : env
                  }))}
                  className={`p-2 rounded-xl text-xs font-semibold capitalize border text-center transition-all ${
                    localFilters.environment === env
                      ? 'bg-[#1B4332] text-white border-[#1B4332]'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'short', label: '< 30 mins' },
                { id: 'medium', label: '30 - 60 mins' },
                { id: 'long', label: '60+ mins' },
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setLocalFilters(prev => ({
                    ...prev,
                    duration: prev.duration === d.id ? undefined : d.id as any
                  }))}
                  className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                    localFilters.duration === d.id
                      ? 'bg-[#1B4332] text-white border-[#1B4332]'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
          >
            Reset Filters
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] shadow-sm"
          >
            Apply Filters
          </button>
        </div>

      </div>
    </div>
  );
};
