// ============================================================
// Reservaciones - Schema Grand-Stay.sql (grandstay_db)
// Crea huésped si no existe (por num_documento + tipo_documento).
// Estados: pendiente | confirmada | cancelada | no_show | completada.
// Acciones: PATCH /:id/checkin, /:id/checkout, DELETE /:id.
// ============================================================

import { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, X, LogIn, LogOut, XCircle,
  User, Mail, BedDouble, Hash, Clipboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import api from '../services/api.js';
import { getErrorMessage } from '../utils/errorHelpers.js';
import useFormValidation from '../hooks/useFormValidation.js';

const ESTADOS = ['pendiente', 'confirmada', 'cancelada', 'no_show', 'completada'];

const ESTADO_BADGE = {
  pendiente:  'badge-warning',
  confirmada: 'badge-success',
  cancelada:  'badge-danger',
  no_show:    'badge-danger',
  completada: 'badge-neutral',
};

const TIPOS_DOC = ['CC', 'CE', 'Pasaporte', 'TI', 'Otro'];
const CANALES   = ['presencial', 'web', 'telefono', 'agencia', 'corporativo'];

const today = () => new Date().toISOString().slice(0, 10);

const reservationRules = {
  num_documento: v => !v?.trim() ? 'Documento obligatorio.' : '',
  nombres:       v => !v?.trim() ? 'Nombres obligatorio.' : '',
  apellidos:     v => !v?.trim() ? 'Apellidos obligatorio.' : '',
  email:         v => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email inválido.' : '',
  fecha_entrada: v => !v ? 'Fecha de entrada obligatoria.' : '',
  fecha_salida:  (v, vals) => {
    if (!v) return 'Fecha de salida obligatoria.';
    if (vals.fecha_entrada && v <= vals.fecha_entrada) return 'Salida debe ser posterior a entrada.';
    return '';
  },
  num_adultos:   v => !v || Number(v) < 1 ? 'Mínimo 1 adulto.' : '',
};

const INITIAL = {
  num_documento: '', tipo_documento: 'CC',
  nombres: '', apellidos: '', email: '', telefono: '',
  id_habitacion: '',
  fecha_entrada: today(), fecha_salida: '',
  num_adultos: '1', num_ninos: '0',
  canal_reserva: 'presencial', observaciones: '',
};

// ── Check-in modal ────────────────────────────────────────
const CheckInModal = ({ reserva, habitaciones, onClose, onConfirm }) => {
  const [data, setData] = useState({
    id_habitacion: reserva.id_habitacion || '',
    deposito_garantia: '0',
    metodo_deposito: 'efectivo',
    observaciones: '',
  });
  const submit = () => onConfirm({
    id_habitacion: data.id_habitacion ? parseInt(data.id_habitacion, 10) : undefined,
    deposito_garantia: Number(data.deposito_garantia) || 0,
    metodo_deposito: data.metodo_deposito,
    observaciones: data.observaciones || null,
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl">Check-in · {reserva.codigo_confirmacion}</h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Habitación</label>
            <select value={data.id_habitacion}
              onChange={e => setData(d => ({ ...d, id_habitacion: e.target.value }))}
              className="input-field">
              <option value="">— Seleccionar —</option>
              {habitaciones.filter(h => h.estado === 'disponible' || h.id_habitacion === reserva.id_habitacion).map(h => (
                <option key={h.id_habitacion} value={h.id_habitacion}>
                  Hab. {h.numero_habitacion} · {h.tipo_nombre} · ${h.tarifa_base ? Number(h.tarifa_base).toLocaleString('es-CO') : '—'}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Depósito (COP)</label>
              <input type="number" min="0" value={data.deposito_garantia}
                onChange={e => setData(d => ({ ...d, deposito_garantia: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Método</label>
              <select value={data.metodo_deposito}
                onChange={e => setData(d => ({ ...d, metodo_deposito: e.target.value }))}
                className="input-field">
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta_credito">Tarjeta crédito</option>
                <option value="tarjeta_debito">Tarjeta débito</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Observaciones</label>
            <textarea rows={2} value={data.observaciones}
              onChange={e => setData(d => ({ ...d, observaciones: e.target.value }))}
              className="input-field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={submit} className="btn-gold flex-1">Confirmar Check-in</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ── Check-out modal ───────────────────────────────────────
const CheckOutModal = ({ reserva, onClose, onConfirm }) => {
  const [data, setData] = useState({
    estado_habitacion: 'bueno',
    deposito_devuelto: '0',
    cargos_adicionales: '0',
    observaciones: '',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl">Check-out · {reserva.codigo_confirmacion}</h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Estado de la habitación</label>
            <select value={data.estado_habitacion}
              onChange={e => setData(d => ({ ...d, estado_habitacion: e.target.value }))}
              className="input-field">
              <option value="excelente">Excelente</option>
              <option value="bueno">Bueno</option>
              <option value="requiere_limpieza">Requiere limpieza</option>
              <option value="requiere_mantenimiento">Requiere mantenimiento</option>
              <option value="danios">Con daños</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Depósito devuelto</label>
              <input type="number" min="0" value={data.deposito_devuelto}
                onChange={e => setData(d => ({ ...d, deposito_devuelto: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Cargos adicionales</label>
              <input type="number" min="0" value={data.cargos_adicionales}
                onChange={e => setData(d => ({ ...d, cargos_adicionales: e.target.value }))}
                className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Observaciones</label>
            <textarea rows={2} value={data.observaciones}
              onChange={e => setData(d => ({ ...d, observaciones: e.target.value }))}
              className="input-field resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => onConfirm({
              estado_habitacion: data.estado_habitacion,
              deposito_devuelto: Number(data.deposito_devuelto) || 0,
              cargos_adicionales: Number(data.cargos_adicionales) || 0,
              observaciones: data.observaciones || null,
            })}
            className="btn-gold flex-1">Confirmar Check-out</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const Reservations = () => {
  const { hasRole } = useAuth();
  const { toast } = useUI();
  const [reservas, setReservas] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const [checkInTarget,  setCheckInTarget]  = useState(null);
  const [checkOutTarget, setCheckOutTarget] = useState(null);

  const form = useFormValidation(INITIAL, reservationRules);

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEstado) params.estado = filterEstado;
      const [rRes, rRooms] = await Promise.all([
        api.get('/api/reservations', { params }),
        api.get('/api/rooms').catch(() => ({ data: [] })),
      ]);
      setReservas(rRes.data);
      setHabitaciones(rRooms.data);
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
      const v = form.values;
      await api.post('/api/reservations', {
        huesped: {
          tipo_documento: v.tipo_documento,
          num_documento:  v.num_documento,
          nombres:        v.nombres,
          apellidos:      v.apellidos,
          email:          v.email || undefined,
          telefono:       v.telefono || undefined,
        },
        id_habitacion:   v.id_habitacion ? parseInt(v.id_habitacion, 10) : undefined,
        fecha_entrada:   v.fecha_entrada,
        fecha_salida:    v.fecha_salida,
        num_adultos:     parseInt(v.num_adultos, 10) || 1,
        num_ninos:       parseInt(v.num_ninos, 10) || 0,
        canal_reserva:   v.canal_reserva,
        observaciones:   v.observaciones || undefined,
      });
      toast.success('Reserva creada.');
      setShowForm(false); form.resetForm(INITIAL);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (payload) => {
    try {
      await api.patch(`/api/reservations/${checkInTarget.id_reserva}/checkin`, payload);
      toast.success('Check-in registrado.');
      setCheckInTarget(null); loadData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleCheckOut = async (payload) => {
    try {
      await api.patch(`/api/reservations/${checkOutTarget.id_reserva}/checkout`, payload);
      toast.success('Check-out registrado.');
      setCheckOutTarget(null); loadData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleCancel = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    try {
      await api.delete(`/api/reservations/${id}`);
      toast.success('Reserva cancelada.');
      loadData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => toast.success('Código copiado.'));
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
      {checkInTarget  && <CheckInModal  reserva={checkInTarget}  habitaciones={habitaciones} onClose={() => setCheckInTarget(null)}  onConfirm={handleCheckIn} />}
      {checkOutTarget && <CheckOutModal reserva={checkOutTarget} onClose={() => setCheckOutTarget(null)} onConfirm={handleCheckOut} />}

      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--gold)' }}>Reservaciones</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{reservas.length} reserva(s)</p>
        </div>
        {hasRole('Administrador', 'Recepcionista') && (
          <button onClick={() => { setShowForm(s => !s); if (showForm) form.resetForm(INITIAL); }}
            className={showForm ? 'btn-ghost' : 'btn-gold'}>
            {showForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Nueva Reserva</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-6 animate-slide-up">
          <h2 className="font-serif text-2xl mb-5">Nueva <span style={{ color: 'var(--gold)' }}>Reserva</span></h2>
          <form onSubmit={handleSubmit} noValidate>
            {/* Huésped */}
            <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--gold)' }}>
              <User size={11} className="inline mr-1" /> Huésped
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Tipo doc.</label>
                <select name="tipo_documento" value={form.values.tipo_documento} onChange={form.handleChange} className="input-field">
                  {TIPOS_DOC.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>N° documento *</label>
                <input name="num_documento" value={form.values.num_documento}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('num_documento')} />
                {form.errors.num_documento && form.touched.num_documento && <p className="error-msg">{form.errors.num_documento}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Teléfono</label>
                <input name="telefono" value={form.values.telefono} onChange={form.handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Nombres *</label>
                <input name="nombres" value={form.values.nombres}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('nombres')} />
                {form.errors.nombres && form.touched.nombres && <p className="error-msg">{form.errors.nombres}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Apellidos *</label>
                <input name="apellidos" value={form.values.apellidos}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('apellidos')} />
                {form.errors.apellidos && form.touched.apellidos && <p className="error-msg">{form.errors.apellidos}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>
                  <Mail size={10} className="inline mr-1" /> Email
                </label>
                <input name="email" type="email" value={form.values.email}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('email')} />
                {form.errors.email && form.touched.email && <p className="error-msg">{form.errors.email}</p>}
              </div>
            </div>

            {/* Estancia */}
            <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--gold)' }}>
              <CalendarDays size={11} className="inline mr-1" /> Estancia
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              <div className="lg:col-span-3">
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>
                  <BedDouble size={10} className="inline mr-1" /> Habitación (opcional, sino se asigna después)
                </label>
                <select name="id_habitacion" value={form.values.id_habitacion} onChange={form.handleChange} className="input-field">
                  <option value="">— Sin asignar —</option>
                  {habitaciones.filter(h => h.estado === 'disponible').map(h => (
                    <option key={h.id_habitacion} value={h.id_habitacion}>
                      Hab. {h.numero_habitacion} · {h.tipo_nombre} · ${h.tarifa_base ? Number(h.tarifa_base).toLocaleString('es-CO') : '—'}/noche
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Entrada *</label>
                <input name="fecha_entrada" type="date" value={form.values.fecha_entrada}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('fecha_entrada')} />
                {form.errors.fecha_entrada && form.touched.fecha_entrada && <p className="error-msg">{form.errors.fecha_entrada}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Salida *</label>
                <input name="fecha_salida" type="date" value={form.values.fecha_salida}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('fecha_salida')} />
                {form.errors.fecha_salida && form.touched.fecha_salida && <p className="error-msg">{form.errors.fecha_salida}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Canal</label>
                <select name="canal_reserva" value={form.values.canal_reserva} onChange={form.handleChange} className="input-field">
                  {CANALES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Adultos *</label>
                <input name="num_adultos" type="number" min="1" value={form.values.num_adultos}
                  onChange={form.handleChange} onBlur={form.handleBlur}
                  className={form.fieldClass('num_adultos')} />
                {form.errors.num_adultos && form.touched.num_adultos && <p className="error-msg">{form.errors.num_adultos}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Niños</label>
                <input name="num_ninos" type="number" min="0" value={form.values.num_ninos}
                  onChange={form.handleChange} className="input-field" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Observaciones</label>
                <textarea name="observaciones" rows={2} value={form.values.observaciones}
                  onChange={form.handleChange} className="input-field resize-none" />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-gold">
                {submitting ? '...' : 'Crear Reserva'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); form.resetForm(INITIAL); }}
                className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input-field w-auto text-sm">
            <option value="">Todos los estados</option>
            {ESTADOS.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={loadData} className="btn-gold text-sm py-2 px-4">Aplicar</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-x-auto p-0">
        <table className="luxury-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Huésped</th>
              <th>Hab.</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th className="text-center">A/N</th>
              <th>Estado</th>
              <th className="text-right">Total</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map(r => (
              <tr key={r.id_reserva}>
                <td>
                  <button onClick={() => copyCode(r.codigo_confirmacion)} className="font-mono text-xs flex items-center gap-1" style={{ color: 'var(--gold)' }}>
                    <Hash size={10} />{r.codigo_confirmacion}
                    <Clipboard size={10} className="opacity-50" />
                  </button>
                </td>
                <td className="text-sm">#{r.id_huesped}</td>
                <td className="text-sm">{r.id_habitacion ? `Hab. ${r.id_habitacion}` : '—'}</td>
                <td className="text-sm">{r.fecha_entrada?.slice(0, 10)}</td>
                <td className="text-sm">{r.fecha_salida?.slice(0, 10)}</td>
                <td className="text-center text-sm">{r.num_adultos}/{r.num_ninos}</td>
                <td><span className={`badge ${ESTADO_BADGE[r.estado] || 'badge-neutral'}`}>{r.estado}</span></td>
                <td className="text-right text-sm">{r.precio_total ? `$${Number(r.precio_total).toLocaleString('es-CO')}` : '—'}</td>
                <td>
                  <div className="flex justify-center gap-1">
                    {r.estado === 'pendiente' && hasRole('Administrador', 'Recepcionista') && (
                      <>
                        <button onClick={() => setCheckInTarget(r)} title="Check-in"
                          className="h-8 w-8 flex items-center justify-center rounded-lg"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                          <LogIn size={13} />
                        </button>
                        <button onClick={() => handleCancel(r.id_reserva)} title="Cancelar"
                          className="h-8 w-8 flex items-center justify-center rounded-lg"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                          <XCircle size={13} />
                        </button>
                      </>
                    )}
                    {r.estado === 'confirmada' && hasRole('Administrador', 'Recepcionista') && (
                      <button onClick={() => setCheckOutTarget(r)} title="Check-out"
                        className="h-8 w-8 flex items-center justify-center rounded-lg"
                        style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}>
                        <LogOut size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reservas.length === 0 && (
              <tr><td colSpan={9} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Sin reservas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reservations;
