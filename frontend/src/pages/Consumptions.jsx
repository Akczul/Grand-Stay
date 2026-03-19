import { useState, useEffect } from 'react';
import {
  UtensilsCrossed, Plus, Trash2, Filter, X,
  Coffee, Shirt, Wine, ShoppingBag, Package, DollarSign,
} from 'lucide-react';
import api from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';
import { getErrorMessage } from '../utils/errorHelpers.js';
import useFormValidation from '../hooks/useFormValidation.js';

// ── Config ─────────────────────────────────────────────────
const TIPO_CONFIG = {
  restaurante: { icon: UtensilsCrossed, color: 'text-orange-400',  bg: 'bg-orange-400/10' },
  spa:         { icon: Coffee,          color: 'text-purple-400',  bg: 'bg-purple-400/10' },
  lavanderia:  { icon: Shirt,           color: 'text-blue-400',    bg: 'bg-blue-400/10'   },
  minibar:     { icon: Wine,            color: 'text-emerald-400', bg: 'bg-emerald-400/10'},
  otros:       { icon: Package,         color: 'text-slate-400',   bg: 'bg-slate-400/10'  },
};

const consumoRules = {
  reservaId:   v => !v ? 'El ID de reserva es obligatorio' : isNaN(v) ? 'Debe ser un número' : '',
  descripcion: v => !v?.trim() ? 'La descripción es obligatoria' : '',
  monto:       v => !v ? 'El monto es obligatorio' : isNaN(v) || Number(v) <= 0 ? 'Debe ser mayor a 0' : '',
  cantidad:    v => !v ? 'La cantidad es obligatoria' : isNaN(v) || Number(v) < 1 ? 'Mínimo 1' : '',
};

