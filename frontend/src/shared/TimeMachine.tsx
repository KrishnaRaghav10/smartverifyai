import React, { useState } from 'react';
import { useAegisStore } from '../store';
import { FastForward, RotateCcw, Calendar, Play, ChevronRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export const TimeMachine: React.FC = () => {
  const { simDate, advanceDays, resetDemoData, jumpToDate } = useAegisStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [customJumpDate, setCustomJumpDate] = useState('');

  const formattedDate = format(simDate, 'dd MMM yyyy');
  const formattedDay = format(simDate, 'EEEE');

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    if (customJumpDate) {
      const parsed = new Date(customJumpDate);
      if (!isNaN(parsed.getTime())) {
        jumpToDate(parsed);
        setIsExpanded(false);
      }
    }
  };

  return (
    <div className="fixed bottom-12 right-6 z-50 flex flex-col items-end gap-2 no-print font-sans">
      {/* Expanded Controls Panel */}
      {isExpanded && (
        <div className="aegis-card p-4 w-80 bg-white/95 backdrop-blur-md border border-[#1F3A8A]/30 shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1E6F0]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#E6ECFF] text-[#1F3A8A]">
                <FastForward className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F1B3D]">
                  Time Machine
                </h4>
                <p className="text-[11px] text-[#5B6785]">
                  Fast-forward simulated clock
                </p>
              </div>
            </div>
            <button
              onClick={resetDemoData}
              title="Reset Demo Data & Baseline (30 Oct 2026)"
              className="text-[11px] text-[#D92D20] hover:bg-rose-50 px-2 py-1 rounded-md flex items-center gap-1 transition-colors font-medium border border-rose-200"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-1.5 my-3">
            <button
              onClick={() => advanceDays(1)}
              className="px-2.5 py-2 rounded-xl bg-[#EEF1F8] hover:bg-[#1F3A8A] hover:text-white text-xs font-semibold text-[#0F1B3D] transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
            >
              +1 Day
            </button>
            <button
              onClick={() => advanceDays(7)}
              className="px-2.5 py-2 rounded-xl bg-[#EEF1F8] hover:bg-[#1F3A8A] hover:text-white text-xs font-semibold text-[#0F1B3D] transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
            >
              +7 Days
            </button>
            <button
              onClick={() => advanceDays(30)}
              className="px-2.5 py-2 rounded-xl bg-[#E6ECFF] hover:bg-[#1F3A8A] hover:text-white text-xs font-bold text-[#1F3A8A] transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
            >
              +30 Days
            </button>
          </div>

          {/* Jump To Specific Date */}
          <form onSubmit={handleJump} className="space-y-2 pt-2 border-t border-[#E1E6F0]">
            <label className="text-[11px] font-medium text-[#5B6785] block">
              Jump to specific date:
            </label>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={customJumpDate}
                onChange={(e) => setCustomJumpDate(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E1E6F0] focus:outline-none focus:ring-2 focus:ring-[#0A5CD6] bg-slate-50"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#1F3A8A] hover:bg-[#0F1B3D] text-white rounded-lg text-xs font-medium shrink-0 flex items-center gap-1"
              >
                Go
              </button>
            </div>
          </form>

          <p className="mt-3 text-[10px] text-[#5B6785] bg-slate-50 p-2 rounded-lg leading-relaxed">
            💡 Advancing time executes SLA calculations, triggers automated notifications, and steps escalation ladders across all modules.
          </p>
        </div>
      )}

      {/* Floating Pill Trigger */}
      <div className="flex items-center gap-1 bg-[#0F1B3D] text-white px-3 py-2 rounded-full shadow-xl hover:shadow-2xl transition-all border border-white/20 select-none">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 pr-2 border-r border-white/20 hover:text-[#F28C28] transition-colors"
          title="Toggle Time Machine Controls"
        >
          <span className="w-2 h-2 rounded-full bg-[#138808] animate-pulse" />
          <Calendar className="w-3.5 h-3.5 text-[#F28C28]" />
          <div className="text-left leading-tight">
            <span className="font-mono-num text-xs font-bold tracking-tight">
              {formattedDate}
            </span>
            <span className="text-[10px] text-white/60 block -mt-0.5">
              {formattedDay}
            </span>
          </div>
        </button>

        <button
          onClick={() => advanceDays(7)}
          className="px-2 py-1 rounded-full bg-white/10 hover:bg-[#F28C28] text-white text-[11px] font-semibold transition-all ml-1"
          title="Quick fast-forward 7 days"
        >
          +7d
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/80"
          title="More options"
        >
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>
    </div>
  );
};
