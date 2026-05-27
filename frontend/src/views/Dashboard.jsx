import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
  Package
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { getInvoices } from '../services/invoiceService';
import { getProducts } from '../services/productService';
import { getDebtorsReport } from '../services/reportService';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value || 0);

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export default function Dashboard({ user }) {
  const isAdmin = user?.rol === 'Administrador';

  const [metrics, setMetrics] = useState({
    totalSalesCount: 0,
    totalSalesValue: 0,
    todaySalesValue: 0,
    todaySalesCount: 0,
    totalActiveDebt: 0,
    debtorsCount: 0,
    productsCount: 0
  });
  const [recentInvoices, setRecentInvoices]   = useState([]);
  const [topDebtors, setTopDebtors]           = useState([]);
  const [loading, setLoading]                 = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // 1. Facturas (todas para historial, filtradas por hoy para métricas)
        const invoices = await getInvoices();
        setRecentInvoices(invoices.slice(0, 5));

        const { start, end } = todayRange();
        const todayInvoices = invoices.filter(inv => {
          const d = new Date(inv.fecha_emision);
          return d >= start && d <= end;
        });

        let totalAllTime = 0;
        invoices.forEach(inv => { totalAllTime += parseFloat(inv.total || 0); });

        let totalHoy = 0;
        todayInvoices.forEach(inv => { totalHoy += parseFloat(inv.total || 0); });

        // 2. Productos
        const products = await getProducts();

        // 3. Deudores — solo si es Admin (Cajero recibe 403)
        let debtors = [];
        if (isAdmin) {
          try {
            debtors = await getDebtorsReport();
          } catch { debtors = []; }
        }
        setTopDebtors(debtors.slice(0, 5));

        let sumDebt = 0;
        debtors.forEach(d => { sumDebt += parseFloat(d.credito_utilizado || 0); });

        setMetrics({
          totalSalesCount:  invoices.length,
          totalSalesValue:  totalAllTime,
          todaySalesValue:  totalHoy,
          todaySalesCount:  todayInvoices.length,
          totalActiveDebt:  sumDebt,
          debtorsCount:     debtors.length,
          productsCount:    products.length
        });
      } catch (error) {
        console.error('Error al cargar dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Cargando panel de control...
      </div>
    );
  }

  return (
    // ← sin className="main-content" aquí, App.jsx ya lo pone
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Saludo */}
      <div>
        <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 4px' }}>
          ¡Hola, {user?.nombre || 'Usuario'}!
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Bienvenido al panel de <strong>Eco Fruver</strong>. Aquí está el resumen del día.
        </p>
      </div>

      {/* Métricas — hoy vs total */}
      <div className="stat-grid">
        <StatCard
          title="Ventas de hoy"
          value={formatCurrency(metrics.todaySalesValue)}
          icon={TrendingUp}
          colorClass="badge-success"
          subtitle={`${metrics.todaySalesCount} transacción(es) hoy`}
        />
        <StatCard
          title="Ventas históricas"
          value={formatCurrency(metrics.totalSalesValue)}
          icon={ShoppingBag}
          colorClass="badge-success"
          subtitle={`${metrics.totalSalesCount} facturas emitidas en total`}
        />
        {isAdmin && (
          <StatCard
            title="Cartera activa (fiados)"
            value={formatCurrency(metrics.totalActiveDebt)}
            icon={DollarSign}
            colorClass="badge-warning"
            subtitle={`${metrics.debtorsCount} clientes con deuda`}
          />
        )}
        {isAdmin && (
          <StatCard
            title="Clientes en mora"
            value={metrics.debtorsCount}
            icon={Users}
            colorClass={metrics.debtorsCount > 0 ? 'badge-danger' : 'badge-success'}
            subtitle="Con saldo pendiente"
          />
        )}
        <StatCard
          title="Catálogo de productos"
          value={metrics.productsCount}
          icon={Package}
          colorClass="badge-success"
          subtitle="Artículos en inventario"
        />
      </div>

      {/* Accesos rápidos */}
      <div className="card card-glass" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', padding: '20px' }}>
        <h4 style={{ margin: '0 8px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Accesos rápidos:
        </h4>
        <button className="btn btn-primary" onClick={() => navigate('/sales')}>
          <ShoppingBag size={16} /> Nueva venta (Caja POS)
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/cartera')}>
          <DollarSign size={16} /> Gestionar cartera
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/clients')}>
          <Users size={16} /> Ver clientes
        </button>
      </div>

      {/* Tablas */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap: '24px' }}>

        {/* Últimas ventas */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Últimas ventas</h3>
            <button className="btn btn-outline" onClick={() => navigate('/sales')}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              Nueva venta <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Factura</th><th>Cliente</th><th>Tipo</th><th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No hay ventas registradas aún.
                    </td>
                  </tr>
                ) : recentInvoices.map(inv => (
                  <tr key={inv.id_factura}>
                    <td><strong style={{ color: 'var(--primary)' }}>{inv.numero_factura}</strong></td>
                    <td>{inv.cliente?.nombre} {inv.cliente?.apellido}</td>
                    <td>
                      <span className={`badge ${inv.tipo_pago === 'Contado' ? 'badge-success' : 'badge-warning'}`}>
                        {inv.tipo_pago}
                      </span>
                    </td>
                    <td><strong>{formatCurrency(inv.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clientes en mora — solo Admin */}
        {isAdmin && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Clientes en mora</h3>
              <button className="btn btn-outline" onClick={() => navigate('/cartera')}
                style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                Cobrar <ArrowRight size={14} />
              </button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th><th>Deuda</th><th>Días</th><th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {topDebtors.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        ¡Sin clientes en mora!
                      </td>
                    </tr>
                  ) : topDebtors.map(d => (
                    <tr key={d.id_cliente}>
                      <td><strong>{d.nombre} {d.apellido}</strong></td>
                      <td style={{ color: 'var(--danger)', fontWeight: 700 }}>
                        {formatCurrency(d.credito_utilizado)}
                      </td>
                      <td>
                        <span className={`badge ${d.dias_retraso > 30 ? 'badge-danger' : 'badge-warning'}`}>
                          {d.dias_retraso} días
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${d.dias_retraso > 30 ? 'badge-danger' : 'badge-warning'}`}>
                          {d.dias_retraso > 30 ? 'BLOQUEADO' : 'ACTIVO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}