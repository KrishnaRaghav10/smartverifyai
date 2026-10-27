import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StatusTag } from '../components/StatusTag';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { 
  Building2, CheckCircle2, XCircle, AlertCircle, 
  FileText, ShieldCheck, Eye, Upload, RefreshCw, 
  Clock, MapPin, Hash, CheckSquare, AlertTriangle, 
  ExternalLink, UserCheck, Send, Check
} from 'lucide-react';

export const ApplicationDetail = () => {
  const { selectedAppId, t, currentUser } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'checklist', 'documents', 'verification', 'flags', 'infrastructure', 'history'
  
  // Officer Action Drawer state
  const [selectedAction, setSelectedAction] = useState('Request Clarification');
  const [actionRemarks, setActionRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Selected document for preview
  const [previewDoc, setPreviewDoc] = useState(null);

  // Upload modal state
  const [uploadType, setUploadType] = useState('Affiliation Letter');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchDetail = () => {
    setLoading(true);
    fetch(`/api/applications/${selectedAppId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        if (d.documents && d.documents.length > 0) {
          setPreviewDoc(d.documents[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching detail:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetail();
  }, [selectedAppId]);

  const handleOfficerAction = (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    setActionSuccessMsg('');

    fetch(`/api/applications/${selectedAppId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: selectedAction,
        remarks: actionRemarks
      })
    })
      .then(res => res.json())
      .then(resData => {
        setSubmittingAction(false);
        setActionSuccessMsg(`Decision '${selectedAction}' recorded in regulatory audit trail.`);
        fetchDetail();
      })
      .catch(err => {
        setSubmittingAction(false);
        alert("Failed to submit officer decision: " + err);
      });
  };

  const handleTriggerVerification = (docId) => {
    fetch(`/api/applications/${selectedAppId}/verify-source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: docId })
    })
      .then(res => res.json())
      .then(() => {
        fetchDetail();
      })
      .catch(err => alert("Verification check failed: " + err));
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('doc_type', uploadType);
    formData.append('file', uploadFile);

    fetch(`/api/applications/${selectedAppId}/upload`, {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(resData => {
        setUploading(false);
        setUploadFile(null);
        alert(`Document ingested. ${resData.flags_raised} forensic flag(s) generated.`);
        fetchDetail();
      })
      .catch(err => {
        setUploading(false);
        alert("Upload error: " + err);
      });
  };

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading application dossier {selectedAppId}...
      </div>
    );
  }

  const tabs = [
    { id: 'summary', label: t.tab_summary },
    { id: 'checklist', label: t.tab_checklist, count: data.checklist?.filter(c => c.status !== 'Present').length },
    { id: 'documents', label: t.tab_documents, count: data.documents?.length },
    { id: 'verification', label: t.tab_verification, count: data.verifications?.length },
    { id: 'flags', label: t.tab_flags, count: data.flags?.length, badgeColor: data.flags?.length > 0 ? 'bg-rose-100 text-rose-800' : '' },
    { id: 'infrastructure', label: t.tab_infra },
    { id: 'history', label: t.tab_history, count: data.history?.length },
  ];

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[
        { label: t.nav_applications, view: 'applications' },
        { label: data.id }
      ]} />

      {/* Dossier Banner Header */}
      <div className="gov-card p-4 border-l-4 border-l-[#1B3A6B]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-[#1B3A6B]">{data.id}</span>
              <StatusTag status={data.status} />
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {data.category}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1">{data.institute.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <span className="flex items-center"><Hash className="w-3.5 h-3.5 mr-1 text-slate-400" /> AICTE ID: {data.institute.aicte_id}</span>
              <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {data.institute.district}, {data.institute.state}</span>
              <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> Submitted: {data.submitted_on}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-right">
            <div className="hidden sm:block">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Assigned Scrutiny Officer</span>
              <span className="text-xs font-semibold text-slate-800">{data.assigned_officer}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left 3 Columns: Tabbed Dossier Contents */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Tabs Navigation */}
          <div className="border-b border-slate-200 bg-white rounded-t px-2 flex space-x-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap flex items-center space-x-1.5 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#1B3A6B] text-[#1B3A6B] font-bold bg-slate-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${tab.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="gov-card p-4 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                  Institutional Profile & Approval Context
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Legal Registered Title:</span>
                    <span className="text-slate-900 font-semibold">{data.institute.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Approved Technical Intake:</span>
                    <span className="text-slate-900 font-semibold">{data.institute.approved_intake} Students</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Campus Address:</span>
                    <span className="text-slate-900 font-semibold">{data.institute.address}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Current Adjudication State:</span>
                    <span className="text-slate-900 font-bold">{data.decision_state || 'Pending Review'}</span>
                  </div>
                </div>

                {data.decision_remarks && (
                  <div className="p-3 bg-amber-50 rounded border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900 block mb-0.5">Recorded Officer Direction:</span>
                    <p className="text-amber-800">{data.decision_remarks}</p>
                    <span className="text-[10px] text-amber-600 block mt-1">Logged on: {data.decision_timestamp}</span>
                  </div>
                )}
              </div>

              {/* Quick Checklist Snapshot */}
              <div className="gov-card p-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 mb-3">
                  Checklist Snapshot
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {data.checklist.map((item, idx) => (
                    <div key={idx} className="p-2 rounded border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 truncate pr-2">{item.name}</span>
                      <StatusTag status={item.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHECKLIST (Feature F1) */}
          {activeTab === 'checklist' && (
            <div className="gov-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Category Checklist Verification ({data.category})
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Automatically mapped from AICTE Approval Process Handbook (APH 2026-27) rules
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {data.checklist.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start space-x-2.5">
                      {item.status === 'Present' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      {item.status === 'Missing' && <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                      {item.status === 'Expired' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                      <div>
                        <span className="text-xs font-bold text-slate-900">{item.name}</span>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                          <span>Issuing Source: {item.authority}</span>
                          {item.expiry_date && <span>· Expiry: {item.expiry_date}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <StatusTag status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS (Feature F2 & Preview) */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Upload New Document Box */}
              <div className="gov-card p-3 bg-slate-50 border-dashed border-2 border-slate-300">
                <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row items-center gap-2 justify-between">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-semibold text-slate-700">Upload New File:</span>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      className="text-xs py-1 px-2 rounded border border-slate-300 bg-white text-slate-800"
                    >
                      <option value="Affiliation Letter">Affiliation Letter</option>
                      <option value="NBA Accreditation">NBA Accreditation</option>
                      <option value="Fire Safety Certificate">Fire Safety Certificate</option>
                      <option value="Land Deed / NOC">Land Deed / NOC</option>
                      <option value="Campus Infrastructure Photo">Campus Infrastructure Photo</option>
                    </select>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="text-xs text-slate-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!uploadFile || uploading}
                    className="btn-gov-primary text-xs py-1 px-3 whitespace-nowrap self-end sm:self-center"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    <span>{uploading ? 'Processing OCR...' : 'Upload & Process'}</span>
                  </button>
                </form>
              </div>

              {/* Documents List & Field Inspector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* List of Docs */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                    Uploaded Documents ({data.documents.length})
                  </span>
                  {data.documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setPreviewDoc(doc)}
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        previewDoc?.id === doc.id
                          ? 'border-[#1B3A6B] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{doc.type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{doc.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{doc.filename}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                        <span>Ref: {doc.ref_number || 'N/A'}</span>
                        <span>Exp: {doc.expiry_date || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: Extracted Fields & PDF Viewer */}
                <div className="gov-card p-4 space-y-3">
                  {previewDoc ? (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-xs font-bold text-[#1B3A6B]">{previewDoc.type}</span>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[220px]">{previewDoc.filename}</p>
                        </div>
                        <a
                          href={previewDoc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-gov-outline text-[11px] py-1 px-2 inline-flex items-center"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          <span>Open File</span>
                        </a>
                      </div>

                      {/* Extracted Structured Fields Drawer */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                          OCR Extracted Fields
                        </span>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1 text-xs">
                          {Object.entries(previewDoc.extracted_fields || {}).map(([key, val]) => (
                            <div key={key} className="flex justify-between py-0.5 border-b border-slate-100 last:border-0">
                              <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-slate-900 font-semibold truncate max-w-[170px]">{String(val || 'N/A')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cryptographic Hash */}
                      <div className="text-[10px] text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-200 break-all">
                        <span className="font-bold text-slate-700 block">SHA-256 Digest:</span>
                        {previewDoc.sha256}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Select a document to inspect OCR extractions and preview
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: VERIFICATION (Feature F5 Mock Sources) */}
          {activeTab === 'verification' && (
            <div className="gov-card p-4 space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  External Issuing-Authority Source Verification
                </h2>
                <p className="text-[11px] text-slate-500">
                  Simulated live query against University, NBA/NAAC, Land Revenue, and Fire Department gateways
                </p>
              </div>

              <div className="space-y-3">
                {data.verifications.map((ver, idx) => (
                  <div key={idx} className="p-3.5 rounded border border-slate-200 bg-white space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="text-xs font-bold text-slate-900">{ver.source}</span>
                        <span className="text-[11px] text-slate-500 ml-2">({ver.document_type})</span>
                      </div>
                      <StatusTag status={ver.status} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Query Reference:</span>
                        <span className="font-mono font-medium text-slate-800">{ver.query_ref || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Checked Timestamp:</span>
                        <span className="text-slate-700">{ver.timestamp}</span>
                      </div>
                      <div className="text-right">
                        <button
                          onClick={() => handleTriggerVerification(ver.document_id)}
                          className="btn-gov-outline text-[11px] py-0.5 px-2"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          <span>Re-query Source</span>
                        </button>
                      </div>
                    </div>

                    {/* Raw authority response summary */}
                    {ver.response_payload && ver.response_payload.authority_data && (
                      <div className="text-[11px] text-slate-600 bg-blue-50/40 p-2 rounded border border-blue-100">
                        <span className="font-semibold text-blue-900 block mb-0.5">Registry Output:</span>
                        <pre className="text-[10px] font-mono whitespace-pre-wrap text-slate-700">
                          {JSON.stringify(ver.response_payload.authority_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FLAGS (Feature F4) */}
          {activeTab === 'flags' && (
            <div className="gov-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Forensic Anomaly Flags ({data.flags.length})
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Automated integrity indicators: Hashing, Chronology, PDF Metadata & Visual ELA
                  </p>
                </div>
              </div>

              {data.flags.length === 0 ? (
                <div className="p-8 text-center bg-emerald-50/40 rounded border border-emerald-200 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <span className="font-bold">Zero Anomalies Detected</span>
                  <p className="text-[11px] text-emerald-600 mt-0.5">All uploaded certificates passed digital forensic checks.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {data.flags.map((flag, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded border border-rose-200 bg-rose-50/20 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="text-xs font-bold text-rose-900">{flag.type}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                          Confidence: {Math.round(flag.confidence * 100)}%
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="font-semibold text-slate-700">What: </span>
                          <span className="text-slate-900">{flag.what}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Where: </span>
                          <span className="text-slate-800 font-mono text-[11px]">{flag.where}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Why: </span>
                          <span className="text-slate-700">{flag.why}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-rose-100/80 text-[10px] font-semibold text-rose-700 italic">
                        {flag.disclaimer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: INFRASTRUCTURE (Feature F6) */}
          {activeTab === 'infrastructure' && (
            <div className="gov-card p-4 space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Campus Physical Infrastructure Check
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Evaluated against AICTE Approval Process Handbook (APH 2026-27, Chapter 5)
                  </p>
                </div>
                <StatusTag status={data.infrastructure?.advisory} />
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded border border-slate-200 bg-slate-50 text-xs">
                  <span className="text-slate-500 block text-[11px]">Enrolled Students</span>
                  <span className="text-lg font-bold text-slate-900">{data.infrastructure?.student_count}</span>
                  <span className="text-[10px] text-slate-400 block">Total sanctioned base</span>
                </div>
                <div className="p-3 rounded border border-slate-200 bg-slate-50 text-xs">
                  <span className="text-slate-500 block text-[11px]">Built-up Carpet Area</span>
                  <span className="text-lg font-bold text-slate-900">{data.infrastructure?.built_up_area_sqm} sq.m</span>
                  <span className="text-[10px] text-slate-400 block">Norm: 4.5 sq.m / student</span>
                </div>
                <div className="p-3 rounded border border-slate-200 bg-slate-50 text-xs">
                  <span className="text-slate-500 block text-[11px]">Technical Laboratories</span>
                  <span className="text-lg font-bold text-slate-900">{data.infrastructure?.labs_count}</span>
                  <span className="text-[10px] text-slate-400 block">Min. 6 fully equipped</span>
                </div>
              </div>

              {/* Advisory Verdict Box */}
              <div className="p-3 rounded border border-slate-200 bg-white">
                <span className="text-xs font-bold text-slate-800 block mb-1">Advisory Finding:</span>
                <p className="text-xs text-slate-700">{data.infrastructure?.notes}</p>
              </div>

              {/* Inspection Samples */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Submitted Photo & Blueprint Evidence
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="border border-slate-200 rounded p-1 bg-slate-50">
                    <img 
                      src="/sample_data/infrastructure/lab_computer_center.jpg" 
                      alt="Computing Center" 
                      className="w-full h-24 object-cover rounded" 
                    />
                    <span className="text-[10px] text-slate-600 font-medium block mt-1 px-1">Computing Lab</span>
                  </div>
                  <div className="border border-slate-200 rounded p-1 bg-slate-50">
                    <img 
                      src="/sample_data/infrastructure/library_reading_hall.jpg" 
                      alt="Reading Hall" 
                      className="w-full h-24 object-cover rounded" 
                    />
                    <span className="text-[10px] text-slate-600 font-medium block mt-1 px-1">Library Hall</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: HISTORY (Audit Trail) */}
          {activeTab === 'history' && (
            <div className="gov-card p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                Dossier Activity History
              </h2>
              <div className="space-y-2">
                {data.history?.map((h) => (
                  <div key={h.id} className="p-2.5 rounded border border-slate-100 bg-slate-50 text-xs">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800">{h.action} · {h.user} ({h.role})</span>
                      <span>{h.timestamp}</span>
                    </div>
                    <p className="text-slate-700">{h.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Column: Officer Action Panel (Sticky) */}
        <div className="space-y-4">
          <div className="gov-card p-4 sticky top-20 border-t-4 border-t-[#E8890C]">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-3">
              <UserCheck className="w-4 h-4 text-[#1B3A6B]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {t.officer_action}
              </h2>
            </div>

            <form onSubmit={handleOfficerAction} className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1.5">Adjudication Call:</span>
                <div className="space-y-1.5">
                  {[
                    { id: 'Accept Finding', label: t.accept_finding, color: 'text-rose-700' },
                    { id: 'Dismiss', label: t.dismiss, color: 'text-emerald-700' },
                    { id: 'Request Clarification', label: t.request_clarification, color: 'text-amber-700' }
                  ].map(act => (
                    <label 
                      key={act.id} 
                      className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                        selectedAction === act.id
                          ? 'border-[#1B3A6B] bg-blue-50/60 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="officer_action"
                        value={act.id}
                        checked={selectedAction === act.id}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        className="text-[#1B3A6B] focus:ring-[#1B3A6B]"
                      />
                      <span className={act.color}>{act.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  {t.officer_remarks}:
                </span>
                <textarea
                  rows={4}
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder="Enter remarks, specific deficiency notes, or institutional response deadlines..."
                  className="w-full p-2 text-xs rounded border border-slate-300 focus:outline-none focus:border-[#1B3A6B] text-slate-800"
                  required
                />
              </div>

              {actionSuccessMsg && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[11px] font-semibold flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingAction || !actionRemarks.trim()}
                className="w-full btn-gov-saffron text-xs py-2 shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>{submittingAction ? 'Submitting...' : t.submit_action}</span>
              </button>

              <div className="text-[10px] text-slate-400 text-center leading-tight pt-1">
                All officer decisions are appended to the immutable regulatory audit trail.
              </div>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
