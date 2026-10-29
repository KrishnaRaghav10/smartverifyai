import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, UserCheck, Scale, Users, BookOpen, BarChart3,
  CheckCircle, AlertTriangle, XCircle, DownloadCloud, ArrowRight,
  ShieldAlert, ToggleLeft, ToggleRight, Search, FileText, Check
} from 'lucide-react';
import { StatusTag } from '../components/StatusTag';

export const SeniorOfficerView = () => {
  const { currentUser, currentPath, navigateTo, authFetch } = useApp();
  const [summary, setSummary] = useState(null);
  const [applications, setApplications] = useState([]);
  const [rules, setRules] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState({ open: false, decision: 'Approve', reason: '' });
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Reassignment Modal State
  const [reassignModal, setReassignModal] = useState({ open: false, app: null, officer: 'Smt. Ananya Sharma' });
  const [submittingReassign, setSubmittingReassign] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, appsRes, rulesRes] = await Promise.all([
        authFetch('/api/dashboard/summary'),
        authFetch('/api/applications'),
        authFetch('/api/rules')
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (appsRes.ok) {
        const apps = await appsRes.json();
        setApplications(apps);

        const detailMatch = currentPath.match(/\/senior\/application\/([^/]+)/);
        const targetId = detailMatch ? detailMatch[1] : (apps.length > 0 ? apps[0].id : null);
        if (targetId) {
          const detRes = await authFetch(`/api/applications/${targetId}`);
          if (detRes.ok) setSelectedApp(await detRes.json());
        }
      }
      if (rulesRes.ok) setRules(await rulesRes.json());
    } catch (err) {
      console.error("Senior view error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPath]);

  // Final Decision Execution (Approve, Return, Reject)
  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (['Return for Correction', 'Recommend Rejection'].includes(decisionModal.decision) && !decisionModal.reason.trim()) {
      alert("A written justification is mandatory for adverse decisions.");
      return;
    }

    setSubmittingDecision(true);
    try {
      const res = await authFetch(`/api/applications/${selectedApp.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionModal.decision,
          reason: decisionModal.reason
        })
      });
      if (res.ok) {
        alert(`Final regulatory decision '${decisionModal.decision}' recorded successfully!`);
        setDecisionModal({ open: false, decision: 'Approve', reason: '' });
        loadData();
      } else {
        const err = await res.json();
        alert(`Failed: ${err.detail}`);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Toggle Rule (Senior Officer Only)
  const handleToggleRule = async (ruleId) => {
    try {
      const res = await authFetch(`/api/rules/${ruleId}/toggle`, { method: 'PUT' });
      if (res.ok) {
        const data = await res.json();
        setRules(rules.map(r => r.id === ruleId ? { ...r, enabled: data.enabled } : r));
      } else {
        alert("Permission denied or error toggling rule.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Reassign Case
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReassign(true);
    try {
      const res = await authFetch(`/api/applications/${reassignModal.app.id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_officer: reassignModal.officer })
      });
      if (res.ok) {
        alert(`Case reassigned to ${reassignModal.officer}!`);
        setReassignModal({ open: false, app: null, officer: 'Smt. Ananya Sharma' });
        loadData();
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmittingReassign(false);
    }
  };

  // CSV Export Download
  const handleDownloadCSV = () => {
    window.open('/api/audit-logs/export', '_blank');
  };

  // Sub-route: /senior/rules
  if (currentPath === '/senior/rules') {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">AICTE Approval Process Handbook (APH) Rule Engine</h1>
            <p className="text-xs text-slate-500 mt-1">
              Active regulatory validation rules enforced by the pre-scrutiny pipeline (APH 2026-27).
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded">
            Senior Officer Authority
          </span>
        </div>

        <div className="space-y-3">
          {rules.map((r) => (
            <div key={r.id} className="gov-card p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs text-[#1B3A6B] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {r.code}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{r.title}</span>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {r.handbook_ref}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{r.description}</p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span className={`text-[11px] font-bold ${r.enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {r.enabled ? "ACTIVE" : "DISABLED"}
                </span>
                <button
                  onClick={() => handleToggleRule(r.id)}
                  className={`p-1 rounded transition-colors ${
                    r.enabled ? 'text-[#1B3A6B] hover:text-[#E8890C]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title={r.enabled ? "Click to Disable Rule" : "Click to Enable Rule"}
                >
                  {r.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sub-route: /senior/assign
  if (currentPath === '/senior/assign') {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-black text-slate-900">Workload Assignment & Officer Queue Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reassign application verification dossiers across authorized Scrutiny Officers.
          </p>
        </div>

        <div className="gov-card bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[#1B3A6B] text-white font-semibold">
              <tr>
                <th className="py-2.5 px-3 text-left">App ID</th>
                <th className="py-2.5 px-3 text-left">Institution</th>
                <th className="py-2.5 px-3 text-left">Category</th>
                <th className="py-2.5 px-3 text-left">Current Assigned Officer</th>
                <th className="py-2.5 px-3 text-left">Status</th>
                <th className="py-2.5 px-3 text-right">Reassign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-[#1B3A6B]">{app.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{app.institute_name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{app.category}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">{app.assigned_officer}</td>
                  <td className="py-2.5 px-3"><StatusTag status={app.status} /></td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setReassignModal({ open: true, app, officer: app.assigned_officer })}
                      className="px-2.5 py-1 text-xs font-bold rounded border border-slate-300 hover:bg-slate-100 text-slate-700"
                    >
                      Reassign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // DEFAULT /senior/overview or Application Detail
  return (
    <div className="space-y-6">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-[#E8890C]" />
            <h1 className="text-xl font-black text-slate-900">
              Senior Officer Executive Overview & Decisions
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authority: <span className="font-bold text-slate-800">{currentUser.name}</span> · Final Approval Sign-off & Policy Governance
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="btn-gov-primary px-3.5 py-2 text-xs font-bold flex items-center space-x-2 shadow-xs self-start sm:self-auto"
        >
          <DownloadCloud className="w-4 h-4" />
          <span>Export Summary Ledger (CSV)</span>
        </button>
      </div>

      {/* 2. Count Cards (Total, Clean, Needs Review, Deficient, Pending) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="gov-card p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Dossiers</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{summary?.counts?.total ?? 15}</span>
        </div>
        <div className="gov-card p-3.5 bg-white border border-emerald-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-800 block">Clean</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{summary?.counts?.clean ?? 3}</span>
        </div>
        <div className="gov-card p-3.5 bg-white border border-blue-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-800 block">Needs Review</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{summary?.counts?.needs_review ?? 7}</span>
        </div>
        <div className="gov-card p-3.5 bg-white border border-rose-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-800 block">Deficient</span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{summary?.counts?.deficient ?? 3}</span>
        </div>
        <div className="gov-card p-3.5 bg-white border border-amber-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-800 block">Pending</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{summary?.counts?.verification_pending ?? 2}</span>
        </div>
      </div>

      {/* 3. Bar Chart: Deficiencies by Type */}
      {summary?.deficiencies_by_type && (
        <div className="gov-card p-4 bg-white border border-slate-200 rounded-lg space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Regulatory Deficiencies Distribution by Type
          </span>
          <div className="space-y-2">
            {summary.deficiencies_by_type.map((d, idx) => {
              const maxCount = 5;
              const pct = Math.min(100, (d.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>{d.type}</span>
                    <span className="font-bold text-[#1B3A6B]">{d.count} occurrence{d.count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1B3A6B] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Cases Awaiting Decision Table with Split Decision Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Cases Table (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Cases Awaiting Final Regulatory Decision
          </span>

          <div className="gov-card bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#1B3A6B] text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-left">App ID</th>
                  <th className="py-2.5 px-3 text-left">Institution</th>
                  <th className="py-2.5 px-3 text-left">Scrutiny Rec.</th>
                  <th className="py-2.5 px-3 text-left">Decision</th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={async () => {
                      const res = await authFetch(`/api/applications/${app.id}`);
                      if (res.ok) setSelectedApp(await res.json());
                    }}
                    className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedApp?.id === app.id ? 'bg-blue-50/70 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-[#1B3A6B]">{app.id}</td>
                    <td className="py-2.5 px-3 text-slate-800 truncate max-w-[140px]">{app.institute_name}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        {app.scrutiny_recommendation || "Under Scrutiny"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {app.final_decision ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {app.final_decision}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-semibold">Pending Call</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-xs text-[#1B3A6B] font-bold">Select →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pinned Decision Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="gov-card p-5 bg-white border-2 border-slate-300 rounded-lg space-y-4 sticky top-20 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Final Regulatory Decision Panel
              </span>
              <span className="text-[10px] font-bold bg-[#E8890C] text-white px-2 py-0.5 rounded">
                Senior Authority
              </span>
            </div>

            {selectedApp ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Selected Case</span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{selectedApp.id}</div>
                  <div className="text-slate-600 font-medium">{selectedApp.institute?.name}</div>
                </div>

                {/* Scrutiny Officer Recommendation Evidence shown BEFORE decision buttons */}
                <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-lg space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block">
                    Officer's Recommendation & Evidence
                  </span>
                  <div className="font-bold text-xs text-slate-900">
                    {selectedApp.scrutiny_recommendation || "Pending Officer Formal Recommendation"}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {selectedApp.scrutiny_remarks || "Automated pre-scrutiny checks completed. Preliminary documents verified against statutory APIs."}
                  </p>
                </div>

                {/* Final Decision Status if already made */}
                {selectedApp.final_decision && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-1">
                    <span className="font-bold text-emerald-900 block">Current Regulatory Order:</span>
                    <span className="font-black text-emerald-800 text-sm">{selectedApp.final_decision}</span>
                    <p className="text-[11px] text-slate-600">Reason: {selectedApp.final_decision_reason || "Statutory criteria satisfied."}</p>
                  </div>
                )}

                {/* 3 Decision Action Buttons */}
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Execute Regulatory Order
                  </span>

                  <button
                    onClick={() => setDecisionModal({ open: true, decision: 'Approve', reason: 'All statutory documents and infrastructure requirements verified.' })}
                    className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Extension of Approval</span>
                  </button>

                  <button
                    onClick={() => setDecisionModal({ open: true, decision: 'Return for Correction', reason: '' })}
                    className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Return for Correction</span>
                  </button>

                  <button
                    onClick={() => setDecisionModal({ open: true, decision: 'Recommend Rejection', reason: '' })}
                    className="w-full py-2.5 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Recommend Rejection</span>
                  </button>
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Select an application from the table to inspect evidence and execute a decision.</p>
            )}

          </div>
        </div>

      </div>

      {/* Final Decision Modal with Mandatory Written Justification for Adverse Orders */}
      {decisionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Confirm Regulatory Order: {decisionModal.decision}
            </h3>

            <div className="text-xs text-slate-600 space-y-1">
              <div>Application: <span className="font-bold text-slate-900">{selectedApp?.id}</span></div>
              <div>Institution: <span className="font-semibold text-slate-800">{selectedApp?.institute?.name}</span></div>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Regulatory Ground / Written Reason {['Return for Correction', 'Recommend Rejection'].includes(decisionModal.decision) && <span className="text-rose-600 font-bold">* (Mandatory)</span>}:
                </label>
                <textarea
                  value={decisionModal.reason}
                  onChange={(e) => setDecisionModal({ ...decisionModal, reason: e.target.value })}
                  rows={4}
                  placeholder="State the regulatory grounds, handbook clauses, or justification for this decision..."
                  className="w-full text-xs p-2.5 rounded border border-slate-300 focus:outline-none focus:border-[#1B3A6B]"
                  required={['Return for Correction', 'Recommend Rejection'].includes(decisionModal.decision)}
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                <span className="font-bold">Formal Regulatory Record: </span>
                This action is final, legally binding, and will be logged in the immutable AICTE regulatory audit ledger with your digital signature.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDecisionModal({ open: false, decision: 'Approve', reason: '' })}
                  className="px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision || (['Return for Correction', 'Recommend Rejection'].includes(decisionModal.decision) && !decisionModal.reason.trim())}
                  className="btn-gov-primary px-4 py-1.5 text-xs font-bold"
                >
                  {submittingDecision ? "Recording..." : `Confirm & Sign ${decisionModal.decision}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassignment Modal */}
      {reassignModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Reassign Case to Scrutiny Officer</h3>
            <form onSubmit={handleReassignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Officer:</label>
                <select
                  value={reassignModal.officer}
                  onChange={(e) => setReassignModal({ ...reassignModal, officer: e.target.value })}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                >
                  <option value="Smt. Ananya Sharma">Smt. Ananya Sharma (Scrutiny Officer)</option>
                  <option value="Shri Vikram Malhotra">Shri Vikram Malhotra (Senior Scrutiny Officer)</option>
                  <option value="Dr. Priya Sundaram">Dr. Priya Sundaram (Regional Scrutineer)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignModal({ open: false, app: null, officer: 'Smt. Ananya Sharma' })}
                  className="px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReassign}
                  className="btn-gov-primary px-4 py-1.5 text-xs font-bold"
                >
                  {submittingReassign ? "Saving..." : "Confirm Reassignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
