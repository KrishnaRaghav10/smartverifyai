import React, { useEffect } from 'react';
import { useApp, ROLE_DEFAULT_PATHS } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AccessDenied } from './components/AccessDenied';
import { Login } from './pages/Login';
import { InstitutionView } from './pages/InstitutionView';
import { ScrutinyOfficerView } from './pages/ScrutinyOfficerView';
import { SeniorOfficerView } from './pages/SeniorOfficerView';
import { AuditorView } from './pages/AuditorView';

export function App() {
  const { currentUser, currentPath, navigateTo, t } = useApp();

  // Redirect to role home if at root '/' or '/dashboard'
  useEffect(() => {
    if (currentUser) {
      if (currentPath === '/' || currentPath === '/dashboard') {
        const homePath = ROLE_DEFAULT_PATHS[currentUser.role] || '/institution/home';
        navigateTo(homePath);
      }
    }
  }, [currentUser, currentPath]);

  // If not authenticated or on login route
  if (!currentUser || currentPath === '/login') {
    return <Login />;
  }

  // Role Access Guard: check if currentPath belongs to another role
  const checkRoleAuthorization = () => {
    const role = currentUser.role;

    if (currentPath.startsWith('/institution') && role !== 'Institution') {
      return false;
    }
    if (currentPath.startsWith('/scrutiny') && role !== 'Scrutiny Officer') {
      return false;
    }
    if (currentPath.startsWith('/senior') && role !== 'Senior Officer') {
      return false;
    }
    if (currentPath.startsWith('/audit') && role !== 'Auditor') {
      return false;
    }
    return true;
  };

  const isAuthorized = checkRoleAuthorization();

  const renderRoleInterface = () => {
    if (!isAuthorized) {
      return <AccessDenied attemptedPath={currentPath} />;
    }

    switch (currentUser.role) {
      case 'Institution':
        return <InstitutionView />;
      case 'Scrutiny Officer':
        return <ScrutinyOfficerView />;
      case 'Senior Officer':
        return <SeniorOfficerView />;
      case 'Auditor':
        return <AuditorView />;
      default:
        return <AccessDenied attemptedPath={currentPath} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      {/* 1. Header with Role-Specific Top Strip */}
      <Header />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 bg-white overflow-y-auto min-w-0">
          {renderRoleInterface()}
        </main>
      </div>

      {/* 3. Official Government Prototype Footer */}
      <footer className="w-full bg-[#F6F8FB] border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-[11px]">
          <span>SmartVerifyAI Regulatory System · Role-Based Architecture</span>
          <span className="text-slate-400 mt-1 sm:mt-0 font-medium">
            AICTE Regulation Bureau · Problem Statement 26261
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
