import React, { useState } from 'react';
import { useApp, DEMO_PRESETS } from '../context/AppContext';
import { Globe, ChevronDown, User, LogOut } from 'lucide-react';
import { PremiumShieldLogo } from './PremiumShieldLogo';

export const Header = () => {
  const { lang, t, toggleLanguage, currentUser, loginAs, logout, navigateTo } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* 1. Thin Tricolour Strip */}
      <div className="w-full h-1 flex">
        <div className="w-1/3 bg-[#FF9933]"></div>
        <div className="w-1/3 bg-[#FFFFFF]"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>

      {/* 2. Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Premium Logo */}
        <div 
          onClick={() => navigateTo('dashboard')}
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
              <span className="text-xs font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded">
                AICTE EoA 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
              {t.ministry}
            </p>
          </div>
        </div>

        {/* Right Actions: Language Toggle & Demo Role Switcher */}
        <div className="flex items-center space-x-3">
          
          {/* EN | हिं Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center space-x-1"
            title="Toggle Language / भाषा बदलें"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'en' ? 'हिन्दी (HI)' : 'English (EN)'}</span>
          </button>

          {/* Demo Role Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800"
            >
              <User className="w-3.5 h-3.5 text-[#1B3A6B]" />
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-slate-900 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 leading-none">{currentUser.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded shadow-md z-50 py-1">
                <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {t.quick_switch}
                  </span>
                </div>
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.role}
                    onClick={() => {
                      loginAs(preset);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-50 border-b border-slate-50 last:border-b-0 ${
                      currentUser.role === preset.role ? 'bg-blue-50/60 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{preset.role}</span>
                      {currentUser.role === preset.role && (
                        <span className="text-[10px] bg-[#1B3A6B] text-white px-1.5 py-0.2 rounded font-medium">Active</span>
                      )}
                    </div>
                    <span className="text-slate-600 font-normal mt-0.5">{preset.name}</span>
                    <span className="text-[10px] text-slate-400">{preset.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-1.5 text-xs rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600"
            title="Sign Out / लॉग आउट"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>
    </header>
  );
};
