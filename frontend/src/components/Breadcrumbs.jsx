import React from 'react';
import { useApp } from '../context/AppContext';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = ({ items = [] }) => {
  const { navigateTo } = useApp();

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-4 py-1" aria-label="Breadcrumb">
      <button 
        onClick={() => navigateTo('dashboard')}
        className="flex items-center hover:text-[#1B3A6B] text-slate-500"
      >
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>SmartVerifyAI</span>
      </button>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast || !item.view ? (
              <span className="font-semibold text-slate-800 truncate">{item.label}</span>
            ) : (
              <button
                onClick={() => navigateTo(item.view, item.appId)}
                className="hover:text-[#1B3A6B] text-slate-600 truncate"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
