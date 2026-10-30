import React, { useState, useEffect } from 'react';
import { useAegisStore } from '../store';
import { Terminal, X, PlusCircle, AlertTriangle, UploadCloud, ArrowUpRight } from 'lucide-react';
import { Application } from '../types';
import { formatISO, addDays } from 'date-fns';

export const DevScenarioPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { applications, advanceDays, addToast, uploadUndertakingEvidence, undertakings } = useAegisStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const handleSimulateUpload = () => {
    const openUnd = undertakings.find((u) => u.status === 'OPEN');
    if (openUnd) {
      uploadUndertakingEvidence(openUnd.id, {
        id: `EVD-SIM-${Date.now()}`,
        name: 'Simulated_Compliance_Evidence.pdf',
        url: '/sample_data/proof.pdf',
        uploadedAt: new Date().toISOString(),
        size: '2.1 MB',
        fileType: 'application/pdf',
        status: 'PENDING'
      });
      addToast({
        type: 'success',
        title: 'Dev Scenario: Evidence Uploaded',
        message: `Simulated document upload for undertaking: ${openUnd.condition.slice(0, 40)}...`
      });
    }
  };

  const handleForceOverdue = () => {
    advanceDays(14);
    addToast({
      type: 'warn',
      title: 'Dev Scenario: Fast-forward 14 Days',
      message: 'Clock fast-forwarded by 14 days. Several cases transitioned to OVERDUE and ESCALATED.'
    });
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 animate-in fade-in duration-200 no-print font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <Terminal className="w-4 h-4" />
          <span>DEV SCENARIO RUNNER</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-slate-400 mb-3">
        Simulate evaluator edge-cases and rapid transitions (Toggle: Ctrl+Shift+D).
      </p>

      <div className="space-y-2">
        <button
          onClick={handleForceOverdue}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl transition-colors text-left"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Force Overdue & Escalation</span>
          </span>
          <span className="text-[10px] bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-200">+14d</span>
        </button>

        <button
          onClick={handleSimulateUpload}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl transition-colors text-left"
        >
          <span className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>Simulate Inst. Evidence Upload</span>
          </span>
          <span className="text-[10px] bg-cyan-400/20 px-1.5 py-0.5 rounded text-cyan-200">Upload</span>
        </button>

        <button
          onClick={() => {
            advanceDays(60);
          }}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl transition-colors text-left"
        >
          <span className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
            <span>Fast-Forward 60 Days (Expiry)</span>
          </span>
          <span className="text-[10px] bg-rose-400/20 px-1.5 py-0.5 rounded text-rose-200">+60d</span>
        </button>
      </div>
    </div>
  );
};
