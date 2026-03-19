// ============================================================
// Habitaciones - CRUD completo, lujo 5 estrellas (RNF-F01, F03, F05)
// ============================================================

import { useState, useEffect } from 'react';
import { BedDouble, Plus, Pencil, Trash2, DollarSign, Filter, X, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import api from '../services/api.js';
import { getErrorMessage } from '../utils/errorHelpers.js';
import useFormValidation from '../hooks/useFormValidation.js';

// ── Validation rules ──────────────────────────────────────
const roomRules = {
  numero:      v => !v?.trim()        ? 'El número de habitación es obligatorio.' : '',
  tarifa_base: v => !v                 ? 'La tarifa es obligatoria.'
                  : isNaN(Number(v)) || Number(v) <= 0 ? 'Ingrese una tarifa válida mayor a 0.' : '',
  capacidad:   v => !v                 ? 'La capacidad es obligatoria.'
                  : isNaN(Number(v)) || Number(v) < 1  ? 'La capacidad debe ser al menos 1.' : '',
};

// ── Status styles ─────────────────────────────────────────
const ESTADO_STYLE = {
  Disponible:          { badge: 'badge-success', dot: '#4ade80' },
  Ocupada:             { badge: 'badge-danger',  dot: '#f87171' },
  Reservada:           { badge: 'badge-info',    dot: '#60a5fa' },
  Sucia:               { badge: 'badge-warning', dot: '#fbbf24' },
  'En Mantenimiento':  { badge: 'badge-neutral', dot: '#94a3b8' },
  Mantenimiento:       { badge: 'badge-neutral', dot: '#94a3b8' },
};

const TIPO_ICON = {
  Sencilla:     <BedDouble size={14} />,
  Doble:        <BedDouble size={14} />,
  Suite:        <span style={{ fontSize: 13 }}>✦</span>,
  Presidencial: <span style={{ fontSize: 13 }}>♛</span>,
};

const INITIAL = { numero: '', tipo: 'Sencilla', tarifa_base: '', capacidad: '', piso: '1', descripcion: '', servicios_incluidos: '' };

// ── Rate change modal (replaces prompt()) ─────────────────
const RateModal = ({ room, onClose, onSave }) => {
  const [val, setVal] = useState(room.tarifa_base?.toString() || '');
  const [err, setErr] = useState('');
  const handleSave = () => {
    if (!val || isNaN(Number(val)) || Number(val) <= 0) { setErr('Ingrese una tarifa válida.'); return; }
    onSave(val);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="card w-full max-w-xs animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-light" style={{ color: 'var(--text-primary)' }}>
            Cambiar Tarifa · <span style={{ color: 'var(--gold)' }}>Hab.{room.numero}</span>
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Nueva tarifa / noche ($)</label>
        <input
          type="number" step="0.01" min="1"
          value={val} onChange={e => { setVal(e.target.value); setErr(''); }}
          className={`input-field ${err ? 'input-error' : ''}`}
          autoFocus
        />
        {err && <p className="error-msg">{err}</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={handleSave} className="btn-gold flex-1">Guardar</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ── Delete confirm modal ──────────────────────────────────
const DeleteModal = ({ room, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
    <div className="card w-full max-w-sm animate-slide-up text-center">
      <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <Trash2 size={20} style={{ color: '#f87171' }} />
      </div>
      <h3 className="font-serif text-xl font-light mb-2" style={{ color: 'var(--text-primary)' }}>Eliminar habitación</h3>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
        ¿Seguro que deseas eliminar la habitación <strong style={{ color: 'var(--gold)' }}>#{room.numero}</strong>? Esta acción no se puede deshacer.
      </p>
      <div className="flex gap-3">
        <button onClick={onConfirm} className="btn-danger flex-1 justify-center">Eliminar</button>
        <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────
const Rooms = () => {
  const { hasRole } = useAuth();
  const { toast } = useUI();
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter]     = useState({ tipo: '', estado: '' });
  const [rateModal, setRateModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const form = useFormValidation(INITIAL, roomRules);

  useEffect(() => { loadRooms(); }, []);

  const loadRooms = async () => {
    try {
      const params = {};
      if (filter.tipo)   params.tipo   = filter.tipo;
      if (filter.estado) params.estado = filter.estado;
      const res = await api.get('/api/rooms', { params });
      setHabitaciones(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.validateAll()) return;
    setSubmitting(true);
    try {
      const data = {
        ...form.values,
        tarifa_base: parseFloat(form.values.tarifa_base),
        capacidad:   parseInt(form.values.capacidad),
        piso:        parseInt(form.values.piso) || 1,
        servicios_incluidos: form.values.servicios_incluidos
          ? form.values.servicios_incluidos.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };
      if (editingId) {
        await api.put(`/api/rooms/${editingId}`, data);
        toast.success(`Habitación #${data.numero} actualizada.`);
      } else {
        await api.post('/api/rooms', data);
        toast.success(`Habitación #${data.numero} creada exitosamente.`);
      }
      setShowForm(false); setEditingId(null); form.resetForm();
      loadRooms();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (hab) => {
    form.resetForm({
      numero:    hab.numero,
      tipo:      hab.tipo,
      tarifa_base: hab.tarifa_base?.toString() || '',
      capacidad: hab.capacidad?.toString() || '',
      piso:      (hab.piso || 1).toString(),
      descripcion: hab.descripcion || '',
      servicios_incluidos: Array.isArray(hab.servicios_incluidos) ? hab.servicios_incluidos.join(', ') : '',
    });
    setEditingId(hab.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeStatus = async (id, estado) => {
    try {
      await api.patch(`/api/rooms/${id}/estado`, { estado });
      toast.success('Estado actualizado.');
      loadRooms();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleRateSave = async (newRate) => {
    try {
      await api.patch(`/api/rooms/${rateModal.id}/tarifa`, { tarifa_base: parseFloat(newRate) });
      toast.success(`Tarifa actualizada a $${parseFloat(newRate).toFixed(2)}.`);
      setRateModal(null); loadRooms();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/rooms/${deleteModal.id}`);
      toast.success(`Habitación #${deleteModal.numero} eliminada.`);
      setDeleteModal(null); loadRooms();
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
      {/* Modals */}
      {rateModal  && <RateModal   room={rateModal}   onClose={() => setRateModal(null)}   onSave={handleRateSave} />}
      {deleteModal && <DeleteModal room={deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} />}

      {/* ── Page header ── */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--gold)' }}>Habitaciones</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{habitaciones.length} habitación(es) registrada(s)</p>
        </div>
        {hasRole('Administrador') && (
          <button
            onClick={() => { setShowForm(s => !s); if (showForm) { setEditingId(null); form.resetForm(); } }}
            className={showForm ? 'btn-ghost' : 'btn-gold'}
          >
            {showForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Nueva Habitación</>}
          </button>
        )}
      </div>

      {/* ── Create / Edit form ── */}
      {showForm && (
        <div className="card mb-6 animate-slide-up">
          <h2 className="font-serif text-2xl font-light mb-5" style={{ color: 'var(--text-primary)' }}>
            {editingId ? 'Editar' : 'Nueva'} <span style={{ color: 'var(--gold)' }}>Habitación</span>
          </h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Número */}
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Número *</label>
                <input name="numero" type="text" placeholder="101" value={form.values.numero}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('numero')} />
                {form.errors.numero && form.touched.numero && <p className="error-msg">{form.errors.numero}</p>}
              </div>
              {/* Tipo */}
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Tipo</label>
                <select name="tipo" value={form.values.tipo} onChange={form.handleChange} className="input-field">
                  {['Sencilla','Doble','Suite','Presidencial'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {/* Tarifa */}
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Tarifa / noche ($) *</label>
                <input name="tarifa_base" type="number" step="0.01" min="1" placeholder="150.00"
                  value={form.values.tarifa_base} onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('tarifa_base')} />
                {form.errors.tarifa_base && form.touched.tarifa_base && <p className="error-msg">{form.errors.tarifa_base}</p>}
              </div>
              {/* Capacidad */}
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Capacidad (personas) *</label>
                <input name="capacidad" type="number" min="1" placeholder="2"
                  value={form.values.capacidad} onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('capacidad')} />
                {form.errors.capacidad && form.touched.capacidad && <p className="error-msg">{form.errors.capacidad}</p>}
              </div>
              {/* Piso */}
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Piso</label>
                <input name="piso" type="number" min="1" placeholder="1"
                  value={form.values.piso} onChange={form.handleChange} className="input-field" />
              </div>
              {/* Servicios */}
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Servicios (coma separados)</label>
                <input name="servicios_incluidos" type="text" placeholder="WiFi, TV, Minibar"
                  value={form.values.servicios_incluidos} onChange={form.handleChange} className="input-field" />
              </div>
              {/* Descripción */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Descripción</label>
                <textarea name="descripcion" rows={2} placeholder="Vista al mar, decoración contemporánea…"
                  value={form.values.descripcion} onChange={form.handleChange} className="input-field resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-gold">
                {submitting
                  ? <div className="h-4 w-4 rounded-full animate-spin" style={{ border: '2px solid #0a0a14', borderTopColor: 'transparent' }} />
                  : editingId ? 'Actualizar Habitación' : 'Crear Habitación'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); form.resetForm(); }}
                className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          <select value={filter.tipo} onChange={e => setFilter(f => ({ ...f, tipo: e.target.value }))} className="input-field w-auto text-sm">
            <option value="">Todos los tipos</option>
            {['Sencilla','Doble','Suite','Presidencial'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filter.estado} onChange={e => setFilter(f => ({ ...f, estado: e.target.value }))} className="input-field w-auto text-sm">
            <option value="">Todos los estados</option>
            {['Disponible','Reservada','Ocupada','Sucia','En Mantenimiento'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={loadRooms} className="btn-gold text-sm py-2 px-4">Aplicar</button>
          {(filter.tipo || filter.estado) && (
            <button onClick={() => { setFilter({ tipo: '', estado: '' }); setTimeout(loadRooms, 50); }}
              className="btn-ghost text-sm py-2 px-3">
              <X size={13} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Room cards grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {habitaciones.map(h => {
          const es = ESTADO_STYLE[h.estado] || ESTADO_STYLE['Mantenimiento'];
          return (
            <div key={h.id} className="card hover:border-gold-500/40 transition-all duration-200 flex flex-col">
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(201,160,71,0.12)', border: '1px solid rgba(201,160,71,0.25)', color: 'var(--gold)' }}>
                    {TIPO_ICON[h.tipo]}
                  </div>
                  <div>
                    <p className="font-serif text-lg font-light" style={{ color: 'var(--text-primary)' }}>
                      Hab. <span style={{ color: 'var(--gold)' }}>{h.numero}</span>
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{h.tipo} · Piso {h.piso}</p>
                  </div>
                </div>
                <span className={`badge ${es.badge}`}>{h.estado}</span>
              </div>

              {/* Card body */}
              <div className="space-y-1.5 text-sm flex-1" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>👥</span>
                  <span>{h.capacidad} persona(s)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign size={12} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <span className="font-serif text-base font-light" style={{ color: 'var(--gold-light)' }}>
                    ${parseFloat(h.tarifa_base).toFixed(2)}
                  </span>
                  <span style={{ fontSize: 11 }}>/noche</span>
                </div>
                {h.servicios_incluidos?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {h.servicios_incluidos.map((s, i) => (
                      <span key={i} className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        <Tag size={9} />{s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card actions */}
              <div className="flex flex-wrap gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                {hasRole('Recepcionista', 'Administrador') && (
                  <select value={h.estado}
                    onChange={e => handleChangeStatus(h.id, e.target.value)}
                    className="input-field text-xs py-1.5 flex-1 min-w-0">
                    {['Disponible','Reservada','Ocupada','Sucia','En Mantenimiento'].map(s => <option key={s}>{s}</option>)}
                  </select>
                )}
                {hasRole('Administrador') && (
                  <div className="flex gap-1">
                    <button onClick={() => setRateModal(h)} title="Cambiar tarifa"
                      className="h-8 w-8 flex items-center justify-center rounded-lg transition-all"
                      style={{ background: 'rgba(201,160,71,0.1)', color: 'var(--gold)', border: '1px solid rgba(201,160,71,0.25)' }}>
                      <DollarSign size={13} />
                    </button>
                    <button onClick={() => handleEdit(h)} title="Editar"
                      className="h-8 w-8 flex items-center justify-center rounded-lg transition-all"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteModal(h)} title="Eliminar"
                      className="h-8 w-8 flex items-center justify-center rounded-lg transition-all"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {habitaciones.length === 0 && (
        <div className="card text-center py-16">
          <BedDouble size={40} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
          <p className="font-serif text-xl font-light" style={{ color: 'var(--text-muted)' }}>No hay habitaciones registradas</p>
          {hasRole('Administrador') && (
            <button onClick={() => setShowForm(true)} className="btn-gold mt-4">
              <Plus size={14} /> Agregar primera habitación
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Rooms;
