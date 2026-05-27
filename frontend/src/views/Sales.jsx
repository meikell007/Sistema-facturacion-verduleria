import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingBag, Search, Plus, Minus, Trash2, User,
  Package, CreditCard, Banknote, CheckCircle2,
  AlertTriangle, X, Receipt, FileText
} from 'lucide-react';
import API from '../services/api';
import InvoicePDF from '../components/InvoicePDF';

const fmt = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

const estadoBadge = (e) =>
  e === 'Pagada' ? 'badge-success' : e === 'Pendiente' ? 'badge-warning' : 'badge-warning';

export default function Sales({ user }) {
  // ── estado ─────────────────────────────────────────────────────────────────
  const [products, setProducts]         = useState([]);
  const [prodSearch, setProdSearch]     = useState('');
  const [loadingProd, setLoadingProd]   = useState(true);

  const [clientQuery, setClientQuery]   = useState('');
  const [clientList, setClientList]     = useState([]);
  const [loadingCli, setLoadingCli]     = useState(false);
  const [showDrop, setShowDrop]         = useState(false);
  const [dropPos, setDropPos]           = useState({ top: 0, left: 0, width: 300 });
  const [selClient, setSelClient]       = useState(null);
  const inputRef = useRef(null);

  const [cart, setCart]                 = useState([]);
  const [drafts, setDrafts]             = useState({});
  const [tipoPago, setTipoPago]         = useState('Contado');

  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [okInvoice, setOkInvoice]       = useState(null);
  const [pdfId, setPdfId]               = useState(null);

  const [invoices, setInvoices]         = useState([]);
  const [loadingInv, setLoadingInv]     = useState(true);
  const [filterTipo, setFilterTipo]     = useState('');
  const [filterEst, setFilterEst]       = useState('');

  // ── efectos ────────────────────────────────────────────────────────────────
  useEffect(() => { fetchProducts(); fetchInvoices(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(t);
  }, [prodSearch]);

  useEffect(() => {
    if (clientQuery.trim().length < 2) { setClientList([]); setShowDrop(false); return; }
    const t = setTimeout(() => fetchClients(clientQuery), 350);
    return () => clearTimeout(t);
  }, [clientQuery]);

  useEffect(() => { fetchInvoices(); }, [filterTipo, filterEst]);

  // cerrar dropdown al clic fuera
  useEffect(() => {
    const fn = (e) => { if (inputRef.current && !inputRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // ── fetchers ───────────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    try {
      setLoadingProd(true);
      const r = await API.get(`/products${prodSearch ? `?search=${encodeURIComponent(prodSearch)}` : ''}`);
      setProducts(Array.isArray(r.data) ? r.data.filter(p => p.activo) : []);
    } catch (e) { console.error('fetchProducts:', e); }
    finally { setLoadingProd(false); }
  };

  const fetchClients = async (q) => {
    try {
      setLoadingCli(true);
      const r = await API.get(`/clients?search=${encodeURIComponent(q)}`);
      const list = Array.isArray(r.data) ? r.data : [];
      setClientList(list);
      if (list.length > 0 && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        setShowDrop(true);
      } else {
        setShowDrop(false);
      }
    } catch (e) {
      console.error('fetchClients:', e);
      setError('Error al buscar clientes. Verifica la conexión con el servidor.');
    }
    finally { setLoadingCli(false); }
  };

  const fetchInvoices = async () => {
    try {
      setLoadingInv(true);
      const params = new URLSearchParams();
      if (filterTipo) params.append('tipo_pago', filterTipo);
      if (filterEst)  params.append('estado', filterEst);
      const r = await API.get(`/invoices${params.toString() ? '?' + params.toString() : ''}`);
      setInvoices(Array.isArray(r.data) ? r.data : []);
    } catch (e) { console.error('fetchInvoices:', e); }
    finally { setLoadingInv(false); }
  };

  // ── carrito ────────────────────────────────────────────────────────────────
  const addToCart = (p) => {
    setError('');
    setCart(prev => {
      const ex = prev.find(i => i.id_producto === p.id_producto);
      if (ex) {
        const nq = ex.cantidad + 1;
        setDrafts(d => ({ ...d, [p.id_producto]: String(nq) }));
        return prev.map(i => i.id_producto === p.id_producto ? { ...i, cantidad: nq } : i);
      }
      setDrafts(d => ({ ...d, [p.id_producto]: '1' }));
      return [...prev, { id_producto: p.id_producto, descripcion: p.descripcion, precio_unitario: parseFloat(p.precio_unitario), unidad_medida: p.unidad_medida, cantidad: 1 }];
    });
  };

  const esUnidad = (u) => u === 'UNIDAD';

  const stepQty = (id, um, dir) => {
    const step = esUnidad(um) ? 1 : 0.1;
    setCart(prev => prev.map(i => {
      if (i.id_producto !== id) return i;
      const nq = esUnidad(um) ? Math.max(1, Math.round(i.cantidad) + dir) : Math.max(0.1, parseFloat((i.cantidad + dir * step).toFixed(3)));
      setDrafts(d => ({ ...d, [id]: String(nq) }));
      return { ...i, cantidad: nq };
    }));
  };

  const changeDraft = (id, val, um) => {
    if (esUnidad(um)) setDrafts(d => ({ ...d, [id]: val.replace(/[^0-9]/g, '') }));
    else setDrafts(d => ({ ...d, [id]: val }));
  };

  const applyDraft = (id, um) => {
    const raw = drafts[id] ?? '';
    const qty = esUnidad(um) ? parseInt(raw, 10) : parseFloat(raw);
    if (!raw || isNaN(qty) || qty <= 0) {
      const prev = cart.find(i => i.id_producto === id);
      setDrafts(d => ({ ...d, [id]: prev ? String(prev.cantidad) : '1' }));
      return;
    }
    const final = esUnidad(um) ? Math.round(qty) : qty;
    setCart(prev => prev.map(i => i.id_producto === id ? { ...i, cantidad: final } : i));
    setDrafts(d => ({ ...d, [id]: String(final) }));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i.id_producto !== id));
    setDrafts(d => { const n = { ...d }; delete n[id]; return n; });
  };

  const clearCart = () => { setCart([]); setDrafts({}); setSelClient(null); setClientQuery(''); setTipoPago('Contado'); setError(''); setOkInvoice(null); };

  const subtotal = cart.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
  const cupoDisp = selClient ? (selClient.limite_credito || 0) - (selClient.credito_utilizado || 0) : 0;

  // ── registrar venta ────────────────────────────────────────────────────────
  const registrar = async () => {
    setError('');
    if (!selClient)      return setError('Selecciona un cliente antes de cobrar.');
    if (cart.length < 1) return setError('El carrito está vacío.');
    if (tipoPago === 'Credito' && subtotal > cupoDisp)
      return setError(`Cupo insuficiente. Disponible: ${fmt(cupoDisp)}`);
    try {
      setSaving(true);
      const r = await API.post('/invoices', {
        id_cliente: selClient.id_cliente,
        tipo_pago: tipoPago,
        detalles: cart.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad }))
      });
      setOkInvoice(r.data);
      setCart([]); setDrafts({}); setSelClient(null); setClientQuery(''); setTipoPago('Contado');
      fetchInvoices();
    } catch (e) {
      console.error('registrar venta:', e);
      const msg = e?.response?.data?.detalles || e?.response?.data?.error || `Error ${e?.response?.status || ''}: No se pudo registrar la venta.`;
      setError(msg);
    } finally { setSaving(false); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>
          <ShoppingBag size={24} color="var(--primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Caja POS</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Registra ventas al contado o a crédito</p>
        </div>
      </div>

      {/* Dropdown portal — pegado directo al body */}
      {showDrop && clientList.length > 0 && createPortal(
        <div style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 999999, background: 'var(--bg-card)', border: '2px solid var(--primary)', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxHeight: '280px', overflowY: 'auto' }}>
          {clientList.map(c => (
            <div key={c.id_cliente}
              style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-app)'}
              onMouseOut={e  => e.currentTarget.style.background = 'transparent'}
              onMouseDown={e => {
                e.preventDefault();
                setSelClient(c);
                setClientQuery('');
                setShowDrop(false);
              }}
            >
              <p style={{ fontWeight: 700, margin: '0 0 2px', fontSize: '0.9rem' }}>{c.nombre} {c.apellido}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
                {c.identificacion} · Cupo: {fmt((c.limite_credito || 0) - (c.credito_utilizado || 0))}
              </p>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Modal PDF */}
      {pdfId && <InvoicePDF invoiceId={pdfId} onClose={() => setPdfId(null)} />}

      {/* Modal venta OK */}
      {okInvoice && (
        <div className="modal-overlay" onClick={() => setOkInvoice(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={22} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>¡Venta registrada!</h3>
              </div>
              <button className="btn btn-outline" onClick={() => setOkInvoice(null)} style={{ padding: '6px 10px' }}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Número de factura</p>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary)', margin: 0 }}>{okInvoice.numero_factura}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cliente</p><p style={{ fontWeight: 700, margin: 0 }}>{okInvoice.cliente?.nombre} {okInvoice.cliente?.apellido}</p></div>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tipo</p><span className={`badge ${okInvoice.tipo_pago === 'Contado' ? 'badge-success' : 'badge-warning'}`}>{okInvoice.tipo_pago}</span></div>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total</p><p style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', margin: 0 }}>{fmt(okInvoice.total)}</p></div>
                <div><p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Estado</p><span className={`badge ${estadoBadge(okInvoice.estado)}`}>{okInvoice.estado}</span></div>
              </div>
            </div>
            <div className="modal-footer" style={{ gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => { setPdfId(okInvoice.id_factura); setOkInvoice(null); }}><FileText size={16} /> Ver PDF</button>
              <button className="btn btn-primary" onClick={() => setOkInvoice(null)}>Nueva venta</button>
            </div>
          </div>
        </div>
      )}

      {/* Layout POS */}
      <div className="pos-container">

        {/* Catálogo */}
        <div className="pos-catalog">

          {/* Cliente */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <User size={18} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Cliente</h3>
            </div>
            {selClient ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                <div>
                  <p style={{ fontWeight: 700, margin: 0 }}>{selClient.nombre} {selClient.apellido}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{selClient.identificacion} · Cupo: {fmt(cupoDisp)}</p>
                </div>
                <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => { setSelClient(null); setClientQuery(''); }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  ref={inputRef}
                  className="input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Buscar cliente (mín. 2 caracteres)..."
                  value={clientQuery}
                  autoComplete="off"
                  onChange={e => setClientQuery(e.target.value)}
                />
                {loadingCli && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>Buscando...</p>}
                {clientQuery.length >= 2 && !loadingCli && clientList.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>Sin resultados para "{clientQuery}"</p>
                )}
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="card" style={{ padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Productos</h3>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" style={{ paddingLeft: '32px', padding: '8px 12px 8px 32px', fontSize: '0.85rem', width: '200px' }}
                  placeholder="Filtrar..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
              </div>
            </div>
            {loadingProd ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando productos...</div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay productos.</div>
            ) : (
              <div className="product-grid">
                {products.map(p => (
                  <div key={p.id_producto} className="product-item" onClick={() => addToCart(p)}>
                    <div><p className="product-item-title">{p.descripcion}</p><span className="product-item-unit">{p.unidad_medida}</span></div>
                    <p className="product-item-price">{fmt(p.precio_unitario)}</p>
                    <div style={{ marginTop: '8px', textAlign: 'right' }}><Plus size={14} color="var(--primary)" /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carrito */}
        <div className="pos-cart">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} color="var(--primary)" />
              <h3 style={{ margin: 0 }}>Carrito ({cart.length})</h3>
            </div>
            {cart.length > 0 && (
              <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.78rem' }} onClick={clearCart}>
                <Trash2 size={13} /> Limpiar
              </button>
            )}
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <ShoppingBag size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                <p>Selecciona productos del catálogo</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id_producto} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.descripcion}</span>
                  <span className="cart-item-price">{fmt(item.precio_unitario)} × {item.cantidad} = {fmt(item.precio_unitario * item.cantidad)}</span>
                </div>
                <div className="cart-item-actions">
                  <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => stepQty(item.id_producto, item.unidad_medida, -1)}><Minus size={12} /></button>
                  <input type="number" className="cart-item-qty-input input"
                    value={drafts[item.id_producto] ?? item.cantidad}
                    min="1" step={esUnidad(item.unidad_medida) ? 1 : 0.1}
                    onKeyDown={e => { if (esUnidad(item.unidad_medida) && (e.key === '.' || e.key === ',')) e.preventDefault(); }}
                    onChange={e => changeDraft(item.id_producto, e.target.value, item.unidad_medida)}
                    onBlur={() => applyDraft(item.id_producto, item.unidad_medida)}
                  />
                  <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => stepQty(item.id_producto, item.unidad_medida, 1)}><Plus size={12} /></button>
                  <button className="btn btn-outline" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => removeItem(item.id_producto)}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Tipo pago */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tipo de pago</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['Contado', 'Credito'].map(t => (
                <button key={t} onClick={() => setTipoPago(t)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: 'var(--radius-sm)', border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'var(--transition)', borderColor: tipoPago === t ? 'var(--primary)' : 'var(--border)', background: tipoPago === t ? 'var(--primary-light)' : 'transparent', color: tipoPago === t ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {t === 'Contado' ? <Banknote size={16} /> : <CreditCard size={16} />}
                  {t === 'Contado' ? 'Contado' : 'Crédito'}
                </button>
              ))}
            </div>
            {tipoPago === 'Credito' && selClient && (
              <div className="credit-warning-box" style={{ marginTop: '10px' }}>
                <span>⚠ Cupo disponible</span>
                <span style={{ fontWeight: 800 }}>{fmt(cupoDisp)}</span>
                {subtotal > cupoDisp && <span style={{ color: 'var(--danger)' }}>El total supera el cupo.</span>}
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="cart-totals">
            <div className="total-row"><span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="total-row"><span style={{ color: 'var(--text-muted)' }}>IVA (0%)</span><span>$0</span></div>
            <div className="total-row grand-total"><span>Total</span><span>{fmt(subtotal)}</span></div>
          </div>

          {error && (
            <div style={{ background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'hsl(350,82%,35%)', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} /><span>{error}</span>
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            disabled={saving || cart.length === 0 || !selClient}
            onClick={registrar}>
            {saving ? 'Procesando...' : <><CheckCircle2 size={18} /> {tipoPago === 'Contado' ? 'Registrar venta' : 'Registrar crédito'}</>}
          </button>
        </div>
      </div>

      {/* Historial */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>Historial de ventas</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select className="input" style={{ padding: '8px 12px', width: 'auto', fontSize: '0.85rem' }} value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="Contado">Contado</option>
              <option value="Credito">Crédito</option>
            </select>
            <select className="input" style={{ padding: '8px 12px', width: 'auto', fontSize: '0.85rem' }} value={filterEst} onChange={e => setFilterEst(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="Pagada">Pagada</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Parcialmente_Pagada">Parcialmente pagada</option>
            </select>
          </div>
        </div>
        {loadingInv ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay facturas.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th># Factura</th><th>Cliente</th><th>Fecha</th><th>Tipo</th><th>Total</th><th>Saldo</th><th>Estado</th><th>PDF</th></tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id_factura}>
                    <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)' }}>{inv.numero_factura}</td>
                    <td>{inv.cliente ? `${inv.cliente.nombre} ${inv.cliente.apellido}` : '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(inv.fecha_emision).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td><span className={`badge ${inv.tipo_pago === 'Contado' ? 'badge-success' : 'badge-warning'}`}>{inv.tipo_pago}</span></td>
                    <td style={{ fontWeight: 700 }}>{fmt(inv.total)}</td>
                    <td style={{ color: inv.saldo_pendiente > 0 ? 'var(--warning)' : 'var(--primary)', fontWeight: 700 }}>{fmt(inv.saldo_pendiente)}</td>
                    <td><span className={`badge ${estadoBadge(inv.estado)}`}>{inv.estado?.replace('_', ' ')}</span></td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setPdfId(inv.id_factura)}>
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