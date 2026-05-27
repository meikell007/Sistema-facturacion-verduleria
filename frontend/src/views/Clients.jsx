import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Search, Plus, Edit2, Eye, CreditCard, X, AlertTriangle,
  Phone, Mail, MapPin, FileText, CheckCircle2
} from 'lucide-react';
import { getClients, createClient, updateClient, getClientHistory } from '../services/clientService';
import Modal from '../components/Modal';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value || 0);

const formatHistoryDate = (d) =>
  new Date(d).toLocaleString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function Clients({ user }) {
  const [clients, setClients]               = useState([]);
  const [search, setSearch]                 = useState('');
  const [loading, setLoading]               = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory]   = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalMode, setModalMode]           = useState('create');
  const [formError, setFormError]           = useState('');
  const [saving, setSaving]                 = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  const emptyForm = {
    nombre: '', apellido: '', identificacion: '', tipo_identificacion: 'CC',
    telefono: '', email: '', direccion: '', limite_credito: 0, activo: true
  };
  const [formData, setFormData] = useState(emptyForm);

  // ── Debounce en el buscador — evita una llamada por cada letra ─────────────
  const debounceRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadClients(val), 350);
  };

  useEffect(() => {
    loadClients('');
    return () => clearTimeout(debounceRef.current);
  }, []);

  // Recargar cuando cambia el toggle de inactivos
  useEffect(() => { loadClients(search); }, [includeInactive]);

  const loadClients = async (q = search) => {
    try {
      setLoading(true);
      const data = await getClients(q, includeInactive);
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al obtener clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData(emptyForm);
    setModalMode('create');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setFormData({
      id_cliente:          client.id_cliente,
      nombre:              client.nombre,
      apellido:            client.apellido,
      identificacion:      client.identificacion,
      tipo_identificacion: client.tipo_identificacion,
      telefono:            client.telefono || '',
      email:               client.email    || '',
      direccion:           client.direccion || '',
      limite_credito:      Number(client.limite_credito),
      activo:              client.activo
    });
    setModalMode('edit');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenDetail = async (client) => {
    setSelectedClient(client);
    setIsDetailModalOpen(true);
    setHistoryLoading(true);
    try {
      const history = await getClientHistory(client.id_cliente);
      // El backend devuelve { client, invoices, payments } — usamos invoices
      const invoices = history?.invoices ?? history;
      setClientHistory(Array.isArray(invoices) ? invoices : []);
    } catch { setClientHistory([]); }
    finally { setHistoryLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validateForm = () => {
    if (!formData.nombre.trim())         return 'El nombre es obligatorio.';
    if (!formData.apellido.trim())       return 'El apellido es obligatorio.';
    if (!formData.identificacion.trim()) return 'La identificación es obligatoria.';
    if (Number(formData.limite_credito) < 0) return 'El límite de crédito no puede ser negativo.';
    return '';
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const err = validateForm();
    if (err) return setFormError(err);
    setSaving(true);
    setFormError('');
    try {
      if (modalMode === 'create') {
        await createClient(formData);
      } else {
        await updateClient(formData.id_cliente, formData);
      }
      setIsModalOpen(false);
      loadClients(search);
    } catch (error) {
      setFormError(error.response?.data?.error || 'Error al guardar cliente. Comprueba los datos.');
    } finally {
      setSaving(false);
    }
  };

  const calculateDebtPct = (client) => {
    const limit = Number(client.limite_credito);
    const used  = Number(client.credito_utilizado);
    if (!limit || limit <= 0) return 0;
    return Math.min(Math.max((used / limit) * 100, 0), 100).toFixed(0);
  };

  return (
    // Sin className="main-content" — App.jsx ya lo pone
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 4px' }}>Maestro de Clientes</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Administra clientes, controla cupos de crédito y consulta historiales.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Registrar Cliente
        </button>
      </div>

      {/* Buscador con debounce */}
      <div className="card card-glass" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px 20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input"
            placeholder="Buscar por identificación, nombre o apellido..."
            value={search}
            onChange={handleSearchChange}
            style={{ paddingLeft: '44px' }}
          />
        </div>
        {/* Toggle para ver clientes inactivos */}
        <button
          className={`btn ${includeInactive ? 'btn-primary' : 'btn-outline'}`}
          style={{ whiteSpace: 'nowrap', padding: '10px 16px', fontSize: '0.85rem' }}
          onClick={() => setIncludeInactive(v => !v)}
          title="Mostrar también clientes inactivos"
        >
          {includeInactive ? 'Mostrando todos' : 'Ver inactivos'}
        </button>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Identificación</th><th>Cliente</th><th>Contacto</th>
              <th>Cupo total</th><th>Deuda actual</th><th>Cupo libre</th>
              <th>Uso crédito</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Cargando clientes...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No se encontraron clientes.</td></tr>
            ) : clients.map(client => {
              const cupoDisponible = Number(client.limite_credito) - Number(client.credito_utilizado);
              const pct = calculateDebtPct(client);
              return (
                <tr key={client.id_cliente} style={{ opacity: client.activo ? 1 : 0.55 }}>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                      {client.tipo_identificacion} {client.identificacion}
                    </span>
                  </td>
                  <td>
                    <strong>{client.nombre} {client.apellido}</strong>
                    {!client.activo && <span className="badge badge-danger" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>Inactivo</span>}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div>{client.telefono || <span style={{ color: 'var(--text-muted)' }}>Sin teléfono</span>}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{client.email || 'Sin correo'}</div>
                  </td>
                  <td>{formatCurrency(client.limite_credito)}</td>
                  <td style={{ color: Number(client.credito_utilizado) > 0 ? 'var(--danger)' : 'inherit', fontWeight: Number(client.credito_utilizado) > 0 ? 700 : 400 }}>
                    {formatCurrency(client.credito_utilizado)}
                  </td>
                  <td style={{ color: cupoDisponible < 0 ? 'var(--danger)' : 'var(--primary)', fontWeight: 600 }}>
                    {formatCurrency(cupoDisponible)}
                  </td>
                  <td>
                    {Number(client.limite_credito) > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? 'var(--danger)' : pct > 40 ? 'var(--warning)' : 'var(--primary)' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{pct}%</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin crédito</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline" style={{ padding: '6px 10px' }} title="Ver historial"
                        onClick={() => handleOpenDetail(client)}><Eye size={16} /></button>
                      <button className="btn btn-outline" style={{ padding: '6px 10px' }} title="Editar"
                        onClick={() => handleOpenEdit(client)}><Edit2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal crear / editar */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Registrar nuevo cliente' : 'Modificar cliente'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div style={{ background: 'var(--danger-light)', color: 'hsl(350,82%,35%)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} /> {formError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Nombre *</label>
              <input name="nombre" type="text" className="input" value={formData.nombre} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Apellido *</label>
              <input name="apellido" type="text" className="input" value={formData.apellido} onChange={handleInputChange} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Tipo doc *</label>
              <select name="tipo_identificacion" className="input" value={formData.tipo_identificacion} onChange={handleInputChange}>
                <option value="CC">CC</option>
                <option value="NIT">NIT</option>
                <option value="CE">CE</option>
              </select>
            </div>
            <div className="form-group">
              <label>Identificación / Cédula / NIT *</label>
              <input name="identificacion" type="text" className="input" value={formData.identificacion} onChange={handleInputChange} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Teléfono</label>
              <input name="telefono" type="tel" className="input" value={formData.telefono} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" className="input" value={formData.email} onChange={handleInputChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input name="direccion" type="text" className="input" value={formData.direccion} onChange={handleInputChange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: modalMode === 'edit' ? '1fr auto' : '1fr', gap: '24px', alignItems: 'center' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Límite de cupo crédito (COP) *</label>
              <input name="limite_credito" type="number" className="input"
                value={formData.limite_credito} onChange={handleInputChange} min="0" step="1000" required />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>
                Pon 0 si el cliente no tiene crédito autorizado.
              </p>
            </div>
            {modalMode === 'edit' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                <input id="client-activo" name="activo" type="checkbox" checked={formData.activo}
                  onChange={handleInputChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label htmlFor="client-activo" style={{ cursor: 'pointer', margin: 0 }}>Activo</label>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal ficha / historial */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}
        title={`Ficha: ${selectedClient?.nombre} ${selectedClient?.apellido}`}
        footer={<button className="btn btn-outline" onClick={() => setIsDetailModalOpen(false)}>Cerrar</button>}
      >
        {selectedClient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card card-glass" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--primary)', margin: 0 }}>
                  Datos del cliente
                </h4>
                {[
                  [FileText, `${selectedClient.tipo_identificacion}: ${selectedClient.identificacion}`],
                  [Phone,    selectedClient.telefono   || 'Sin teléfono'],
                  [Mail,     selectedClient.email      || 'Sin correo'],
                  [MapPin,   selectedClient.direccion  || 'Sin dirección'],
                ].map(([Icon, text], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                    <Icon size={15} color="var(--text-muted)" /> {text}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--primary)', margin: 0 }}>
                  Estado de crédito
                </h4>
                {[
                  ['Cupo total',    formatCurrency(selectedClient.limite_credito), null],
                  ['Deuda actual',  formatCurrency(selectedClient.credito_utilizado), Number(selectedClient.credito_utilizado) > 0 ? 'var(--danger)' : null],
                  ['Cupo libre',    formatCurrency(Number(selectedClient.limite_credito) - Number(selectedClient.credito_utilizado)), 'var(--primary)'],
                ].map(([label, val, color], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <strong style={color ? { color } : {}}>{val}</strong>
                  </div>
                ))}
                {Number(selectedClient.limite_credito) > 0 && (() => {
                  const pct = Math.min((Number(selectedClient.credito_utilizado) / Number(selectedClient.limite_credito)) * 100, 100).toFixed(0);
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Uso del cupo</span><strong>{pct}%</strong>
                      </div>
                      <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? 'var(--danger)' : pct > 40 ? 'var(--warning)' : 'var(--primary)' }} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div>
              <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                <CreditCard size={17} /> Historial de compras
              </h3>
              <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr><th>Factura</th><th>Fecha</th><th>Tipo</th><th>Total</th><th>Saldo</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Cargando...</td></tr>
                    ) : clientHistory.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Sin transacciones.</td></tr>
                    ) : clientHistory.map(inv => (
                      <tr key={inv.id_factura}>
                        <td><strong style={{ color: 'var(--primary)' }}>{inv.numero_factura}</strong></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatHistoryDate(inv.fecha_emision)}</td>
                        <td><span className={`badge ${inv.tipo_pago === 'Contado' ? 'badge-success' : 'badge-warning'}`}>{inv.tipo_pago}</span></td>
                        <td><strong>{formatCurrency(inv.total)}</strong></td>
                        <td style={{ color: Number(inv.saldo_pendiente) > 0 ? 'var(--danger)' : 'inherit', fontWeight: Number(inv.saldo_pendiente) > 0 ? 700 : 400 }}>
                          {formatCurrency(inv.saldo_pendiente)}
                        </td>
                        <td>
                          <span className={`badge ${inv.estado === 'Pagada' ? 'badge-success' : inv.estado === 'Parcialmente_Pagada' ? 'badge-warning' : 'badge-danger'}`}>
                            {inv.estado.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}