import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { History, Download, Filter, RefreshCw, ShieldCheck } from 'lucide-react';

export const AuditLog = () => {
  const { t } = useApp();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('All');

  const fetchLogs = () => {
    setLoading(true);
    let url = `/api/audit-logs?`;
    if (actionFilter !== 'All') url += `action=${encodeURIComponent(actionFilter)}&`;

    fetch(url)
      .then(res => res.json())
      .then(d => {
        setLogs(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching logs:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleExportCSV = () => {
    window.open('/api/audit-logs/export', '_blank');
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: t.nav_audit }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.nav_audit}</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
              Immutable Regulatory Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed audit trail recording every rule applied, record read, source checked, and officer adjudication.
          </p>
        </div>

        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="btn-gov-primary text-xs py-1.5 px-3 flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="gov-card p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Event Type:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="py-1 px-2.5 rounded border border-slate-300 bg-white text-slate-800 focus:outline-none"
          >
            <option value="All">All Audit Events</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="RECORD_READ">Record Read</option>
            <option value="SOURCE_CALLED">Source Gateway Check</option>
            <option value="OFFICER_ACTION">Officer Adjudication</option>
            <option value="PIPELINE_EVALUATION">Pipeline Evaluation</option>
            <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
            <option value="RULE_TOGGLED">Rule Configuration Toggled</option>
          </select>
        </div>

        <button
          onClick={fetchLogs}
          className="p-1 rounded border border-slate-300 hover:bg-slate-50 text-slate-600"
          title="Refresh logs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="gov-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Loading immutable audit entries...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No audit records match the filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F8FB] text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Event ID</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">User & Role</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Application ID</th>
                  <th className="py-2.5 px-3">Details / Audit Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-500 whitespace-nowrap">
                      #{log.id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{log.user_name}</span>
                      <span className="text-[10px] text-slate-400">{log.user_role}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#1B3A6B] whitespace-nowrap">
                      {log.application_id || 'System'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
