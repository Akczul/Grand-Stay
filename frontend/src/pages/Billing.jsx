import { useState, useEffect } from 'react';
import {
  Receipt, CreditCard, FileText, CheckCircle2, X,
  Filter, Eye, Banknote, Smartphone,
} from 'lucide-react';
import api from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';
import { getErrorMessage } from '../utils/errorHelpers.js';

// ── Pay Modal ──────────────────────────────────────────────
const METODOS = [
  { value: 'Efectivo',      icon: Banknote,    label: 'Efectivo' },
  { value: 'Tarjeta',       icon: CreditCard,  label: 'Tarjeta de crédito / débito' },
  { value: 'Transferencia', icon: Smartphone,  label: 'Transferencia bancaria' },
];

const PayModal = ({ factura, onConfirm, onClose }) => {
  const [metodo, setMetodo] = useState('Efectivo');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-gold-400">Procesar Pago</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-[var(--text-muted)] text-sm mb-1">Factura #{factura.id} — {factura.huespedNombre}</p>
        <p className="text-3xl font-bold text-[var(--text-primary)] mb-6">
          ${parseFloat(factura.total_final).toFixed(2)}
        </p>
        <div className="space-y-2 mb-6">
          {METODOS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setMetodo(value)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                metodo === value
                  ? 'border-gold-500 bg-gold-500/10 text-gold-300'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {metodo === value && <CheckCircle2 size={16} className="text-gold-400 shrink-0" />}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={() => onConfirm(factura.id, metodo)} className="btn-gold flex-1">
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Billing Page ───────────────────────────────────────────
const ESTADO_BADGE = {
  Pendiente: 'badge badge-warning',
  Pagada:    'badge badge-success',
  Anulada:   'badge badge-danger',
};

const TIPO_COLOR = {
  restaurante: 'text-orange-400',
  spa:         'text-purple-400',
  lavanderia:  'text-blue-400',
  minibar:     'text-emerald-400',
  otros:       'text-[var(--text-muted)]',
};

const Billing = () => {
  const { toast } = useUI();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [payTarget, setPayTarget] = useState(null);

  useEffect(() => { loadFacturas(); }, []);

  const loadFacturas = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEstado) params.estado = filterEstado;
      const res = await api.get('/api/billing', { params });
      setFacturas(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id, metodo) => {
    try {
      await api.patch(`/api/billing/${id}/pagar`, { metodo_pago: metodo });
      toast.success('Pago procesado exitosamente');
      setPayTarget(null);
      await loadFacturas();
      if (selectedFactura?.id === id) {
        const res = await api.get(`/api/billing/${id}`);
        setSelectedFactura(res.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await api.get(`/api/billing/${id}`);
      setSelectedFactura(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {payTarget && (
        <PayModal
          factura={payTarget}
          onConfirm={handlePay}
          onClose={() => setPayTarget(null)}
        />
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)]">Facturación</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Gestión de facturas y cobros del hotel</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Filter size={16} />
            <span className="text-sm font-medium">Filtrar por estado:</span>
          </div>
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="">Todas</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Pagada">Pagadas</option>
            <option value="Anulada">Anuladas</option>
          </select>
          <button onClick={loadFacturas} className="btn-gold text-sm py-2 px-4">Aplicar</button>
          {filterEstado && (
            <button
              onClick={() => { setFilterEstado(''); loadFacturas(); }}
              className="btn-ghost text-sm py-2 px-3"
            >
              <X size={14} className="inline mr-1" />Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Invoice list */}
        <div className="lg:col-span-3 card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-gold-400" />
              <h2 className="font-semibold text-[var(--text-primary)]">Lista de Facturas</h2>
              <span className="ml-auto badge badge-neutral">{facturas.length}</span>
            </div>
          </div>

          {facturas.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={40} className="mx-auto text-[var(--text-muted)] mb-3 opacity-30" />
              <p className="text-[var(--text-muted)]">No hay facturas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="luxury-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Huésped</th>
                    <th className="hidden sm:table-cell">Hab.</th>
                    <th className="text-right">Total</th>
                    <th>Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map(f => (
                    <tr
                      key={f.id}
                      onClick={() => handleViewDetail(f.id)}
                      className={`cursor-pointer ${selectedFactura?.id === f.id ? 'bg-gold-500/5' : ''}`}
                    >
                      <td className="font-mono text-gold-400/80 text-xs">#{f.id}</td>
                      <td className="font-medium text-[var(--text-primary)]">{f.huespedNombre}</td>
                      <td className="hidden sm:table-cell text-[var(--text-muted)]">{f.habitacionNumero}</td>
                      <td className="text-right font-bold text-[var(--text-primary)]">
                        ${parseFloat(f.total_final).toFixed(2)}
                      </td>
                      <td>
                        <span className={ESTADO_BADGE[f.estado] || 'badge badge-neutral'}>{f.estado}</span>
                      </td>
                      <td className="text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetail(f.id)}
                            title="Ver detalle"
                            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-gold-400 hover:bg-gold-500/10 transition-all"
                          >
                            <Eye size={15} />
                          </button>
                          {f.estado === 'Pendiente' && (
                            <button onClick={() => setPayTarget(f)} className="btn-success text-xs py-1 px-3">
                              Pagar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 card">
          {selectedFactura ? (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-gold-400" />
                  <h2 className="font-semibold text-[var(--text-primary)]">Detalle</h2>
                </div>
                <button
                  onClick={() => setSelectedFactura(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1 pb-4 border-b border-[var(--border)] mb-4">
                <p className="text-[var(--text-muted)] text-xs font-mono">Factura #{selectedFactura.id}</p>
                <p className="text-xl font-serif font-bold text-[var(--text-primary)]">{selectedFactura.huespedNombre}</p>
                <p className="text-[var(--text-muted)] text-sm">Habitación {selectedFactura.habitacionNumero}</p>
                <p className="text-[var(--text-muted)] text-xs">
                  {selectedFactura.fecha_inicio} → {selectedFactura.fecha_fin}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={ESTADO_BADGE[selectedFactura.estado] || 'badge badge-neutral'}>
                    {selectedFactura.estado}
                  </span>
                  {selectedFactura.metodo_pago && (
                    <span className="text-xs text-[var(--text-muted)]">Pago: {selectedFactura.metodo_pago}</span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Hospedaje</span>
                  <span className="text-[var(--text-primary)]">${parseFloat(selectedFactura.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Consumos</span>
                  <span className="text-[var(--text-primary)]">${parseFloat(selectedFactura.consumos_total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">IVA (16%)</span>
                  <span className="text-[var(--text-primary)]">${parseFloat(selectedFactura.impuestos).toFixed(2)}</span>
                </div>
                <div className="gold-divider" />
                <div className="flex justify-between">
                  <span className="font-bold text-[var(--text-primary)]">TOTAL</span>
                  <span className="font-bold text-xl text-gold-400">${parseFloat(selectedFactura.total_final).toFixed(2)}</span>
                </div>
              </div>

              {selectedFactura.detalle_consumos?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Detalle de Consumos
                  </p>
                  <div className="space-y-1">
                    {selectedFactura.detalle_consumos.map((c, i) => (
                      <div key={i} className="flex justify-between text-xs bg-[var(--bg-input)] p-2 rounded-md">
                        <span className={TIPO_COLOR[c.tipo] || 'text-[var(--text-muted)]'}>
                          {c.tipo} — {c.descripcion}
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">${parseFloat(c.monto).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFactura.estado === 'Pendiente' && (
                <button
                  onClick={() => setPayTarget(selectedFactura)}
                  className="btn-gold w-full mt-6 flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  Procesar Pago
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] py-12">
              <Receipt size={48} className="text-[var(--text-muted)] opacity-20 mb-4" />
              <p className="text-[var(--text-muted)] text-center text-sm">
                Selecciona una factura<br />para ver los detalles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;
