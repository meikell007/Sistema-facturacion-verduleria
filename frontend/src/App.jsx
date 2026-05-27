import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import Login from './views/Login';
import Clients from './views/Clients';
import Products from './views/Products';
import Sales from './views/Sales';
import Cartera from './views/Cartera';
import Reports from './views/Reports';
import Users from './views/Users';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('eco_fruver_theme') || 'light');

  useEffect(() => {
    const storedUser  = localStorage.getItem('eco_fruver_user');
    const storedToken = localStorage.getItem('eco_fruver_token');

    if (storedUser && storedToken) {
      // Verificar si el JWT expiró leyendo el payload (sin librería)
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const expired = payload.exp && Date.now() / 1000 > payload.exp;
        if (expired) {
          localStorage.removeItem('eco_fruver_token');
          localStorage.removeItem('eco_fruver_user');
        } else {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // Token malformado — limpiar sesión
        localStorage.removeItem('eco_fruver_token');
        localStorage.removeItem('eco_fruver_user');
      }
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

  const isAdmin = user?.rol === 'Administrador';

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar user={user} theme={theme} toggleTheme={toggleTheme} />
        <main className="main-content">
          <Routes>
            <Route path="/"        element={<Dashboard user={user} />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales"   element={<Sales user={user} />} />
            <Route path="/cartera" element={<Cartera user={user} />} />
            <Route path="/reports" element={<Reports user={user} />} />
            {/* Ruta protegida: solo Administrador */}
            <Route
              path="/users"
              element={isAdmin ? <Users user={user} /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;