import React, { useState } from 'react';
import { useApp, DEMO_PRESETS } from '../context/AppContext';
import { User, Lock, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PremiumShieldLogo } from '../components/PremiumShieldLogo';

export const Login = () => {
  const { loginAs, t } = useApp();
  const [selectedPreset, setSelectedPreset] = useState(DEMO_PRESETS[0]);
  const [password, setPassword] = useState('pramaan2026');

  const handleSubmit = (e) => {
    e.preventDefault();
    loginAs(selectedPreset);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col justify-between">
      {/* Tricolour Strip */}
      <div className="w-full h-1.5 flex">
        <div className="w-1/3 bg-[#FF9933]"></div>
        <div className="w-1/3 bg-[#FFFFFF]"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-xl w-full space-y-6">
          
          {/* Brand Header with Premium Shield Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center mb-1">
              <PremiumShieldLogo className="w-16 h-16 drop-shadow-md" size={64} />
            </div>
            <h1 className="text-3xl font-black text-[#1B3A6B] tracking-tight">
              Smart<span className="text-[#E8890C]">Verify</span>AI
            </h1>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Application Validation & Document Verification System
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Regulation Bureau · All India Council for Technical Education (AICTE)
            </p>
          </div>

          {/* Login Card */}
          <div className="gov-card p-6 bg-white shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Select Demo Role to Begin</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                One-Click Access
              </span>
            </h2>

            {/* Role Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
              {DEMO_PRESETS.map((preset) => {
                const isSelected = selectedPreset.role === preset.role;
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    className={`p-3 rounded text-left border transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#1B3A6B] bg-blue-50/50 shadow-xs ring-1 ring-[#1B3A6B]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{preset.role}</span>
                        {preset.role === 'Scrutiny Officer' && (
                          <span className="text-[9px] bg-[#E8890C] text-white px-1.5 py-0.2 rounded font-semibold">
                            Primary Flow
                          </span>
                        )}
                        {isSelected && preset.role !== 'Scrutiny Officer' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1B3A6B]" />
                        )}
                      </div>
                      <span className="text-slate-600 font-medium block mt-1 text-[11px]">
                        {preset.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block leading-tight">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected User Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email ID</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={selectedPreset.email}
                    readOnly
                    className="w-full pl-8 pr-3 py-2 text-xs rounded border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                className="w-full btn-gov-primary py-2.5 text-xs flex items-center justify-center space-x-1.5 shadow-xs mt-2"
              >
                <span>Sign In as {selectedPreset.role}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center text-[10px] text-slate-400 space-x-2">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span>Simulated Prototype Login · 100% Synthetic Data for SIH 2026</span>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-[11px] text-slate-500">
        <p>Prototype for Smart India Hackathon 2026 · Problem Statement 26261 · Not an official AICTE system.</p>
      </footer>
    </div>
  );
};
