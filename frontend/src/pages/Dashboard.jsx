import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StatusTag } from '../components/StatusTag';
import { 
  FileCheck2, AlertTriangle, XCircle, Clock, 
  Layers, ArrowUpRight, CheckCircle, BarChart3, 
  Activity, ArrowRight
} from 'lucide-react';

export const Dashboard = () => {
  const { t, navigateTo } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-500 text-xs">
        Loading regulatory summary data...
      </div>
    );
  }

  const counts = data?.counts || { total: 0, clean: 0, needs_review: 0, deficient: 0, verification_pending: 0 };
  const latestApps = data?.latest_applications || [];
  const alerts = data?.alerts || [];
  const chartData = data?.deficiencies_by_type || [];
  const metrics = data?.prototype_metrics || {
    extraction_accuracy_pct: 98.4,
    avg_verification_time_sec: 1.2,
    flags_per_100_apps: 46.7,
    source_success_rate_pct: 94.2
  };

  const maxCount = Math.max(...chartData.map(c => c.count), 1);

  return (
    <div className="space-y-6">
      
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.nav_dashboard}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t.tagline}</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button 
            onClick={() => navigateTo('applications')} 
            className="btn-gov-primary text-xs"
          >
            <span>{t.nav_applications}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      </div>

      {/* 1. Five Count Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total */}
        <div 
          onClick={() => navigateTo('applications')}
          className="gov-card p-3 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t.total_apps}</span>
            <Layers className="w-4 h-4 text-[#1B3A6B]" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{counts.total}</div>
          <span className="text-[10px] text-slate-400">All submitted dossiers</span>
        </div>

        {/* Clean */}
        <div 
          onClick={() => navigateTo('applications')}
          className="gov-card p-3 cursor-pointer hover:border-emerald-400 transition-colors bg-emerald-50/20"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t.clean_apps}</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">{counts.clean}</div>
          <span className="text-[10px] text-emerald-600">Zero anomalies flagged</span>
        </div>

        {/* Needs Review */}
        <div 
          onClick={() => navigateTo('applications')}
          className="gov-card p-3 cursor-pointer hover:border-amber-400 transition-colors bg-amber-50/20"
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t.needs_review_apps}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-800">{counts.needs_review}</div>
          <span className="text-[10px] text-amber-600">Discrepancy identified</span>
        </div>

        {/* Deficient */}
        <div 
          onClick={() => navigateTo('applications')}
          className="gov-card p-3 cursor-pointer hover:border-rose-400 transition-colors bg-rose-50/20"
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t.deficient_apps}</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-800">{counts.deficient}</div>
          <span className="text-[10px] text-rose-600">Missing or lapsed docs</span>
        </div>

        {/* Verification Pending */}
        <div 
          onClick={() => navigateTo('applications')}
          className="gov-card p-3 cursor-pointer hover:border-blue-400 transition-colors bg-blue-50/20"
        >
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t.pending_apps}</span>
            <Clock className="w-4 h-4 text-[#1B3A6B]" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{counts.verification_pending}</div>
          <span className="text-[10px] text-blue-600">External check awaiting</span>
        </div>
      </div>

      {/* 2. Middle Row: "Needs Your Attention" Alerts & Deficiencies Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Needs Your Attention */}
        <div className="lg:col-span-2 gov-card p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#E8890C]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {t.needs_attention}
              </h2>
            </div>
            <span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-200">
              {alerts.length} Pending Actions
            </span>
          </div>

          <div className="space-y-2.5">
            {alerts.map((al, idx) => (
              <div 
                key={idx}
                onClick={() => navigateTo('application_detail', al.app_id)}
                className="p-3 rounded border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 transition-colors cursor-pointer flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#1B3A6B]">{al.app_id}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-white text-rose-700 border border-rose-200 rounded">
                      {al.type}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-1">{al.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{al.description}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className="text-[10px] text-[#E8890C] font-semibold">{al.time}</span>
                  <div className="mt-1 flex items-center justify-end text-xs text-[#1B3A6B] font-medium">
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Deficiencies by Category Bar Chart */}
        <div className="gov-card p-4">
          <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100">
            <BarChart3 className="w-4 h-4 text-[#1B3A6B]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t.deficiency_by_type}
            </h2>
          </div>

          <div className="space-y-3 pt-1">
            {chartData.map((item, idx) => {
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium truncate max-w-[170px]" title={item.type}>
                      {item.type}
                    </span>
                    <span className="font-bold text-slate-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded overflow-hidden">
                    <div 
                      className="bg-[#1B3A6B] h-full rounded" 
                      style={{ width: `${Math.max(pct, 12)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. Latest 10 Applications Table */}
      <div className="gov-card p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#1B3A6B]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t.latest_applications}
            </h2>
          </div>
          <button 
            onClick={() => navigateTo('applications')} 
            className="text-xs font-medium text-[#1B3A6B] hover:underline"
          >
            View all 15 applications →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F8FB] text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Application ID</th>
                <th className="py-2.5 px-3">Institution Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Submitted On</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Flags</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {latestApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[#1B3A6B] whitespace-nowrap">
                    {app.id}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {app.institute_name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    {app.category}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {app.submitted_on}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <StatusTag status={app.status} />
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {app.flags_count > 0 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {app.flags_count} flags
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-semibold">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => navigateTo('application_detail', app.id)}
                      className="text-xs text-[#1B3A6B] hover:text-[#0f2343] font-semibold hover:underline"
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Prototype Metrics Panel (Section 11) */}
      <div className="gov-panel p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Activity className="w-4 h-4 text-[#1B3A6B]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t.prototype_metrics}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-medium">{t.extraction_accuracy}</span>
            <span className="text-xl font-bold text-emerald-700">{metrics.extraction_accuracy_pct}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Sample dataset validation</span>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-medium">{t.avg_verification_time}</span>
            <span className="text-xl font-bold text-[#1B3A6B]">{metrics.avg_verification_time_sec}s</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Mock source round-trip</span>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-medium">{t.flags_per_hundred}</span>
            <span className="text-xl font-bold text-amber-700">{metrics.flags_per_100_apps}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Regulatory anomaly rate</span>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-medium">{t.source_success_rate}</span>
            <span className="text-xl font-bold text-emerald-700">{metrics.source_success_rate_pct}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Registry gateway uptime</span>
          </div>
        </div>
      </div>

    </div>
  );
};
