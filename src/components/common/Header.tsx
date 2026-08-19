import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Compass, Bell, Shield, User, Globe, ChevronDown, Check } from 'lucide-react';
import { NotificationDrawer } from './NotificationDrawer';
import { dataService } from '../../services/dataService';

export const Header: React.FC = () => {
  const { currentUser, switchUser, language, setLanguage } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = dataService.getNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#1B4332] text-white shadow-md border-b border-[#2D6A4F] px-3.5 py-2.5">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#52B788] flex items-center justify-center text-[#081C15] font-bold shadow-sm shrink-0">
              <Compass className="w-5 h-5 animate-pulse-glow" />
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-wide text-white block leading-tight">TRAILIM</span>
              <span className="text-[9px] uppercase font-semibold text-[#52B788] block tracking-wider leading-tight">
                {language === 'he' ? 'למידה תלוית מקום' : 'Place-Based Learning'}
              </span>
            </div>
          </div>

          {/* Persona Switcher & Notifications */}
          <div className="flex items-center gap-2">

            {/* Notifications Button */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl text-[#E8F5E9] bg-[#2D6A4F]/60 hover:bg-[#2D6A4F] transition-colors border border-[#2D6A4F] shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ED6C02] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-full bg-[#2D6A4F] hover:bg-[#3D7A5F] transition-all text-xs font-medium border border-[#52B788]/30 shrink-0 min-h-[38px]"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover border border-[#52B788]"
                />
                <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-extrabold bg-[#52B788] text-[#081C15]">
                  {currentUser.role}
                </span>
                <ChevronDown className="w-3 h-3 text-[#52B788]" />
              </button>

              {/* Role Select Dropdown Menu */}
              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 text-slate-800 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Switch Prototype Persona</p>
                    <p className="text-xs text-slate-600">Test role permissions in real-time:</p>
                  </div>

                  <button
                    onClick={() => { switchUser('student-1'); setShowRoleDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <div>
                        <div className="font-semibold text-slate-800">Student (Maya Lin)</div>
                        <div className="text-[10px] text-slate-500">Creates routes, submits for review</div>
                      </div>
                    </div>
                    {currentUser.id === 'student-1' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => { switchUser('teacher-1'); setShowRoleDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      <div>
                        <div className="font-semibold text-slate-800">Teacher (Ms. Elena Vance)</div>
                        <div className="text-[10px] text-slate-500">Publishes, assigns class routes</div>
                      </div>
                    </div>
                    {currentUser.id === 'teacher-1' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => { switchUser('approver-1'); setShowRoleDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      <div>
                        <div className="font-semibold text-slate-800">Reviewer (Dr. David Miller)</div>
                        <div className="text-[10px] text-slate-500">Reviews & approves submissions</div>
                      </div>
                    </div>
                    {currentUser.id === 'approver-1' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => { switchUser('guest'); setShowRoleDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors border-t border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <div className="font-semibold text-slate-800">Guest Visitor</div>
                        <div className="text-[10px] text-slate-500">Limited public view mode</div>
                      </div>
                    </div>
                    {currentUser.role === 'guest' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Notifications Drawer */}
      <NotificationDrawer isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
};
