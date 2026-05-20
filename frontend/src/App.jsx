import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import Login from './views/Login';
import Clients from './views/Clients';
import Products from './views/Products';
import Sales from './views/Sales';
import Cartera from './views/Cartera';
import Reports from './views/Reports';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('eco_fruver_theme') || 'light');

  // Check token on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('eco_fruver_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('eco_fruver_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // If no user, force login
  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar user={user} theme={theme} toggleTheme={toggleTheme} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/cartera" element={<Cartera />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

