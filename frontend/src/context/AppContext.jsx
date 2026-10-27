import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const AppContext = createContext();

export const DEMO_PRESETS = [
  {
    role: "Scrutiny Officer",
    email: "scrutiny@pramaan.aicte.gov.in",
    name: "Smt. Ananya Sharma",
    desc: "Reviews flags, verifies sources, confirms or dismisses findings"
  },
  {
    role: "Senior Officer",
    email: "senior@pramaan.aicte.gov.in",
    name: "Shri Rajeshwar Verma",
    desc: "Views high-level analytics, takes final policy and approval call"
  },
  {
    role: "Institution",
    email: "institution@pramaan.aicte.gov.in",
    name: "Dr. Ramesh Gupta (R.V. Institute)",
    desc: "Submits application dossier, views deficiencies and fixes gaps"
  },
  {
    role: "Auditor",
    email: "auditor@pramaan.aicte.gov.in",
    name: "Shri K. S. Narayanan",
    desc: "Read-only access to immutable regulatory audit logs"
  }
];

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState('en');
  const [currentView, setCurrentView] = useState('login'); // Start at 'login' for true start-to-finish experience
  const [selectedAppId, setSelectedAppId] = useState('APP-2026-004'); // default for quick demo inspection
  const [currentUser, setCurrentUser] = useState({
    id: "USR-SCRUT-01",
    email: "scrutiny@pramaan.aicte.gov.in",
    name: "Smt. Ananya Sharma",
    role: "Scrutiny Officer"
  });
  const [token, setToken] = useState('demo-token');

  const t = translations[lang] || translations.en;

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const loginAs = (preset) => {
    setCurrentUser({
      id: "USR-" + preset.role.toUpperCase().replace(/\s+/g, '-'),
      email: preset.email,
      name: preset.name,
      role: preset.role
    });
    setToken('token-' + preset.role);
    setCurrentView('dashboard');
  };

  const logout = () => {
    setCurrentView('login');
  };

  const navigateTo = (view, appId = null) => {
    if (appId) {
      setSelectedAppId(appId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider value={{
      lang,
      t,
      toggleLanguage,
      currentUser,
      setCurrentUser,
      token,
      loginAs,
      logout,
      currentView,
      navigateTo,
      selectedAppId,
      setSelectedAppId
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
