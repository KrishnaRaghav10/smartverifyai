import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { BookOpen, Check, X, ShieldAlert, FileText } from 'lucide-react';

export const RulesManagement = () => {
  const { t } = useApp();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = () => {
    fetch('/api/rules')
      .then(res => res.json())
      .then(d => {
        setRules(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching rules:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = (ruleId) => {
    fetch(`/api/rules/${ruleId}/toggle`, { method: 'PUT' })
      .then(res => res.json())
      .then(resData => {
        setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: resData.enabled } : r));
      })
      .catch(err => alert("Failed to toggle rule: " + err));
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: t.nav_rules }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.nav_rules}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurable regulatory validation rules mapped to AICTE Approval Process Handbook (APH 2026-27)
          </p>
        </div>
        <div className="mt-2 sm:mt-0">
          <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-[#1B3A6B] rounded border border-blue-200">
            Source: `backend/rules/eoa_rules.json`
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading rules configuration...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div 
              key={rule.id}
              className={`p-4 rounded border transition-colors ${
                rule.enabled ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50/60 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block">{rule.id} · {rule.code}</span>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug mt-0.5">{rule.title}</h3>
                </div>
                <button
                  onClick={() => handleToggle(rule.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 shrink-0 ${
                    rule.enabled
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {rule.enabled ? <Check className="w-3.5 h-3.5 mr-1" /> : <X className="w-3.5 h-3.5 mr-1" />}
                  <span>{rule.enabled ? 'Active' : 'Disabled'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-3">{rule.description}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center text-[#1B3A6B] font-semibold">
                  <BookOpen className="w-3.5 h-3.5 mr-1 text-[#E8890C]" />
                  <span>{rule.handbook_ref}</span>
                </div>
                <span className="text-slate-500 font-medium">{rule.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
