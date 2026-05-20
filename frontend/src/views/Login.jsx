import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { login } from '../services/authService';

export default function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await login(username, password);
      setUser(data.user);
      navigate('/');
    } catch (err) {
      console.error('Error in login form:', err);
      setError(err.response?.data?.error || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        background: 'var(--bg-app)',
        padding: '20px'
      }}
    >
      <div 
        className="card card-glass" 
        style={{ 
          width: '100%', 
          maxWidth: '420px', 
          padding: '40px 32px', 
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center'
        }}
      >
        {/* Logo de Manzana */}
        <div 
          style={{ 
            display: 'inline-flex', 
            padding: '16px', 
            borderRadius: '50%', 
            background: 'var(--primary-light)', 
            color: 'var(--primary)',
            marginBottom: '20px'
          }}
        >
          <Apple size={48} fill="currentColor" />
        </div>

        {/* Título de la Aplicación */}
        <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-main)' }}>Eco Fruver</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem' }}>
          Sistema de Gestión de Facturas y Cartera
        </p>

        {/* Alerta de Error */}
        {error && (
          <div 
            className="credit-warning-box" 
            style={{ 
              marginBottom: '20px', 
              background: 'var(--danger-light)', 
              borderColor: 'var(--danger)',
              color: 'var(--danger)',
              flexDirection: 'row',
              alignItems: 'center',
              textAlign: 'left'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginRight: 8 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <div style={{ position: 'relative' }}>
              <UserIcon 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
              <input 
                id="username"
                type="text" 
                className="input" 
                placeholder="Nombre de usuario" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
              <input 
                id="password"
                type="password" 
                className="input" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px' }}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
