import React, { useState } from 'react';
import { X, Bell, Check, ChevronRight } from 'lucide-react';
import { dataService } from '../../services/dataService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState(dataService.getNotifications());

  if (!isOpen) return null;

  const markAllRead = () => {
    notifications.forEach(n => dataService.markNotificationAsRead(n.id));
    setNotifications(dataService.getNotifications());
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 bg-[#1B4332] text-white flex items-center justify-between border-b border-[#2D6A4F]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#52B788]" />
            <h2 className="font-bold text-base">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#2D6A4F] text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">Recent Activity Updates</span>
          <button
            onClick={markAllRead}
            className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map(item => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all ${
                item.read ? 'bg-white border-slate-200' : 'bg-emerald-50/70 border-emerald-200 shadow-xs'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-xs text-slate-800">{item.title}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-2">{item.message}</p>
              {item.linkRouteId && (
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-0.5"
                >
                  View details <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
