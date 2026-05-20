import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  AlertTriangle,
  Scale,
  ShoppingBag,
  DollarSign
} from 'lucide-react';
import { 
  getProducts, 
  createProduct, 
  updateProduct 
} from '../services/productService';
import Modal from '../components/Modal';

export default function Products({ user }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  
  // Form State
  const [formData, setFormData] = useState({
    descripcion: '',
    precio_unitario: '',
    unidad_medida: 'UNIDAD',
    activo: true
  });
  
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts(search);
      setProducts(data);
    } catch (error) {
      console.error('Error al obtener productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      descripcion: '',
      precio_unitario: '',
      unidad_medida: 'UNIDAD',
      activo: true
    });
    setModalMode('create');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setFormData({
      id_producto: product.id_producto,
      descripcion: product.descripcion,
      precio_unitario: Number(product.precio_unitario),
      unidad_medida: product.unidad_medida,
      activo: product.activo
    });
    setModalMode('edit');
    setFormError('');
    setIsModalOpen(true);
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
    if (!formData.descripcion || !formData.precio_unitario) {
      setFormError('Descripción y Precio Unitario son campos obligatorios.');
      return;
    }

    if (Number(formData.precio_unitario) <= 0) {
      setFormError('El precio del producto debe ser mayor a 0.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        await createProduct(formData);
      } else {
        await updateProduct(formData.id_producto, formData);
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setFormError(error.response?.data?.error || 'Error al guardar producto. Compruebe los datos.');
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

  return (
    <div className="main-content">
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-main)' }}>Catálogo de Productos</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Administre los productos perecederos, configure precios vigentes y habilite la venta fraccionada por peso (Gramaje).
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Nuevo Producto
        </button>
      </div>

      {/* Barra de Búsqueda */}
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
            placeholder="Buscar por descripción..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      {/* Tabla del Inventario */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descripción del Artículo</th>
              <th>Precio Vigente</th>
              <th>Unidad de Venta</th>
              <th>Tipo de Venta</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  Cargando catálogo de productos...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No se encontraron productos en el catálogo.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id_producto} style={{ opacity: product.activo ? 1 : 0.6 }}>
                  <td><strong>#{product.id_producto}</strong></td>
                  <td>
                    <strong style={{ fontSize: '1rem' }}>{product.descripcion}</strong>
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1.05rem' }}>
                    {formatCurrency(product.precio_unitario)}
                  </td>
                  <td>
                    <span 
                      className={`badge ${product.unidad_medida === 'KG' ? 'badge-warning' : 'badge-success'}`}
                      style={{ fontWeight: '800' }}
                    >
                      {product.unidad_medida === 'KG' ? 'Por Kilogramo' : 'Por Unidad'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      {product.unidad_medida === 'KG' ? (
                        <>
                          <Scale size={16} style={{ color: 'var(--warning)' }} />
                          <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>Venta Fraccionada (3 decimales)</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={16} style={{ color: 'var(--primary)' }} />
                          <span style={{ color: 'var(--text-muted)' }}>Cantidad Entera</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    {product.activo ? (
                      <span className="badge badge-success">Activo</span>
                    ) : (
                      <span className="badge badge-danger">Inactivo</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleOpenEdit(product)}
                      style={{ padding: '6px 10px' }}
                      title="Editar Producto"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar Producto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Agregar Nuevo Producto al Catálogo' : 'Modificar Producto de Catálogo'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Producto'}
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

          <div className="form-group">
            <label htmlFor="product-desc">Descripción del Producto *</label>
            <input 
              id="product-desc"
              name="descripcion" 
              type="text" 
              className="input" 
              placeholder="Ej: Tomate Chonto Seleccionado, Cebolla, etc."
              value={formData.descripcion}
              onChange={handleInputChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="product-precio">Precio Unitario Vigente (COP) *</label>
              <div style={{ position: 'relative' }}>
                <DollarSign 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-muted)' 
                  }} 
                />
                <input 
                  id="product-precio"
                  name="precio_unitario" 
                  type="number" 
                  className="input" 
                  placeholder="2400"
                  value={formData.precio_unitario}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '36px' }}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="product-unidad">Unidad de Medida / Tipo Venta *</label>
              <select 
                id="product-unidad"
                name="unidad_medida" 
                className="input"
                value={formData.unidad_medida}
                onChange={handleInputChange}
              >
                <option value="UNIDAD">Unidad Fija (Enteros)</option>
                <option value="KG">Kilogramos (Soporte Gramaje / Fraccionados)</option>
              </select>
            </div>
          </div>

          {modalMode === 'edit' && (
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', marginTop: '8px' }}>
              <input 
                id="product-activo"
                name="activo" 
                type="checkbox" 
                checked={formData.activo}
                onChange={handleInputChange}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label htmlFor="product-activo" style={{ cursor: 'pointer', marginBottom: '0' }}>Producto Activo en Catálogo</label>
            </div>
          )}

          {formData.unidad_medida === 'KG' && (
            <div 
              className="credit-warning-box" 
              style={{ 
                marginTop: '16px', 
                background: 'var(--primary-light)', 
                color: 'var(--primary)', 
                borderColor: 'hsla(var(--hue-green), 68%, 40%, 0.15)',
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Scale size={20} style={{ flexShrink: 0, marginRight: '10px' }} />
              <div>
                <strong>Nota sobre Gramaje:</strong> Configurar como Kilogramo (KG) habilita al cajero a registrar pesos con hasta 3 decimales exactos en la caja registradora (ej: 0.355 kg de tomates).
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
