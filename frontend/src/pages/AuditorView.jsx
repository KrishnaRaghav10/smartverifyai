import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  History, Eye, BookOpen, DownloadCloud, Search, Filter,
  ShieldCheck, Lock, AlertCircle, FileText
} from 'lucide-react';
import { StatusTag } from '../components/StatusTag';

export const AuditorView = () => {
  const { currentUser, currentPath, navigateTo, authFetch } = useApp();
  const [logs, setLogs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [rules, setRules] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters for Audit Log
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, appsRes, rulesRes] = await Promise.all([
        authFetch('/api/audit-logs'),
        authFetch('/api/applications'),
        authFetch('/api/rules')
      ]);

      if (logsRes.ok) setLogs(await logsRes.json());
      if (appsRes.ok) {
        const apps = await appsRes.json();
        setApplications(apps);

        const detailMatch = currentPath.match(/\/audit\/application\/([^/]+)/);
        if (detailMatch) {
          const detRes = await authFetch(`/api/applications/${detailMatch[1]}`);
          if (detRes.ok) setSelectedApp(await detRes.json());
        }
      }
      if (rulesRes.ok) setRules(await rulesRes.json());
    } catch (err) {
      console.error("Auditor view error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPath]);

  // CSV Export Download
  const handleDownloadCSV = () => {
    window.open('/api/audit-logs/export', '_blank');
  };

  // Filtered Audit Logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = !search || 
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.user_name.toLowerCase().includes(search.toLowerCase()) ||
      log.application_id.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "All" || log.action === actionFilter;
    const matchesRole = roleFilter === "All" || log.user_role === roleFilter;
    return matchesSearch && matchesAction && matchesRole;
  });

  // Sub-route: /audit/rules
  if (currentPath === '/audit/rules') {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Regulatory Rulebook (Read-Only Audit)</h1>
            <p className="text-xs text-slate-500 mt-1">Inspection of AICTE Approval Process Handbook rules and operational status.</p>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-slate-600 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Read-Only Surveillance Mode</span>
          </div>
        </div>

        <div className="space-y-3">
          {rules.map((r) => (
            <div key={r.id} className="gov-card p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {r.code}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{r.title}</span>
                  <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                    {r.handbook_ref}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{r.description}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  r.enabled ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {r.enabled ? "ENABLED" : "DISABLED"}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold italic">(No edit rights)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sub-route: /audit/export
  if (currentPath === '/audit/export') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-black text-slate-900">Export Immutable Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Download certified compliance records containing timestamped logs, source checks, and decisions.
          </p>
        </div>

        <div className="gov-card p-6 bg-white border border-slate-200 rounded-lg space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2 text-xs">
            <span className="font-bold text-slate-800 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1B3A6B]" />
              <span>Certified Regulatory Ledger</span>
            </span>
            <p className="text-slate-600 text-[11px]">
              This export conforms to Section 8 of the AICTE Regulatory Specifications. It exports an SHA-256 verifiable CSV containing exact UTC timestamps, user roles, IP addresses, and detailed action logs.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleDownloadCSV}
              className="btn-gov-primary px-6 py-2.5 text-xs font-bold flex items-center space-x-2"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Download Official Audit Trail (CSV)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sub-route: /audit/applications or detail view
  if (currentPath === '/audit/applications' || currentPath.startsWith('/audit/application/')) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Applications Archive (Read-Only)</h1>
            <p className="text-xs text-slate-500 mt-1">Inspection of complete institutional dossiers, verifications, and decisions.</p>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-slate-600 text-xs font-semibold">
            <Eye className="w-3.5 h-3.5" />
            <span>Read-Only Dossier View</span>
          </div>
        </div>

        {selectedApp ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-2 py-1 text-xs font-bold rounded border border-slate-300 bg-white"
                >
                  ← Back to List
                </button>
                <span className="font-bold text-sm text-[#1B3A6B]">{selectedApp.id}</span>
                <span className="text-xs text-slate-600">· {selectedApp.institute?.name}</span>
              </div>
              <StatusTag status={selectedApp.status} />
            </div>

            {/* Read-Only Notice Banner */}
            <div className="p-3 bg-slate-100 border border-slate-300 rounded text-xs text-slate-700 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Auditor Interface: No edit, verification, or decision actions are permitted in this mode.</span>
            </div>

            {/* Complete Dossier Data Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Documents & Source Checks */}
              <div className="gov-card p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                <span className="font-bold uppercase tracking-wider text-slate-700 block text-[11px]">
                  Uploaded Statutory Documents ({selectedApp.documents?.length || 0})
                </span>
                <div className="space-y-2">
                  {selectedApp.documents?.map((d) => (
                    <div key={d.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                      <div className="font-bold text-slate-900">{d.type}</div>
                      <div className="text-[11px] text-slate-500">Ref: {d.ref_number} · Expiry: {d.expiry_date || 'N/A'}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">SHA256: {d.sha256}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forensic Flags */}
              <div className="gov-card p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                <span className="font-bold uppercase tracking-wider text-slate-700 block text-[11px]">
                  Forensic Anomaly Records ({selectedApp.flags?.length || 0})
                </span>
                <div className="space-y-2">
                  {selectedApp.flags?.length === 0 ? (
                    <p className="text-slate-400 text-xs">No forensic flags recorded.</p>
                  ) : (
                    selectedApp.flags?.map((f) => (
                      <div key={f.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{f.type}</span>
                          <span className="text-[10px] text-slate-500">State: {f.state}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">{f.what}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="gov-card bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#1B3A6B] text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-left">App ID</th>
                  <th className="py-2.5 px-3 text-left">Institution</th>
                  <th className="py-2.5 px-3 text-left">Category</th>
                  <th className="py-2.5 px-3 text-left">Submitted</th>
                  <th className="py-2.5 px-3 text-left">Decision Order</th>
                  <th className="py-2.5 px-3 text-right">View Only</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-[#1B3A6B]">{a.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{a.institute_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{a.category}</td>
                    <td className="py-2.5 px-3 text-slate-500">{a.submitted_on}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {a.final_decision || a.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={async () => {
                          const res = await authFetch(`/api/applications/${a.id}`);
                          if (res.ok) setSelectedApp(await res.json());
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100 text-slate-700"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT /audit/logs: AUDIT TABLE VIEW
  return (
    <div className="space-y-6">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-slate-700" />
            <h1 className="text-xl font-black text-slate-900">
              Regulatory Audit Ledger & Surveillance
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditor: <span className="font-bold text-slate-800">{currentUser.name}</span> · Independent Audit Wing · Immutable System Ledger
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="btn-gov-primary px-3.5 py-2 text-xs font-bold flex items-center space-x-2 shadow-xs self-start sm:self-auto"
        >
          <DownloadCloud className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search details, user, application ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs p-1.5 rounded border border-slate-300 bg-white font-medium"
          >
            <option value="All">All User Roles</option>
            <option value="Institution">Institution</option>
            <option value="Scrutiny Officer">Scrutiny Officer</option>
            <option value="Senior Officer">Senior Officer</option>
            <option value="Auditor">Auditor</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs p-1.5 rounded border border-slate-300 bg-white font-medium"
          >
            <option value="All">All Action Types</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="RECORD_READ">RECORD_READ</option>
            <option value="SOURCE_CALLED">SOURCE_CALLED</option>
            <option value="FLAG_REVIEWED">FLAG_REVIEWED</option>
            <option value="FINAL_DECISION">FINAL_DECISION</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
            <option value="RULE_TOGGLED">RULE_TOGGLED</option>
          </select>
        </div>
      </div>

      {/* 3. Searchable Audit Table (time, user, role, action, application, details) */}
      <div className="gov-card bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#1B3A6B] text-white font-semibold">
            <tr>
              <th className="py-2.5 px-3 text-left">Timestamp (UTC)</th>
              <th className="py-2.5 px-3 text-left">User</th>
              <th className="py-2.5 px-3 text-left">Role</th>
              <th className="py-2.5 px-3 text-left">Action</th>
              <th className="py-2.5 px-3 text-left">Application</th>
              <th className="py-2.5 px-3 text-left">Event Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filteredLogs.map((log) => {
              const isAccessDenied = log.action === 'ACCESS_DENIED';
              return (
                <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${isAccessDenied ? 'bg-rose-50/50' : ''}`}>
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2 px-3 font-sans font-semibold text-slate-900 whitespace-nowrap">{log.user_name}</td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-sans font-semibold border ${
                      log.user_role === 'Institution' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      log.user_role === 'Scrutiny Officer' ? 'bg-blue-50 text-blue-900 border-blue-200' :
                      log.user_role === 'Senior Officer' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {log.user_role}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      isAccessDenied ? 'bg-rose-100 text-rose-800 font-sans' : 'text-[#1B3A6B]'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-sans font-bold text-slate-700">{log.application_id || 'General'}</td>
                  <td className="py-2 px-3 font-sans text-slate-700 leading-tight max-w-md">{log.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
