import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StatusTag } from '../components/StatusTag';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Search, Filter, RefreshCw, ArrowUpRight } from 'lucide-react';

export const ApplicationsList = () => {
  const { t, navigateTo } = useApp();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchApps = () => {
    setLoading(true);
    let url = `/api/applications?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (categoryFilter !== 'All') url += `category=${encodeURIComponent(categoryFilter)}&`;
    if (statusFilter !== 'All') url += `status=${encodeURIComponent(statusFilter)}&`;

    fetch(url)
      .then(res => res.json())
      .then(d => {
        setApps(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching applications:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApps();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApps();
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: t.nav_applications }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.nav_applications}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-scrutiny registry for AICTE Extension of Approval (EoA) 2026-27 dossiers
          </p>
        </div>
        <div className="mt-2 sm:mt-0">
          <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
            Total Ingested: {apps.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="gov-card p-3 flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, Institute, or AICTE ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:border-[#1B3A6B] bg-white text-slate-800"
          />
        </form>

        {/* Filters */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
          
          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-2 text-xs rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
            >
              <option value="All">All Categories</option>
              <option value="Extension of Approval">Extension of Approval</option>
              <option value="Increase in intake">Increase in intake</option>
              <option value="New course">New course</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2 text-xs rounded border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1B3A6B]"
            >
              <option value="All">{t.status_all}</option>
              <option value="Clean">Clean</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Deficient">Deficient</option>
              <option value="Verification Pending">Verification Pending</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchApps}
            className="p-1.5 rounded border border-slate-300 hover:bg-slate-50 text-slate-600"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

      {/* Applications Data Grid */}
      <div className="gov-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Filtering applications...
          </div>
        ) : apps.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No applications match the current search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F8FB] text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Application ID</th>
                  <th className="py-2.5 px-3">Institution & AICTE ID</th>
                  <th className="py-2.5 px-3">State / District</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Submitted On</th>
                  <th className="py-2.5 px-3">Validation Status</th>
                  <th className="py-2.5 px-3 text-center">Flags</th>
                  <th className="py-2.5 px-3 text-right">Adjudication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apps.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#1B3A6B] whitespace-nowrap">
                      {a.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      <div>{a.institute_name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">AICTE ID: {a.aicte_id}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {a.state}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {a.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {a.submitted_on}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusTag status={a.status} />
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {a.flags_count > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {a.flags_count} flags
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => navigateTo('application_detail', a.id)}
                        className="btn-gov-outline text-[11px] py-1 px-2.5 inline-flex items-center"
                      >
                        <span>Open Dossier</span>
                        <ArrowUpRight className="w-3 h-3 ml-1 text-[#1B3A6B]" />
                      </button>
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
