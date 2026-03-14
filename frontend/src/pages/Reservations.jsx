// ============================================================
// Página de Reservaciones - Ciclo completo
// Crear reserva, check-in, check-out, cancelar
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

const Reservations = () => {
  const { user, hasRole } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const [form, setForm] = useState({
    habitacionId: '', fecha_inicio: '', fecha_fin: '',
    huespedNombre: '', huespedEmail: '', notas: '',
  });
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const params = {};
      if (filterEstado) params.estado = filterEstado;
      if (hasRole('Huesped')) params.huespedId = user.id;

      const [resReservas] = await Promise.all([
        api.get('/api/reservations', { params }),
      ]);
      setReservas(resReservas.data);

      // Cargar habitaciones disponibles para el formulario
      if (hasRole('Administrador', 'Recepcionista')) {
        try {
          const resRooms = await api.get('/api/rooms/available');
          setHabitaciones(resRooms.data);
        } catch {}
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/reservations', {
        habitacionId: parseInt(form.habitacionId),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        huespedNombre: form.huespedNombre || user.nombre,
        huespedEmail: form.huespedEmail,
        notas: form.notas,
      });
      setShowForm(false);
      setForm({ habitacionId: '', fecha_inicio: '', fecha_fin: '', huespedNombre: '', huespedEmail: '', notas: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error creando reserva');
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await api.patch(`/api/reservations/${id}/checkin`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error en check-in');
    }
  };

  const handleCheckOut = async (id) => {
    if (!confirm('¿Confirmar check-out? Se generará la factura automáticamente.')) return;
    try {
      const res = await api.patch(`/api/reservations/${id}/checkout`);
      alert(`Check-out exitoso. ${res.data.factura ? 'Factura generada.' : ''}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error en check-out');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return;
    try {
      await api.patch(`/api/reservations/${id}/cancelar`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error cancelando');
    }
  };

  const estadoBadge = {
    Pendiente: 'bg-yellow-100 text-yellow-700',
    Confirmada: 'bg-blue-100 text-blue-700',
    CheckIn: 'bg-green-100 text-green-700',
    CheckOut: 'bg-gray-100 text-gray-700',
    Cancelada: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reservaciones</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Nueva Reserva'}
        </button>
      </div>

      {/* Filtro */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input-field w-auto">
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Confirmada">Confirmada</option>
            <option value="CheckIn">Check-In</option>
            <option value="CheckOut">Check-Out</option>
            <option value="Cancelada">Cancelada</option>
          </select>
          <button onClick={loadData} className="btn-secondary">Filtrar</button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Nueva Reserva</h2>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Habitación</label>
              <select value={form.habitacionId} onChange={e => setForm({ ...form, habitacionId: e.target.value })} className="input-field" required>
                <option value="">Seleccionar habitación</option>
                {habitaciones.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.numero} - {h.tipo} (${parseFloat(h.tarifa_base).toFixed(2)}/noche)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Huésped</label>
              <input type="text" value={form.huespedNombre} onChange={e => setForm({ ...form, huespedNombre: e.target.value })} className="input-field" placeholder={user.nombre} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de llegada</label>
              <input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de salida</label>
              <input type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email del Huésped</label>
              <input type="email" value={form.huespedEmail} onChange={e => setForm({ ...form, huespedEmail: e.target.value })} className="input-field" placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input type="text" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="input-field" placeholder="Notas adicionales" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary">Crear Reserva</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de reservas */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-3">ID</th>
                <th className="text-left py-3 px-3">Huésped</th>
                <th className="text-left py-3 px-3">Hab.</th>
                <th className="text-left py-3 px-3">Llegada</th>
                <th className="text-left py-3 px-3">Salida</th>
                <th className="text-left py-3 px-3">Estado</th>
                <th className="text-right py-3 px-3">Total</th>
                <th className="text-left py-3 px-3">Código</th>
                <th className="text-center py-3 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium">#{r.id}</td>
                  <td className="py-3 px-3">{r.huespedNombre}</td>
                  <td className="py-3 px-3 font-bold">{r.habitacionNumero}</td>
                  <td className="py-3 px-3">{r.fecha_inicio}</td>
                  <td className="py-3 px-3">{r.fecha_fin}</td>
                  <td className="py-3 px-3">
                    <span className={`badge ${estadoBadge[r.estado]}`}>{r.estado}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold">${parseFloat(r.total).toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono text-xs">{r.codigoAcceso}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1 justify-center">
                      {r.estado === 'Confirmada' && hasRole('Recepcionista', 'Administrador') && (
                        <button onClick={() => handleCheckIn(r.id)} className="text-xs btn-success py-1 px-2">Check-In</button>
                      )}
                      {r.estado === 'CheckIn' && hasRole('Recepcionista', 'Administrador') && (
                        <button onClick={() => handleCheckOut(r.id)} className="text-xs bg-purple-500 hover:bg-purple-600 text-white py-1 px-2 rounded-lg">Check-Out</button>
                      )}
                      {(r.estado === 'Confirmada' || r.estado === 'Pendiente') && (
                        <button onClick={() => handleCancel(r.id)} className="text-xs btn-danger py-1 px-2">Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reservas.length === 0 && (
            <p className="text-center text-gray-400 py-8">No hay reservas</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reservations;
