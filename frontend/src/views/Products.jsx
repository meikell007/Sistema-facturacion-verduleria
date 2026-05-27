import React, { useState, useEffect, useRef } from 'react';
import { Package, Search, Plus, Edit2, AlertTriangle, Scale, ShoppingBag, DollarSign } from 'lucide-react';
import { getProducts, createProduct, updateProduct } from '../services/productService';
import Modal from '../components/Modal';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value || 0);

export default function Products({ user }) {
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formError, setFormError] = useState('');
  const [saving, setSaving]       = useState(false);

  const emptyForm = { descripcion: '', precio_unitario: '', unidad_medida: 'UNIDAD', activo: true };
  const [formData, setFormData] = useState(emptyForm);

  // ── Debounce buscador ──────────────────────────────────────────────────────
  const debounceRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadProducts(val), 350);
  };

  useEffect(() => {
    loadProducts('');
    return () => clearTimeout(debounceRef.current);
  }, []);

  const loadProducts = async (q = search) => {
    try {
      setLoading(true);
      const data = await getProducts(q);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al obtener productos:', err);
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

  const handleOpenEdit = (product) => {
    setFormData({
      id_producto:    product.id_producto,
      descripcion:    product.descripcion,
      precio_unitario: Number(product.precio_unitario),
      unidad_medida:  product.unidad_medida,
      activo:         product.activo
    });
    setModalMode('edit');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validateForm = () => {
    if (!formData.descripcion.trim()) return 'La descripción es obligatoria.';
    if (!formData.precio_unitario)    return 'El precio es obligatorio.';
    if (Number(formData.precio_unitario) <= 0) return 'El precio debe ser mayor a $0.';
    if (Number(formData.precio_unitario) > 10_000_000) return 'El precio parece inusualmente alto. Verifícalo.';
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
        await createProduct(formData);
      } else {
        await updateProduct(formData.id_producto, formData);
      }
      setIsModalOpen(false);
      loadProducts(search);
    } catch (error) {
      setFormError(error.response?.data?.error || 'Error al guardar producto. Comprueba los datos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    // Sin className="main-content" — App.jsx ya lo pone
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 4px' }}>Catálogo de Productos</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Administra productos, configura precios y tipos de venta (unidad o peso).
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Buscador */}
      <div className="card card-glass" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px 20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input"
            placeholder="Buscar por descripción..."
            value={search}
            onChange={handleSearchChange}
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Descripción</th><th>Precio vigente</th>
              <th>Unidad de venta</th><th>Tipo venta</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Cargando catálogo...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No se encontraron productos.</td></tr>
            ) : products.map(p => (
              <tr key={p.id_producto} style={{ opacity: p.activo ? 1 : 0.55 }}>
                <td><strong style={{ color: 'var(--text-muted)' }}>#{p.id_producto}</strong></td>
                <td><strong style={{ fontSize: '1rem' }}>{p.descripcion}</strong></td>
                <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>
                  {formatCurrency(p.precio_unitario)}
                </td>
                <td>
                  <span className={`badge ${p.unidad_medida === 'KG' ? 'badge-warning' : p.unidad_medida === 'GRAMO' ? 'badge-warning' : 'badge-success'}`}
                    style={{ fontWeight: 800 }}>
                    {p.unidad_medida === 'KG' ? 'Por Kilogramo' : p.unidad_medida === 'GRAMO' ? 'Por Gramo' : 'Por Unidad'}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  {p.unidad_medida !== 'UNIDAD' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Scale size={15} color="var(--warning)" />
                      <span style={{ fontWeight: 600 }}>Venta fraccionada</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <ShoppingBag size={15} /> Cantidad entera
                    </div>
                  )}
                </td>
                <td>
                  <span className={`badge ${p.activo ? 'badge-success' : 'badge-danger'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '6px 10px' }} title="Editar"
                    onClick={() => handleOpenEdit(p)}><Edit2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear / editar */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Agregar producto al catálogo' : 'Modificar producto'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar producto'}
          </button>
        </>}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div style={{ background: 'var(--danger-light)', color: 'hsl(350,82%,35%)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} /> {formError}
            </div>
          )}

          <div className="form-group">
            <label>Descripción del producto *</label>
            <input name="descripcion" type="text" className="input"
              placeholder="Ej: Tomate Chonto Seleccionado"
              value={formData.descripcion} onChange={handleInputChange} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Precio vigente (COP) *</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input name="precio_unitario" type="number" className="input"
                  placeholder="2400"
                  value={formData.precio_unitario} onChange={handleInputChange}
                  style={{ paddingLeft: '36px' }}
                  min="1" step="100" required />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                Debe ser mayor a $0.
              </p>
            </div>

            <div className="form-group">
              <label>Unidad de medida *</label>
              <select name="unidad_medida" className="input"
                value={formData.unidad_medida} onChange={handleInputChange}>
                <option value="UNIDAD">Unidad (enteros)</option>
                <option value="KG">Kilogramo (decimales)</option>
                <option value="GRAMO">Gramo (decimales)</option>
              </select>
            </div>
          </div>

          {formData.unidad_medida !== 'UNIDAD' && (
            <div style={{ background: 'var(--primary-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
              <Scale size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.82rem', color: 'var(--primary)', margin: 0 }}>
                <strong>Venta fraccionada:</strong> el cajero podrá ingresar cantidades con decimales (ej: 0.750 kg).
              </p>
            </div>
          )}

          {modalMode === 'edit' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <input id="product-activo" name="activo" type="checkbox"
                checked={formData.activo} onChange={handleInputChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="product-activo" style={{ cursor: 'pointer', margin: 0 }}>
                Producto activo en catálogo
              </label>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}