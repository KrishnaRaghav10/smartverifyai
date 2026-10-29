import React, { useState } from 'react';
import { useApp, DEMO_PRESETS, TOP_STRIP_COLORS, ROLE_DEFAULT_PATHS } from '../context/AppContext';
import { Globe, ChevronDown, User, LogOut, Eye, ShieldCheck } from 'lucide-react';
import { PremiumShieldLogo } from './PremiumShieldLogo';

export const Header = () => {
  const { lang, t, toggleLanguage, currentUser, loginWithPreset, logout, navigateTo } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  if (!currentUser) return null;

  const role = currentUser.role;
  const stripColor = TOP_STRIP_COLORS[role] || '#1B3A6B';
  const roleHome = ROLE_DEFAULT_PATHS[role] || '/institution/home';

  // Role badge color style
  const getBadgeStyle = () => {
    switch (role) {
      case 'Institution':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Scrutiny Officer':
        return 'bg-blue-50 text-blue-900 border-blue-300';
      case 'Senior Officer':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'Auditor':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* 1. Thin Role-Coloured Top Strip */}
      <div 
        className="w-full h-1.5 transition-colors duration-300"
        style={{ backgroundColor: stripColor }}
        title={`Interface Mode: ${role}`}
      />

      {/* 2. Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo (clicking takes user to their own role home) */}
        <div 
          onClick={() => navigateTo(roleHome)}
          className="flex items-center space-x-3 cursor-pointer select-none"
        >
          <div className="flex items-center justify-center">
            <PremiumShieldLogo className="w-10 h-10 shrink-0" size={42} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight text-[#1B3A6B]">
                Smart<span className="text-[#E8890C]">Verify</span>AI
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded">
                AICTE EoA 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
              {t.ministry}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">

          {/* Dedicated Auditor "Read-only access" Tag */}
          {role === 'Auditor' && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-slate-700 text-xs font-semibold">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Read-only access</span>
            </div>
          )}
          
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1"
            title="Toggle Language / भाषा बदलें"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* User & Role Badge with Fast Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-all shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-[#1B3A6B]" />
              <div className="text-left hidden md:block">
                <div className="font-bold text-slate-900 leading-tight flex items-center space-x-1.5">
                  <span>{currentUser.name}</span>
                </div>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getBadgeStyle()}`}>
                    {currentUser.role}
                  </span>
                  {currentUser.institute_id && (
                    <span className="text-[10px] text-slate-500 font-medium">({currentUser.institute_id})</span>
                  )}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Quick Switch Dropdown */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1.5">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Switch Active Demo Role
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Auto Redirects</span>
                </div>
                {DEMO_PRESETS.map((preset) => {
                  const isActive = currentUser.username === preset.username;
                  return (
                    <button
                      key={preset.username}
                      onClick={async () => {
                        setShowRoleMenu(false);
                        await loginWithPreset(preset, 'demo123');
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex flex-col hover:bg-slate-50 border-b border-slate-50 last:border-b-0 transition-colors ${
                        isActive ? 'bg-blue-50/70 border-l-4 border-l-[#1B3A6B]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{preset.name}</span>
                        {isActive ? (
                          <span className="text-[10px] bg-[#1B3A6B] text-white px-2 py-0.5 rounded font-semibold">Active</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {preset.role}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5">{preset.desc}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-1.5 text-xs rounded border border-slate-300 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 text-slate-600 transition-colors"
            title="Sign Out / लॉग आउट"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
};
