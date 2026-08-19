import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MapPin, Camera, ShieldCheck, AlertCircle, X, Search, FileUp, KeyRound, CheckCircle2, RefreshCw, Smartphone
} from 'lucide-react';

export type PermissionStatus = 'not_requested' | 'granted' | 'denied' | 'unavailable';
export type PermissionType = 'location' | 'camera';

interface ActiveModalConfig {
  type: PermissionType;
  purpose: string;
  onGranted?: () => void;
  onFallback?: (option?: string) => void;
}

interface PermissionContextType {
  locationStatus: PermissionStatus;
  cameraStatus: PermissionStatus;
  userLocation: { latitude: number; longitude: number; city?: string } | null;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  requestLocationPermission: (purpose: string, onGranted?: () => void, onFallback?: (option?: string) => void) => void;
  requestCameraPermission: (purpose: string, onGranted?: () => void, onFallback?: (option?: string) => void) => void;
  setSimulatedLocationStatus: (status: 'granted' | 'denied') => void;
  setSimulatedCameraStatus: (status: 'granted' | 'denied') => void;
  resetPermissions: () => void;
  closeModal: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LOCATION_PERM: 'trailim_perm_location_v1',
  CAMERA_PERM: 'trailim_perm_camera_v1',
  SELECTED_CITY: 'trailim_selected_city_v1',
};

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locationStatus, setLocationStatus] = useState<PermissionStatus>(() => {
    if (typeof window === 'undefined') return 'not_requested';
    return (localStorage.getItem(STORAGE_KEYS.LOCATION_PERM) as PermissionStatus) || 'not_requested';
  });

  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>(() => {
    if (typeof window === 'undefined') return 'not_requested';
    return (localStorage.getItem(STORAGE_KEYS.CAMERA_PERM) as PermissionStatus) || 'not_requested';
  });

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; city?: string } | null>(() => {
    return { latitude: 32.0853, longitude: 34.7818, city: 'Tel Aviv' };
  });

  const [selectedCity, setSelectedCityState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'Tel Aviv';
    return localStorage.getItem(STORAGE_KEYS.SELECTED_CITY) || 'Tel Aviv';
  });

  const [activeModal, setActiveModal] = useState<ActiveModalConfig | null>(null);
  const [showCitySearchInput, setShowCitySearchInput] = useState<boolean>(false);
  const [tempCityQuery, setTempCityQuery] = useState<string>('');

  const setSelectedCity = (city: string) => {
    setSelectedCityState(city);
    localStorage.setItem(STORAGE_KEYS.SELECTED_CITY, city);
  };

  const updateLocationStatus = (status: PermissionStatus) => {
    setLocationStatus(status);
    localStorage.setItem(STORAGE_KEYS.LOCATION_PERM, status);
  };

  const updateCameraStatus = (status: PermissionStatus) => {
    setCameraStatus(status);
    localStorage.setItem(STORAGE_KEYS.CAMERA_PERM, status);
  };

  const requestLocationPermission = (purpose: string, onGranted?: () => void, onFallback?: (option?: string) => void) => {
    if (locationStatus === 'granted') {
      if (onGranted) onGranted();
      return;
    }
    setActiveModal({ type: 'location', purpose, onGranted, onFallback });
  };

  const requestCameraPermission = (purpose: string, onGranted?: () => void, onFallback?: (option?: string) => void) => {
    if (cameraStatus === 'granted') {
      if (onGranted) onGranted();
      return;
    }
    setActiveModal({ type: 'camera', purpose, onGranted, onFallback });
  };

  const handleGrantRealOrSimulatedLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            city: 'Current Position'
          });
          updateLocationStatus('granted');
          const cb = activeModal?.onGranted;
          setActiveModal(null);
          if (cb) cb();
        },
        () => {
          // Fallback if browser permission fails
          updateLocationStatus('granted'); // Simulated grant for prototype
          setUserLocation({ latitude: 32.0853, longitude: 34.7818, city: 'Tel Aviv' });
          const cb = activeModal?.onGranted;
          setActiveModal(null);
          if (cb) cb();
        },
        { timeout: 5000 }
      );
    } else {
      updateLocationStatus('granted');
      setUserLocation({ latitude: 32.0853, longitude: 34.7818, city: 'Tel Aviv' });
      const cb = activeModal?.onGranted;
      setActiveModal(null);
      if (cb) cb();
    }
  };

  const handleGrantRealOrSimulatedCamera = () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          // Stop track immediately after permission check
          stream.getTracks().forEach(track => track.stop());
          updateCameraStatus('granted');
          const cb = activeModal?.onGranted;
          setActiveModal(null);
          if (cb) cb();
        })
        .catch(() => {
          updateCameraStatus('granted'); // Simulated grant for prototype
          const cb = activeModal?.onGranted;
          setActiveModal(null);
          if (cb) cb();
        });
    } else {
      updateCameraStatus('granted');
      const cb = activeModal?.onGranted;
      setActiveModal(null);
      if (cb) cb();
    }
  };

  const handleDenyLocation = () => {
    updateLocationStatus('denied');
    const cb = activeModal?.onFallback;
    setActiveModal(null);
    if (cb) cb('denied');
  };

  const handleDenyCamera = () => {
    updateCameraStatus('denied');
    const cb = activeModal?.onFallback;
    setActiveModal(null);
    if (cb) cb('denied');
  };

  const handleFallbackOption = (optionName: string) => {
    const cb = activeModal?.onFallback;
    setActiveModal(null);
    setShowCitySearchInput(false);
    if (cb) cb(optionName);
  };

  const resetPermissions = () => {
    updateLocationStatus('not_requested');
    updateCameraStatus('not_requested');
    localStorage.removeItem(STORAGE_KEYS.LOCATION_PERM);
    localStorage.removeItem(STORAGE_KEYS.CAMERA_PERM);
  };

  return (
    <PermissionContext.Provider
      value={{
        locationStatus,
        cameraStatus,
        userLocation,
        selectedCity,
        setSelectedCity,
        requestLocationPermission,
        requestCameraPermission,
        setSimulatedLocationStatus: updateLocationStatus,
        setSimulatedCameraStatus: updateCameraStatus,
        resetPermissions,
        closeModal: () => {
          setActiveModal(null);
          setShowCitySearchInput(false);
        },
      }}
    >
      {children}

      {/* Contextual Permission Modal Dialog */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200">
            
            {/* Header / Icon */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${activeModal.type === 'location' ? 'bg-emerald-100 text-[#1B4332]' : 'bg-indigo-100 text-indigo-900'}`}>
                  {activeModal.type === 'location' ? <MapPin className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Contextual Access Request</span>
                  <h3 className="font-display font-bold text-base text-slate-900 leading-tight">
                    {activeModal.type === 'location' ? 'Location Access Request' : 'Camera Access Request'}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Purpose Notice */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Action Requested</span>
              <p className="text-xs font-semibold text-slate-800">
                "{activeModal.purpose}"
              </p>
            </div>

            {/* In-App Explanation & Privacy Assurance */}
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              {activeModal.type === 'location' ? (
                <>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p><strong className="text-slate-800">Why it's needed:</strong> Calculates distance to starting points and verifies station arrival on-site.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <p><strong className="text-slate-800">Privacy assurance:</strong> Live student locations are never saved or displayed publicly.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <p><strong className="text-slate-800">Why it's needed:</strong> To capture outdoor field evidence photos for station completion.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                    <p><strong className="text-slate-800">Privacy assurance:</strong> Photos stay inside your class project workspace.</p>
                  </div>
                </>
              )}
            </div>

            {/* Denied Warning (if previously denied) */}
            {((activeModal.type === 'location' && locationStatus === 'denied') || (activeModal.type === 'camera' && cameraStatus === 'denied')) && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2 text-[11px] text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Access is currently denied in browser settings. You can use a fallback option below.</span>
              </div>
            )}

            {/* Simulated Prototype Toggle Bar */}
            <div className="bg-slate-100 p-2 rounded-xl flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-500" /> Prototype Control:
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    if (activeModal.type === 'location') handleGrantRealOrSimulatedLocation();
                    else handleGrantRealOrSimulatedCamera();
                  }}
                  className="px-2 py-1 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800 cursor-pointer"
                >
                  Simulate Grant
                </button>
                <button
                  onClick={() => {
                    if (activeModal.type === 'location') handleDenyLocation();
                    else handleDenyCamera();
                  }}
                  className="px-2 py-1 bg-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-400 cursor-pointer"
                >
                  Simulate Deny
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => {
                if (activeModal.type === 'location') handleGrantRealOrSimulatedLocation();
                else handleGrantRealOrSimulatedCamera();
              }}
              className="w-full py-3 bg-[#1B4332] text-white rounded-xl font-bold text-xs hover:bg-[#2D6A4F] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {activeModal.type === 'location' ? (
                <>
                  <MapPin className="w-4 h-4" /> Allow Location Access
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" /> Enable Camera Access
                </>
              )}
            </button>

            {/* City Search Box (if toggled) */}
            {showCitySearchInput && activeModal.type === 'location' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Search City Manually</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Tel Aviv, Jerusalem, Haifa..."
                    value={tempCityQuery}
                    onChange={(e) => setTempCityQuery(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                  <button
                    onClick={() => {
                      if (tempCityQuery.trim()) {
                        setSelectedCity(tempCityQuery.trim());
                        handleFallbackOption('manual_city');
                      }
                    }}
                    className="px-3 py-2 bg-[#1B4332] text-white text-xs font-bold rounded-xl"
                  >
                    Select
                  </button>
                </div>
              </div>
            )}

            {/* Fallback & Alternative Actions */}
            <div className="pt-1 border-t border-slate-100 space-y-1.5 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Alternatives</span>
              
              {activeModal.type === 'location' ? (
                <div className="grid grid-cols-2 gap-1.5 text-left">
                  <button
                    onClick={() => setShowCitySearchInput(!showCitySearchInput)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-500" /> Search City
                  </button>

                  <button
                    onClick={() => handleFallbackOption('qr_code')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" /> QR / Passcode
                  </button>

                  <button
                    onClick={() => handleFallbackOption('teacher_unlock')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Teacher Unlock
                  </button>

                  <button
                    onClick={() => handleFallbackOption('demo_mode')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /> Demo Mode
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                    <FileUp className="w-3.5 h-3.5 text-slate-500" /> Choose Existing File
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFallbackOption('uploaded_file');
                        }
                      }} 
                    />
                  </label>

                  <button
                    onClick={() => handleFallbackOption('text_alternative')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Continue with Text Description Alternative
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  if (activeModal.type === 'location') handleFallbackOption('demo_mode');
                  else handleFallbackOption('cancel');
                }}
                className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 pt-1 cursor-pointer font-medium"
              >
                {activeModal.type === 'location' ? 'Continue Without Location' : 'Cancel'}
              </button>
            </div>

          </div>
        </div>
      )}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};
