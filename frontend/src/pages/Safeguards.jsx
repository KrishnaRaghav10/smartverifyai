import React from 'react';
import { useApp } from '../context/AppContext';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ShieldCheck, UserCheck, Lock, Database, Clock, KeyRound, CheckCircle } from 'lucide-react';

export const Safeguards = () => {
  const { t } = useApp();

  const safeguardsList = [
    {
      title: "AI Output is Advice Only",
      icon: ShieldCheck,
      desc: "SmartVerifyAI automated extraction, record matching, and Error Level Analysis (ELA) flags are preliminary advisory indicators. They do not constitute a legal or administrative decision."
    },
    {
      title: "Zero Adverse Action Without Officer Sign-Off",
      icon: UserCheck,
      desc: "No institutional application can be rejected, deferred, or issued a show-cause notice purely by machine algorithms. An appointed AICTE Scrutiny Officer must review evidence and take the human call."
    },
    {
      title: "Strict Role-Based Access Control (RBAC)",
      icon: KeyRound,
      desc: "Access is compartmentalized across 4 distinct roles: Institution, Scrutiny Officer, Senior Officer (Regulation Bureau), and Independent Auditor. Sensitive forensic views are gated."
    },
    {
      title: "Encrypted Document Ingestion & Storage",
      icon: Lock,
      desc: "All submitted affidavits, architectural plans, and letters are digested with SHA-256 cryptographic signatures and stored in secure restricted volumes."
    },
    {
      title: "Immutable Access & Action Logging",
      icon: Database,
      desc: "Every record read, source gateway lookup, rule applied, flag raised, and officer action is appended to an immutable audit ledger that cannot be modified or deleted."
    },
    {
      title: "Authorized Source Integrations",
      icon: CheckCircle,
      desc: "Only officially accredited regulatory endpoints (State University registries, NBA/NAAC repositories, State Land Registries, and Fire Departments) are queried. No unauthorized data scraping."
    },
    {
      title: "Synthetic Data & Privacy Retention",
      icon: Clock,
      desc: "All demo institutional data is 100% synthetic for SIH 2026. Prototype uploads are purged automatically after 30 days in adherence to data hygiene protocols."
    }
  ];

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: t.nav_safeguards }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.nav_safeguards}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Architectural Safeguards, AI Ethics & Regulatory Governance Charter (Section 6)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeguardsList.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="gov-card p-4 space-y-2 border-l-3 border-l-[#1B3A6B]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded bg-blue-50 text-[#1B3A6B] flex items-center justify-center shrink-0 border border-blue-200">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-9">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Out of Scope & Future Path Summary */}
      <div className="gov-panel p-4 space-y-2 mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Scope Boundaries & Hackathon Disclaimer
        </h3>
        <p className="text-xs text-slate-600">
          Built as a prototype for <strong>Smart India Hackathon 2026 · Problem Statement 26261</strong> (Regulation Bureau, AICTE). Out of scope for this build: Live production DigiLocker/NAD production credentials, payments gateway, and field inspector smartphone application.
        </p>
      </div>
    </div>
  );
};
