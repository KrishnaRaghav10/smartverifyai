import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ListOrdered, Layers, Bell, CheckSquare, Search, Filter,
  CheckCircle, XCircle, AlertTriangle, ArrowRight, ExternalLink,
  RefreshCw, MessageSquare, ShieldAlert, Send, Eye, FileText
} from 'lucide-react';
import { StatusTag } from '../components/StatusTag';

export const ScrutinyOfficerView = () => {
  const { currentUser, currentPath, navigateTo, authFetch, selectedAppId, setSelectedAppId } = useApp();
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Split View state
  const [activeDocIndex, setActiveDocIndex] = useState(0);

  // Flag action modal
  const [flagModal, setFlagModal] = useState({ open: false, flag: null, action: 'Accept', reason: '' });
  const [processingFlag, setProcessingFlag] = useState(false);

  // Clarification modal
  const [clarificationModal, setClarificationModal] = useState({ open: false, message: '' });
  const [submittingClarification, setSubmittingClarification] = useState(false);

  // Senior Recommendation modal
  const [recommendModal, setRecommendModal] = useState({ open: false, recommendation: 'Recommend Approval', remarks: '' });
  const [submittingRecommend, setSubmittingRecommend] = useState(false);

  // Verification in progress map
  const [verifyingDocId, setVerifyingDocId] = useState(null);

  // Load applications and summary
  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, appsRes] = await Promise.all([
        authFetch('/api/dashboard/summary'),
        authFetch('/api/applications')
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (appsRes.ok) {
        const apps = await appsRes.json();
        setApplications(apps);

        // Check if viewing a specific application
        const detailMatch = currentPath.match(/\/scrutiny\/application\/([^/]+)/);
        const targetId = detailMatch ? detailMatch[1] : (apps.length > 0 ? apps[0].id : null);
        if (targetId) {
          const detailRes = await authFetch(`/api/applications/${targetId}`);
          if (detailRes.ok) {
            setSelectedApp(await detailRes.json());
          }
        }
      }
    } catch (err) {
      console.error("Scrutiny view error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPath]);

  // Trigger Source Verification
  const handleVerifySource = async (docId, forceStatus = null) => {
    if (!selectedApp) return;
    setVerifyingDocId(docId);
    try {
      const res = await authFetch(`/api/applications/${selectedApp.id}/verify-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId, status: forceStatus })
      });
      if (res.ok) {
        // Refresh application detail
        const detailRes = await authFetch(`/api/applications/${selectedApp.id}`);
        if (detailRes.ok) setSelectedApp(await detailRes.json());
      }
    } catch (err) {
      alert("Verification error: " + err.message);
    } finally {
      setVerifyingDocId(null);
    }
  };

  // Submit Flag Review (Accept or Dismiss with reason)
  const handleFlagReviewSubmit = async (e) => {
    e.preventDefault();
    if (!flagModal.reason.trim()) {
      alert("A written justification is required to review a flag.");
      return;
    }
    setProcessingFlag(true);
    try {
      const res = await authFetch(`/api/applications/${selectedApp.id}/flag-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flag_id: flagModal.flag.id,
          action: flagModal.action,
          reason: flagModal.reason
        })
      });
      if (res.ok) {
        setFlagModal({ open: false, flag: null, action: 'Accept', reason: '' });
        const detailRes = await authFetch(`/api/applications/${selectedApp.id}`);
        if (detailRes.ok) setSelectedApp(await detailRes.json());
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setProcessingFlag(false);
    }
  };

  // Submit Clarification Request
  const handleClarificationSubmit = async (e) => {
    e.preventDefault();
    if (!clarificationModal.message.trim()) return;
    setSubmittingClarification(true);
    try {
      const res = await authFetch(`/api/applications/${selectedApp.id}/request-clarification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clarificationModal.message })
      });
      if (res.ok) {
        alert("Clarification request sent to institution!");
        setClarificationModal({ open: false, message: '' });
        const detailRes = await authFetch(`/api/applications/${selectedApp.id}`);
        if (detailRes.ok) setSelectedApp(await detailRes.json());
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmittingClarification(false);
    }
  };

  // Send to Senior Officer with Recommendation
  const handleRecommendSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRecommend(true);
    try {
      const res = await authFetch(`/api/applications/${selectedApp.id}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation: recommendModal.recommendation,
          remarks: recommendModal.remarks
        })
      });
      if (res.ok) {
        alert(`Case escalated to Senior Officer with: "${recommendModal.recommendation}"`);
        setRecommendModal({ open: false, recommendation: 'Recommend Approval', remarks: '' });
        const detailRes = await authFetch(`/api/applications/${selectedApp.id}`);
        if (detailRes.ok) setSelectedApp(await detailRes.json());
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmittingRecommend(false);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch = !search || 
      app.id.toLowerCase().includes(search.toLowerCase()) ||
      app.institute_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "All" || app.category === categoryFilter;
    const matchesStat = statusFilter === "All" || app.status === statusFilter;
    return matchesSearch && matchesCat && matchesStat;
  });

  const isDetailRoute = currentPath.startsWith('/scrutiny/application/');

  return (
    <div className="space-y-6">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ListOrdered className="w-5 h-5 text-[#1B3A6B]" />
            <h1 className="text-xl font-black text-slate-900">
              Scrutiny Officer Work Queue
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Officer: <span className="font-bold text-slate-800">{currentUser.name}</span> · Preliminary Dossier Validation & Source Verification
          </p>
        </div>

        {selectedApp && !isDetailRoute && (
          <button
            onClick={() => navigateTo(`/scrutiny/application/${selectedApp.id}`)}
            className="btn-gov-primary px-4 py-2 text-xs font-bold flex items-center space-x-2 shadow-xs self-start sm:self-auto"
          >
            <span>Open Split-Screen Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Alert Panel (Expiring Documents, Pending Source Checks, New Flags) */}
      {summary?.alerts && summary.alerts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5 uppercase tracking-wider">
              <Bell className="w-4 h-4 text-amber-700" />
              <span>Priority Scrutiny Alerts ({summary.alerts.length})</span>
            </span>
            <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              Attention Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {summary.alerts.slice(0, 3).map((alert, i) => (
              <div key={i} className="p-2.5 bg-white border border-amber-200 rounded text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{alert.type}</span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">{alert.severity}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-tight">{alert.description}</p>
                <div className="pt-1 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-[#1B3A6B] font-bold">{alert.app_id}</span>
                  <button
                    onClick={async () => {
                      const res = await authFetch(`/api/applications/${alert.app_id}`);
                      if (res.ok) {
                        setSelectedApp(await res.json());
                        navigateTo(`/scrutiny/application/${alert.app_id}`);
                      }
                    }}
                    className="text-[#1B3A6B] font-bold hover:underline"
                  >
                    Inspect Dossier →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Sub-route: SPLIT SCREEN VIEW (/scrutiny/application/:id) */}
      {isDetailRoute && selectedApp ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateTo('/scrutiny/queue')}
                className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              >
                ← Back to Queue
              </button>
              <span className="font-black text-slate-900 text-sm">{selectedApp.id}</span>
              <span className="text-xs text-slate-500 font-medium">({selectedApp.institute?.name})</span>
            </div>

            {/* Action Bar (NO approval/rejection button for Scrutiny!) */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setClarificationModal({ open: true, message: '' })}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded flex items-center space-x-1"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Request Clarification</span>
              </button>

              <button
                onClick={() => setRecommendModal({ open: true, recommendation: 'Recommend Approval', remarks: '' })}
                className="btn-gov-primary px-3.5 py-1.5 text-xs font-bold flex items-center space-x-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Escalate / Recommend to Senior</span>
              </button>
            </div>
          </div>

          {/* Scrutiny Officer Recommendation Status Banner */}
          {selectedApp.scrutiny_recommendation && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900 flex items-center justify-between">
              <div>
                <span className="font-bold">Your Submitted Recommendation: </span>
                <span className="font-semibold text-[#1B3A6B]">{selectedApp.scrutiny_recommendation}</span>
                {selectedApp.scrutiny_remarks && <span className="text-slate-600 italic"> — "{selectedApp.scrutiny_remarks}"</span>}
              </div>
              <span className="text-[10px] bg-purple-100 px-2 py-0.5 rounded border border-purple-300 font-bold uppercase">
                Awaiting Senior Officer Call
              </span>
            </div>
          )}

          {/* DENSE SPLIT VIEW (Left: Document Viewer; Right: Extracted Fields & Flags) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[600px]">
            
            {/* LEFT PANE (5 cols): Document Preview & Selector */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Document Viewer ({selectedApp.documents?.length || 0})
                </span>
                <span className="text-[10px] text-slate-400">PDF / Image Preview</span>
              </div>

              {/* Doc Selector Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {selectedApp.documents?.map((d, idx) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDocIndex(idx)}
                    className={`px-2.5 py-1 text-xs rounded border font-semibold truncate max-w-[180px] ${
                      activeDocIndex === idx
                        ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {d.type}
                  </button>
                ))}
              </div>

              {/* Document Frame / Render */}
              <div className="flex-1 bg-slate-100 rounded border border-slate-200 min-h-[420px] flex items-center justify-center overflow-hidden relative">
                {selectedApp.documents && selectedApp.documents[activeDocIndex] ? (
                  selectedApp.documents[activeDocIndex].file_url.endsWith('.pdf') ? (
                    <iframe
                      src={selectedApp.documents[activeDocIndex].file_url}
                      className="w-full h-full min-h-[420px] border-none"
                      title="PDF Preview"
                    />
                  ) : (
                    <img
                      src={selectedApp.documents[activeDocIndex].file_url}
                      alt="Doc preview"
                      className="max-h-[400px] object-contain p-2"
                    />
                  )
                ) : (
                  <span className="text-xs text-slate-400">No document selected</span>
                )}
              </div>

              {/* Document Metadata Bar */}
              {selectedApp.documents && selectedApp.documents[activeDocIndex] && (
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Reference: <span className="font-mono font-bold text-slate-800">{selectedApp.documents[activeDocIndex].ref_number}</span></span>
                    <span>Expiry: <span className="font-semibold text-slate-800">{selectedApp.documents[activeDocIndex].expiry_date || "N/A"}</span></span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    SHA256: {selectedApp.documents[activeDocIndex].sha256}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT PANE (7 cols): Extracted Fields, Source Checks & Anomaly Flags */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* 1. Automated Source Verification Module */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Statutory Source Verification (Live Mock Gateways)
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Bureau Integration
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedApp.documents?.map((doc) => {
                    const ver = selectedApp.verifications?.find(v => v.document_id === doc.id);
                    const isVerifying = verifyingDocId === doc.id;

                    return (
                      <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{doc.type}</span>
                            <span className="text-[11px] text-slate-500 font-mono">({doc.ref_number})</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Source: {doc.issuing_authority || "State Authority"}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {ver ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ver.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                              ver.status === 'Mismatch Detected' ? 'bg-rose-100 text-rose-800' :
                              ver.status === 'Expired' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-200 text-slate-800'
                            }`}>
                              {ver.status}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                              Pending Check
                            </span>
                          )}

                          <button
                            onClick={() => handleVerifySource(doc.id)}
                            disabled={isVerifying}
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-700 flex items-center space-x-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                            <span>{ver ? "Re-verify" : "Run Check"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Anomaly & Forgery Flags Review (Accept or Dismiss with Reason) */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Forensic AI Anomaly Flags ({selectedApp.flags?.length || 0})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Officer Decision Required</span>
                </div>

                {selectedApp.flags?.length === 0 ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <span className="text-xs font-bold text-emerald-900">Zero Forensic Flags Raised</span>
                    <p className="text-[11px] text-emerald-700">All document pixels and metadata pass consistency checks.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedApp.flags?.map((flag) => (
                      <div key={flag.id} className="p-3.5 border border-slate-200 rounded-lg bg-slate-50 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                              {flag.type}
                            </span>
                            <span className="font-bold text-slate-900">{flag.what}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            flag.state === 'Confirmed' ? 'bg-rose-200 text-rose-900' :
                            flag.state === 'Dismissed' ? 'bg-slate-200 text-slate-700 line-through' :
                            'bg-amber-100 text-amber-900'
                          }`}>
                            {flag.state}
                          </span>
                        </div>

                        <p className="text-slate-700 text-[11px]">{flag.why}</p>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Confidence: {(flag.confidence * 100).toFixed(0)}%</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setFlagModal({ open: true, flag, action: 'Accept', reason: '' })}
                              className="px-2.5 py-1 text-xs rounded font-bold bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100"
                            >
                              Accept Flag
                            </button>
                            <button
                              onClick={() => setFlagModal({ open: true, flag, action: 'Dismiss', reason: '' })}
                              className="px-2.5 py-1 text-xs rounded font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                            >
                              Dismiss Flag
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* DENSE WORK QUEUE TABLE */
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by ID or institute..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 bg-white"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs p-1.5 rounded border border-slate-300 bg-white font-medium"
              >
                <option value="All">All Categories</option>
                <option value="Extension of Approval">Extension of Approval</option>
                <option value="Increase in intake">Increase in intake</option>
                <option value="New course">New course</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-1.5 rounded border border-slate-300 bg-white font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Deficient">Deficient</option>
                <option value="Clean">Clean</option>
                <option value="Under Scrutiny">Under Scrutiny</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          <div className="gov-card bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#1B3A6B] text-white font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-left">App ID</th>
                  <th className="py-2.5 px-3 text-left">Institution Name</th>
                  <th className="py-2.5 px-3 text-left">Category</th>
                  <th className="py-2.5 px-3 text-left">Submitted</th>
                  <th className="py-2.5 px-3 text-center">Flags</th>
                  <th className="py-2.5 px-3 text-left">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#1B3A6B]">{a.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{a.institute_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{a.category}</td>
                    <td className="py-2.5 px-3 text-slate-500">{a.submitted_on}</td>
                    <td className="py-2.5 px-3 text-center">
                      {a.flags_count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {a.flags_count} flag{a.flags_count > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusTag status={a.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={async () => {
                          const res = await authFetch(`/api/applications/${a.id}`);
                          if (res.ok) setSelectedApp(await res.json());
                          navigateTo(`/scrutiny/application/${a.id}`);
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 hover:bg-[#1B3A6B] hover:text-white text-slate-700 transition-colors"
                      >
                        Review Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Flag Review Modal (Accept/Dismiss with Mandatory Reason) */}
      {flagModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              {flagModal.action === 'Accept' ? "Accept Regulatory Flag" : "Dismiss Anomaly Flag"}
            </h3>

            <p className="text-xs text-slate-600">
              Flag: <span className="font-semibold">{flagModal.flag?.what}</span>
            </p>

            <form onSubmit={handleFlagReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Written Justification / Reason (Mandatory):
                </label>
                <textarea
                  value={flagModal.reason}
                  onChange={(e) => setFlagModal({ ...flagModal, reason: e.target.value })}
                  rows={3}
                  placeholder={`Explain why you are ${flagModal.action === 'Accept' ? 'accepting this finding as a deficiency' : 'dismissing this flag as a false positive or verified benign'}...`}
                  className="w-full text-xs p-2.5 rounded border border-slate-300 focus:outline-none focus:border-[#1B3A6B]"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFlagModal({ open: false, flag: null, action: 'Accept', reason: '' })}
                  className="px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingFlag || !flagModal.reason.trim()}
                  className={`px-4 py-1.5 text-xs font-bold text-white rounded ${
                    flagModal.action === 'Accept' ? 'bg-rose-700 hover:bg-rose-800' : 'bg-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {processingFlag ? "Saving..." : `Confirm ${flagModal.action}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clarification Request Modal */}
      {clarificationModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Request Clarification from Institution</h3>
            <form onSubmit={handleClarificationSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Specify Required Document / Clarification:
                </label>
                <textarea
                  value={clarificationModal.message}
                  onChange={(e) => setClarificationModal({ ...clarificationModal, message: e.target.value })}
                  rows={4}
                  placeholder="e.g. Please upload the latest Fire Safety Certificate renewed by the municipal council..."
                  className="w-full text-xs p-2.5 rounded border border-slate-300"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClarificationModal({ open: false, message: '' })}
                  className="px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClarification || !clarificationModal.message.trim()}
                  className="btn-gov-primary px-4 py-1.5 text-xs font-bold"
                >
                  {submittingClarification ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Senior Officer Recommendation Modal */}
      {recommendModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Submit Recommendation to Senior Officer</h3>
            
            <form onSubmit={handleRecommendSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Your Recommendation:</label>
                <select
                  value={recommendModal.recommendation}
                  onChange={(e) => setRecommendModal({ ...recommendModal, recommendation: e.target.value })}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white font-semibold"
                >
                  <option value="Recommend Approval">Recommend Approval</option>
                  <option value="Recommend Rejection">Recommend Rejection</option>
                  <option value="Needs Senior Review">Needs Senior Regulatory Review</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Internal Remarks / Evidence Summary:</label>
                <textarea
                  value={recommendModal.remarks}
                  onChange={(e) => setRecommendModal({ ...recommendModal, remarks: e.target.value })}
                  rows={3}
                  placeholder="Summary of statutory checks performed, source verification status, and findings..."
                  className="w-full text-xs p-2.5 rounded border border-slate-300"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecommendModal({ open: false, recommendation: 'Recommend Approval', remarks: '' })}
                  className="px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRecommend || !recommendModal.remarks.trim()}
                  className="btn-gov-primary px-4 py-1.5 text-xs font-bold"
                >
                  {submittingRecommend ? "Submitting..." : "Submit to Senior Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
