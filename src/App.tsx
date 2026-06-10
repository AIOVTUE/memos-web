import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { HomePage } from './components/HomePage.js';
import { LoginPage } from './components/LoginPage.js';
import { applyTheme, getStoredTheme, type ThemeMode } from './lib/theme.js';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.checkAuth();
      setAuthenticated(data.authenticated);
    } catch {
      setAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Clear local state even if logout request fails
    }
    setAuthenticated(false);
  };

  if (authenticated === null) {
    return <div className="loading">加载中…</div>;
  }

  if (!authenticated) {
    return <LoginPage onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <HomePage
      onLogout={() => void handleLogout()}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}
