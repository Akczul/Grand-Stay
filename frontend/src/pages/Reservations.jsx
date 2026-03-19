// ============================================================
// Reservaciones - Ciclo completo con validaciones (RNF-F01, F03, F05)
// ============================================================

import { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, X, CheckCircle2, LogOut, XCircle, Filter,
  User, Mail, BedDouble, CalendarCheck, StickyNote
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import api from '../services/api.js';
import { getErrorMessage } from '../utils/errorHelpers.js';
import useFormValidation from '../hooks/useFormValidation.js';

// ── Validation rules ──────────────────────────────────────
const reservationRules = {
  habitacionId:  v => !v                       ? 'Seleccione una habitación.' : '',
  huespedNombre: v => !v?.trim()               ? 'El nombre del huésped es obligatorio.' : '',
  huespedEmail:  v => !v                        ? 'El email del huésped es obligatorio.'
                    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Ingrese un email válido.' : '',
  fecha_inicio:  v => !v                        ? 'La fecha de llegada es obligatoria.' : '',
  fecha_fin: (v, vals) => {
    if (!v) return 'La fecha de salida es obligatoria.';
    if (vals.fecha_inicio && v <= vals.fecha_inicio)
      return 'La fecha de salida debe ser posterior a la llegada.';
    return '';
  },
};

const INICIAL = { habitacionId: '', huespedNombre: '', huespedEmail: '', fecha_inicio: '', fecha_fin: '', notas: '' };

// ── Status styles ─────────────────────────────────────────
const ESTADO_BADGE = {
  Pendiente:  'badge-warning',
  Confirmada: 'badge-info',
  Activa:     'badge-info',
  CheckIn:    'badge-success',
  CheckOut:   'badge-neutral',
  Cancelada:  'badge-danger',
};

const today = () => new Date().toISOString().split('T')[0];

// ── Main component ────────────────────────────────────────
const Reservations = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useUI();
  const [reservas, setReservas]         = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [filterEstado, setFilterEstado] = useState('');

  const form = useFormValidation(INICIAL, reservationRules);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEstado) params.estado = filterEstado;
      if (hasRole('Huesped')) params.huespedId = user.id;

      const [rRes] = await Promise.all([api.get('/api/reservations', { params })]);
      setReservas(rRes.data);

      if (hasRole('Administrador', 'Recepcionista')) {
        const rRooms = await api.get('/api/rooms/available').catch(() => ({ data: [] }));
        setHabitaciones(rRooms.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Inject user data for Huesped role
    if (hasRole('Huesped')) {
      form.setValues(v => ({ ...v, huespedNombre: v.huespedNombre || user.nombre, huespedEmail: v.huespedEmail || user.email }));
    }
    if (!form.validateAll()) return;
    setSubmitting(true);
    try {
      await api.post('/api/reservations', {
        habitacionId:  parseInt(form.values.habitacionId),
        fecha_inicio:  form.values.fecha_inicio,
        fecha_fin:     form.values.fecha_fin,
        huespedId:     user.id,
        huespedNombre: form.values.huespedNombre || user.nombre,
        huespedEmail:  form.values.huespedEmail,
        notas:         form.values.notas,
      });
      toast.success('Reserva creada exitosamente.');
      setShowForm(false);
      form.resetForm();
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await api.patch(`/api/reservations/${id}/checkin`);
      toast.success('Check-in realizado. Habitación ahora Ocupada.');
      loadData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleCheckOut = async (id) => {
    try {
      const res = await api.patch(`/api/reservations/${id}/checkout`);
      toast.success(`Check-out exitoso.${res.data?.factura ? ' Factura generada.' : ''}`);
      loadData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleCancel = async (id) => {
    try {
      await api.patch(`/api/reservations/${id}/cancelar`);
      toast.success('Reserva cancelada.');
      loadData();
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
      {/* ── Page header ── */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--gold)' }}>Reservaciones</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{reservas.length} reserva(s) encontrada(s)</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); if (showForm) form.resetForm(); }}
          className={showForm ? 'btn-ghost' : 'btn-gold'}
        >
          {showForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Nueva Reserva</>}
        </button>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div className="card mb-6 animate-slide-up">
          <h2 className="font-serif text-2xl font-light mb-5" style={{ color: 'var(--text-primary)' }}>
            Nueva <span style={{ color: 'var(--gold)' }}>Reserva</span>
          </h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Habitación */}
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>
                  <BedDouble size={11} className="inline mr-1" />Habitación *
                </label>
                <select name="habitacionId" value={form.values.habitacionId}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('habitacionId')}>
                  <option value="">Seleccionar habitación disponible…</option>
                  {habitaciones.map(h => (
                    <option key={h.id} value={h.id}>
                      Hab. {h.numero} — {h.tipo} · ${parseFloat(h.tarifa_base).toFixed(2)}/noche
                    </option>
                  ))}
                </select>
                {form.errors.habitacionId && form.touched.habitacionId && <p className="error-msg">{form.errors.habitacionId}</p>}
              </div>

              {/* Nombre huésped */}
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>
                  <User size={11} className="inline mr-1" />Nombre del Huésped *
                </label>
                <input name="huespedNombre" type="text" placeholder={user.nombre}
                  value={form.values.huespedNombre} onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('huespedNombre')} />
                {form.errors.huespedNombre && form.touched.huespedNombre && <p className="error-msg">{form.errors.huespedNombre}</p>}
              </div>

              {/* Email huésped */}
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>
                  <Mail size={11} className="inline mr-1" />Email del Huésped *
                </label>
                <input name="huespedEmail" type="email" placeholder="correo@ejemplo.com"
                  value={form.values.huespedEmail} onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('huespedEmail')} />
                {form.errors.huespedEmail && form.touched.huespedEmail && <p className="error-msg">{form.errors.huespedEmail}</p>}
              </div>

              {/* Fecha inicio */}
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>
                  <CalendarCheck size={11} className="inline mr-1" />Fecha de Llegada *
                </label>
                <input name="fecha_inicio" type="date" min={today()}
                  value={form.values.fecha_inicio} onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('fecha_inicio')} />
                {form.errors.fecha_inicio && form.touched.fecha_inicio && <p className="error-msg">{form.errors.fecha_inicio}</p>}
              </div>

              {/* Fecha fin */}
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>
                  <CalendarCheck size={11} className="inline mr-1" />Fecha de Salida *
                </label>
                <input name="fecha_fin" type="date" min={form.values.fecha_inicio || today()}
                  value={form.values.fecha_fin} onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('fecha_fin')} />
                {form.errors.fecha_fin && form.touched.fecha_fin && <p className="error-msg">{form.errors.fecha_fin}</p>}
              </div>

              {/* Notas */}
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>
                  <StickyNote size={11} className="inline mr-1" />Notas adicionales
                </label>
                <input name="notas" type="text" placeholder="Solicitudes especiales, hora de llegada…"
                  value={form.values.notas} onChange={form.handleChange} className="input-field" />
              </div>
            </div>

            {/* Nights preview */}
            {form.values.fecha_inicio && form.values.fecha_fin && form.values.fecha_fin > form.values.fecha_inicio && (() => {
              const noches = Math.ceil((new Date(form.values.fecha_fin) - new Date(form.values.fecha_inicio)) / 86400000);
              const hab = habitaciones.find(h => h.id === parseInt(form.values.habitacionId));
              return (
                <div className="mb-4 p-3 rounded-lg flex items-center gap-3"
                  style={{ background: 'rgba(201,160,71,0.08)', border: '1px solid rgba(201,160,71,0.2)' }}>
                  <CalendarDays size={14} style={{ color: 'var(--gold)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--gold-light)' }}>{noches} noche(s)</strong>
                    {hab && <span style={{ color: 'var(--text-muted)' }}> · Total estimado: <strong style={{ color: 'var(--gold-light)' }}>
                      ${(noches * parseFloat(hab.tarifa_base)).toFixed(2)}
                    </strong></span>}
                  </span>
                </div>
              );
            })()}

            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-gold">
                {submitting
                  ? <div className="h-4 w-4 rounded-full animate-spin" style={{ border: '2px solid #0a0a14', borderTopColor: 'transparent' }} />
                  : 'Crear Reserva'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); form.resetForm(); }} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter ── */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={14} style={{ color: 'var(--gold)' }} />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input-field w-auto text-sm">
            <option value="">Todos los estados</option>
            {['Pendiente','Confirmada','CheckIn','CheckOut','Cancelada'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={loadData} className="btn-gold text-sm py-2 px-4">Filtrar</button>
          {filterEstado && (
            <button onClick={() => { setFilterEstado(''); setTimeout(loadData, 50); }} className="btn-ghost text-sm py-2 px-3">
              <X size={13} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Table (desktop) / Cards (mobile) ── */}

      {/* Desktop table */}
      <div className="card-flat hidden md:block overflow-x-auto">
        <table className="luxury-table">
          <thead>
            <tr>
              <th>#</th><th>Huésped</th><th>Habitación</th>
              <th>Llegada</th><th>Salida</th><th>Estado</th>
              <th className="text-right">Total</th><th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>#{r.id}</td>
                <td>
                  <p className="font-medium">{r.huespedNombre}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.huespedEmail}</p>
                </td>
                <td className="font-bold" style={{ color: 'var(--gold)' }}>{r.habitacionNumero}</td>
                <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{r.fecha_inicio}</td>
                <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{r.fecha_fin}</td>
                <td><span className={`badge ${ESTADO_BADGE[r.estado] || 'badge-neutral'}`}>{r.estado}</span></td>
                <td className="text-right font-serif font-light text-base" style={{ color: 'var(--gold-light)' }}>
                  ${parseFloat(r.total).toFixed(2)}
                </td>
                <td>
                  <div className="flex gap-1.5 justify-center flex-wrap">
                    {(r.estado === 'Confirmada' || r.estado === 'Pendiente') && hasRole('Recepcionista','Administrador') && (
                      <button onClick={() => handleCheckIn(r.id)} className="btn-success text-xs py-1 px-2.5">
                        <CheckCircle2 size={11} /> Check-In
                      </button>
                    )}
                    {r.estado === 'CheckIn' && hasRole('Recepcionista','Administrador') && (
                      <button onClick={() => handleCheckOut(r.id)} className="btn-ghost text-xs py-1 px-2.5">
                        <LogOut size={11} /> Check-Out
                      </button>
                    )}
                    {(r.estado === 'Confirmada' || r.estado === 'Pendiente') && (
                      <button onClick={() => handleCancel(r.id)} className="btn-danger text-xs py-1 px-2.5">
                        <XCircle size={11} /> Cancelar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reservas.length === 0 && (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--text-subtle)' }}>No hay reservas</p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {reservas.map(r => (
          <div key={r.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-serif text-lg font-light" style={{ color: 'var(--text-primary)' }}>
                  Hab. <span style={{ color: 'var(--gold)' }}>{r.habitacionNumero}</span>
                </p>
                <p className="text-sm font-medium">{r.huespedNombre}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {r.fecha_inicio} → {r.fecha_fin}
                </p>
              </div>
              <div className="text-right">
                <span className={`badge ${ESTADO_BADGE[r.estado] || 'badge-neutral'} block mb-1`}>{r.estado}</span>
                <p className="font-serif font-light" style={{ color: 'var(--gold)' }}>${parseFloat(r.total).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {(r.estado === 'Confirmada' || r.estado === 'Pendiente') && hasRole('Recepcionista','Administrador') && (
                <button onClick={() => handleCheckIn(r.id)} className="btn-success text-xs py-1.5 px-3 flex-1 justify-center">
                  <CheckCircle2 size={11} /> Check-In
                </button>
              )}
              {r.estado === 'CheckIn' && hasRole('Recepcionista','Administrador') && (
                <button onClick={() => handleCheckOut(r.id)} className="btn-ghost text-xs py-1.5 px-3 flex-1 justify-center">
                  <LogOut size={11} /> Check-Out
                </button>
              )}
              {(r.estado === 'Confirmada' || r.estado === 'Pendiente') && (
                <button onClick={() => handleCancel(r.id)} className="btn-danger text-xs py-1.5 px-3 flex-1 justify-center">
                  <XCircle size={11} /> Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
        {reservas.length === 0 && (
          <div className="card text-center py-12">
            <CalendarDays size={36} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>No hay reservas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservations;
