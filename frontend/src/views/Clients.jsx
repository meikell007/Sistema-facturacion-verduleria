import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Eye, 
  CreditCard, 
  X, 
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  getClients, 
  createClient, 
  updateClient, 
  getClientHistory 
} from '../services/clientService';
import Modal from '../components/Modal';

export default function Clients({ user }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  
  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    identificacion: '',
    tipo_identificacion: 'CC',
    telefono: '',
    email: '',
    direccion: '',
    limite_credito: 0,
    activo: true
  });
  
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClients();
  }, [search]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getClients(search);
      setClients(data);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      nombre: '',
      apellido: '',
      identificacion: '',
      tipo_identificacion: 'CC',
      telefono: '',
      email: '',
      direccion: '',
      limite_credito: 0,
      activo: true
    });
    setModalMode('create');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setFormData({
      id_cliente: client.id_cliente,
      nombre: client.nombre,
      apellido: client.apellido,
      identificacion: client.identificacion,
      tipo_identificacion: client.tipo_identificacion,
      telefono: client.telefono || '',
      email: client.email || '',
      direccion: client.direccion || '',
      limite_credito: Number(client.limite_credito),
      activo: client.activo
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
      setClientHistory(history);
    } catch (error) {
      console.error('Error al obtener historial del cliente:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.apellido || !formData.identificacion) {
      setFormError('Nombre, Apellido e Identificación son campos obligatorios.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await createClient(formData);
      } else {
        await updateClient(formData.id_cliente, formData);
      }
      setIsModalOpen(false);
      loadClients();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      setFormError(error.response?.data?.error || 'Error al guardar cliente. Compruebe los datos.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatHistoryDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDebtPercentage = (client) => {
    const limit = Number(client.limite_credito);
    const utilized = Number(client.credito_utilizado);
    if (!limit || limit <= 0) return 0;
    const pct = (utilized / limit) * 100;
    return Math.min(Math.max(pct, 0), 100).toFixed(0);
  };

  return (
    <div className="main-content">
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-main)' }}>Maestro de Clientes</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Administre los clientes del fruver, controle cupos de crédito (fiados) y consulte historiales.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Registrar Cliente
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="card card-glass" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1' }}>
          <Search 
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
            type="text" 
            className="input" 
            placeholder="Buscar por identificación, nombre o apellido..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Identificación</th>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Cupo Total</th>
              <th>Deuda Actual</th>
              <th>Cupo Disponible</th>
              <th>Uso Crédito</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  Cargando catálogo de clientes...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No se encontraron clientes en el sistema.
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const cupoDisponible = Number(client.limite_credito) - Number(client.credito_utilizado);
                const debtPct = calculateDebtPercentage(client);
                
                return (
                  <tr key={client.id_cliente} style={{ opacity: client.activo ? 1 : 0.6 }}>
                    <td>
                      <span className="badge badge-success" style={{ background: 'var(--bg-app)', color: 'var(--text-main)' }}>
                        {client.tipo_identificacion} {client.identificacion}
                      </span>
                    </td>
                    <td>
                      <strong>{client.nombre} {client.apellido}</strong>
                      {!client.activo && (
                        <span className="badge badge-danger" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                        <span>{client.telefono || 'Sin teléfono'}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{client.email || 'Sin correo'}</span>
                      </div>
                    </td>
                    <td>{formatCurrency(client.limite_credito)}</td>
                    <td style={{ 
                      color: Number(client.credito_utilizado) > 0 ? 'var(--danger)' : 'inherit',
                      fontWeight: Number(client.credito_utilizado) > 0 ? '700' : 'normal'
                    }}>
                      {formatCurrency(client.credito_utilizado)}
                    </td>
                    <td style={{ 
                      color: cupoDisponible < 0 ? 'var(--danger)' : 'var(--primary)',
                      fontWeight: '600'
                    }}>
                      {formatCurrency(cupoDisponible)}
                    </td>
                    <td>
                      {Number(client.limite_credito) > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
                          <div style={{ 
                            flex: 1, 
                            height: '6px', 
                            background: 'var(--border)', 
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${debtPct}%`, 
                              height: '100%', 
                              background: debtPct > 80 ? 'var(--danger)' : debtPct > 40 ? 'var(--warning)' : 'var(--primary)'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                            {debtPct}%
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin Crédito</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleOpenDetail(client)}
                          style={{ padding: '6px 10px' }}
                          title="Ver Ficha y Historial de Fiados"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleOpenEdit(client)}
                          style={{ padding: '6px 10px' }}
                          title="Editar Datos"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Agregar / Editar Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Registrar Nuevo Cliente' : 'Modificar Cliente'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="credit-warning-box" style={{ marginBottom: '16px', background: 'var(--danger-light)', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
              <AlertTriangle size={18} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
              <strong>Error: </strong> {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="client-nombre">Nombre *</label>
              <input 
                id="client-nombre"
                name="nombre" 
                type="text" 
                className="input" 
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="client-apellido">Apellido *</label>
              <input 
                id="client-apellido"
                name="apellido" 
                type="text" 
                className="input" 
                value={formData.apellido}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="client-tipo-id">Tipo Doc *</label>
              <select 
                id="client-tipo-id"
                name="tipo_identificacion" 
                className="input"
                value={formData.tipo_identificacion}
                onChange={handleInputChange}
              >
                <option value="CC">CC</option>
                <option value="NIT">NIT</option>
                <option value="CE">CE</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="client-id">Identificación / Cédula / NIT *</label>
              <input 
                id="client-id"
                name="identificacion" 
                type="text" 
                className="input" 
                value={formData.identificacion}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="client-tel">Teléfono</label>
              <input 
                id="client-tel"
                name="telefono" 
                type="tel" 
                className="input" 
                value={formData.telefono}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="client-email">Email</label>
              <input 
                id="client-email"
                name="email" 
                type="email" 
                className="input" 
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="client-dir">Dirección</label>
            <input 
              id="client-dir"
              name="direccion" 
              type="text" 
              className="input" 
              value={formData.direccion}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'center' }}>
            <div className="form-group">
              <label htmlFor="client-cupo">Límite de Cupo Crédito (COP) *</label>
              <input 
                id="client-cupo"
                name="limite_credito" 
                type="number" 
                className="input" 
                value={formData.limite_credito}
                onChange={handleInputChange}
                min="0"
                step="1000"
                required
              />
            </div>

            {modalMode === 'edit' && (
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', marginTop: '16px' }}>
                <input 
                  id="client-activo"
                  name="activo" 
                  type="checkbox" 
                  checked={formData.activo}
                  onChange={handleInputChange}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="client-activo" style={{ cursor: 'pointer', marginBottom: '0' }}>Cliente Activo</label>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal Ficha y Historial del Cliente */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Ficha de Cliente: ${selectedClient?.nombre} ${selectedClient?.apellido}`}
        footer={
          <button className="btn btn-outline" onClick={() => setIsDetailModalOpen(false)}>
            Cerrar Ficha
          </button>
        }
      >
        {selectedClient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Info Básica y Barra de Crédito */}
            <div className="card card-glass" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--primary)' }}>
                  Información del Cliente
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <FileText size={16} className="text-muted" />
                  <span><strong>Doc:</strong> {selectedClient.tipo_identificacion} {selectedClient.identificacion}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <Phone size={16} className="text-muted" />
                  <span><strong>Teléfono:</strong> {selectedClient.telefono || 'No registrado'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <Mail size={16} className="text-muted" />
                  <span><strong>Correo:</strong> {selectedClient.email || 'No registrado'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <MapPin size={16} className="text-muted" />
                  <span><strong>Dirección:</strong> {selectedClient.direccion || 'No registrada'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--primary)' }}>
                  Estado de Crédito
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Cupo de Crédito:</span>
                  <strong>{formatCurrency(selectedClient.limite_credito)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Crédito Utilizado (Deuda):</span>
                  <strong style={{ color: Number(selectedClient.credito_utilizado) > 0 ? 'var(--danger)' : 'inherit' }}>
                    {formatCurrency(selectedClient.credito_utilizado)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Cupo Disponible:</span>
                  <strong style={{ color: 'var(--primary)' }}>
                    {formatCurrency(Number(selectedClient.limite_credito) - Number(selectedClient.credito_utilizado))}
                  </strong>
                </div>

                {Number(selectedClient.limite_credito) > 0 ? (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Uso del cupo</span>
                      <strong>{calculateDebtPercentage(selectedClient)}%</strong>
                    </div>
                    <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${calculateDebtPercentage(selectedClient)}%`, 
                        height: '100%', 
                        background: Number(calculateDebtPercentage(selectedClient)) > 80 ? 'var(--danger)' : Number(calculateDebtPercentage(selectedClient)) > 40 ? 'var(--warning)' : 'var(--primary)'
                      }} />
                    </div>
                  </div>
                ) : (
                  <div className="badge badge-success" style={{ background: 'var(--bg-app)', color: 'var(--text-muted)', alignSelf: 'flex-start', textTransform: 'none' }}>
                    Cliente no autorizado para crédito ("fiado")
                  </div>
                )}
              </div>
            </div>

            {/* Historial de Créditos y Transacciones */}
            <div>
              <h3 style={{ marginBottom: '12px', fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} />
                Historial de Compras y Movimientos de Cartera
              </h3>
              
              <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Factura</th>
                      <th>Fecha Emisión</th>
                      <th>Tipo</th>
                      <th>Total</th>
                      <th>Deuda Restante</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                          Cargando historial de cuentas...
                        </td>
                      </tr>
                    ) : clientHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          No hay transacciones registradas para este cliente.
                        </td>
                      </tr>
                    ) : (
                      clientHistory.map((invoice) => (
                        <tr key={invoice.id_factura}>
                          <td><strong>{invoice.numero_factura}</strong></td>
                          <td style={{ fontSize: '0.85rem' }}>{formatHistoryDate(invoice.fecha_emision)}</td>
                          <td>
                            <span className={`badge ${invoice.tipo_pago === 'Contado' ? 'badge-success' : 'badge-warning'}`}>
                              {invoice.tipo_pago}
                            </span>
                          </td>
                          <td><strong>{formatCurrency(invoice.total)}</strong></td>
                          <td style={{ 
                            color: Number(invoice.saldo_pendiente) > 0 ? 'var(--danger)' : 'inherit',
                            fontWeight: Number(invoice.saldo_pendiente) > 0 ? '700' : 'normal'
                          }}>
                            {formatCurrency(invoice.saldo_pendiente)}
                          </td>
                          <td>
                            <span className={`badge ${
                              invoice.estado === 'Pagada' ? 'badge-success' : 
                              invoice.estado === 'Parcialmente_Pagada' ? 'badge-warning' : 'badge-danger'
                            }`}>
                              {invoice.estado.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
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
