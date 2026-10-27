import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ApplicationsList } from './pages/ApplicationsList';
import { ApplicationDetail } from './pages/ApplicationDetail';
import { AuditLog } from './pages/AuditLog';
import { RulesManagement } from './pages/RulesManagement';
import { Safeguards } from './pages/Safeguards';

export function App() {
  const { currentView, t } = useApp();

  if (currentView === 'login') {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'applications':
        return <ApplicationsList />;
      case 'application_detail':
        return <ApplicationDetail />;
      case 'audit':
        return <AuditLog />;
      case 'rules':
        return <RulesManagement />;
      case 'safeguards':
        return <Safeguards />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      {/* 1. Header with Tricolour Strip */}
      <Header />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 bg-white overflow-y-auto min-w-0">
          {renderContent()}
        </main>
      </div>

      {/* 3. Official Government Prototype Footer */}
      <footer className="w-full bg-[#F6F8FB] border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-[11px]">
          <span>{t.footer_text}</span>
          <span className="text-slate-400 mt-1 sm:mt-0 font-medium">
            AICTE Regulation Bureau · Problem Statement 26261
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
