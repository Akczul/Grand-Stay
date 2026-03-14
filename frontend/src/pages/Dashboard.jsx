// ============================================================
// Dashboard - Vista principal diferenciada por rol
// Recepcionista: ve reservas activas y habitaciones
// Administrador: ve reportes y estadísticas generales
// Limpieza: ve tareas pendientes
// Huésped: ve sus reservas
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Cargar datos según el rol
      if (hasRole('Administrador')) {
        try {
          const res = await api.get('/api/reports/dashboard');
          setStats(res.data);
        } catch { console.warn('No se pudieron cargar reportes'); }
      }

      if (hasRole('Administrador', 'Recepcionista')) {
        try {
          const [resRooms, resReservas] = await Promise.all([
            api.get('/api/rooms'),
            api.get('/api/reservations'),
          ]);
          setHabitaciones(resRooms.data);
          setReservas(resReservas.data);
        } catch { console.warn('No se pudieron cargar datos'); }
      }

      if (hasRole('Huesped')) {
        try {
          const res = await api.get(`/api/reservations?huespedId=${user.id}`);
          setReservas(res.data);
        } catch { console.warn('No se pudieron cargar reservas'); }
      }

      if (hasRole('Limpieza')) {
        try {
          const res = await api.get('/api/cleaning/tareas?estado=Pendiente');
          setReservas(res.data); // reutilizamos el state
        } catch { console.warn('No se pudieron cargar tareas'); }
      }
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const estadoColor = {
    Disponible: 'bg-green-100 text-green-700',
    Ocupada: 'bg-red-100 text-red-700',
    Sucia: 'bg-yellow-100 text-yellow-700',
    Mantenimiento: 'bg-gray-100 text-gray-700',
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Dashboard - {user?.rol}
      </h1>

      {/* ========== DASHBOARD ADMINISTRADOR ========== */}
      {hasRole('Administrador') && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Total Habitaciones</p>
            <p className="text-3xl font-bold text-blue-800">{stats.habitaciones?.total || 0}</p>
          </div>
          <div className="card bg-green-50 border-green-200">
            <p className="text-sm text-green-600 font-medium">Disponibles</p>
            <p className="text-3xl font-bold text-green-800">{stats.habitaciones?.disponibles || 0}</p>
          </div>
          <div className="card bg-orange-50 border-orange-200">
            <p className="text-sm text-orange-600 font-medium">Reservas Activas</p>
            <p className="text-3xl font-bold text-orange-800">{stats.reservas?.activas || 0}</p>
          </div>
          <div className="card bg-purple-50 border-purple-200">
            <p className="text-sm text-purple-600 font-medium">Ingresos del Mes</p>
            <p className="text-3xl font-bold text-purple-800">
              ${stats.facturacion?.ingresosMesActual?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      )}

      {/* ========== DASHBOARD RECEPCIONISTA ========== */}
      {hasRole('Administrador', 'Recepcionista') && (
        <>
          {/* Estado de habitaciones */}
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Estado de Habitaciones</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {habitaciones.map(h => (
                <div key={h.id} className={`p-3 rounded-lg text-center ${estadoColor[h.estado] || 'bg-gray-100'}`}>
                  <p className="font-bold text-lg">{h.numero}</p>
                  <p className="text-xs">{h.tipo}</p>
                  <p className="text-xs font-medium mt-1">{h.estado}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reservas recientes */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Reservas Recientes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-3">ID</th>
                    <th className="text-left py-2 px-3">Huésped</th>
                    <th className="text-left py-2 px-3">Habitación</th>
                    <th className="text-left py-2 px-3">Llegada</th>
                    <th className="text-left py-2 px-3">Salida</th>
                    <th className="text-left py-2 px-3">Estado</th>
                    <th className="text-right py-2 px-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.slice(0, 10).map(r => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">#{r.id}</td>
                      <td className="py-2 px-3">{r.huespedNombre}</td>
                      <td className="py-2 px-3">{r.habitacionNumero}</td>
                      <td className="py-2 px-3">{r.fecha_inicio}</td>
                      <td className="py-2 px-3">{r.fecha_fin}</td>
                      <td className="py-2 px-3">
                        <span className="badge bg-blue-100 text-blue-700">{r.estado}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-medium">${parseFloat(r.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reservas.length === 0 && (
                <p className="text-center text-gray-400 py-8">No hay reservas registradas</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========== DASHBOARD HUÉSPED ========== */}
      {hasRole('Huesped') && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Mis Reservas</h2>
          {reservas.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No tienes reservas activas</p>
          ) : (
            <div className="space-y-4">
              {reservas.map(r => (
                <div key={r.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">Habitación {r.habitacionNumero}</p>
                      <p className="text-gray-500">{r.fecha_inicio} → {r.fecha_fin}</p>
                      {r.codigoAcceso && (
                        <p className="mt-2 text-sm">
                          Código de acceso: <span className="font-mono font-bold text-primary-500">{r.codigoAcceso}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="badge bg-blue-100 text-blue-700">{r.estado}</span>
                      <p className="mt-2 font-bold text-lg">${parseFloat(r.total).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== DASHBOARD LIMPIEZA ========== */}
      {hasRole('Limpieza') && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Tareas de Limpieza Pendientes</h2>
          {reservas.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hay tareas pendientes</p>
          ) : (
            <div className="space-y-3">
              {reservas.map(t => (
                <div key={t.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                  <div>
                    <p className="font-bold">Habitación {t.habitacionNumero}</p>
                    <p className="text-sm text-gray-500">Prioridad: {t.prioridad}</p>
                    {t.notas && <p className="text-sm text-gray-400 mt-1">{t.notas}</p>}
                  </div>
                  <span className={`badge ${
                    t.prioridad === 'Urgente' ? 'bg-red-100 text-red-700' :
                    t.prioridad === 'Alta' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {t.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
