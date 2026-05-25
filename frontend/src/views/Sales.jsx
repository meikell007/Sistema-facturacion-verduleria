import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Package,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  X,
  Receipt,
  FileText
} from 'lucide-react';
import { getClients } from '../services/clientService';
import { getProducts } from '../services/productService';
import { createInvoice, getInvoices } from '../services/invoiceService';
import InvoicePDF from '../components/InvoicePDF';

// ─── Utilidades ────────────────────────────────────────────────────────────────

const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const estadoBadge = (estado) => {
  const map = {
    Pagada: 'badge-success',
    Pendiente: 'badge-warning',
    Parcialmente_Pagada: 'badge-warning',
  };
  return map[estado] || 'badge-danger';
};

// ─── Componente principal ───────────────────────────────────────────────────────

export default function Sales({ user }) {
  // ── Catálogo ────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ── Cliente seleccionado ────────────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const clientRef = useRef(null);

  // ── Carrito ─────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState([]);

  // ── Tipo de pago ────────────────────────────────────────────────────────────
  const [tipoPago, setTipoPago] = useState('Contado');

  // ── Procesamiento ───────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successInvoice, setSuccessInvoice] = useState(null);

  // ── Historial de facturas ───────────────────────────────────────────────────
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoiceFilter, setInvoiceFilter] = useState({ tipo_pago: '', estado: '' });

  // ── PDF ─────────────────────────────────────────────────────────────────────
  const [pdfInvoiceId, setPdfInvoiceId] = useState(null);

  // ── Efectos ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadProducts();
    loadInvoices();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => loadProducts(), 300);
    return () => clearTimeout(handler);
  }, [productSearch]);

  useEffect(() => {
    if (clientSearch.trim().length >= 2) {
      searchClients(clientSearch);
    } else {
      setClients([]);
    }
  }, [clientSearch]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [invoiceFilter]);

  // ── Loaders ─────────────────────────────────────────────────────────────────

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const data = await getProducts(productSearch);
      setProducts(Array.isArray(data) ? data.filter(p => p.activo) : []);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const searchClients = async (q) => {
    try {
      setLoadingClients(true);
      const data = await getClients(q);
      setClients(Array.isArray(data) ? data.filter(c => c.activo) : []);
      setShowClientDropdown(true);
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const data = await getInvoices(invoiceFilter);
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // ── Carrito ─────────────────────────────────────────────────────────────────

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(i => i.id_producto === product.id_producto);
      if (existing) {
        return prev.map(i =>
          i.id_producto === product.id_producto
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, {
        id_producto: product.id_producto,
        descripcion: product.descripcion,
        precio_unitario: parseFloat(product.precio_unitario),
        unidad_medida: product.unidad_medida,
        cantidad: 1,
      }];
    });
    setError('');
  };

  const updateQty = (id_producto, value) => {
    const qty = parseFloat(value);
    if (isNaN(qty) || qty <= 0) return removeFromCart(id_producto);
    setCart(prev =>
      prev.map(i => i.id_producto === id_producto ? { ...i, cantidad: qty } : i)
    );
  };

  const removeFromCart = (id_producto) => {
    setCart(prev => prev.filter(i => i.id_producto !== id_producto));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedClient(null);
    setClientSearch('');
    setTipoPago('Contado');
    setError('');
    setSuccessInvoice(null);
  };

  // ── Totales ─────────────────────────────────────────────────────────────────

  const subtotal = cart.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0);
  const total = subtotal;

  const creditoDisponible = selectedClient
    ? (selectedClient.limite_credito || 0) - (selectedClient.credito_utilizado || 0)
    : 0;

  // ── Enviar factura ──────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError('');
    if (!selectedClient) return setError('Selecciona un cliente antes de cobrar.');
    if (cart.length === 0) return setError('El carrito está vacío.');
    if (tipoPago === 'Credito' && total > creditoDisponible) {
      return setError(`Cupo insuficiente. Disponible: ${formatCOP(creditoDisponible)}`);
    }

    const payload = {
      id_cliente: selectedClient.id_cliente,
      tipo_pago: tipoPago,
      detalles: cart.map(i => ({
        id_producto: i.id_producto,
        cantidad: i.cantidad,
      })),
    };

    try {
      setSaving(true);
      const invoice = await createInvoice(payload);
      setSuccessInvoice(invoice);
      setCart([]);
      setSelectedClient(null);
      setClientSearch('');
      setTipoPago('Contado');
      loadInvoices();
    } catch (err) {
      const msg =
        err?.response?.data?.detalles ||
        err?.response?.data?.error ||
        'Error al registrar la venta. Revisa los datos e intenta de nuevo.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
          <ShoppingBag size={24} color="var(--primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Caja POS</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Registra ventas al contado o a crédito
          </p>
        </div>
      </div>

      {/* Modal PDF */}
      {pdfInvoiceId && (
        <InvoicePDF
          invoiceId={pdfInvoiceId}
          onClose={() => setPdfInvoiceId(null)}
        />
      )}

      {/* Modal de venta exitosa */}
      {successInvoice && (
        <div className="modal-overlay" onClick={() => setSuccessInvoice(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={22} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>¡Venta registrada!</h3>
              </div>
              <button className="btn btn-outline" onClick={() => setSuccessInvoice(null)} style={{ padding: '6px 10px' }}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Número de factura</p>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary)' }}>
                  {successInvoice.numero_factura}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cliente</p>
                  <p style={{ fontWeight: 700 }}>
                    {successInvoice.cliente?.nombre} {successInvoice.cliente?.apellido}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tipo de pago</p>
                  <span className={`badge ${successInvoice.tipo_pago === 'Contado' ? 'badge-success' : 'badge-warning'}`}>
                    {successInvoice.tipo_pago}
                  </span>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total</p>
                  <p style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                    {formatCOP(successInvoice.total)}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Estado</p>
                  <span className={`badge ${estadoBadge(successInvoice.estado)}`}>
                    {successInvoice.estado}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ gap: '10px' }}>
              {/* BOTÓN VER PDF desde el modal de éxito */}
              <button
                className="btn btn-outline"
                onClick={() => {
                  setPdfInvoiceId(successInvoice.id_factura);
                  setSuccessInvoice(null);
                }}
              >
                <FileText size={16} /> Ver factura PDF
              </button>
              <button className="btn btn-primary" onClick={() => setSuccessInvoice(null)}>
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout POS */}
      <div className="pos-container">

        {/* ── Catálogo izquierdo ──────────────────────────── */}
        <div className="pos-catalog">

          {/* Selección de cliente */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <User size={18} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Cliente</h3>
            </div>

            {selectedClient ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '12px 16px'
              }}>
                <div>
                  <p style={{ fontWeight: 700, margin: 0 }}>
                    {selectedClient.nombre} {selectedClient.apellido}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    {selectedClient.identificacion} · Cupo disponible: {formatCOP(creditoDisponible)}
                  </p>
                </div>
                <button className="btn btn-outline" style={{ padding: '6px 10px' }}
                  onClick={() => { setSelectedClient(null); setClientSearch(''); }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div ref={clientRef} style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Buscar cliente por nombre o cédula..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    onFocus={() => clients.length > 0 && setShowClientDropdown(true)}
                  />
                </div>
                {showClientDropdown && clients.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
                    maxHeight: '220px', overflowY: 'auto', marginTop: '4px'
                  }}>
                    {clients.map(c => (
                      <div key={c.id_cliente}
                        style={{ padding: '12px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-app)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => {
                          setSelectedClient(c);
                          setClientSearch('');
                          setShowClientDropdown(false);
                        }}>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>
                          {c.nombre} {c.apellido}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
                          {c.identificacion} · Cupo: {formatCOP((c.limite_credito || 0) - (c.credito_utilizado || 0))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {loadingClients && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>Buscando...</p>
                )}
                {clientSearch.length >= 2 && !loadingClients && clients.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>
                    No se encontraron clientes activos.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Catálogo de productos */}
          <div className="card" style={{ padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Productos</h3>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  style={{ paddingLeft: '32px', padding: '8px 12px 8px 32px', fontSize: '0.85rem', width: '220px' }}
                  placeholder="Filtrar productos..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>
            </div>

            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando productos...</div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No hay productos disponibles.
              </div>
            ) : (
              <div className="product-grid">
                {products.map(p => (
                  <div
                    key={p.id_producto}
                    className="product-item"
                    onClick={() => addToCart(p)}
                    title={`Clic para agregar ${p.descripcion} al carrito`}
                  >
                    <div>
                      <p className="product-item-title">{p.descripcion}</p>
                      <span className="product-item-unit">{p.unidad_medida}</span>
                    </div>
                    <p className="product-item-price">{formatCOP(p.precio_unitario)}</p>
                    <div style={{ marginTop: '8px', textAlign: 'right' }}>
                      <Plus size={14} color="var(--primary)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Carrito derecho ────────────────────────────── */}
        <div className="pos-cart">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} color="var(--primary)" />
              <h3 style={{ margin: 0 }}>Carrito ({cart.length})</h3>
            </div>
            {cart.length > 0 && (
              <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                onClick={clearCart}>
                <Trash2 size={13} /> Limpiar
              </button>
            )}
          </div>

          {/* Items del carrito */}
          <div className="cart-items">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <ShoppingBag size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                <p>Selecciona productos del catálogo</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id_producto} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.descripcion}</span>
                    <span className="cart-item-price">
                      {formatCOP(item.precio_unitario)} × {item.cantidad} = {formatCOP(item.precio_unitario * item.cantidad)}
                    </span>
                  </div>
                  <div className="cart-item-actions">
                    <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                      onClick={() => updateQty(item.id_producto, item.cantidad - (item.unidad_medida === 'UNIDAD' ? 1 : 0.1))}>
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      className="cart-item-qty-input input"
                      value={item.cantidad}
                      min="0.01"
                      step={item.unidad_medida === 'UNIDAD' ? 1 : 0.1}
                      onChange={e => updateQty(item.id_producto, e.target.value)}
                    />
                    <button className="btn btn-outline" style={{ padding: '4px 8px' }}
                      onClick={() => updateQty(item.id_producto, item.cantidad + (item.unidad_medida === 'UNIDAD' ? 1 : 0.1))}>
                      <Plus size={12} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', color: 'var(--danger)' }}
                      onClick={() => removeFromCart(item.id_producto)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tipo de pago */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tipo de pago
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['Contado', 'Credito'].map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setTipoPago(tipo)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '10px', borderRadius: 'var(--radius-sm)', border: '2px solid',
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'var(--transition)',
                    borderColor: tipoPago === tipo ? 'var(--primary)' : 'var(--border)',
                    background: tipoPago === tipo ? 'var(--primary-light)' : 'transparent',
                    color: tipoPago === tipo ? 'var(--primary)' : 'var(--text-muted)',
                  }}>
                  {tipo === 'Contado' ? <Banknote size={16} /> : <CreditCard size={16} />}
                  {tipo === 'Contado' ? 'Contado' : 'Crédito'}
                </button>
              ))}
            </div>

            {tipoPago === 'Credito' && selectedClient && (
              <div className="credit-warning-box" style={{ marginTop: '10px' }}>
                <span>⚠ Cupo disponible del cliente</span>
                <span style={{ fontSize: '1rem', fontWeight: 800 }}>{formatCOP(creditoDisponible)}</span>
                {total > creditoDisponible && (
                  <span style={{ color: 'var(--danger)', marginTop: '4px' }}>
                    El total supera el cupo disponible.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="cart-totals">
            <div className="total-row">
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            <div className="total-row">
              <span style={{ color: 'var(--text-muted)' }}>IVA (0%)</span>
              <span>$0</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: 'hsl(350, 82%, 35%)', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'flex-start'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            disabled={saving || cart.length === 0 || !selectedClient}
            onClick={handleSubmit}
          >
            {saving ? 'Procesando...' : (
              <>
                <CheckCircle2 size={18} />
                {tipoPago === 'Contado' ? 'Registrar venta' : 'Registrar crédito'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Historial de facturas ─────────────────────────────────── */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>Historial de ventas</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="input"
              style={{ padding: '8px 12px', width: 'auto', fontSize: '0.85rem' }}
              value={invoiceFilter.tipo_pago}
              onChange={e => setInvoiceFilter(f => ({ ...f, tipo_pago: e.target.value }))}
            >
              <option value="">Todos los tipos</option>
              <option value="Contado">Contado</option>
              <option value="Credito">Crédito</option>
            </select>
            <select
              className="input"
              style={{ padding: '8px 12px', width: 'auto', fontSize: '0.85rem' }}
              value={invoiceFilter.estado}
              onChange={e => setInvoiceFilter(f => ({ ...f, estado: e.target.value }))}
            >
              <option value="">Todos los estados</option>
              <option value="Pagada">Pagada</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Parcialmente_Pagada">Parcialmente pagada</option>
            </select>
          </div>
        </div>

        {loadingInvoices ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando facturas...</div>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No hay facturas registradas.
          </div>
        ) : (
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
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id_factura}>
                    <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)' }}>
                      {inv.numero_factura}
                    </td>
                    <td>
                      {inv.cliente
                        ? `${inv.cliente.nombre} ${inv.cliente.apellido}`
                        : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(inv.fecha_emision).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
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
                    {/* ── BOTÓN VER PDF ── */}
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => setPdfInvoiceId(inv.id_factura)}
                        title="Ver e imprimir esta factura"
                      >
                        <FileText size={14} /> Ver
                      </button>
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