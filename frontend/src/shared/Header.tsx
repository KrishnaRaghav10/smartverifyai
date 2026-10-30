import React, { useState } from 'react';
import { useAegisStore } from '../store';
import { TricolorHairline } from './TricolorHairline';
import { DEMO_USERS } from '../mock/seed';
import { Role } from '../types';
import rolesConfig from '../config/roles.json';
import {
  Bell,
  Search,
  Calendar,
  Globe,
  ChevronDown,
  UserCheck,
  FastForward,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  onOpenNotifications: () => void;
  accentColor?: string;
  portalTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  accentColor = '#1F3A8A',
  portalTitle
}) => {
  const {
    currentUser,
    switchRole,
    simDate,
    advanceDays,
    notifications,
    setCommandPaletteOpen,
    language,
    setLanguage
  } = useAegisStore();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const currentRoleCfg = rolesConfig.find((r) => r.role === currentUser.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E1E6F0] shadow-sm select-none no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Portal Name */}
        <div className="flex items-center gap-3 shrink-0">
          <a href="/" className="flex items-center gap-2.5 group">
            <img
              src="/shield.svg"
              alt="AEGIS Shield"
              className="w-9 h-9 transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-[#1F3A8A] font-['Poppins']">
                  AEGIS
                </span>
              </div>
              <span className="text-[10px] text-[#5B6785] -mt-1 hidden md:block">
                AICTE Approval & Compliance System
              </span>
            </div>
          </a>

          {/* Role Portal Badge */}
          {portalTitle && (
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-[#E1E6F0]">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-xs font-bold text-[#0F1B3D] tracking-wide">
                {portalTitle}
              </span>
            </div>
          )}
        </div>

        {/* Center: Search Command Palette Button */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[#F7F8FC] border border-[#E1E6F0] text-xs text-[#5B6785] hover:border-[#1F3A8A] hover:bg-white transition-all shadow-inner group"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#5B6785] group-hover:text-[#1F3A8A]" />
              <span>Search applications, institutions, actions...</span>
            </span>
            <kbd className="font-mono text-[10px] bg-white border border-[#E1E6F0] text-[#5B6785] px-1.5 py-0.5 rounded shadow-xs">
              ⌘K / Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Clock, Notifications, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Simulated Clock Chip */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEF1F8] border border-[#E1E6F0] text-xs font-medium text-[#0F1B3D]">
            <Calendar className="w-3.5 h-3.5 text-[#F28C28]" />
            <span className="font-mono-num font-bold">
              {format(simDate, 'dd MMM yyyy')}
            </span>
            <button
              onClick={() => advanceDays(7)}
              title="Fast-forward simulated clock by 7 days"
              className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E6ECFF] text-[#1F3A8A] hover:bg-[#1F3A8A] hover:text-white transition-colors"
            >
              +7d
            </button>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'EN' ? 'HI' : 'EN')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E1E6F0] hover:bg-[#F7F8FC] text-xs font-semibold text-[#0F1B3D] transition-colors"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#0A5CD6]" />
            <span>{language === 'EN' ? 'EN' : 'हिं'}</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl hover:bg-[#F7F8FC] border border-[#E1E6F0] text-[#0F1B3D] transition-colors"
            title="Open Notification Centre"
          >
            <Bell className="w-4 h-4 text-[#0F1B3D]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#D92D20] text-white text-[10px] font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Demo Role Switcher Menu */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#E1E6F0] bg-[#F7F8FC] hover:bg-white text-xs text-left transition-all"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-xs"
                style={{ backgroundColor: currentRoleCfg?.accentColor || accentColor }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden xl:block">
                <div className="font-bold text-[#0F1B3D] leading-none text-xs">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-[#5B6785] mt-0.5">
                  {currentRoleCfg?.portalName || currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#5B6785]" />
            </button>

            {/* Dropdown Menu */}
            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#E1E6F0] p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-[#E1E6F0] mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6785]">
                    Demo Persona / Role Switcher
                  </span>
                  <p className="text-xs font-semibold text-[#0F1B3D]">
                    10 Independent User Interfaces
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-1">
                  {rolesConfig.map((r) => {
                    const isActive = currentUser.role === r.role;
                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchRole(r.role as Role);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                          isActive
                            ? 'bg-[#E6ECFF] text-[#1F3A8A] font-bold'
                            : 'hover:bg-[#F7F8FC] text-[#0F1B3D]'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: r.accentColor }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{r.portalName}</div>
                          <div className="text-[10px] text-[#5B6785] font-normal truncate">
                            {r.demoUser.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature 4px Tricolour hairline */}
      <TricolorHairline />
    </header>
  );
};
