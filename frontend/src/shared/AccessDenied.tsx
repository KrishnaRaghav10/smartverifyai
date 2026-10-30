import React from 'react';
import { useAegisStore } from '../store';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import rolesConfig from '../config/roles.json';

interface AccessDeniedProps {
  requiredRole?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole }) => {
  const { currentUser, switchRole } = useAegisStore();
  const navigate = useNavigate();

  const handleSwitchToRequired = () => {
    if (requiredRole) {
      switchRole(requiredRole as any);
      navigate(0); // reload view
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full aegis-card p-8 text-center space-y-4 border-rose-200 shadow-xl bg-white">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-[#D92D20] flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D92D20]">
            HTTP 403 · Access Restricted
          </span>
          <h2 className="text-xl font-bold text-[#0F1B3D]">
            Not Authorised for Your Role
          </h2>
          <p className="text-xs text-[#5B6785] leading-relaxed">
            This module requires the statutory authority of a{' '}
            <strong className="text-[#0F1B3D]">{requiredRole || 'different role'}</strong>.
            You are currently signed in as{' '}
            <strong className="text-[#0F1B3D]">{currentUser.name}</strong> ({currentUser.role}).
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-2">
          {requiredRole && (
            <button
              onClick={handleSwitchToRequired}
              className="w-full py-2.5 px-4 bg-[#1F3A8A] hover:bg-[#0F1B3D] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              Switch to {requiredRole.replace(/_/g, ' ')} Perspective
            </button>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 bg-[#EEF1F8] hover:bg-slate-200 text-[#0F1B3D] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to AEGIS Landing Hub
          </button>
        </div>
      </div>
    </div>
  );
};