// ── Delete Modal ───────────────────────────────────────────
const DeleteModal = ({ id, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="card w-full max-w-sm animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <h2 className="font-semibold text-[var(--text-primary)]">Eliminar consumo</h2>
      </div>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        ¿Eliminar el consumo <strong className="text-[var(--text-primary)]">#{id}</strong>? Esta acción no se puede deshacer.
      </p>
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
        <button onClick={onConfirm} className="btn-danger flex-1">Eliminar</button>
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────
const Consumptions = () => {
  const { toast } = useUI();
  const [consumos, setConsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterTipo, setFilterTipo] = useState('');
  const [tipo, setTipo] = useState('restaurante');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const form = useFormValidation(
    { reservaId: '', descripcion: '', monto: '', cantidad: '1' },
    consumoRules,
  );

  useEffect(() => { loadConsumos(); }, []);

  const loadConsumos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTipo) params.tipo = filterTipo;
      const res = await api.get('/api/consumptions', { params });
      setConsumos(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.validateAll()) return;
    try {
      await api.post('/api/consumptions', {
        reservaId:   parseInt(form.values.reservaId),
        tipo,
        descripcion: form.values.descripcion,
        monto:       parseFloat(form.values.monto),
        cantidad:    parseInt(form.values.cantidad),
      });
      toast.success('Consumo registrado exitosamente');
      setShowForm(false);
      form.resetForm({ reservaId: '', descripcion: '', monto: '', cantidad: '1' });
      setTipo('restaurante');
      loadConsumos();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/consumptions/${deleteTarget}`);
      toast.success('Consumo eliminado');
      setDeleteTarget(null);
      loadConsumos();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const subtotal = (c) => (parseFloat(c.monto) * (c.cantidad || 1)).toFixed(2);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {deleteTarget !== null && (
        <DeleteModal
          id={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)]">Consumos</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Cargos adicionales: restaurante, spa, minibar y más</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); form.resetForm(); setTipo('restaurante'); }}
          className={showForm ? 'btn-ghost' : 'btn-gold'}
        >
          {showForm
            ? <><X size={16} className="mr-2" />Cancelar</>
            : <><Plus size={16} className="mr-2" />Registrar Consumo</>
          }
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign size={18} className="text-gold-400" />
            <h2 className="font-semibold text-[var(--text-primary)]">Registrar Nuevo Consumo</h2>
          </div>

          {/* Tipo selector */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
              Tipo de servicio
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TIPO_CONFIG).map(([key, { icon: Icon, color, bg }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTipo(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all capitalize ${
                    tipo === key
                      ? `border-gold-500/50 ${bg} ${color}`
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <Icon size={15} />
                  {key}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">ID de Reserva *</label>
              <input
                type="number"
                name="reservaId"
                value={form.values.reservaId}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                className={form.fieldClass('reservaId')}
                placeholder="Ej: 1"
              />
              {form.errors.reservaId && form.touched.reservaId && (
                <p className="error-msg">{form.errors.reservaId}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Descripción *</label>
              <input
                type="text"
                name="descripcion"
                value={form.values.descripcion}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                className={form.fieldClass('descripcion')}
                placeholder="Ej: Cena buffet para 2"
              />
              {form.errors.descripcion && form.touched.descripcion && (
                <p className="error-msg">{form.errors.descripcion}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Monto ($) *</label>
              <input
                type="number"
                name="monto"
                step="0.01"
                value={form.values.monto}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                className={form.fieldClass('monto')}
                placeholder="0.00"
              />
              {form.errors.monto && form.touched.monto && (
                <p className="error-msg">{form.errors.monto}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Cantidad *</label>
              <input
                type="number"
                name="cantidad"
                value={form.values.cantidad}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                className={form.fieldClass('cantidad')}
                min="1"
              />
              {form.errors.cantidad && form.touched.cantidad && (
                <p className="error-msg">{form.errors.cantidad}</p>
              )}
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="btn-gold">
                <Plus size={16} className="mr-2" />Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Filter size={16} />
            <span className="text-sm font-medium">Tipo:</span>
          </div>
          <select
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value)}
            className="input-field w-auto text-sm capitalize"
          >
            <option value="">Todos</option>
            {Object.keys(TIPO_CONFIG).map(k => (
              <option key={k} value={k} className="capitalize">{k}</option>
            ))}
          </select>
          <button onClick={loadConsumos} className="btn-gold text-sm py-2 px-4">Aplicar</button>
          {filterTipo && (
            <button onClick={() => { setFilterTipo(''); loadConsumos(); }} className="btn-ghost text-sm py-2 px-3">
              <X size={14} className="inline mr-1" />Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {consumos.length === 0 ? (
        <div className="card text-center py-16">
          <UtensilsCrossed size={48} className="mx-auto text-[var(--text-muted)] opacity-20 mb-4" />
          <p className="text-[var(--text-muted)]">No hay consumos registrados</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card overflow-hidden p-0 hidden md:block">
            <table className="luxury-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Reserva</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th className="text-right">Monto</th>
                  <th className="text-center">Cant.</th>
                  <th className="text-right">Subtotal</th>
                  <th>Fecha</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consumos.map(c => {
                  const cfg = TIPO_CONFIG[c.tipo] || TIPO_CONFIG.otros;
                  const Icon = cfg.icon;
                  return (
                    <tr key={c.id}>
                      <td className="font-mono text-gold-400/80 text-xs">#{c.id}</td>
                      <td className="font-medium text-[var(--text-primary)]">#{c.reservaId}</td>
                      <td>
                        <span className={`flex items-center gap-1.5 text-sm ${cfg.color}`}>
                          <Icon size={14} />
                          <span className="capitalize">{c.tipo}</span>
                        </span>
                      </td>
                      <td className="text-[var(--text-muted)]">{c.descripcion}</td>
                      <td className="text-right text-[var(--text-primary)]">${parseFloat(c.monto).toFixed(2)}</td>
                      <td className="text-center text-[var(--text-muted)]">{c.cantidad}</td>
                      <td className="text-right font-bold text-gold-400">${subtotal(c)}</td>
                      <td className="text-xs text-[var(--text-muted)]">
                        {new Date(c.fecha).toLocaleDateString('es')}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => setDeleteTarget(c.id)}
                          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {consumos.map(c => {
              const cfg = TIPO_CONFIG[c.tipo] || TIPO_CONFIG.otros;
              const Icon = cfg.icon;
              return (
                <div key={c.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <Icon size={18} className={cfg.color} />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)] capitalize">{c.tipo}</p>
                        <p className="text-xs text-[var(--text-muted)]">Reserva #{c.reservaId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gold-400">${subtotal(c)}</p>
                      <p className="text-xs text-[var(--text-muted)]">×{c.cantidad} · ${parseFloat(c.monto).toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-muted)]">{c.descripcion}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-[var(--text-muted)]">{new Date(c.fecha).toLocaleDateString('es')}</p>
                    <button
                      onClick={() => setDeleteTarget(c.id)}
                      className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Consumptions;
