import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Shield,
  User,
  RefreshCw
} from 'lucide-react';
import API from '../services/api';

// ─── Utilidades ────────────────────────────────────────────────────────────────

const formatDate = (d) =>
  new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const ROLES = [
  { id: 1, nombre: 'Administrador' },
  { id: 2, nombre: 'Cajero' },
];

// ─── Componente principal ───────────────────────────────────────────────────────

export default function Users({ user }) {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [showPass, setShowPass]     = useState(false);

  const emptyForm = { nombre: '', apellido: '', username: '', password: '', id_rol: 2 };
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  // ─── Carga de usuarios ───────────────────────────────────────────────────────

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/auth/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Handlers formulario ─────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'id_rol' ? parseInt(value) : value }));
    setFormError('');
  };

  const validateForm = () => {
    if (!form.nombre.trim())    return 'El nombre es obligatorio.';
    if (!form.apellido.trim())  return 'El apellido es obligatorio.';
    if (!form.username.trim())  return 'El nombre de usuario es obligatorio.';
    if (form.username.length < 4) return 'El usuario debe tener al menos 4 caracteres.';
    if (!form.password)         return 'La contraseña es obligatoria.';
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (!form.id_rol)           return 'Selecciona un rol.';
    return '';
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) return setFormError(validationError);

    try {
      setSaving(true);
      setFormError('');
      await API.post('/auth/register', form);
      setSuccess(`Usuario "${form.username}" creado exitosamente.`);
      setShowModal(false);
      setForm(emptyForm);
      loadUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setFormError(err?.response?.data?.error || 'Error al crear el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const openModal = () => {
    setForm(emptyForm);
    setFormError('');
    setShowPass(false);
    setShowModal(true);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="stat-icon" style={{ background: 'var(--secondary-light)' }}>
            <UserCog size={24} color="var(--secondary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Usuarios del sistema</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              Gestiona los accesos de administradores y cajeros
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={18} /> Nuevo usuario
        </button>
      </div>

      {/* Mensaje de éxito */}
      {success && (
        <div style={{
          background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)',
          padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px',
          color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      {/* Error de carga */}
      {error && (
        <div style={{
          background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)',
          padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px',
          color: 'hsl(350, 82%, 35%)', fontSize: '0.9rem'
        }}>
          <AlertTriangle size={16} /> {error}
          <button className="btn btn-outline" style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '0.8rem' }} onClick={loadUsers}>
            <RefreshCw size={13} /> Reintentar
          </button>
        </div>
      )}

      {/* ── Modal: crear usuario ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Plus size={20} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Crear nuevo usuario</h3>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

              {/* Nombre y apellido */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="u-nombre">Nombre</label>
                  <input
                    id="u-nombre"
                    name="nombre"
                    className="input"
                    placeholder="Ej: María"
                    value={form.nombre}
                    onChange={handleChange}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="u-apellido">Apellido</label>
                  <input
                    id="u-apellido"
                    name="apellido"
                    className="input"
                    placeholder="Ej: García"
                    value={form.apellido}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Username */}
              <div className="form-group">
                <label htmlFor="u-username">Nombre de usuario</label>
                <input
                  id="u-username"
                  name="username"
                  className="input"
                  placeholder="Ej: mgarcia (mínimo 4 caracteres)"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>

              {/* Contraseña */}
              <div className="form-group">
                <label htmlFor="u-password">Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="u-password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    className="input"
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Rol */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="u-rol">Rol</label>
                <select
                  id="u-rol"
                  name="id_rol"
                  className="input"
                  value={form.id_rol}
                  onChange={handleChange}
                >
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>
                  {form.id_rol === 1
                    ? 'Acceso completo: productos, reportes, usuarios y auditoría.'
                    : 'Acceso a caja POS, clientes, cartera y mora.'}
                </p>
              </div>

              {/* Error de formulario */}
              {formError && (
                <div style={{
                  marginTop: '14px', background: 'var(--danger-light)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                  color: 'hsl(350, 82%, 35%)', fontSize: '0.85rem',
                  display: 'flex', gap: '8px', alignItems: 'flex-start'
                }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                  {formError}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={handleSubmit}
              >
                {saving ? 'Creando...' : <><Plus size={16} /> Crear usuario</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla de usuarios ────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>
            Usuarios registrados
            {!loading && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem', marginLeft: '8px' }}>({users.length})</span>}
          </h3>
          <button className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={loadUsers}>
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Cargando usuarios...
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No hay usuarios registrados.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id_usuario}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%',
                          background: u.rol?.nombre_rol === 'Administrador' ? 'var(--secondary-light)' : 'var(--primary-light)',
                          color: u.rol?.nombre_rol === 'Administrador' ? 'var(--secondary)' : 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.9rem', flexShrink: 0
                        }}>
                          {u.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>
                            {u.nombre} {u.apellido}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      @{u.username}
                      {u.username === user?.username && (
                        <span style={{ marginLeft: '6px', fontSize: '0.72rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
                          Tú
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {u.rol?.nombre_rol === 'Administrador'
                          ? <Shield size={14} color="var(--secondary)" />
                          : <User size={14} color="var(--primary)" />
                        }
                        <span className={`badge ${u.rol?.nombre_rol === 'Administrador' ? 'badge-warning' : 'badge-success'}`}
                          style={{ fontSize: '0.72rem' }}>
                          {u.rol?.nombre_rol || '—'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {u.fecha_creacion ? formatDate(u.fecha_creacion) : '—'}
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
}
