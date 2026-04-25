// ============================================================
// Facturación - Schema Grand-Stay.sql (grandstay_db)
// facturas (cabecera) + items_factura (líneas).
// Métodos: efectivo|tarjeta_credito|tarjeta_debito|transferencia|credito_hotel|mixto.
// Estados: pendiente|pagada|parcial|anulada.
// IVA Colombia 19% (impuesto_pct).
// ============================================================

import { useState, useEffect } from 'react';
import {
  Receipt, CreditCard, FileText, X, Eye, Banknote, Smartphone,
  Filter, RefreshCw, Plus, Ban,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { getErrorMessage } from '../utils/errorHelpers.js';

const METODOS_PAGO = [
  { value: 'efectivo',         label: 'Efectivo',          icon: Banknote   },
  { value: 'tarjeta_credito',  label: 'Tarjeta crédito',   icon: CreditCard },
  { value: 'tarjeta_debito',   label: 'Tarjeta débito',    icon: CreditCard },
  { value: 'transferencia',    label: 'Transferencia',     icon: Smartphone },
  { value: 'credito_hotel',    label: 'Crédito hotel',     icon: FileText   },
  { value: 'mixto',            label: 'Mixto',             icon: FileText   },
];

const ESTADO_BADGE = {
  pendiente: 'badge-warning',
  pagada:    'badge-success',
  parcial:   'badge-info',
  anulada:   'badge-danger',
};

// ── Generate Modal ────────────────────────────────────────
const GenerateModal = ({ onClose, onConfirm }) => {
  const [data, setData] = useState({
    id_reserva: '', metodo_pago: 'efectivo', descuentos: '0', incluir_consumos: true, notas: '',
  });
  const submit = () => {
    if (!data.id_reserva) return;
    onConfirm(parseInt(data.id_reserva, 10), {
      metodo_pago: data.metodo_pago,
      descuentos:  Number(data.descuentos) || 0,
      incluir_consumos: data.incluir_consumos,
      notas: data.notas || undefined,
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl">Generar Factura</h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>ID Reserva *</label>
            <input type="number" value={data.id_reserva}
              onChange={e => setData(d => ({ ...d, id_reserva: e.target.value }))}
              className="input-field" autoFocus />
          </div>
          <div>
            <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Método de pago</label>
            <select value={data.metodo_pago}
              onChange={e => setData(d => ({ ...d, metodo_pago: e.target.value }))}
              className="input-field">
              {METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Descuentos (COP)</label>
            <input type="number" min="0" value={data.descuentos}
              onChange={e => setData(d => ({ ...d, descuentos: e.target.value }))}
              className="input-field" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={data.incluir_consumos}
              onChange={e => setData(d => ({ ...d, incluir_consumos: e.target.checked }))} />
            Incluir consumos pendientes
          </label>
          <div>
            <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Notas</label>
            <textarea rows={2} value={data.notas}
              onChange={e => setData(d => ({ ...d, notas: e.target.value }))}
              className="input-field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={submit} className="btn-gold flex-1">Generar</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ── Pay Modal ─────────────────────────────────────────────
const PayModal = ({ factura, onClose, onConfirm }) => {
  const [metodo, setMetodo] = useState(factura.metodo_pago || 'efectivo');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl">Procesar Pago</h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{factura.numero_factura}</p>
        <p className="text-3xl font-serif font-light mb-5" style={{ color: 'var(--gold-light)' }}>
          ${Number(factura.total).toLocaleString('es-CO')}
        </p>
        <div className="space-y-2 mb-5">
          {METODOS_PAGO.map(({ value, icon: Icon, label }) => (
            <button key={value} onClick={() => setMetodo(value)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                metodo === value ? 'border-yellow-500/60 bg-yellow-500/10' : 'border-[var(--border)]'
              }`}>
              <Icon size={16} style={{ color: 'var(--gold)' }} />
              <span className="flex-1 text-sm">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => onConfirm(metodo)} className="btn-gold flex-1">Confirmar</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ── Detail Modal ──────────────────────────────────────────
const DetailModal = ({ data, onClose }) => {
  const { factura, items } = data;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-2xl">{factura.numero_factura}</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Emitida: {factura.fecha_emision?.slice(0, 16).replace('T', ' ')}
            </p>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <table className="luxury-table mb-5">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Categoría</th>
              <th className="text-center">Cant.</th>
              <th className="text-right">P. Unit.</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id_item}>
                <td className="text-sm">{it.concepto}</td>
                <td><span className="badge badge-neutral">{it.categoria}</span></td>
                <td className="text-center">{Number(it.cantidad)}</td>
                <td className="text-right">${Number(it.precio_unitario).toLocaleString('es-CO')}</td>
                <td className="text-right">${Number(it.subtotal).toLocaleString('es-CO')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          <div className="flex justify-between"><span>Subtotal</span><span>${Number(factura.subtotal).toLocaleString('es-CO')}</span></div>
          <div className="flex justify-between"><span>Descuentos</span><span>− ${Number(factura.descuentos).toLocaleString('es-CO')}</span></div>
          <div className="flex justify-between"><span>IVA ({factura.impuesto_pct}%)</span><span>${Number(factura.impuestos).toLocaleString('es-CO')}</span></div>
          <div className="flex justify-between text-lg font-serif pt-2 mt-2" style={{ borderTop: '1px solid var(--border)', color: 'var(--gold-light)' }}>
            <span>Total</span><span>${Number(factura.total).toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between pt-3">
            <span>Estado</span>
            <span className={`badge ${ESTADO_BADGE[factura.estado_pago] || 'badge-neutral'}`}>{factura.estado_pago}</span>
          </div>
          <div className="flex justify-between"><span>Método</span><span>{factura.metodo_pago}</span></div>
          {factura.notas && <p className="pt-2 italic">{factura.notas}</p>}
        </div>
      </div>
    </div>
  );
};

const Billing = () => {
  const { hasRole } = useAuth();
  const { toast } = useUI();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [genModal, setGenModal] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => { loadFacturas(); /* eslint-disable-next-line */ }, []);

  const loadFacturas = async () => {
    setLoading(true);
    try {
      const params = filterEstado ? { estado_pago: filterEstado } : {};
      const res = await api.get('/api/billing', { params });
      setFacturas(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (reservaId, payload) => {
    try {
      const res = await api.post(`/api/billing/generar/${reservaId}`, payload);
      toast.success(`Factura ${res.data.factura.numero_factura} creada.`);
      setGenModal(false);
      loadFacturas();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handlePay = async (metodo) => {
    try {
      await api.patch(`/api/billing/${payTarget.id_factura}/pagar`, { metodo_pago: metodo });
      toast.success('Pago procesado.');
      setPayTarget(null);
      loadFacturas();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await api.get(`/api/billing/${id}`);
      setDetail(res.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleAnular = async (id) => {
    const motivo = prompt('Motivo de anulación:');
    if (!motivo) return;
    try {
      await api.patch(`/api/billing/${id}/anular`, { motivo });
      toast.success('Factura anulada.');
      loadFacturas();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--gold)' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {genModal  && <GenerateModal onClose={() => setGenModal(false)} onConfirm={handleGenerate} />}
      {payTarget && <PayModal factura={payTarget} onClose={() => setPayTarget(null)} onConfirm={handlePay} />}
      {detail    && <DetailModal data={detail} onClose={() => setDetail(null)} />}

      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--gold)' }}>Facturación</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{facturas.length} factura(s)</p>
        </div>
        {hasRole('Administrador', 'Recepcionista') && (
          <button onClick={() => setGenModal(true)} className="btn-gold">
            <Plus size={14} /> Generar Factura
          </button>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={14} style={{ color: 'var(--gold)' }} />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input-field w-auto text-sm">
            <option value="">Todos los estados</option>
            {Object.keys(ESTADO_BADGE).map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={loadFacturas} className="btn-gold text-sm py-2 px-4">
            <RefreshCw size={12} className="inline mr-1" /> Aplicar
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="luxury-table">
          <thead>
            <tr>
              <th>N° Factura</th>
              <th>Check-in</th>
              <th>Emisión</th>
              <th>Método</th>
              <th className="text-right">Subtotal</th>
              <th className="text-right">IVA</th>
              <th className="text-right">Total</th>
              <th>Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map(f => (
              <tr key={f.id_factura}>
                <td className="font-mono text-xs" style={{ color: 'var(--gold)' }}>{f.numero_factura}</td>
                <td className="text-sm">CK-{f.id_checkin}</td>
                <td className="text-sm">{f.fecha_emision?.slice(0, 10)}</td>
                <td className="text-xs">{f.metodo_pago}</td>
                <td className="text-right text-sm">${Number(f.subtotal).toLocaleString('es-CO')}</td>
                <td className="text-right text-sm">${Number(f.impuestos).toLocaleString('es-CO')}</td>
                <td className="text-right font-medium" style={{ color: 'var(--gold-light)' }}>
                  ${Number(f.total).toLocaleString('es-CO')}
                </td>
                <td><span className={`badge ${ESTADO_BADGE[f.estado_pago] || 'badge-neutral'}`}>{f.estado_pago}</span></td>
                <td>
                  <div className="flex justify-center gap-1">
                    <button onClick={() => handleViewDetail(f.id_factura)} title="Ver"
                      className="h-8 w-8 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                      <Eye size={13} />
                    </button>
                    {f.estado_pago === 'pendiente' && hasRole('Administrador', 'Recepcionista') && (
                      <button onClick={() => setPayTarget(f)} title="Pagar"
                        className="h-8 w-8 flex items-center justify-center rounded-lg"
                        style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
                        <CreditCard size={13} />
                      </button>
                    )}
                    {f.estado_pago !== 'anulada' && hasRole('Administrador') && (
                      <button onClick={() => handleAnular(f.id_factura)} title="Anular"
                        className="h-8 w-8 flex items-center justify-center rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                        <Ban size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {facturas.length === 0 && (
              <tr><td colSpan={9} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <Receipt size={32} className="mx-auto mb-2 opacity-30" /> Sin facturas
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Billing;
