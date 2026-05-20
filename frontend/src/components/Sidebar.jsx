import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Apple, 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package, 
  Wallet, 
  FileText, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { logout } from '../services/authService';

export default function Sidebar({ user, theme, toggleTheme }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('¿Está seguro de que desea cerrar sesión?')) {
      await logout();
      navigate('/login');
    }
  };

  const isAdmin = user?.rol === 'Administrador';

  return (
    <aside className="sidebar">
      {/* Logo y Branding */}
      <div className="sidebar-logo">
        <Apple size={32} fill="currentColor" />
        <span>Eco Fruver</span>
      </div>

      {/* Menú de Navegación */}
      <nav className="sidebar-menu">
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/sales" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <ShoppingBag size={20} />
          <span>Caja POS</span>
        </NavLink>

        <NavLink 
          to="/clients" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Clientes</span>
        </NavLink>

        {/* Solo administradores pueden gestionar catálogo de productos */}
        {isAdmin && (
          <NavLink 
            to="/products" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Package size={20} />
            <span>Productos</span>
          </NavLink>
        )}

        <NavLink 
          to="/cartera" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Wallet size={20} />
          <span>Cartera / Cuentas</span>
        </NavLink>

        <NavLink 
          to="/reports" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FileText size={20} />
          <span>Reportes</span>
        </NavLink>
      </nav>

      {/* Control de Tema Claro / Oscuro y Perfil */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'auto' }}>
        
        {/* Toggle Dark Mode Button */}
        <button 
          onClick={toggleTheme} 
          className="btn btn-outline" 
          style={{ 
            justifyContent: 'flex-start', 
            padding: '10px 16px', 
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'var(--sidebar-text)',
            background: 'rgba(0,0,0,0.15)'
          }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={18} style={{ color: '#fbbf24' }} />
              <span>Tema Claro</span>
            </>
          ) : (
            <>
              <Moon size={18} style={{ color: '#a78bfa' }} />
              <span>Tema Oscuro</span>
            </>
          )}
        </button>

        {/* Tarjeta de Usuario Conectado */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.nombre} {user?.apellido}</span>
            <span className="user-role">{user?.rol}</span>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#f87171', 
              cursor: 'pointer', 
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
