import React, { useState, useEffect } from 'react';
import { useAegisStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Building2, FastForward, CheckSquare, Shield, X, ArrowRight } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, applications, institutions, advanceDays, switchRole } = useAegisStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredApps = query.trim()
    ? applications
        .filter(
          (a) =>
            a.id.toLowerCase().includes(query.toLowerCase()) ||
            a.institutionName.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
    : applications.slice(0, 4);

  const filteredInsts = query.trim()
    ? institutions
        .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()) || i.aicteId.includes(query))
        .slice(0, 3)
    : institutions.slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E1E6F0] overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E1E6F0] gap-3 bg-[#F7F8FC]">
          <Search className="w-5 h-5 text-[#5B6785]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications, institutions, or actions (e.g. 'Aarohan', 'APP-W', 'advance')..."
            className="w-full bg-transparent text-sm text-[#0F1B3D] placeholder-[#5B6785] focus:outline-none"
          />
          <span className="text-[11px] font-mono bg-white border border-[#E1E6F0] text-[#5B6785] px-2 py-0.5 rounded-md shadow-sm">
            ESC
          </span>
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="text-[#5B6785] hover:text-[#0F1B3D]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          <div>
            <h5 className="text-[11px] font-bold text-[#5B6785] uppercase tracking-wider px-3 mb-1.5">
              Quick Time Machine Actions
            </h5>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  advanceDays(7);
                  setCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#E6ECFF] hover:text-[#1F3A8A] rounded-xl transition-colors text-left"
              >
                <FastForward className="w-4 h-4 text-[#F28C28]" />
                Fast-forward Clock (+7 Days)
              </button>
              <button
                onClick={() => {
                  advanceDays(30);
                  setCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#E6ECFF] hover:text-[#1F3A8A] rounded-xl transition-colors text-left"
              >
                <FastForward className="w-4 h-4 text-[#D92D20]" />
                Fast-forward Clock (+30 Days)
              </button>
            </div>
          </div>

          {/* Applications Match */}
          {filteredApps.length > 0 && (
            <div>
              <h5 className="text-[11px] font-bold text-[#5B6785] uppercase tracking-wider px-3 mb-1.5 flex items-center justify-between">
                <span>Applications</span>
                <span className="text-[10px] font-normal lowercase">press click to view</span>
              </h5>
              <div className="space-y-1">
                {filteredApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      setCommandPaletteOpen(false);
                      navigate(`/scrutiny/case/${app.id}`);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#EEF1F8] rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[#1F3A8A]" />
                      <div>
                        <span className="font-mono-num font-bold text-[#0F1B3D] mr-2">
                          {app.id}
                        </span>
                        <span className="text-[#5B6785] group-hover:text-[#0F1B3D]">
                          {app.institutionName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {app.currentStage}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#5B6785] group-hover:text-[#1F3A8A] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Institutions Match */}
          {filteredInsts.length > 0 && (
            <div>
              <h5 className="text-[11px] font-bold text-[#5B6785] uppercase tracking-wider px-3 mb-1.5">
                Institutions
              </h5>
              <div className="space-y-1">
                {filteredInsts.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => {
                      switchRole('INSTITUTION');
                      setCommandPaletteOpen(false);
                      navigate('/institution');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#EEF1F8] rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-[#0A5CD6]" />
                      <div>
                        <span className="font-medium text-[#0F1B3D]">
                          {inst.name}
                        </span>
                        <span className="text-[11px] text-[#5B6785] ml-2">
                          ({inst.region} Region · AICTE ID {inst.aicteId})
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#0A5CD6] font-semibold">
                      Switch View &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#F7F8FC] border-t border-[#E1E6F0] flex items-center justify-between text-[11px] text-[#5B6785]">
          <span>Navigation shortcut: Use arrow keys or click to open</span>
          <span className="font-mono">AEGIS v2.4</span>
        </div>
      </div>
    </div>
  );
};
