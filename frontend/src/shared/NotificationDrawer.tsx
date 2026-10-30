import React, { useState } from 'react';
import { useAegisStore } from '../store';
import { Bell, X, CheckCheck, AlertTriangle, ArrowUpCircle, Clock, Info, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Notification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAegisStore();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'UPCOMING' | 'OVERDUE' | 'ESCALATION'>('ALL');

  if (!isOpen) return null;

  const filtered = activeTab === 'ALL'
    ? notifications
    : notifications.filter((n) => n.kind === activeTab);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const getIcon = (kind: Notification['kind']) => {
    switch (kind) {
      case 'ESCALATION':
        return <ArrowUpCircle className="w-4 h-4 text-[#D92D20]" />;
      case 'OVERDUE':
        return <AlertTriangle className="w-4 h-4 text-[#D92D20]" />;
      case 'UPCOMING':
        return <Clock className="w-4 h-4 text-[#E8A100]" />;
      default:
        return <Info className="w-4 h-4 text-[#0A5CD6]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#E1E6F0] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#E1E6F0] flex items-center justify-between bg-[#F7F8FC]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-[#E6ECFF] text-[#1F3A8A] rounded-xl">
                <Bell className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-[#0F1B3D]">
                  Notification Centre
                </h3>
                <span className="text-xs text-[#5B6785]">
                  {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  title="Mark all as read"
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-[#5B6785] hover:text-[#0F1B3D] transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-[#5B6785] hover:text-[#0F1B3D] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[#E1E6F0] bg-white px-2 overflow-x-auto text-xs font-medium text-[#5B6785]">
            {(['ALL', 'PENDING', 'UPCOMING', 'OVERDUE', 'ESCALATION'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2.5 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-[#1F3A8A] text-[#1F3A8A] font-bold'
                    : 'border-transparent hover:text-[#0F1B3D]'
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E1E6F0]">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5B6785]">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No {activeTab.toLowerCase()} notifications found.
              </div>
            ) : (
              filtered.map((item) => {
                const isUnread = !item.readAt;
                return (
                  <div
                    key={item.id}
                    onClick={() => markNotificationRead(item.id)}
                    className={`p-4 transition-colors cursor-pointer hover:bg-slate-50 relative ${
                      isUnread ? 'bg-[#F0F4FF]' : 'bg-white'
                    }`}
                  >
                    {isUnread && (
                      <span className="absolute left-2 top-5 w-1.5 h-1.5 rounded-full bg-[#0A5CD6]" />
                    )}
                    <div className="flex items-start gap-3 pl-2">
                      <div className="mt-0.5">{getIcon(item.kind)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-200/60 text-[#0F1B3D]">
                            {item.entityRef.type}: {item.entityRef.id}
                          </span>
                          <span className="text-[10px] text-[#5B6785] font-mono-num">
                            {format(parseISO(item.createdAt), 'dd MMM HH:mm')}
                          </span>
                        </div>
                        <p className="text-xs text-[#0F1B3D] leading-relaxed">
                          {item.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-[#5B6785] font-semibold">
                            Recipient: {item.toRole}
                          </span>
                          <span className="text-[11px] text-[#0A5CD6] hover:underline flex items-center gap-0.5 font-medium">
                            Details <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Persistent Footer Warning */}
          <div className="p-3 bg-[#EEF1F8] border-t border-[#E1E6F0] text-[10px] text-[#5B6785] text-center">
            System-generated alerts trigger automatically as statutory deadlines approach.
          </div>
        </div>
      </div>
    </div>
  );
};
