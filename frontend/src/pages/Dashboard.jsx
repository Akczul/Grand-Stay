// ============================================================
// Dashboard - Vista principal diferenciada por rol (RNF-F01)
// Diseño de lujo 5 estrellas con KPIs, tablas y estado de habitaciones
// ============================================================

import { useState, useEffect } from 'react';
import {
  LayoutDashboard, BedDouble, CalendarDays, DollarSign,
  TrendingUp, Sparkles, Clock, CheckCircle2, XCircle,
  RefreshCw, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import api from '../services/api.js';
import { getErrorMessage } from '../utils/errorHelpers.js';

// ── KPI card ──────────────────────────────────────────────
const KpiCard = ({ label, value, sub, Icon, color }) => (
  <div className="stat-card animate-fade-in">
    <div className="flex items-start justify-between mb-4">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-serif font-light" style={{ color: 'var(--text-primary)' }}>{value}</p>
    <p className="text-xs font-medium mt-1 uppercase tracking-wider" style={{ color: 'var(--gold)' }}>{label}</p>
    {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>{sub}</p>}
  </div>
);

// ── Room status chip ──────────────────────────────────────
const ROOM_STYLE = {
  Disponible:      { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80',  border: 'rgba(34,197,94,0.3)' },
  Ocupada:         { bg: 'rgba(239,68,68,0.12)',  color: '#f87171',  border: 'rgba(239,68,68,0.3)' },
  Reservada:       { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa',  border: 'rgba(59,130,246,0.3)' },
  Sucia:           { bg: 'rgba(234,179,8,0.12)',  color: '#fbbf24',  border: 'rgba(234,179,8,0.3)' },
  'En Mantenimiento': { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.25)' },
  Mantenimiento:   { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8',  border: 'rgba(148,163,184,0.25)' },
};

const RESERVA_BADGE = {
  Pendiente:  'badge-warning',
  Confirmada: 'badge-info',
  Activa:     'badge-info',
  CheckIn:    'badge-success',
  CheckOut:   'badge-neutral',
  Cancelada:  'badge-danger',
};

// ── Main component ────────────────────────────────────────
const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useUI();
  const [stats, setStats]           = useState(null);
  const [reservas, setReservas]     = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      if (hasRole('Administrador')) {
        const res = await api.get('/api/reports/dashboard').catch(() => ({ data: null }));
        setStats(res.data);
      }
      if (hasRole('Administrador', 'Recepcionista')) {
        const [rRooms, rRes] = await Promise.all([
          api.get('/api/rooms'),
          api.get('/api/reservations'),
        ]);
        setHabitaciones(rRooms.data);
        setReservas(rRes.data);
      }
      if (hasRole('Huesped')) {
        const res = await api.get(`/api/reservations?huespedId=${user.id}`);
        setReservas(res.data);
      }
      if (hasRole('Limpieza')) {
        const res = await api.get('/api/cleaning/tareas?estado=Pendiente');
        setReservas(res.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
            <span style={{ color: 'var(--gold)' }}>Bienvenido,</span> {user?.nombre}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            <LayoutDashboard size={12} className="inline mr-1" />
            Panel de control · {user?.rol}
          </p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2 self-start sm:self-auto">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* ════════════ ADMINISTRADOR ════════════ */}
      {hasRole('Administrador') && stats && (
        <section className="mb-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard label="Total Habitaciones" value={stats.habitaciones?.total ?? 0}
              Icon={BedDouble} color="#c9a047" sub="en el sistema" />
            <KpiCard label="Disponibles" value={stats.habitaciones?.disponibles ?? 0}
              Icon={CheckCircle2} color="#4ade80" sub="listas para reservar" />
            <KpiCard label="Reservas Activas" value={stats.reservas?.activas ?? 0}
              Icon={CalendarDays} color="#60a5fa" sub="en curso" />
            <KpiCard label="Ingresos del Mes" value={`$${(stats.facturacion?.ingresosMesActual ?? 0).toFixed(0)}`}
              Icon={DollarSign} color="#a78bfa" sub="facturación actual" />
          </div>
        </section>
      )}

      {/* ════════════ RECEPCIONISTA / ADMIN ════════════ */}
      {hasRole('Administrador', 'Recepcionista') && (
        <>
          {/* Room status grid */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl font-light" style={{ color: 'var(--text-primary)' }}>
                Estado de <span style={{ color: 'var(--gold)' }}>Habitaciones</span>
              </h2>
              <Link to="/rooms" className="flex items-center gap-1 text-xs" style={{ color: 'var(--gold)' }}>
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
              {habitaciones.map(h => {
                const s = ROOM_STYLE[h.estado] || ROOM_STYLE['Mantenimiento'];
                return (
                  <div
                    key={h.id}
                    className="rounded-lg p-2.5 text-center transition-all duration-200 cursor-default"
                    style={{ background: s.bg, border: `1px solid ${s.border}` }}
                    title={`${h.tipo} · ${h.estado}`}
                  >
                    <p className="font-bold text-sm" style={{ color: s.color }}>{h.numero}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontSize: 10 }}>{h.tipo.slice(0,3)}</p>
                  </div>
                );
              })}
              {habitaciones.length === 0 && (
                <p className="col-span-full text-center py-4 text-sm" style={{ color: 'var(--text-subtle)' }}>
                  Sin habitaciones registradas
                </p>
              )}
            </div>
          </section>

          {/* Recent reservations */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl font-light" style={{ color: 'var(--text-primary)' }}>
                Reservas <span style={{ color: 'var(--gold)' }}>Recientes</span>
              </h2>
              <Link to="/reservations" className="flex items-center gap-1 text-xs" style={{ color: 'var(--gold)' }}>
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            <div className="card-flat overflow-x-auto">
              <table className="luxury-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Huésped</th>
                    <th className="hidden sm:table-cell">Habitación</th>
                    <th className="hidden md:table-cell">Llegada</th>
                    <th className="hidden md:table-cell">Salida</th>
                    <th>Estado</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.slice(0, 8).map(r => (
                    <tr key={r.id}>
                      <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>#{r.id}</td>
                      <td className="font-medium">{r.huespedNombre}</td>
                      <td className="hidden sm:table-cell font-bold" style={{ color: 'var(--gold)' }}>{r.habitacionNumero}</td>
                      <td className="hidden md:table-cell text-sm" style={{ color: 'var(--text-muted)' }}>{r.fecha_inicio}</td>
                      <td className="hidden md:table-cell text-sm" style={{ color: 'var(--text-muted)' }}>{r.fecha_fin}</td>
                      <td><span className={`badge ${RESERVA_BADGE[r.estado] || 'badge-neutral'}`}>{r.estado}</span></td>
                      <td className="text-right font-medium" style={{ color: 'var(--gold-light)' }}>
                        ${parseFloat(r.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reservas.length === 0 && (
                <p className="text-center py-10 text-sm" style={{ color: 'var(--text-subtle)' }}>Sin reservas registradas</p>
              )}
            </div>
          </section>
        </>
      )}

      {/* ════════════ HUÉSPED ════════════ */}
      {hasRole('Huesped') && (
        <section>
          <h2 className="font-serif text-2xl font-light mb-5" style={{ color: 'var(--text-primary)' }}>
            Mis <span style={{ color: 'var(--gold)' }}>Reservas</span>
          </h2>
          {reservas.length === 0 ? (
            <div className="card text-center py-14">
              <CalendarDays size={36} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
              <p className="font-serif text-xl font-light mb-1" style={{ color: 'var(--text-muted)' }}>Sin reservas activas</p>
              <p className="text-sm mb-5" style={{ color: 'var(--text-subtle)' }}>Reserve una habitación para disfrutar de nuestra experiencia.</p>
              <Link to="/reservations" className="btn-gold inline-flex">Hacer una reserva</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reservas.map(r => {
                const s = ROOM_STYLE[r.habitacion?.estado || 'Reservada'] || ROOM_STYLE.Reservada;
                return (
                  <div key={r.id} className="card hover:border-gold-500/40 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-serif text-xl font-light" style={{ color: 'var(--text-primary)' }}>
                          Habitación <span style={{ color: 'var(--gold)' }}>{r.habitacionNumero}</span>
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {r.fecha_inicio} → {r.fecha_fin}
                        </p>
                      </div>
                      <span className={`badge ${RESERVA_BADGE[r.estado] || 'badge-neutral'}`}>{r.estado}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {r.codigoAcceso
                        ? <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--gold-light)' }}>
                            🔑 {r.codigoAcceso}
                          </span>
                        : <span />}
                      <p className="text-lg font-serif font-light" style={{ color: 'var(--gold)' }}>
                        ${parseFloat(r.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ════════════ LIMPIEZA ════════════ */}
      {hasRole('Limpieza') && (
        <section>
          <h2 className="font-serif text-2xl font-light mb-5" style={{ color: 'var(--text-primary)' }}>
            Tareas <span style={{ color: 'var(--gold)' }}>Pendientes</span>
          </h2>
          {reservas.length === 0 ? (
            <div className="card text-center py-14">
              <Sparkles size={36} className="mx-auto mb-3" style={{ color: 'var(--text-subtle)' }} />
              <p className="font-serif text-xl font-light" style={{ color: 'var(--text-muted)' }}>
                Sin tareas pendientes 🎉
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reservas.map(t => {
                const prioColor = { Urgente: '#f87171', Alta: '#fb923c', Normal: '#60a5fa', Baja: '#94a3b8' };
                return (
                  <div key={t.id} className="card hover:border-gold-500/40">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-serif text-lg font-light" style={{ color: 'var(--text-primary)' }}>
                          Hab. <span style={{ color: 'var(--gold)' }}>{t.habitacionNumero}</span>
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {t.asignadoA && `Asignado a: ${t.asignadoA}`}
                        </p>
                      </div>
                      <span
                        className="badge text-xs"
                        style={{
                          background: `${prioColor[t.prioridad]}20`,
                          color: prioColor[t.prioridad],
                          border: `1px solid ${prioColor[t.prioridad]}40`,
                        }}
                      >
                        {t.prioridad}
                      </span>
                    </div>
                    {t.notas && <p className="text-xs mt-2" style={{ color: 'var(--text-subtle)' }}>{t.notas}</p>}
                    <Link to="/cleaning" className="flex items-center gap-1 text-xs mt-3" style={{ color: 'var(--gold)' }}>
                      Ir a tareas <ArrowRight size={11} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
