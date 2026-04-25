// ============================================================
// Dashboard - Vista por rol
// Admin: KPIs vía /api/reports/dashboard
// Recepcionista: rooms + reservas
// PersonalLimpieza: pendientes + alertas
// ServicioTecnico: habitaciones en mantenimiento
// Huesped: sus reservas (placeholder)
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble, Calendar, Users, DollarSign, Sparkles, AlertTriangle,
  TrendingUp, Wrench, Receipt, ArrowRight,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { getErrorMessage } from '../utils/errorHelpers.js';

const Dashboard = () => {
  const { usuario, hasRole } = useAuth();
  const { toast } = useUI();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [alertas, setAlertas] = useState([]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [usuario?.rol]);

  const load = async () => {
    setLoading(true);
    try {
      if (hasRole('Administrador')) {
        const r = await api.get('/api/reports/dashboard');
        setAdminData(r.data);
      }
      if (hasRole('Administrador', 'Recepcionista')) {
        const [a, b] = await Promise.all([
          api.get('/api/rooms'),
          api.get('/api/reservations'),
        ]);
        setRooms(a.data); setReservas(b.data.slice(0, 6));
      }
      if (hasRole('PersonalLimpieza', 'Administrador')) {
        const [p, a] = await Promise.all([
          api.get('/api/cleaning/habitaciones/pendientes').catch(() => ({ data: { habitaciones: [] } })),
          api.get('/api/cleaning/insumos/alertas').catch(() => ({ data: [] })),
        ]);
        setPendientes(p.data.habitaciones || []);
        setAlertas(a.data || []);
      }
      if (hasRole('ServicioTecnico')) {
        const r = await api.get('/api/rooms', { params: { estado: 'mantenimiento' } });
        setRooms(r.data);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
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
      <div className="page-header">
        <h1 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Bienvenido, <span style={{ color: 'var(--gold)' }}>{usuario?.nombre}</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Rol: {usuario?.rol}</p>
      </div>

      {/* ADMIN ───────────────────────────────────────────── */}
      {hasRole('Administrador') && adminData && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard icon={Users}      label="Check-ins hoy"  value={adminData.ocupacion_hoy?.total_checkins_hoy ?? 0} />
            <KpiCard icon={DollarSign} label="Ingresos hoy"   value={`$${Number(adminData.ocupacion_hoy?.ingresos_hoy ?? 0).toLocaleString('es-CO')}`} />
            <KpiCard icon={Calendar}   label="Reservas hoy"   value={adminData.reservas_hoy ?? 0} />
            <KpiCard icon={TrendingUp} label="Check-outs hoy" value={adminData.checkouts_hoy ?? 0} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="card">
              <h3 className="font-serif text-lg mb-3">Estado de habitaciones</h3>
              {(adminData.habitaciones_por_estado || []).map(r => (
                <div key={r.estado} className="flex justify-between text-sm py-1">
                  <span className="badge badge-neutral">{r.estado}</span>
                  <span className="font-serif text-lg" style={{ color: 'var(--gold-light)' }}>{r.total}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 className="font-serif text-lg mb-3 flex items-center gap-2">
                <AlertTriangle size={16} style={{ color: '#f87171' }} /> Stock crítico
              </h3>
              {(adminData.stock_critico || []).length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin alertas.</p>
              ) : (
                (adminData.stock_critico || []).slice(0, 5).map(s => (
                  <div key={s.id_insumo} className="flex justify-between text-sm py-1">
                    <span>{s.nombre}</span>
                    <span style={{ color: '#f87171' }}>{s.stock_actual} / min {s.stock_minimo}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* RECEPCION ───────────────────────────────────────── */}
      {hasRole('Administrador', 'Recepcionista') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg">Habitaciones</h3>
              <Link to="/rooms" className="text-xs flex items-center gap-1" style={{ color: 'var(--gold)' }}>Ver <ArrowRight size={12} /></Link>
            </div>
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{rooms.length} en total</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {['disponible', 'ocupada', 'limpieza'].map(e => {
                const cnt = rooms.filter(r => r.estado === e).length;
                return (
                  <div key={e} className="text-center p-2 rounded-lg" style={{ background: 'rgba(201,160,71,0.06)' }}>
                    <p className="font-serif text-2xl" style={{ color: 'var(--gold-light)' }}>{cnt}</p>
                    <p style={{ color: 'var(--text-muted)' }}>{e}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg">Reservas recientes</h3>
              <Link to="/reservations" className="text-xs flex items-center gap-1" style={{ color: 'var(--gold)' }}>Ver <ArrowRight size={12} /></Link>
            </div>
            <div className="space-y-1.5 text-sm">
              {reservas.map(r => (
                <div key={r.id_reserva} className="flex justify-between">
                  <span className="font-mono text-xs" style={{ color: 'var(--gold)' }}>{r.codigo_confirmacion}</span>
                  <span className="badge badge-neutral text-xs">{r.estado}</span>
                </div>
              ))}
              {reservas.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Sin reservas.</p>}
            </div>
          </div>
        </div>
      )}

      {/* LIMPIEZA ────────────────────────────────────────── */}
      {hasRole('PersonalLimpieza') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg flex items-center gap-2"><Sparkles size={16} style={{ color: 'var(--gold)' }} /> Pendientes</h3>
              <Link to="/cleaning" className="text-xs flex items-center gap-1" style={{ color: 'var(--gold)' }}>Ver <ArrowRight size={12} /></Link>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{pendientes.length} habitación(es)</p>
            <div className="mt-3 space-y-1 text-sm">
              {pendientes.slice(0, 5).map(h => (
                <div key={h.id_habitacion} className="flex justify-between">
                  <span>Hab. {h.numero_habitacion}</span>
                  <span className="badge badge-warning text-xs">{h.estado}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-serif text-lg mb-3 flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: '#f87171' }} /> Alertas de stock
            </h3>
            {alertas.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin alertas.</p>
            ) : (
              alertas.slice(0, 5).map(s => (
                <div key={s.id_insumo} className="flex justify-between text-sm py-1">
                  <span>{s.nombre}</span>
                  <span style={{ color: '#f87171' }}>{s.stock_actual}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TECNICO ─────────────────────────────────────────── */}
      {hasRole('ServicioTecnico') && (
        <div className="card">
          <h3 className="font-serif text-lg mb-3 flex items-center gap-2">
            <Wrench size={16} style={{ color: 'var(--gold)' }} /> Habitaciones en mantenimiento
          </h3>
          {rooms.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ninguna pendiente.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {rooms.map(h => (
                <div key={h.id_habitacion} className="p-3 rounded-lg text-center" style={{ background: 'rgba(201,160,71,0.06)' }}>
                  <BedDouble size={14} className="mx-auto mb-1" style={{ color: 'var(--gold)' }} />
                  <p className="font-serif text-lg">{h.numero_habitacion}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Piso {h.piso}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUICK LINKS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <QuickLink to="/rooms"        icon={BedDouble} label="Habitaciones" />
        <QuickLink to="/reservations" icon={Calendar}  label="Reservas" />
        <QuickLink to="/consumptions" icon={Sparkles}  label="Consumos" />
        <QuickLink to="/billing"      icon={Receipt}   label="Facturación" />
      </div>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value }) => (
  <div className="card">
    <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--gold)' }}>
      <Icon size={13} />
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </div>
    <p className="font-serif text-3xl font-light" style={{ color: 'var(--text-primary)' }}>{value}</p>
  </div>
);

const QuickLink = ({ to, icon: Icon, label }) => (
  <Link to={to} className="card text-center hover:bg-yellow-500/5 transition-colors">
    <Icon size={20} className="mx-auto mb-2" style={{ color: 'var(--gold)' }} />
    <p className="text-sm">{label}</p>
  </Link>
);

export default Dashboard;
