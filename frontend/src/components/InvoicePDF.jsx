import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, X, Loader } from 'lucide-react';
import { getInvoiceById } from '../services/invoiceService';

// ─── Utilidades ────────────────────────────────────────────────────────────────

const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

const formatDate = (d) =>
  new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

// ─── Estilos internos del documento (aislados del tema de la app) ──────────────
// Se usan estilos en línea con colores fijos para garantizar fidelidad al imprimir/exportar PDF
const DOC = {
  page: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontSize: '13px',
    color: '#1a1a1a',
    background: '#ffffff',
    width: '680px',
    margin: '0 auto',
    padding: '40px 48px',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '2px solid #e5e5e5',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  logoName: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#1a6b3a',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  logoSub: {
    fontSize: '11px',
    color: '#6b7280',
    margin: 0,
  },
  invoiceInfo: {
    textAlign: 'right',
  },
  invoiceNum: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#1a6b3a',
    margin: '0 0 4px',
  },
  invoiceMeta: {
    fontSize: '11px',
    color: '#6b7280',
    margin: '2px 0',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#9ca3af',
    margin: '0 0 8px',
  },
  clientBox: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '14px 18px',
  },
  clientName: {
    fontWeight: 700,
    fontSize: '14px',
    margin: '0 0 3px',
  },
  clientDetail: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '2px 0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    background: '#f3f4f6',
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
  },
  thRight: {
    textAlign: 'right',
  },
  td: {
    padding: '11px 12px',
    fontSize: '13px',
    borderBottom: '1px solid #f3f4f6',
    color: '#1a1a1a',
    verticalAlign: 'middle',
  },
  tdRight: {
    textAlign: 'right',
  },
  totalsBox: {
    marginLeft: 'auto',
    width: '280px',
    marginTop: '16px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '13px',
    color: '#6b7280',
  },
  totalRowGrand: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderTop: '2px solid #1a6b3a',
    marginTop: '4px',
    fontSize: '16px',
    fontWeight: 800,
    color: '#1a6b3a',
  },
  badge: (estado) => {
    const colors = {
      Pagada: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
      Pendiente: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
      Parcialmente_Pagada: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
    };
    const c = colors[estado] || { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
    return {
      display: 'inline-block',
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      borderRadius: '50px',
      padding: '3px 10px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    };
  },
  footer: {
    marginTop: '32px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
    fontSize: '11px',
    color: '#9ca3af',
  },
  saldoBanner: (saldo) => ({
    background: saldo > 0 ? '#fffbeb' : '#ecfdf5',
    border: `1px dashed ${saldo > 0 ? '#f59e0b' : '#34d399'}`,
    borderRadius: '8px',
    padding: '12px 18px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

// ─── Documento de factura (el HTML que se convierte a PDF) ─────────────────────

function InvoiceDocument({ invoice }) {
  if (!invoice) return null;

  const cliente = invoice.cliente || {};
  const detalles = invoice.detalles || [];

  return (
    <div style={DOC.page}>

      {/* Encabezado */}
      <div style={DOC.header}>
        <div style={DOC.logo}>
          <p style={DOC.logoName}>🌿 Eco Fruver</p>
          <p style={DOC.logoSub}>Sistema de Facturación · Universidad del Magdalena</p>
          <p style={{ ...DOC.logoSub, marginTop: '6px' }}>Santa Marta, Colombia</p>
        </div>
        <div style={DOC.invoiceInfo}>
          <p style={DOC.invoiceNum}>{invoice.numero_factura}</p>
          <p style={DOC.invoiceMeta}>Emitida: {formatDate(invoice.fecha_emision)}</p>
          <p style={DOC.invoiceMeta}>Tipo de pago: <strong>{invoice.tipo_pago}</strong></p>
          <div style={{ marginTop: '8px' }}>
            <span style={DOC.badge(invoice.estado)}>{invoice.estado?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Datos del cliente */}
      <div style={DOC.section}>
        <p style={DOC.sectionTitle}>Facturado a</p>
        <div style={DOC.clientBox}>
          <p style={DOC.clientName}>{cliente.nombre} {cliente.apellido}</p>
          {cliente.tipo_identificacion && (
            <p style={DOC.clientDetail}>{cliente.tipo_identificacion}: {cliente.identificacion}</p>
          )}
          {cliente.telefono && <p style={DOC.clientDetail}>Tel: {cliente.telefono}</p>}
          {cliente.email && <p style={DOC.clientDetail}>Email: {cliente.email}</p>}
          {cliente.direccion && <p style={DOC.clientDetail}>Dirección: {cliente.direccion}</p>}
        </div>
      </div>

      {/* Saldo pendiente si aplica */}
      {invoice.tipo_pago === 'Credito' && (
        <div style={DOC.saldoBanner(invoice.saldo_pendiente)}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: invoice.saldo_pendiente > 0 ? '#92400e' : '#065f46' }}>
            {invoice.saldo_pendiente > 0 ? '⚠ Saldo pendiente de pago' : '✓ Factura pagada en su totalidad'}
          </span>
          <span style={{ fontWeight: 800, fontSize: '15px', color: invoice.saldo_pendiente > 0 ? '#f59e0b' : '#059669' }}>
            {formatCOP(invoice.saldo_pendiente)}
          </span>
        </div>
      )}

      {/* Tabla de productos */}
      <div style={DOC.section}>
        <p style={DOC.sectionTitle}>Detalle de productos</p>
        <table style={DOC.table}>
          <thead>
            <tr>
              <th style={DOC.th}>#</th>
              <th style={DOC.th}>Producto</th>
              <th style={{ ...DOC.th, ...DOC.thRight }}>Unidad</th>
              <th style={{ ...DOC.th, ...DOC.thRight }}>Cantidad</th>
              <th style={{ ...DOC.th, ...DOC.thRight }}>Precio unit.</th>
              <th style={{ ...DOC.th, ...DOC.thRight }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {detalles.map((d, i) => (
              <tr key={d.id_detalle || i}>
                <td style={{ ...DOC.td, color: '#9ca3af', fontSize: '12px' }}>{i + 1}</td>
                <td style={DOC.td}>
                  <strong>{d.producto?.descripcion || `Producto #${d.id_producto}`}</strong>
                </td>
                <td style={{ ...DOC.td, ...DOC.tdRight, fontSize: '11px', color: '#6b7280' }}>
                  {d.producto?.unidad_medida || '—'}
                </td>
                <td style={{ ...DOC.td, ...DOC.tdRight }}>
                  {parseFloat(d.cantidad).toLocaleString('es-CO')}
                </td>
                <td style={{ ...DOC.td, ...DOC.tdRight }}>
                  {formatCOP(d.precio_unitario_venta)}
                </td>
                <td style={{ ...DOC.td, ...DOC.tdRight, fontWeight: 700 }}>
                  {formatCOP(d.subtotal_linea)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div style={DOC.totalsBox}>
        <div style={DOC.totalRow}>
          <span>Subtotal</span>
          <span>{formatCOP(invoice.subtotal)}</span>
        </div>
        <div style={DOC.totalRow}>
          <span>IVA (0%)</span>
          <span>{formatCOP(invoice.impuesto)}</span>
        </div>
        <div style={DOC.totalRowGrand}>
          <span>TOTAL</span>
          <span>{formatCOP(invoice.total)}</span>
        </div>
      </div>

      {/* Pie de página */}
      <div style={DOC.footer}>
        <p style={{ margin: '0 0 4px' }}>
          Eco Fruver · Sistema de Facturación y Gestión de Crédito
        </p>
        <p style={{ margin: 0 }}>
          Proyecto de Seminario · Universidad del Magdalena · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

// ─── Componente exportable: Modal con la factura y botón de descarga ───────────

export default function InvoicePDF({ invoiceId, invoiceData, onClose }) {
  const [invoice, setInvoice] = useState(invoiceData || null);
  const [loading, setLoading] = useState(!invoiceData);
  const [exporting, setExporting] = useState(false);
  const docRef = useRef(null);

  // Cargar factura por ID si no se pasó directo
  useEffect(() => {
    if (!invoiceData && invoiceId) {
      setLoading(true);
      getInvoiceById(invoiceId)
        .then(data => setInvoice(data))
        .catch(() => setInvoice(null))
        .finally(() => setLoading(false));
    }
  }, [invoiceId, invoiceData]);

  // ── Exportar a PDF usando html2pdf.js (cargado dinámicamente) ──────────────
  const handleDownloadPDF = async () => {
    if (!docRef.current || !invoice) return;
    setExporting(true);

    try {
      // Cargar html2pdf.js dinámicamente — no requiere npm install
      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const opt = {
        margin:      [0, 0, 0, 0],
        filename:    `factura-${invoice.numero_factura}.pdf`,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await window.html2pdf().set(opt).from(docRef.current).save();
    } catch (err) {
      console.error('Error al generar el PDF:', err);
      alert('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  // ── Imprimir con el diálogo del navegador ──────────────────────────────────
  const handlePrint = () => {
    const printContent = docRef.current?.innerHTML;
    if (!printContent) return;

    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Factura ${invoice?.numero_factura || ''}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; }
            @page { size: A4; margin: 0; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          width: '780px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Barra de acciones */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>
            Vista previa — {invoice?.numero_factura || 'Factura'}
          </h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn btn-outline"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              onClick={handlePrint}
              disabled={loading || !invoice}
            >
              <Printer size={15} /> Imprimir
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              onClick={handleDownloadPDF}
              disabled={loading || !invoice || exporting}
            >
              {exporting
                ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generando...</>
                : <><Download size={15} /> Descargar PDF</>
              }
            </button>
            <button className="btn btn-outline" style={{ padding: '8px 10px' }} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              Cargando factura...
            </div>
          ) : !invoice ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              No se pudo cargar la factura.
            </div>
          ) : (
            /* El div con ref es el que se convierte a PDF */
            <div
              ref={docRef}
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <InvoiceDocument invoice={invoice} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
