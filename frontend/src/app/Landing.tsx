import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAegisStore } from '../store';
import rolesConfig from '../config/roles.json';
import { Role } from '../types';
import {
  ShieldCheck,
  ArrowRight,
  School,
  FileCheck2,
  MapPin,
  LayoutGrid,
  CalendarDays,
  FileSpreadsheet,
  CheckCircle2,
  Crown,
  Sliders,
  History,
  Scale
} from 'lucide-react';

export const Landing: React.FC = () => {
  const { switchRole } = useAegisStore();
  const navigate = useNavigate();

  const roleIcons: Record<string, React.ReactNode> = {
    INSTITUTION: <School className="w-6 h-6" />,
    SCRUTINY_OFFICER: <FileCheck2 className="w-6 h-6" />,
    REGIONAL_OFFICER: <MapPin className="w-6 h-6" />,
    BUREAU_OFFICER: <LayoutGrid className="w-6 h-6" />,
    EVC_COORDINATOR: <CalendarDays className="w-6 h-6" />,
    COMMITTEE_MEMBER: <FileSpreadsheet className="w-6 h-6" />,
    COMPLIANCE_OFFICER: <CheckCircle2 className="w-6 h-6" />,
    SENIOR_AUTHORITY: <Crown className="w-6 h-6" />,
    SYSTEM_ADMIN: <Sliders className="w-6 h-6" />,
    AUDITOR: <History className="w-6 h-6" />
  };

  const roleRoutes: Record<string, string> = {
    INSTITUTION: '/institution',
    SCRUTINY_OFFICER: '/scrutiny',
    REGIONAL_OFFICER: '/regional',
    BUREAU_OFFICER: '/bureau',
    EVC_COORDINATOR: '/evc',
    COMMITTEE_MEMBER: '/committee',
    COMPLIANCE_OFFICER: '/compliance',
    SENIOR_AUTHORITY: '/authority',
    SYSTEM_ADMIN: '/admin',
    AUDITOR: '/auditor'
  };

  const handleSelectRole = (role: Role) => {
    switchRole(role);
    const targetRoute = roleRoutes[role] || '/';
    navigate(targetRoute);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-sans selection:bg-[#E6ECFF] selection:text-[#1F3A8A]">
      {/* Hero Header Panel with Ashoka Chakra 4% pattern */}
      <div className="relative bg-white border-b border-[#E1E6F0] py-16 px-4 sm:px-6 lg:px-8 ashoka-chakra-pattern overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10 space-y-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6ECFF] border border-[#1F3A8A]/20 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#138808] animate-pulse" />
            <span className="text-xs font-bold text-[#1F3A8A] uppercase tracking-wider">
              Statutory Platform · AICTE Approval & Compliance 2026-27
            </span>
          </div>

          {/* Logo & Headline */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <img src="/shield.svg" alt="AEGIS Mark" className="w-14 h-14" />
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1F3A8A] tracking-tight font-['Poppins']">
                AEGIS
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#5B6785] -mt-1 tracking-wide">
                AICTE Approval & Compliance Management System
              </p>
            </div>
          </div>

          <p className="text-base sm:text-lg text-[#0F1B3D] max-w-2xl mx-auto font-medium">
            "Bringing every approval under control."
          </p>

          <p className="text-xs sm:text-sm text-[#5B6785] max-w-3xl mx-auto leading-relaxed">
            Automating multi-stage routing (Scrutiny, Re-Scrutiny, EVC, SAC/SHC), pendency monitoring,
            time-bound undertakings, lease validity radar, and immutable audit trails across 10 dedicated role perspectives.
          </p>

          {/* Action CTAs */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleSelectRole('INSTITUTION')}
              className="px-6 py-3 rounded-2xl bg-[#0A5CD6] hover:bg-[#0747a6] text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
            >
              <span>Enter Institution Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSelectRole('SCRUTINY_OFFICER')}
              className="px-6 py-3 rounded-2xl bg-[#1F3A8A] hover:bg-[#0F1B3D] text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
            >
              <span>Explore Scrutiny Officer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Regulatory Safeguard Notice Line */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs text-[#5B6785] bg-[#EEF1F8] py-2 px-4 rounded-xl border border-[#E1E6F0]">
              <Scale className="w-4 h-4 text-[#1F3A8A] shrink-0" />
              <span>
                Automated alerts support, but do not replace, statutory scrutiny and decisions of the competent authority.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 10 Role Cards Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-extrabold text-[#0F1B3D] tracking-tight">
              Select Role Perspective to Enter
            </h2>
            <p className="text-xs text-[#5B6785] mt-0.5">
              Select any role below to evaluate its dedicated workflow perspective.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {rolesConfig.map((cfg) => {
            const icon = roleIcons[cfg.role] || <ShieldCheck className="w-6 h-6" />;
            return (
              <div
                key={cfg.role}
                onClick={() => handleSelectRole(cfg.role as Role)}
                className="aegis-card aegis-card-hover p-4 cursor-pointer flex flex-col justify-between group relative overflow-hidden bg-white border hover:border-transparent"
                style={{
                  borderTop: `4px solid ${cfg.accentColor}`
                }}
              >
                <div>
                  <div className="flex items-center mb-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110"
                      style={{ backgroundColor: cfg.accentColor }}
                    >
                      {icon}
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-[#0F1B3D] group-hover:text-[#1F3A8A] transition-colors leading-snug">
                    {cfg.portalName}
                  </h3>

                  <p className="text-[11px] text-[#5B6785] mt-1 line-clamp-2 leading-relaxed">
                    {cfg.mood}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E1E6F0] flex items-center justify-between">
                  <div className="min-w-0 pr-1">
                    <span className="text-[10px] font-bold text-[#0F1B3D] block truncate">
                      {cfg.demoUser.name}
                    </span>
                    <span className="text-[9px] text-[#5B6785] block truncate">
                      {cfg.demoUser.designation}
                    </span>
                  </div>
                  <span
                    className="p-1 rounded-lg text-white shrink-0 group-hover:translate-x-0.5 transition-transform"
                    style={{ backgroundColor: cfg.accentColor }}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
