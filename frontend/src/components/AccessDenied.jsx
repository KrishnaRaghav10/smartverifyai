import React from 'react';
import { useApp, ROLE_DEFAULT_PATHS } from '../context/AppContext';
import { ShieldX, ArrowLeft, Lock } from 'lucide-react';

export const AccessDenied = ({ attemptedPath }) => {
  const { currentUser, navigateTo } = useApp();

  const role = currentUser?.role || 'Guest';
  const roleHome = ROLE_DEFAULT_PATHS[role] || '/login';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-lg shadow-sm p-6 text-center space-y-4">
        
        <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600">
          <ShieldX className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
            HTTP 403 · Access Denied
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-2">
            Restricted Interface
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Your current account role <span className="font-bold text-[#1B3A6B]">"{role}"</span> does not have authorization to view <span className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">{attemptedPath}</span>.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-left text-[11px] text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Regulatory Boundary Enforcement</span>
          </div>
          <p className="text-[10px] text-slate-500">
            In AICTE regulatory systems, interfaces and endpoints are segregated by authority. Unauthorized URL traversals are recorded in the security audit ledger.
          </p>
        </div>

        <button
          onClick={() => navigateTo(roleHome)}
          className="btn-gov-primary w-full py-2.5 text-xs flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to {role} Home</span>
        </button>

      </div>
    </div>
  );
};
