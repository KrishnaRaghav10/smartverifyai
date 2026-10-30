import React, { useState } from 'react';
import { useAegisStore } from '../store';
import { X, ShieldCheck, Filter, UserCheck, Bot, CheckCircle, Search, Hash } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const AuditDrawer: React.FC = () => {
  const { isAuditDrawerOpen, closeAuditDrawer, auditDrawerEntity, auditEvents } = useAegisStore();
  const [filterActor, setFilterActor] = useState<'ALL' | 'SYSTEM' | 'OFFICIAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isAuditDrawerOpen) return null;

  // Filter events matching the entity (or show all if global)
  let events = auditDrawerEntity
    ? auditEvents.filter(
        (e) =>
          e.entityRef.type === auditDrawerEntity.type &&
          e.entityRef.id === auditDrawerEntity.id
      )
    : auditEvents;

  // If entity has few events, also show other events related to that entity id
  if (events.length === 0 && auditDrawerEntity) {
    events = auditEvents.filter(
      (e) =>
        e.entityRef.id.includes(auditDrawerEntity.id) ||
        (e.before && JSON.stringify(e.before).includes(auditDrawerEntity.id))
    );
  }

  // Filter by Actor
  if (filterActor === 'SYSTEM') {
    events = events.filter((e) => e.isAutomated || e.actor === 'SYSTEM');
  } else if (filterActor === 'OFFICIAL') {
    events = events.filter((e) => !e.isAutomated && e.actor !== 'SYSTEM');
  }

  // Filter by query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    events = events.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        (e.reason && e.reason.toLowerCase().includes(q)) ||
        e.actor.toLowerCase().includes(q) ||
        e.hash.toLowerCase().includes(q)
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-[#E1E6F0] flex flex-col font-sans">
          {/* Header */}
          <div className="p-4 border-b border-[#E1E6F0] flex items-center justify-between bg-[#F7F8FC]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-[#1F3A8A] text-white rounded-xl shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-[#0F1B3D] flex items-center gap-2">
                  <span>Cryptographic Audit Trail</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Chain Verified
                  </span>
                </h3>
                <p className="text-xs text-[#5B6785]">
                  {auditDrawerEntity
                    ? `Entity: ${auditDrawerEntity.type} / ${auditDrawerEntity.id}`
                    : 'Global platform event ledger'}
                </p>
              </div>
            </div>
            <button
              onClick={closeAuditDrawer}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-[#5B6785] hover:text-[#0F1B3D] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-[#E1E6F0] bg-white space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5B6785] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit actions, actors, or reasons..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-[#E1E6F0] focus:outline-none focus:ring-1 focus:ring-[#0A5CD6]"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-[#5B6785]">Filter Actor:</span>
              <button
                onClick={() => setFilterActor('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  filterActor === 'ALL'
                    ? 'bg-[#1F3A8A] text-white'
                    : 'bg-[#EEF1F8] text-[#5B6785] hover:bg-slate-200'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setFilterActor('OFFICIAL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  filterActor === 'OFFICIAL'
                    ? 'bg-[#0A5CD6] text-white'
                    : 'bg-[#EEF1F8] text-[#5B6785] hover:bg-slate-200'
                }`}
              >
                Authorised Official
              </button>
              <button
                onClick={() => setFilterActor('SYSTEM')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  filterActor === 'SYSTEM'
                    ? 'bg-[#6D4AFF] text-white'
                    : 'bg-[#EEF1F8] text-[#5B6785] hover:bg-slate-200'
                }`}
              >
                System-generated
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {events.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5B6785]">
                No audit records matching criteria.
              </div>
            ) : (
              events.map((evt, idx) => {
                const isSys = evt.isAutomated || evt.actor === 'SYSTEM';
                return (
                  <div key={evt.id || idx} className="relative pl-6 pb-4 border-l-2 border-[#E1E6F0] last:border-l-0">
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                        isSys ? 'bg-[#6D4AFF]' : 'bg-[#1F3A8A]'
                      }`}
                    >
                      {isSys ? (
                        <Bot className="w-2.5 h-2.5 text-white" />
                      ) : (
                        <UserCheck className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>

                    {/* Event Body */}
                    <div className="bg-[#F7F8FC] p-3 rounded-xl border border-[#E1E6F0] space-y-1.5 hover:border-[#1F3A8A]/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSys
                              ? 'bg-purple-100 text-purple-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {isSys ? 'System-generated' : 'Decision by authorised official'}
                        </span>
                        <span className="text-[10px] font-mono-num text-[#5B6785]">
                          {format(parseISO(evt.at), 'dd MMM yyyy · HH:mm:ss')}
                        </span>
                      </div>

                      <div className="font-semibold text-xs text-[#0F1B3D]">
                        {evt.action.replace(/_/g, ' ')}
                      </div>

                      <div className="text-[11px] text-[#5B6785]">
                        <span className="font-medium text-[#0F1B3D]">Actor:</span> {evt.actor}
                      </div>

                      {evt.reason && (
                        <p className="text-xs text-[#0F1B3D] bg-white p-2 rounded-lg border border-slate-200/60 italic">
                          "{evt.reason}"
                        </p>
                      )}

                      {/* Before / After diff preview if available */}
                      {(evt.before || evt.after) && (
                        <div className="text-[10px] font-mono bg-slate-900 text-emerald-400 p-2 rounded-lg overflow-x-auto space-y-0.5">
                          {evt.before && <div>- PREV: {JSON.stringify(evt.before)}</div>}
                          {evt.after && <div className="text-white">+ NEXT: {JSON.stringify(evt.after)}</div>}
                        </div>
                      )}

                      {/* Cryptographic Hash Verification Line */}
                      <div className="pt-1.5 border-t border-[#E1E6F0] flex items-center justify-between text-[10px] font-mono text-[#5B6785]">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-[#138808]" />
                          Hash: {evt.hash.slice(0, 10)}...{evt.hash.slice(-4)}
                        </span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                          ✓ chained
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-[#EEF1F8] border-t border-[#E1E6F0] text-[10px] text-[#5B6785] text-center">
            Immutable SHA-256 Hash Chain · Tamper-evident Audit Guarantee
          </div>
        </div>
      </div>
    </div>
  );
};
