import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, PlusCircle, AlertTriangle, MessageSquare, CheckCircle, Clock,
  Upload, ArrowRight, ShieldCheck, HelpCircle, Send, Check, X, Building
} from 'lucide-react';
import { StatusTag } from '../components/StatusTag';

export const InstitutionView = () => {
  const { currentUser, currentPath, navigateTo, authFetch } = useApp();
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Application Form State
  const [newCategory, setNewCategory] = useState("Extension of Approval");
  const [newStudents, setNewStudents] = useState(480);
  const [newArea, setNewArea] = useState(2500);
  const [newLabs, setNewLabs] = useState(8);
  const [submittingApp, setSubmittingApp] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("Fire Safety Certificate");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Clarification Reply State
  const [replyMessage, setReplyMessage] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, appRes] = await Promise.all([
        authFetch('/api/dashboard/summary'),
        authFetch('/api/applications')
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (appRes.ok) {
        const apps = await appRes.json();
        setApplications(apps);

        // If on an application detail sub-route: /institution/application/:id
        const detailMatch = currentPath.match(/\/institution\/application\/([^/]+)/);
        if (detailMatch) {
          const detailRes = await authFetch(`/api/applications/${detailMatch[1]}`);
          if (detailRes.ok) {
            setSelectedApp(await detailRes.json());
          }
        } else if (apps.length > 0 && !selectedApp) {
          // pre-load first app detail for preview if needed
          const detailRes = await authFetch(`/api/applications/${apps[0].id}`);
          if (detailRes.ok) {
            setSelectedApp(await detailRes.json());
          }
        }
      }
    } catch (err) {
      console.error("Error loading institution data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPath]);

  // Handle Application Submission
  const handleCreateApp = async (e) => {
    e.preventDefault();
    setSubmittingApp(true);
    try {
      const res = await authFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          student_count: newStudents,
          built_up_area_sqm: newArea,
          labs_count: newLabs
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Application ${data.application_id} submitted successfully!`);
        navigateTo('/institution/home');
        loadData();
      } else {
        const err = await res.json();
        alert(`Submission failed: ${err.detail}`);
      }
    } catch (err) {
      alert("Submission error: " + err.message);
    } finally {
      setSubmittingApp(false);
    }
  };

  // Handle Document Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedApp) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('doc_type', uploadDocType);
    formData.append('file', uploadFile);

    try {
      const res = await authFetch(`/api/applications/${selectedApp.id}/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert("Document uploaded successfully!");
        setShowUploadModal(false);
        setUploadFile(null);
        // Reload detail
        const detailRes = await authFetch(`/api/applications/${selectedApp.id}`);
        if (detailRes.ok) setSelectedApp(await detailRes.json());
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.detail}`);
      }
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle Clarification Reply
  const handleClarificationReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedApp) return;

    setSubmittingReply(true);
    try {
      const res = await authFetch(`/api/applications/${selectedApp.id}/institution-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyMessage })
      });
      if (res.ok) {
        alert("Reply submitted to Scrutiny Officer!");
        setReplyMessage("");
        const detailRes = await authFetch(`/api/applications/${selectedApp.id}`);
        if (detailRes.ok) setSelectedApp(await detailRes.json());
      }
    } catch (err) {
      alert("Error submitting reply: " + err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Helper: Status Tracker Step Calculation
  const getStepState = (status) => {
    // Steps: 1: Submitted, 2: Under Scrutiny, 3: Clarification Needed, 4: Decided
    if (status === "Approved" || status === "Rejected" || status === "Returned") {
      return 4;
    }
    if (status === "Clarification Needed" || status === "Needs Review") {
      return 3;
    }
    if (status === "Under Scrutiny" || status === "Verification Pending" || status === "Deficient") {
      return 2;
    }
    return 1;
  };

  // Sub-route: /institution/new
  if (currentPath === '/institution/new') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-black text-slate-900">Submit New Approval Application</h1>
          <p className="text-xs text-slate-500 mt-1">
            Fill out the institutional parameters for AICTE Approval Process 2026-27.
          </p>
        </div>

        <form onSubmit={handleCreateApp} className="gov-card p-6 bg-white space-y-5 border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Application Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white font-medium"
            >
              <option value="Extension of Approval">Extension of Approval (EoA)</option>
              <option value="Increase in intake">Increase in Approved Intake</option>
              <option value="New course">Introduction of New Course / Program</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Student Intake
              </label>
              <input
                type="number"
                value={newStudents}
                onChange={(e) => setNewStudents(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white"
                min="60"
                step="60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Built-Up Area (sqm)
              </label>
              <input
                type="number"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white"
                min="500"
                step="50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Laboratory Count
              </label>
              <input
                type="number"
                value={newLabs}
                onChange={(e) => setNewLabs(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white"
                min="2"
                required
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 space-y-1">
            <span className="font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Institutional Declaration</span>
            </span>
            <p className="text-[11px] text-emerald-800">
              By submitting, your institution certifies that all physical premises and statutory documents comply with AICTE Approval Process Handbook (APH 2026-27).
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              disabled={submittingApp}
              className="btn-gov-primary px-6 py-2.5 text-xs font-bold flex items-center space-x-2"
            >
              <span>{submittingApp ? "Submitting Application..." : "Submit Application to Bureau"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/institution/home')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Sub-route: /institution/deficiencies
  if (currentPath === '/institution/deficiencies') {
    const allDeficiencies = [];
    if (selectedApp && selectedApp.deficiencies) {
      selectedApp.deficiencies.forEach(d => allDeficiencies.push({ ...d, appId: selectedApp.id }));
    }

    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-black text-slate-900">Institutional Deficiencies to Resolve</h1>
          <p className="text-xs text-slate-500 mt-1">
            Items identified during verification requiring statutory compliance or document uploads.
          </p>
        </div>

        {allDeficiencies.length === 0 ? (
          <div className="gov-card p-8 bg-white border border-slate-200 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No Active Deficiencies</h3>
            <p className="text-xs text-slate-500">All mandatory statutory requirements for your applications are currently satisfied.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allDeficiencies.map((def, idx) => (
              <div key={idx} className="gov-card p-4 bg-white border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      {def.type}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{def.item}</span>
                    <span className="text-[11px] text-slate-400">({def.appId})</span>
                  </div>
                  <p className="text-xs text-slate-700">{def.description}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Action Needed: {def.action_needed}</p>
                </div>

                <button
                  onClick={() => {
                    setUploadDocType(def.item);
                    setShowUploadModal(true);
                  }}
                  className="btn-gov-primary px-3 py-1.5 text-xs font-bold whitespace-nowrap self-start sm:self-auto"
                >
                  Upload & Fix Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Sub-route: /institution/messages
  if (currentPath === '/institution/messages') {
    const messages = applications.filter(a => a.clarification_requested);

    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-black text-slate-900">Official AICTE Correspondence & Clarifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Direct communication channel with assigned Scrutiny Officers regarding your application dossiers.
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="gov-card p-8 bg-white border border-slate-200 text-center space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No Open Clarification Requests</h3>
            <p className="text-xs text-slate-500">There are no pending requests for clarification from AICTE scrutiny officers.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="gov-card p-5 bg-white border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-[#1B3A6B]">{m.id}</span>
                    <span className="text-xs text-slate-500 font-medium">· {m.category}</span>
                  </div>
                  <StatusTag status={m.status} />
                </div>

                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded text-xs space-y-1">
                  <span className="font-bold text-[#1B3A6B] block">Request from AICTE Scrutiny Officer:</span>
                  <p className="text-slate-800">{m.clarification_message}</p>
                </div>

                {m.clarification_reply ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-1">
                    <span className="font-bold text-emerald-900 block">Your Submitted Reply:</span>
                    <p className="text-emerald-800">{m.clarification_reply}</p>
                  </div>
                ) : (
                  <form onSubmit={handleClarificationReply} className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-slate-700">Write Your Clarification Response:</label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={3}
                      placeholder="Explain the statutory resolution or details for the scrutiny officer..."
                      className="w-full text-xs p-2.5 rounded border border-slate-300 focus:outline-none focus:border-[#1B3A6B]"
                      required
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        type="submit"
                        disabled={submittingReply}
                        className="btn-gov-primary px-4 py-2 text-xs font-bold flex items-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submittingReply ? "Submitting..." : "Send Reply to Officer"}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // DEFAULT HOME SCREEN: /institution/home or /institution/application/:id
  return (
    <div className="space-y-6">
      
      {/* 1. Header Bar with Institution Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-[#1B3A6B]" />
            <h1 className="text-xl font-black text-slate-900">
              {currentUser.name}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Institute ID: <span className="font-bold text-[#1B3A6B]">{currentUser.institute_id}</span> · Approval Cycle 2026-27
          </p>
        </div>

        <button
          onClick={() => navigateTo('/institution/new')}
          className="btn-gov-primary px-4 py-2 text-xs font-bold flex items-center space-x-2 self-start sm:self-auto shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* 2. Three Institution Count Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gov-card p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Open Applications</span>
            <FileText className="w-4 h-4 text-[#1B3A6B]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary?.counts?.total || applications.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Submitted for AICTE Scrutiny</p>
        </div>

        <div className="gov-card p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Deficiencies to Fix</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {summary?.counts?.deficiencies_to_fix ?? 1}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Documents missing or expired</p>
        </div>

        <div className="gov-card p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
            <span>Official Messages</span>
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {summary?.counts?.messages_count ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Clarifications from scrutiny officers</p>
        </div>
      </div>

      {/* 3. Applications List & Status Trackers */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Your Submitted Applications ({applications.length})
        </h2>

        {applications.length === 0 ? (
          <div className="gov-card p-8 bg-white border border-slate-200 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No Applications Submitted Yet</h3>
            <p className="text-xs text-slate-500">Click 'New Application' above to create your first approval submission.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const step = getStepState(app.status);
              const isSelected = selectedApp?.id === app.id;

              return (
                <div
                  key={app.id}
                  className={`gov-card p-5 bg-white border rounded-lg transition-all ${
                    isSelected ? 'border-[#1B3A6B] ring-1 ring-[#1B3A6B]' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-sm">{app.id}</span>
                        <span className="text-xs text-slate-600 font-semibold">· {app.category}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">Submitted on {app.submitted_on}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <StatusTag status={app.status} />
                      <button
                        onClick={async () => {
                          const res = await authFetch(`/api/applications/${app.id}`);
                          if (res.ok) setSelectedApp(await res.json());
                        }}
                        className="px-3 py-1 text-xs font-bold rounded border border-slate-300 hover:bg-slate-50 text-slate-700"
                      >
                        {isSelected ? "Active Dossier" : "View Dossier"}
                      </button>
                    </div>
                  </div>

                  {/* 4-Step Visual Status Tracker */}
                  <div className="pt-4">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Lifecycle Progress Tracker
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      <div className={`p-2 rounded border font-semibold ${step >= 1 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        1. Submitted
                      </div>
                      <div className={`p-2 rounded border font-semibold ${step >= 2 ? 'bg-blue-50 text-blue-800 border-blue-300' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        2. Under Scrutiny
                      </div>
                      <div className={`p-2 rounded border font-semibold ${step >= 3 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        3. Clarification
                      </div>
                      <div className={`p-2 rounded border font-semibold ${step >= 4 ? 'bg-purple-50 text-purple-800 border-purple-300' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        4. Decided ({app.final_decision || 'Pending'})
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Active Application Detail Dossier (Form-like, clean, large buttons) */}
      {selectedApp && (
        <div className="gov-card p-6 bg-white border border-slate-200 rounded-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Application Dossier</span>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                {selectedApp.id} · {selectedApp.category}
              </h2>
            </div>
            
            <button
              onClick={() => {
                setUploadDocType("Fire Safety Certificate");
                setShowUploadModal(true);
              }}
              className="btn-gov-primary px-4 py-2 text-xs font-bold flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload / Replace Document</span>
            </button>
          </div>

          {/* Plain Language Deficiencies Notice */}
          {selectedApp.deficiencies && selectedApp.deficiencies.length > 0 && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
              <span className="font-bold text-amber-900 text-xs flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Items Requiring Institutional Action ({selectedApp.deficiencies.length})</span>
              </span>
              <ul className="space-y-1.5">
                {selectedApp.deficiencies.map((d, i) => (
                  <li key={i} className="text-xs text-amber-950 flex items-start space-x-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <div>
                      <span className="font-semibold">{d.item}:</span> {d.description}{" "}
                      <span className="text-slate-500 font-medium">({d.action_needed})</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Statutory Documents Checklist for Category */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Category Statutory Checklist
            </h3>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Document Type</th>
                    <th className="py-2.5 px-3 text-left">Issuing Authority</th>
                    <th className="py-2.5 px-3 text-left">Expiry Date</th>
                    <th className="py-2.5 px-3 text-left">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedApp.checklist?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.authority}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.expiry_date || "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'Expired' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setUploadDocType(item.name);
                            setShowUploadModal(true);
                          }}
                          className="text-[#1B3A6B] hover:underline font-bold text-xs"
                        >
                          {item.status === 'Present' ? 'Replace' : 'Upload'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Uploaded Documents ({selectedApp.documents?.length || 0})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedApp.documents?.map((doc) => (
                <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{doc.type}</span>
                    <span className="text-[11px] text-slate-500">{doc.filename} · Ref: {doc.ref_number}</span>
                  </div>
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Clarification Response Box if Scrutiny Officer Requested */}
          {selectedApp.clarification_requested && (
            <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-center space-x-2 text-[#1B3A6B] font-bold text-xs">
                <HelpCircle className="w-4 h-4 text-[#1B3A6B]" />
                <span>Clarification Requested by AICTE Scrutiny Officer</span>
              </div>
              <p className="text-xs text-slate-800 bg-white p-3 rounded border border-blue-100">
                "{selectedApp.clarification_message}"
              </p>

              {selectedApp.clarification_reply ? (
                <div className="text-xs text-emerald-900 font-semibold flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Reply submitted: "{selectedApp.clarification_reply}"</span>
                </div>
              ) : (
                <form onSubmit={handleClarificationReply} className="space-y-2">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
                    placeholder="Enter your official reply to this clarification request..."
                    className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={submittingReply}
                    className="btn-gov-primary px-4 py-2 text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReply ? "Submitting..." : "Send Clarification Reply"}</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Upload Statutory Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                >
                  <option value="Fire Safety Certificate">Fire Safety Certificate</option>
                  <option value="Affiliation Letter">Affiliation Letter</option>
                  <option value="NBA Accreditation">NBA Accreditation</option>
                  <option value="Land Deed / NOC">Land Deed / NOC</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select File (PDF or Image)</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-xs p-1.5 rounded border border-slate-300"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="btn-gov-primary px-4 py-1.5 text-xs font-bold"
                >
                  {uploading ? "Uploading..." : "Confirm & Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
