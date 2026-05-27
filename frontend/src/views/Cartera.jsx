import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Wallet, Search, User, AlertTriangle, CheckCircle2, X,
  Clock, DollarSign, FileText, CreditCard, History
} from 'lucide-react';
import { getClients } from '../services/clientService';
import { registerPayment, getPendingInvoicesByClient, getPaymentHistory } from '../services/paymentService';

const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value || 0);

const formatDate = (d) =>
  new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const diasDesde = (fecha) => Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));

const estadoBadge = (estado) => {
  const map = { Pagada: 'badge-success', Pendiente: 'badge-warning', Parcialmente_Pagada: 'badge-warning' };
  return map[estado] || 'badge-danger';
};

export default function Cartera({ user }) {
  const [clientSearch, setClientSearch]     = useState('');
  const [clientResults, setClientResults]   = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showDropdown, setShowDropdown]     = useState(false);
  const [dropdownPos, setDropdownPos]       = useState({ top: 0, left: 0, width: 0 });
  const [selectedClient, setSelectedClient] = useState(null);
  const inputRef = useRef(null);  // ref al INPUT, no al contenedor

  const [pendingInvoices, setPendingInvoices]   = useState([]);
  const [loadingInvoices, setLoadingInvoices]   = useState(false);

  const [abonoModal, setAbonoModal]   = useState(null);
  const [montoAbono, setMontoAbono]   = useState('');
  const [observacion, setObservacion] = useState('');
  const [savingAbono, setSavingAbono] = useState(false);
  const [abonoError, setAbonoError]   = useState('');
  const [abonoExito, setAbonoExito]   = useState(null);

  const [paymentHistory, setPaymentHistory]   = useState([]);
  const [loadingHistory, setLoadingHistory]   = useState(true);
  const [activeTab, setActiveTab]             = useState('cliente');

  // ── Posición del dropdown fijo bajo el input ────────────────────────────────
  const updateDropdownPos = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width });
  };

  useEffect(() => { loadPaymentHistory(); }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (clientSearch.trim().length >= 2) searchClients(clientSearch);
      else { setClientResults([]); setShowDropdown(false); }
    }, 300);
    return () => clearTimeout(handler);
  }, [clientSearch]);

  // Cerrar dropdown al clic fuera
  useEffect(() => {
    const handleOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (selectedClient) loadPendingInvoices(selectedClient.id_cliente);
  }, [selectedClient]);

  const searchClients = async (q) => {
    try {
      setLoadingClients(true);
      const data = await getClients(q);
      const result = Array.isArray(data) ? data.filter(c => c.activo) : [];
      setClientResults(result);
      if (result.length > 0) { updateDropdownPos(); setShowDropdown(true); }
      else setShowDropdown(false);
    } catch { setClientResults([]); setShowDropdown(false); }
    finally { setLoadingClients(false); }
  };

  const loadPendingInvoices = async (clientId) => {
    try {
      setLoadingInvoices(true);
      const data = await getPendingInvoicesByClient(clientId);
      setPendingInvoices(Array.isArray(data) ? data : []);
    } catch { setPendingInvoices([]); }
    finally { setLoadingInvoices(false); }
  };

  const loadPaymentHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await getPaymentHistory();
      setPaymentHistory(Array.isArray(data) ? data : []);
    } catch { setPaymentHistory([]); }
    finally { setLoadingHistory(false); }
  };

  const selectClient = (client) => {
    setSelectedClient(client); setClientSearch('');
    setShowDropdown(false); setPendingInvoices([]); setAbonoExito(null);
  };

  const clearClient = () => {
    setSelectedClient(null); setClientSearch('');
    setPendingInvoices([]); setAbonoExito(null);
  };

  const openAbonoModal = (invoice) => {
    setAbonoModal(invoice); setMontoAbono(''); setObservacion(''); setAbonoError('');
  };

  const handleRegistrarAbono = async () => {
    setAbonoError('');
    const monto = parseFloat(montoAbono);
    if (!monto || monto <= 0) return setAbonoError('Ingresa un monto válido mayor a cero.');
    if (monto > abonoModal.saldo_pendiente)
      return setAbonoError(`El abono (${formatCOP(monto)}) supera el saldo pendiente (${formatCOP(abonoModal.saldo_pendiente)}).`);
    try {
      setSavingAbono(true);
      const result = await registerPayment(abonoModal.id_factura, monto, observacion);
      setAbonoExito(result);
      setAbonoModal(null);
      await loadPendingInvoices(selectedClient.id_cliente);
      await loadPaymentHistory();
      setSelectedClient(prev => ({ ...prev, credito_utilizado: Math.max(0, (prev.credito_utilizado || 0) - monto) }));
    } catch (err) {
      setAbonoError(err?.response?.data?.detalles || err?.response?.data?.error || 'Error al registrar el abono.');
    } finally { setSavingAbono(false); }
  };

  const totalDeuda   = pendingInvoices.reduce((s, f) => s + parseFloat(f.saldo_pendiente || 0), 0);
  const facturasMora = pendingInvoices.filter(f => diasDesde(f.fecha_emision) > 30);
  const creditoDisp  = selectedClient ? (selectedClient.limite_credito || 0) - (selectedClient.credito_utilizado || 0) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
          <Wallet size={24} color="var(--warning)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Cartera</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Consulta deudas y registra abonos de clientes</p>
        </div>
      </div>

      {/* ── DROPDOWN — createPortal lo pega en body, por encima de TODO ── */}
      {showDropdown && clientResults.length > 0 && createPortal(
        <div style={{
          position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width,
          zIndex: 99999, background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
          maxHeight: '280px', overflowY: 'auto',
        }}>
          {clientResults.map(c => (
            <div key={c.id_cliente}
              style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-app)'}
              onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
              onMouseDown={e => {
                e.preventDefault();
                selectClient(c);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 700, margin: '0 0 2px', fontSize: '0.9rem' }}>{c.nombre} {c.apellido}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>{c.identificacion}</p>
                </div>
                {c.credito_utilizado > 0 && (
                  <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                    Deuda: {formatCOP(c.credito_utilizado)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Modal abono exitoso */}
      {abonoExito && (
        <div className="modal-overlay" onClick={() => setAbonoExito(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={22} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Abono registrado</h3>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setAbonoExito(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 4px' }}>Monto abonado</p>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)', margin: 0 }}>
                  {formatCOP(abonoExito.pago?.monto)}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 2px' }}>Factura</p>
                  <p style={{ fontWeight: 700, margin: 0 }}>{abonoExito.factura?.numero_factura}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 2px' }}>Saldo restante</p>
                  <p style={{ fontWeight: 700, color: abonoExito.factura?.saldo_pendiente > 0 ? 'var(--warning)' : 'var(--primary)', margin: 0 }}>
                    {formatCOP(abonoExito.factura?.saldo_pendiente)}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 2px' }}>Estado</p>
                  <span className={`badge ${estadoBadge(abonoExito.factura?.estado)}`}>
                    {abonoExito.factura?.estado?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setAbonoExito(null)}>Continuar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal registrar abono */}
      {abonoModal && (
        <div className="modal-overlay" onClick={() => setAbonoModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DollarSign size={20} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Registrar abono</h3>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setAbonoModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 2px' }}>Factura</p><p style={{ fontWeight: 800, margin: 0 }}>{abonoModal.numero_factura}</p></div>
                  <div><p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 2px' }}>Total original</p><p style={{ fontWeight: 700, margin: 0 }}>{formatCOP(abonoModal.total)}</p></div>
                  <div><p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 2px' }}>Saldo pendiente</p><p style={{ fontWeight: 800, color: 'var(--warning)', fontSize: '1.05rem', margin: 0 }}>{formatCOP(abonoModal.saldo_pendiente)}</p></div>
                  <div><p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 2px' }}>Días vencida</p><p style={{ fontWeight: 700, color: diasDesde(abonoModal.fecha_emision) > 30 ? 'var(--danger)' : 'var(--text-main)', margin: 0 }}>{diasDesde(abonoModal.fecha_emision)} días</p></div>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="monto-abono">Monto del abono (COP)</label>
                <input id="monto-abono" type="number" className="input"
                  placeholder={`Máximo ${formatCOP(abonoModal.saldo_pendiente)}`}
                  min="0.01" step="100" value={montoAbono}
                  onChange={e => { setMontoAbono(e.target.value); setAbonoError(''); }} autoFocus />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {[0.25, 0.5, 0.75, 1].map(pct => (
                    <button key={pct} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      onClick={() => setMontoAbono((abonoModal.saldo_pendiente * pct).toFixed(0))}>
                      {pct === 1 ? 'Total' : `${pct * 100}%`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="obs-abono">Observación (opcional)</label>
                <input id="obs-abono" type="text" className="input"
                  placeholder="Ej: Pago en efectivo, transferencia..."
                  value={observacion} onChange={e => setObservacion(e.target.value)} />
              </div>
              {abonoError && (
                <div style={{ marginTop: '14px', background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'hsl(350, 82%, 35%)', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />{abonoError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setAbonoModal(null)}>Cancelar</button>
              <button className="btn btn-primary" disabled={savingAbono || !montoAbono} onClick={handleRegistrarAbono}>
                {savingAbono ? 'Registrando...' : 'Confirmar abono'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'cliente',   label: 'Cobro por cliente',   icon: <User size={16} /> },
          { key: 'historial', label: 'Historial de abonos', icon: <History size={16} /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: '-2px', cursor: 'pointer', fontWeight: 700,
            color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: '0.9rem', transition: 'var(--transition)',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Cobro por cliente */}
      {activeTab === 'cliente' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <User size={17} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Seleccionar cliente</h3>
            </div>

            {selectedClient ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontWeight: 800, margin: '0 0 2px', fontSize: '1rem' }}>{selectedClient.nombre} {selectedClient.apellido}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                      {selectedClient.identificacion}{selectedClient.telefono && ` · ${selectedClient.telefono}`}
                    </p>
                  </div>
                  <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={clearClient}>
                    <X size={14} /> Cambiar
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'Deuda total',      value: formatCOP(totalDeuda),               color: totalDeuda > 0 ? 'var(--warning)' : 'var(--primary)', icon: <AlertTriangle size={16} /> },
                    { label: 'Cupo disponible',  value: formatCOP(creditoDisp),              color: creditoDisp > 0 ? 'var(--primary)' : 'var(--danger)',  icon: <CreditCard size={16} /> },
                    { label: 'Facturas en mora', value: `${facturasMora.length} factura(s)`, color: facturasMora.length > 0 ? 'var(--danger)' : 'var(--primary)', icon: <Clock size={16} /> },
                  ].map((m, i) => (
                    <div key={i} style={{ background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', padding: '14px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '6px' }}>{m.icon} {m.label}</div>
                      <p style={{ fontWeight: 800, color: m.color, margin: 0, fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Buscador con dropdown flotante ── */
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
                <input
                  ref={inputRef}
                  className="input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Buscar cliente por nombre o cédula..."
                  value={clientSearch}
                  autoComplete="off"
                  onChange={e => { setClientSearch(e.target.value); updateDropdownPos(); }}
                  onFocus={() => { updateDropdownPos(); if (clientResults.length > 0) setShowDropdown(true); }}
                />
                {loadingClients && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>Buscando...</p>}
                {clientSearch.length >= 2 && !loadingClients && clientResults.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>No se encontraron clientes.</p>
                )}
              </div>
            )}
          </div>

          {/* Facturas pendientes */}
          {selectedClient && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FileText size={17} color="var(--warning)" />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Facturas pendientes</h3>
                {pendingInvoices.length > 0 && <span className="badge badge-warning" style={{ marginLeft: '4px' }}>{pendingInvoices.length}</span>}
              </div>
              {loadingInvoices ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Cargando facturas...</div>
              ) : pendingInvoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={32} color="var(--primary)" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Este cliente no tiene deudas pendientes.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingInvoices.map(inv => {
                    const dias = diasDesde(inv.fecha_emision);
                    const enMora = dias > 30;
                    return (
                      <div key={inv.id_factura} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: 'var(--radius-sm)', border: `1px solid ${enMora ? 'var(--danger)' : 'var(--border)'}`, background: enMora ? 'var(--danger-light)' : 'var(--bg-app)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--primary)' }}>{inv.numero_factura}</span>
                            <span className={`badge ${estadoBadge(inv.estado)}`} style={{ fontSize: '0.72rem' }}>{inv.estado?.replace('_', ' ')}</span>
                            {enMora && <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>⚠ Mora: {dias} días</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                            <span>Emitida: {formatDate(inv.fecha_emision)}</span>
                            <span>Total: <strong style={{ color: 'var(--text-main)' }}>{formatCOP(inv.total)}</strong></span>
                            <span>Saldo: <strong style={{ color: 'var(--warning)' }}>{formatCOP(inv.saldo_pendiente)}</strong></span>
                          </div>
                        </div>
                        <button className="btn btn-primary" style={{ whiteSpace: 'nowrap', padding: '10px 18px' }} onClick={() => openAbonoModal(inv)}>
                          <DollarSign size={15} /> Abonar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Historial */}
      {activeTab === 'historial' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <History size={17} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Todos los abonos registrados</h3>
          </div>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando historial...</div>
          ) : paymentHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay abonos registrados aún.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th><th>Factura</th><th>Cliente</th>
                    <th>Monto abonado</th><th>Saldo anterior</th><th>Saldo posterior</th><th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map(p => (
                    <tr key={p.id_pago}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDate(p.fecha_pago)}</td>
                      <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)' }}>{p.factura?.numero_factura || '—'}</td>
                      <td>{p.factura?.cliente ? `${p.factura.cliente.nombre} ${p.factura.cliente.apellido}` : '—'}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatCOP(p.monto)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatCOP(p.saldo_anterior)}</td>
                      <td style={{ color: p.saldo_posterior === 0 ? 'var(--primary)' : 'var(--warning)', fontWeight: 700 }}>{formatCOP(p.saldo_posterior)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.observacion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}