import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Shield,
  Calendar,
  Download,
  RefreshCw,
  DollarSign,
  CreditCard,
  Banknote,
  Users,
  Clock,
  CheckCircle2,
  FileText,
  Search
} from 'lucide-react';
import { getSalesReport, getDebtorsReport, getAuditLogs } from '../services/reportService';

// ─── Utilidades ────────────────────────────────────────────────────────────────

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

const formatDate = (d) =>
  new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (d) =>
  new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

const today = () => new Date().toISOString().slice(0, 10);

const firstDayOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const estadoBadge = (estado) => {
  const map = { Pagada: 'badge-success', Pendiente: 'badge-warning', Parcialmente_Pagada: 'badge-warning' };
  return map[estado] || 'badge-danger';
};

const accionColor = (accion) => {
  const map = {
    LOGIN: 'badge-success', LOGOUT: 'badge-success',
    INSERT: 'badge-success', UPDATE: 'badge-warning', DELETE: 'badge-danger',
  };
  return map[accion] || 'badge-warning';
};

// ─── Componente StatCard ───────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = 'var(--primary)', bg = 'var(--primary-light)' }) {
  return (
    <div className="card stat-card" style={{ padding: '20px' }}>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>
          {label}
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', margin: '0 0 2px', color }}>
          {value}
        </p>
        {sub && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>{sub}</p>}
      </div>
      <div className="stat-icon" style={{ background: bg, color }}>
        {icon}
      </div>
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────────

export default function Reports({ user }) {
  const isAdmin = user?.rol === 'Administrador';

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('ventas');

  // ── Reporte de ventas ────────────────────────────────────────────────────
  const [startDate, setStartDate]     = useState(firstDayOfMonth());
  const [endDate, setEndDate]         = useState(today());
  const [salesData, setSalesData]     = useState(null);
  const [loadingSales, setLoadingSales] = useState(true); // true para mostrar cargando al abrir
  const [salesError, setSalesError]   = useState('');

  // ── Reporte de deudores ──────────────────────────────────────────────────
  const [debtors, setDebtors]             = useState([]);
  const [loadingDebtors, setLoadingDebtors] = useState(false);
  const [debtorSearch, setDebtorSearch]   = useState('');

  // ── Auditoría ────────────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs]         = useState([]);
  const [loadingAudit, setLoadingAudit]   = useState(false);
  const [auditSearch, setAuditSearch]     = useState('');

  // ─── Carga inicial: al montar el componente carga el reporte del mes ──────

  useEffect(() => {
    // Cargar reporte de ventas automáticamente al abrir la vista (si es admin)
    if (isAdmin) loadSalesReport();
    // Cargar deudores siempre (Admin y Cajero lo pueden ver)
    loadDebtorsReport();
  }, []); // solo al montar

  useEffect(() => {
    if (activeTab === 'auditoria' && isAdmin && auditLogs.length === 0) loadAuditLogs();
  }, [activeTab]);

  // ─── Loaders ─────────────────────────────────────────────────────────────

  const loadSalesReport = async () => {
    if (!startDate || !endDate) return setSalesError('Selecciona un rango de fechas válido.');
    if (startDate > endDate) return setSalesError('La fecha de inicio no puede ser mayor a la fecha fin.');
    try {
      setLoadingSales(true);
      setSalesError('');
      // Enviar fechas con T00:00 para forzar interpretación local y evitar bug de zona horaria UTC
      const data = await getSalesReport(`${startDate}T00:00`, `${endDate}T23:59`);
      setSalesData(data);
    } catch (err) {
      setSalesError(err?.response?.data?.error || 'Error al cargar el reporte de ventas.');
    } finally {
      setLoadingSales(false);
    }
  };

  const loadDebtorsReport = async () => {
    try {
      setLoadingDebtors(true);
      const data = await getDebtorsReport();
      setDebtors(Array.isArray(data) ? data : []);
    } catch {
      setDebtors([]);
    } finally {
      setLoadingDebtors(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const data = await getAuditLogs();
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch {
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  // ─── Filtros locales ──────────────────────────────────────────────────────

  const filteredDebtors = debtors.filter(d =>
    `${d.nombre} ${d.apellido} ${d.identificacion}`.toLowerCase().includes(debtorSearch.toLowerCase())
  );

  const filteredAudit = auditLogs.filter(l =>
    `${l.accion} ${l.tabla_afectada} ${l.descripcion} ${l.usuario?.username || ''}`.toLowerCase().includes(auditSearch.toLowerCase())
  );

  // ─── Tabs disponibles según rol ───────────────────────────────────────────

  const tabs = [
    { key: 'ventas', label: 'Ventas', icon: <TrendingUp size={16} />, adminOnly: true },
    { key: 'deudores', label: 'Clientes en mora', icon: <AlertTriangle size={16} />, adminOnly: false },
    ...(isAdmin ? [{ key: 'auditoria', label: 'Auditoría', icon: <Shield size={16} />, adminOnly: true }] : []),
  ].filter(t => !t.adminOnly || isAdmin);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="stat-icon" style={{ background: 'var(--secondary-light)' }}>
          <BarChart2 size={24} color="var(--secondary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Reportes</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Estadísticas, cartera en mora y pista de auditoría
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid var(--border)' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px', cursor: 'pointer', fontWeight: 700,
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.9rem', transition: 'var(--transition)',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Reporte de ventas ──────────────────────────────────────────── */}
      {activeTab === 'ventas' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Filtro de fechas */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Desde
                </label>
                <input
                  type="date"
                  className="input"
                  style={{ width: '180px' }}
                  value={startDate}
                  max={endDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hasta
                </label>
                <input
                  type="date"
                  className="input"
                  style={{ width: '180px' }}
                  value={endDate}
                  min={startDate}
                  max={today()}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={loadSalesReport}
                disabled={loadingSales}
              >
                <RefreshCw size={16} className={loadingSales ? 'spin' : ''} />
                {loadingSales ? 'Generando...' : 'Generar reporte'}
              </button>
              {/* Accesos rápidos */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Hoy', s: today(), e: today() },
                  { label: 'Este mes', s: firstDayOfMonth(), e: today() },
                ].map(q => (
                  <button
                    key={q.label}
                    className="btn btn-outline"
                    style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                    onClick={() => { setStartDate(q.s); setEndDate(q.e); }}
                  >
                    <Calendar size={13} /> {q.label}
                  </button>
                ))}
              </div>
            </div>
            {salesError && (
              <div style={{
                marginTop: '14px', background: 'var(--danger-light)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                color: 'hsl(350, 82%, 35%)', fontSize: '0.85rem',
                display: 'flex', gap: '8px', alignItems: 'center'
              }}>
                <AlertTriangle size={15} /> {salesError}
              </div>
            )}
          </div>

          {/* Estado de carga */}
          {loadingSales && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} style={{ marginBottom: '12px', opacity: 0.4, animation: 'spin 1s linear infinite' }} />
              <p style={{ margin: 0 }}>Generando reporte...</p>
            </div>
          )}

          {/* Tarjetas resumen */}
          {!loadingSales && salesData && (
            <>
              <div className="stat-grid">
                <StatCard
                  icon={<TrendingUp size={22} />}
                  label="Total vendido"
                  value={formatCOP(salesData.resumen.totalVendido)}
                  sub={`${salesData.invoices.length} factura(s) en el período`}
                />
                <StatCard
                  icon={<Banknote size={22} />}
                  label="Ventas contado"
                  value={formatCOP(salesData.resumen.totalContado)}
                  color="var(--primary)"
                  bg="var(--primary-light)"
                />
                <StatCard
                  icon={<CreditCard size={22} />}
                  label="Ventas crédito"
                  value={formatCOP(salesData.resumen.totalCredito)}
                  color="var(--warning)"
                  bg="var(--warning-light)"
                />
                <StatCard
                  icon={<DollarSign size={22} />}
                  label="Recaudado en el período"
                  value={formatCOP(salesData.resumen.totalRecaudado)}
                  sub={`${salesData.payments.length} abono(s) registrado(s)`}
                  color="var(--secondary)"
                  bg="var(--secondary-light)"
                />
              </div>

              {/* Saldo pendiente generado */}
              {salesData.resumen.saldoPendienteGenerado > 0 && (
                <div style={{
                  background: 'var(--warning-light)', border: '1px dashed var(--warning)',
                  borderRadius: 'var(--radius-sm)', padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <AlertTriangle size={18} color="var(--warning)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    Saldo pendiente generado en el período: <span style={{ color: 'var(--warning)' }}>{formatCOP(salesData.resumen.saldoPendienteGenerado)}</span>
                  </span>
                </div>
              )}

              {/* Tabla de facturas */}
              {salesData.invoices.length > 0 && (
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <FileText size={16} color="var(--primary)" />
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>
                      Facturas del período ({salesData.invoices.length})
                    </h3>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th># Factura</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Total</th>
                          <th>Saldo</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.invoices.map(inv => (
                          <tr key={inv.id_factura}>
                            <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)' }}>
                              {inv.numero_factura}
                            </td>
                            <td>
                              {inv.cliente ? `${inv.cliente.nombre} ${inv.cliente.apellido}` : '—'}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {formatDate(inv.fecha_emision)}
                            </td>
                            <td>
                              <span className={`badge ${inv.tipo_pago === 'Contado' ? 'badge-success' : 'badge-warning'}`}>
                                {inv.tipo_pago}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700 }}>{formatCOP(inv.total)}</td>
                            <td style={{ color: inv.saldo_pendiente > 0 ? 'var(--warning)' : 'var(--primary)', fontWeight: 700 }}>
                              {formatCOP(inv.saldo_pendiente)}
                            </td>
                            <td>
                              <span className={`badge ${estadoBadge(inv.estado)}`}>
                                {inv.estado?.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tabla de abonos en el período */}
              {salesData.payments.length > 0 && (
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <DollarSign size={16} color="var(--secondary)" />
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>
                      Abonos recibidos en el período ({salesData.payments.length})
                    </h3>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Factura</th>
                          <th>Cliente</th>
                          <th>Monto</th>
                          <th>Saldo posterior</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.payments.map(p => (
                          <tr key={p.id_pago}>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {formatDate(p.fecha_pago)}
                            </td>
                            <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)' }}>
                              {p.factura?.numero_factura || '—'}
                            </td>
                            <td>
                              {p.factura?.cliente
                                ? `${p.factura.cliente.nombre} ${p.factura.cliente.apellido}`
                                : '—'}
                            </td>
                            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                              {formatCOP(p.monto)}
                            </td>
                            <td style={{ color: p.saldo_posterior === 0 ? 'var(--primary)' : 'var(--warning)', fontWeight: 700 }}>
                              {formatCOP(p.saldo_posterior)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {salesData.invoices.length === 0 && salesData.payments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <BarChart2 size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                  <p style={{ margin: 0 }}>No hay movimientos en este período.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: Clientes en mora ───────────────────────────────────────────── */}
      {activeTab === 'deudores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Resumen rápido */}
          {!loadingDebtors && debtors.length > 0 && (
            <div className="stat-grid">
              <StatCard
                icon={<Users size={22} />}
                label="Clientes con deuda"
                value={debtors.length}
                color="var(--warning)"
                bg="var(--warning-light)"
              />
              <StatCard
                icon={<DollarSign size={22} />}
                label="Cartera total"
                value={formatCOP(debtors.reduce((s, d) => s + (d.credito_utilizado || 0), 0))}
                color="var(--warning)"
                bg="var(--warning-light)"
              />
              <StatCard
                icon={<Clock size={22} />}
                label="En mora (+30 días)"
                value={debtors.filter(d => d.dias_retraso > 30).length}
                sub="clientes con retraso crítico"
                color="var(--danger)"
                bg="var(--danger-light)"
              />
            </div>
          )}

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={17} color="var(--warning)" />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Clientes con saldo pendiente</h3>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: '32px', padding: '8px 12px 8px 32px', fontSize: '0.85rem', width: '220px' }}
                    placeholder="Buscar cliente..."
                    value={debtorSearch}
                    onChange={e => setDebtorSearch(e.target.value)}
                  />
                </div>
                <button className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={loadDebtorsReport}>
                  <RefreshCw size={14} /> Actualizar
                </button>
              </div>
            </div>

            {loadingDebtors ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Cargando clientes en mora...
              </div>
            ) : filteredDebtors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} color="var(--primary)" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {debtorSearch ? 'No hay coincidencias.' : '¡Sin clientes en mora! La cartera está al día.'}
                </p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Identificación</th>
                      <th>Teléfono</th>
                      <th>Deuda</th>
                      <th>Límite crédito</th>
                      <th>Cupo libre</th>
                      <th>Factura más antigua</th>
                      <th>Días retraso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDebtors.map(d => {
                      const enMora = d.dias_retraso > 30;
                      return (
                        <tr key={d.id_cliente}>
                          <td style={{ fontWeight: 700 }}>
                            {d.nombre} {d.apellido}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {d.tipo_identificacion}: {d.identificacion}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {d.telefono || '—'}
                          </td>
                          <td style={{ fontWeight: 800, color: 'var(--warning)' }}>
                            {formatCOP(d.credito_utilizado)}
                          </td>
                          <td>{formatCOP(d.limite_credito)}</td>
                          <td style={{ color: d.cupo_disponible > 0 ? 'var(--primary)' : 'var(--danger)', fontWeight: 700 }}>
                            {formatCOP(d.cupo_disponible)}
                          </td>
                          <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)', fontSize: '0.88rem' }}>
                            {d.factura_mas_antigua || '—'}
                          </td>
                          <td>
                            <span className={`badge ${enMora ? 'badge-danger' : 'badge-warning'}`}>
                              {d.dias_retraso} días
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Auditoría (solo Admin) ─────────────────────────────────────── */}
      {activeTab === 'auditoria' && isAdmin && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={17} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Pista de auditoría</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                (últimas {auditLogs.length} entradas)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  style={{ paddingLeft: '32px', padding: '8px 12px 8px 32px', fontSize: '0.85rem', width: '220px' }}
                  placeholder="Filtrar por acción, tabla..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                />
              </div>
              <button className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={loadAuditLogs}>
                <RefreshCw size={14} /> Actualizar
              </button>
            </div>
          </div>

          {loadingAudit ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Cargando registros de auditoría...
            </div>
          ) : filteredAudit.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No hay registros de auditoría.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha y hora</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Tabla</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudit.map((log, i) => (
                    <tr key={log.id_auditoria || i}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(log.fecha_hora)}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                        {log.usuario?.username || `ID:${log.id_usuario}`}
                        {log.usuario && (
                          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.78rem', display: 'block' }}>
                            {log.usuario.nombre} {log.usuario.apellido}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${accionColor(log.accion)}`} style={{ fontSize: '0.72rem' }}>
                          {log.accion}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {log.tabla_afectada}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '300px' }}>
                        {log.descripcion}
                      </td>
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