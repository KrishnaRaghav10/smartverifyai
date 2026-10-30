import React from 'react';
import { ShieldCheck, Scale, Info } from 'lucide-react';

export const SafeguardFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#FFFFFF] border-t border-[#E1E6F0] py-2.5 px-4 text-xs text-[#5B6785] shrink-0 no-print">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center md:text-left">
          <Scale className="w-4 h-4 text-[#1F3A8A] shrink-0" />
          <span className="font-medium text-[#0F1B3D]">
            Statutory Safeguard:
          </span>
          <span>
            Automated alerts support, but do not replace, statutory scrutiny and decisions of the competent authority.
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] shrink-0">
          <span className="flex items-center gap-1 text-[#138808] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Hash-Chain Verified
          </span>
          <span className="text-[#5B6785]">
            AICTE AEGIS v2.4 (Simulated Clock)
          </span>
        </div>
      </div>
    </footer>
  );
};
