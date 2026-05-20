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

export default function Dashboard({ user }) {
  const [metrics, setMetrics] = useState({
    totalSalesCount: 0,
    totalSalesValue: 0,
    totalActiveDebt: 0,
    debtorsCount: 0,
    productsCount: 0
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [topDebtors, setTopDebtors] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // 1. Obtener facturas recientes
        const invoices = await getInvoices();
        setRecentInvoices(invoices.slice(0, 5)); // Tomar últimas 5

        // Calcular totales de ventas
        let totalSales = 0;
        invoices.forEach(inv => {
          totalSales += inv.total;
        });

        // 2. Obtener catálogo para contar productos
        const products = await getProducts();
        
        // 3. Obtener reporte de deudores (Cartera)
        const debtors = await getDebtorsReport();
        setTopDebtors(debtors.slice(0, 5)); // Top 5 deudores

        let sumActiveDebt = 0;
        debtors.forEach(d => {
          sumActiveDebt += d.credito_utilizado;
        });

        setMetrics({
          totalSalesCount: invoices.length,
          totalSalesValue: totalSales,
          totalActiveDebt: sumActiveDebt,
          debtorsCount: debtors.length,
          productsCount: products.length
        });

      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando panel de control...</div>;
  }

  return (
    <div className="main-content">
      {/* Saludo y Cabecera */}
      <div>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--text-main)' }}>
          ¡Hola, {user?.nombre || 'Usuario'}!
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Bienvenido al panel administrativo de <strong>Eco Fruver</strong>. Esto es lo que está ocurriendo hoy.
        </p>
      </div>

      {/* Grid de Estadísticas (Métricas de la Verdulería) */}
      <div className="stat-grid">
        <StatCard 
          title="Ventas Totales Registradas" 
          value={formatCurrency(metrics.totalSalesValue)}
          icon={TrendingUp}
          colorClass="badge-success"
          subtitle={`${metrics.totalSalesCount} transacciones emitidas`}
        />
        
        <StatCard 
          title="Cartera Activa (Fiados)" 
          value={formatCurrency(metrics.totalActiveDebt)}
          icon={DollarSign}
          colorClass="badge-warning"
          subtitle={`${metrics.debtorsCount} clientes con deuda`}
        />

        <StatCard 
          title="Clientes Deudores" 
          value={metrics.debtorsCount}
          icon={Users}
          colorClass={metrics.debtorsCount > 0 ? "badge-danger" : "badge-success"}
          subtitle="Morosos con saldo pendiente"
        />

        <StatCard 
          title="Catálogo de Productos" 
          value={metrics.productsCount}
          icon={Package}
          colorClass="badge-success"
          subtitle="Artículos listos en inventario"
        />
      </div>

      {/* Accesos Rápidos */}
      <div className="card card-glass" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <h4 style={{ marginRight: '16px' }}>Accesos Rápidos:</h4>
        <button className="btn btn-primary" onClick={() => navigate('/sales')}>
          <ShoppingBag size={18} />
          Nueva Venta (Caja POS)
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/cartera')}>
          <DollarSign size={18} />
          Gestionar Cartera / Abonos
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/clients')}>
          <Users size={18} />
          Ver Maestro de Clientes
        </button>
      </div>

      {/* Secciones de Datos Recientes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Tabla Ventas Recientes */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Últimas Ventas Realizadas</h3>
            <button 
              className="btn btn-outline" 
              onClick={() => navigate('/sales')} 
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              Nueva Venta <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se han registrado ventas hoy.
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((inv) => (
                    <tr key={inv.id_factura}>
                      <td><strong>{inv.numero_factura}</strong></td>
                      <td>{inv.cliente?.nombre} {inv.cliente?.apellido}</td>
                      <td>
                        <span className={`badge ${inv.tipo_pago === 'Contado' ? 'badge-success' : 'badge-warning'}`}>
                          {inv.tipo_pago}
                        </span>
                      </td>
                      <td><strong>{formatCurrency(inv.total)}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla Deudores Principales */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Clientes en Mora Crítica</h3>
            <button 
              className="btn btn-outline" 
              onClick={() => navigate('/cartera')}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              Cobrar Deuda <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Deuda Activa</th>
                  <th>Días Mora</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {topDebtors.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      ¡Felicidades! Ningún cliente tiene deudas pendientes.
                    </td>
                  </tr>
                ) : (
                  topDebtors.map((debtor) => (
                    <tr key={debtor.id_cliente}>
                      <td><strong>{debtor.nombre} {debtor.apellido}</strong></td>
                      <td style={{ color: 'var(--danger)', fontWeight: '700' }}>
                        {formatCurrency(debtor.credito_utilizado)}
                      </td>
                      <td>
                        <span className={`badge ${debtor.dias_retraso > 30 ? 'badge-danger' : 'badge-warning'}`}>
                          {debtor.dias_retraso} días
                        </span>
                      </td>
                      <td>
                        {debtor.dias_retraso > 30 ? (
                          <span className="badge badge-danger" title="Crédito Bloqueado Automáticamente">
                            BLOQUEADO
                          </span>
                        ) : (
                          <span className="badge badge-warning">ACTIVO</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
