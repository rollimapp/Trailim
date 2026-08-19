import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Award, Globe, Eye, Settings, Download, LogOut, Check, MapPin, Camera, RotateCcw } from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext';

export const ProfileView: React.FC = () => {
  const { currentUser, switchUser, language, setLanguage } = useAuth();
  const { locationStatus, cameraStatus, resetPermissions, requestLocationPermission, requestCameraPermission } = usePermissions();
  const [highContrast, setHighContrast] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Profile Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-center">
        <div className="relative inline-block">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-emerald-500/30" />
          <span className="absolute bottom-0 right-0 bg-[#1B4332] text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border border-white">
            {currentUser.role}
          </span>
        </div>

        <div>
          <h1 className="font-display font-bold text-xl text-slate-900">{currentUser.name}</h1>
          <p className="text-xs text-slate-500 font-medium">{currentUser.email}</p>
          <p className="text-xs text-emerald-800 font-bold mt-1">{currentUser.schoolName || 'District Educator Network'}</p>
        </div>

        {/* Capabilities Badge Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-center gap-1.5 text-[10px] font-semibold">
          {currentUser.capabilities.canCreateRoutes && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">Route Creation</span>}
          {currentUser.capabilities.canReviewSubmitted && <span className="px-2.5 py-1 bg-amber-50 text-amber-900 rounded-full border border-amber-200">Review & Moderation</span>}
          {currentUser.capabilities.canPublishDirectly && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-900 rounded-full border border-indigo-200">Direct Publishing</span>}
        </div>
      </div>

      {/* Role Switching Options */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Prototype Persona Switcher</h3>
        <p className="text-xs text-slate-600">Test Trailim capabilities across different educational roles:</p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => switchUser('student-1')}
            className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
              currentUser.id === 'student-1' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            Student (Maya)
          </button>
          <button
            onClick={() => switchUser('teacher-1')}
            className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
              currentUser.id === 'teacher-1' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            Teacher (Sarah)
          </button>
          <button
            onClick={() => switchUser('approver-1')}
            className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
              currentUser.id === 'approver-1' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            Reviewer (Dr. Miller)
          </button>
          <button
            onClick={() => switchUser('guest')}
            className={`p-2.5 rounded-xl border text-left font-semibold transition-all ${
              currentUser.role === 'guest' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            Guest Visitor
          </button>
        </div>
      </div>

      {/* Accessibility & Language Preferences */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
        <h3 className="font-bold uppercase text-slate-500 tracking-wider">App Preferences & Accessibility</h3>
        
        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-slate-800">Language & Direction</span>
          </div>
          <button
            onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
            className="px-3 py-1 bg-[#1B4332] text-white rounded-lg font-bold text-xs"
          >
            {language === 'en' ? 'English (LTR)' : 'עברית (RTL)'}
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-slate-800">High Contrast Mode</span>
          </div>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={`px-3 py-1 rounded-lg font-bold text-xs ${
              highContrast ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {highContrast ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Device & Privacy Permissions Settings */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold uppercase text-slate-500 tracking-wider">Device & Privacy Permissions</h3>
          <button
            onClick={resetPermissions}
            className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
          >
            <RotateCcw className="w-3 h-3" /> Reset Status
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <div>
                <div className="font-semibold text-slate-800">Geographic Location</div>
                <div className="text-[10px] text-slate-500">Requested only on explicit user actions</div>
              </div>
            </div>
            <button
              onClick={() => requestLocationPermission('verify outdoor station position', () => {}, () => {})}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] capitalize ${
                locationStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : locationStatus === 'denied'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {locationStatus}
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-700" />
              <div>
                <div className="font-semibold text-slate-800">Camera Access</div>
                <div className="text-[10px] text-slate-500">Requested only when taking field evidence</div>
              </div>
            </div>
            <button
              onClick={() => requestCameraPermission('capture field evidence photo', () => {}, () => {})}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] capitalize ${
                cameraStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : cameraStatus === 'denied'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {cameraStatus}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
