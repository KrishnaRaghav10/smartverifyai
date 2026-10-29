import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const AppContext = createContext();

export const DEMO_PRESETS = [
  {
    username: "inst01",
    role: "Institution",
    name: "Dr. Ramesh Gupta (Director, R.V. Institute)",
    institute_id: "INST-01",
    homePath: "/institution/home",
    desc: "Submit application, upload/replace docs, view plain deficiencies"
  },
  {
    username: "inst02",
    role: "Institution",
    name: "Dr. Suresh Patil (Director, Pune Institute)",
    institute_id: "INST-02",
    homePath: "/institution/home",
    desc: "Second institution demonstrating strict data-isolation rules"
  },
  {
    username: "scrutiny01",
    role: "Scrutiny Officer",
    name: "Smt. Ananya Sharma",
    institute_id: null,
    homePath: "/scrutiny/queue",
    desc: "Review queue, source verify, accept/dismiss flags, recommend to Senior"
  },
  {
    username: "senior01",
    role: "Senior Officer",
    name: "Shri Rajeshwar Verma",
    institute_id: null,
    homePath: "/senior/overview",
    desc: "High-level overview, final decisions (Approve/Return/Reject), assign, rules"
  },
  {
    username: "auditor01",
    role: "Auditor",
    name: "Shri K. S. Narayanan",
    institute_id: null,
    homePath: "/audit/logs",
    desc: "Read-only access, searchable audit ledger, export CSV"
  }
];

export const ROLE_DEFAULT_PATHS = {
  "Institution": "/institution/home",
  "Scrutiny Officer": "/scrutiny/queue",
  "Senior Officer": "/senior/overview",
  "Auditor": "/audit/logs"
};

export const ROLE_PATH_PREFIXES = {
  "Institution": "/institution",
  "Scrutiny Officer": "/scrutiny",
  "Senior Officer": "/senior",
  "Auditor": "/audit"
};

export const TOP_STRIP_COLORS = {
  "Institution": "#138808",     // Green
  "Scrutiny Officer": "#1B3A6B",// Navy
  "Senior Officer": "#FF9933",  // Saffron
  "Auditor": "#64748B"          // Grey
};

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState('en');
  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.pathname;
    return (path && path !== '/') ? path : '/login';
  });
  const [selectedAppId, setSelectedAppId] = useState('APP-2026-004');

  // Load saved user or start at login
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smartverify_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('smartverify_token') || '';
  });

  const t = translations[lang] || translations.en;

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/login');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path, appId = null) => {
    if (appId) {
      setSelectedAppId(appId);
    }
    setCurrentPath(path);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const loginWithPreset = async (preset, password = 'demo123') => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: preset.username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      const userObj = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        institute_id: data.user.institute_id
      };

      setCurrentUser(userObj);
      setToken(data.access_token);
      localStorage.setItem('smartverify_user', JSON.stringify(userObj));
      localStorage.setItem('smartverify_token', data.access_token);

      const targetPath = ROLE_DEFAULT_PATHS[userObj.role] || '/institution/home';
      navigateTo(targetPath);
      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken('');
    localStorage.removeItem('smartverify_user');
    localStorage.removeItem('smartverify_token');
    navigateTo('/login');
  };

  // Helper for authorized API calls
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    };
    const response = await fetch(url, { ...options, headers });
    return response;
  };

  return (
    <AppContext.Provider value={{
      lang,
      t,
      toggleLanguage,
      currentUser,
      token,
      loginWithPreset,
      logout,
      currentPath,
      navigateTo,
      selectedAppId,
      setSelectedAppId,
      authFetch
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
