// ============================================================
// Habitaciones - Schema Grand-Stay.sql (grandstay_db)
// Campos reales: id_habitacion, numero_habitacion, id_tipo,
// piso, estado (lowercase), tarifa vigente vía tabla `tarifas`.
// ============================================================

import { useState, useEffect } from 'react';
import {
  BedDouble, Plus, Pencil, Trash2, DollarSign, Filter, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import api from '../services/api.js';
import { getErrorMessage } from '../utils/errorHelpers.js';
import useFormValidation from '../hooks/useFormValidation.js';

// Tipos por defecto. El backend acepta el nombre en `tipo`.
const TIPOS = ['Sencilla', 'Doble', 'Suite Junior', 'Suite Ejecutiva', 'Suite Presidencial'];

const ESTADOS = ['disponible', 'ocupada', 'limpieza', 'mantenimiento', 'bloqueada'];

const ESTADO_BADGE = {
  disponible:    'badge-success',
  ocupada:       'badge-danger',
  limpieza:      'badge-warning',
  mantenimiento: 'badge-neutral',
  bloqueada:     'badge-neutral',
};

const roomRules = {
  numero_habitacion: v => !v?.toString().trim() ? 'Número obligatorio.' : '',
  piso: v => v === '' || v === null || v === undefined ? 'Piso obligatorio.'
            : isNaN(Number(v)) || Number(v) < 0 ? 'Piso inválido.' : '',
};

const INITIAL = { numero_habitacion: '', tipo: 'Sencilla', piso: '1', descripcion_adicional: '' };

const RateModal = ({ room, onClose, onSave }) => {
  const [precio, setPrecio] = useState(room.tarifa_base?.toString() || '');
  const [temporada, setTemporada] = useState(room.temporada || 'media');
  const [err, setErr] = useState('');
  const submit = () => {
    if (!precio || isNaN(Number(precio)) || Number(precio) <= 0) {
      setErr('Precio inválido.'); return;
    }
    onSave({ precio_noche: Number(precio), temporada });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>
            Tarifa · Hab. {room.numero_habitacion}
          </h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Precio / noche (COP)</label>
        <input type="number" min="1" step="0.01" value={precio}
          onChange={e => { setPrecio(e.target.value); setErr(''); }}
          className={`input-field ${err ? 'input-error' : ''}`} autoFocus />
        {err && <p className="error-msg">{err}</p>}
        <label className="block text-xs uppercase font-medium mb-1.5 mt-3" style={{ color: 'var(--gold)' }}>Temporada</label>
        <select value={temporada} onChange={e => setTemporada(e.target.value)} className="input-field">
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
        <div className="flex gap-3 mt-5">
          <button onClick={submit} className="btn-gold flex-1">Guardar</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ room, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="card w-full max-w-sm animate-slide-up text-center">
      <div className="h-12 w-12 rounded-full mx-auto mb-3 flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <Trash2 size={20} style={{ color: '#f87171' }} />
      </div>
      <h3 className="font-serif text-xl mb-2">Eliminar habitación</h3>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
        ¿Eliminar Hab. <strong style={{ color: 'var(--gold)' }}>{room.numero_habitacion}</strong>?
      </p>
      <div className="flex gap-3">
        <button onClick={onConfirm} className="btn-danger flex-1 justify-center">Eliminar</button>
        <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
      </div>
    </div>
  </div>
);

const Rooms = () => {
  const { hasRole } = useAuth();
  const { toast } = useUI();
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState({ tipo: '', estado: '' });
  const [rateModal, setRateModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const form = useFormValidation(INITIAL, roomRules);

  useEffect(() => { loadRooms(); /* eslint-disable-next-line */ }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.tipo)   params.tipo = filter.tipo;
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
        numero_habitacion: form.values.numero_habitacion,
        tipo:              form.values.tipo,
        piso:              parseInt(form.values.piso, 10),
        descripcion_adicional: form.values.descripcion_adicional || null,
      };
      if (editingId) {
        await api.put(`/api/rooms/${editingId}`, data);
        toast.success('Habitación actualizada.');
      } else {
        await api.post('/api/rooms', data);
        toast.success(`Habitación ${data.numero_habitacion} creada.`);
      }
      setShowForm(false); setEditingId(null); form.resetForm();
      loadRooms();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (h) => {
    form.resetForm({
      numero_habitacion: h.numero_habitacion,
      tipo: h.tipo_nombre || 'Sencilla',
      piso: (h.piso || 1).toString(),
      descripcion_adicional: h.descripcion_adicional || '',
    });
    setEditingId(h.id_habitacion);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeStatus = async (id, estado) => {
    try {
      await api.patch(`/api/rooms/${id}/estado`, { estado });
      toast.success(`Estado: ${estado}`);
      loadRooms();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleRateSave = async ({ precio_noche, temporada }) => {
    try {
      await api.patch(`/api/rooms/${rateModal.id_habitacion}/tarifa`, { precio_noche, temporada });
      toast.success(`Tarifa actualizada a $${precio_noche.toFixed(2)}.`);
      setRateModal(null); loadRooms();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/rooms/${deleteModal.id_habitacion}`);
      toast.success(`Habitación ${deleteModal.numero_habitacion} eliminada.`);
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
      {rateModal   && <RateModal   room={rateModal}   onClose={() => setRateModal(null)}   onSave={handleRateSave} />}
      {deleteModal && <DeleteModal room={deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} />}

      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--gold)' }}>Habitaciones</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {habitaciones.length} habitación(es)
          </p>
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

      {showForm && (
        <div className="card mb-6 animate-slide-up">
          <h2 className="font-serif text-2xl mb-5">
            {editingId ? 'Editar' : 'Nueva'} <span style={{ color: 'var(--gold)' }}>Habitación</span>
          </h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Número *</label>
                <input name="numero_habitacion" type="text" placeholder="101"
                  value={form.values.numero_habitacion}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('numero_habitacion')} />
                {form.errors.numero_habitacion && form.touched.numero_habitacion && (
                  <p className="error-msg">{form.errors.numero_habitacion}</p>
                )}
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Tipo</label>
                <select name="tipo" value={form.values.tipo} onChange={form.handleChange} className="input-field">
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Piso *</label>
                <input name="piso" type="number" min="0" placeholder="1"
                  value={form.values.piso}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('piso')} />
                {form.errors.piso && form.touched.piso && <p className="error-msg">{form.errors.piso}</p>}
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Descripción adicional</label>
                <textarea name="descripcion_adicional" rows={2}
                  placeholder="Vista al mar, decoración…"
                  value={form.values.descripcion_adicional}
                  onChange={form.handleChange}
                  className="input-field resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-gold">
                {submitting ? '...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); form.resetForm(); }}
                className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={14} style={{ color: 'var(--gold)' }} />
          <select value={filter.tipo} onChange={e => setFilter(f => ({ ...f, tipo: e.target.value }))} className="input-field w-auto text-sm">
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filter.estado} onChange={e => setFilter(f => ({ ...f, estado: e.target.value }))} className="input-field w-auto text-sm">
            <option value="">Todos los estados</option>
            {ESTADOS.map(s => <option key={s}>{s}</option>)}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {habitaciones.map(h => {
          const badge = ESTADO_BADGE[h.estado] || 'badge-neutral';
          return (
            <div key={h.id_habitacion} className="card flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(201,160,71,0.12)', border: '1px solid rgba(201,160,71,0.25)', color: 'var(--gold)' }}>
                    <BedDouble size={14} />
                  </div>
                  <div>
                    <p className="font-serif text-lg font-light">
                      Hab. <span style={{ color: 'var(--gold)' }}>{h.numero_habitacion}</span>
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {h.tipo_nombre || '—'} · Piso {h.piso}
                    </p>
                  </div>
                </div>
                <span className={`badge ${badge}`}>{h.estado}</span>
              </div>

              <div className="space-y-1.5 text-sm flex-1" style={{ color: 'var(--text-muted)' }}>
                {h.capacidad && (
                  <div>👥 {h.capacidad} persona(s)</div>
                )}
                <div className="flex items-center gap-1.5">
                  <DollarSign size={12} style={{ color: 'var(--gold)' }} />
                  <span className="font-serif text-base" style={{ color: 'var(--gold-light)' }}>
                    {h.tarifa_base ? `$${Number(h.tarifa_base).toLocaleString('es-CO')}` : 'Sin tarifa'}
                  </span>
                  {h.tarifa_base && <span style={{ fontSize: 11 }}>/noche</span>}
                  {h.temporada && <span className="badge badge-neutral text-[10px] ml-auto">{h.temporada}</span>}
                </div>
                {h.descripcion_adicional && (
                  <p className="text-xs italic" style={{ color: 'var(--text-subtle)' }}>{h.descripcion_adicional}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                {hasRole('Recepcionista', 'Administrador', 'PersonalLimpieza', 'ServicioTecnico') && (
                  <select value={h.estado}
                    onChange={e => handleChangeStatus(h.id_habitacion, e.target.value)}
                    className="input-field text-xs py-1.5 flex-1 min-w-0">
                    {ESTADOS.map(s => <option key={s}>{s}</option>)}
                  </select>
                )}
                {hasRole('Administrador') && (
                  <div className="flex gap-1">
                    <button onClick={() => setRateModal(h)} title="Tarifa"
                      className="h-8 w-8 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(201,160,71,0.1)', color: 'var(--gold)', border: '1px solid rgba(201,160,71,0.25)' }}>
                      <DollarSign size={13} />
                    </button>
                    <button onClick={() => handleEdit(h)} title="Editar"
                      className="h-8 w-8 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteModal(h)} title="Eliminar"
                      className="h-8 w-8 flex items-center justify-center rounded-lg"
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
          <p className="font-serif text-xl" style={{ color: 'var(--text-muted)' }}>Sin habitaciones</p>
        </div>
      )}
    </div>
  );
};

export default Rooms;
