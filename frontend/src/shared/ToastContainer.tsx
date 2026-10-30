import React from 'react';
import { useAegisStore } from '../store';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, RotateCcw } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAegisStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print">
      {toasts.map((t) => {
        let bg = 'bg-white text-[#0F1B3D] border-[#E1E6F0]';
        let Icon = Info;
        let iconColor = 'text-[#0A5CD6]';

        if (t.type === 'success') {
          bg = 'bg-emerald-50 text-emerald-950 border-emerald-300';
          Icon = CheckCircle2;
          iconColor = 'text-[#138808]';
        } else if (t.type === 'warn') {
          bg = 'bg-amber-50 text-amber-950 border-amber-300';
          Icon = AlertTriangle;
          iconColor = 'text-[#F28C28]';
        } else if (t.type === 'error') {
          bg = 'bg-rose-50 text-rose-950 border-rose-300';
          Icon = AlertCircle;
          iconColor = 'text-[#D92D20]';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-200 ${bg}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold leading-tight">{t.title}</h5>
              <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                {t.message}
              </p>
              {t.undoable && t.onUndo && (
                <button
                  onClick={() => {
                    t.onUndo?.();
                    removeToast(t.id);
                  }}
                  className="mt-2 text-[10px] font-bold text-[#1F3A8A] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Undo Action
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 shrink-0 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
