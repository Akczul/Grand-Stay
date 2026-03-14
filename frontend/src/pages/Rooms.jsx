// ============================================================
// Página de Habitaciones - CRUD completo
// Solo Administrador modifica tarifas
// Solo Recepcionista cambia estados
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

const Rooms = () => {
  const { hasRole } = useAuth();
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState({ tipo: '', estado: '' });
  const [form, setForm] = useState({
    numero: '', tipo: 'Sencilla', tarifa_base: '', capacidad: '',
    piso: '1', descripcion: '', servicios_incluidos: '',
  });
  const [error, setError] = useState('');

  useEffect(() => { loadRooms(); }, []);

  const loadRooms = async () => {
    try {
      const params = {};
      if (filter.tipo) params.tipo = filter.tipo;
      if (filter.estado) params.estado = filter.estado;
      const res = await api.get('/api/rooms', { params });
      setHabitaciones(res.data);
    } catch (err) {
      console.error('Error cargando habitaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = {
        ...form,
        tarifa_base: parseFloat(form.tarifa_base),
        capacidad: parseInt(form.capacidad),
        piso: parseInt(form.piso),
        servicios_incluidos: form.servicios_incluidos
          ? form.servicios_incluidos.split(',').map(s => s.trim())
          : [],
      };

      if (editingId) {
        await api.put(`/api/rooms/${editingId}`, data);
      } else {
        await api.post('/api/rooms', data);
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Error guardando habitación');
    }
  };

  const handleEdit = (hab) => {
    setForm({
      numero: hab.numero,
      tipo: hab.tipo,
      tarifa_base: hab.tarifa_base.toString(),
      capacidad: hab.capacidad.toString(),
      piso: hab.piso.toString(),
      descripcion: hab.descripcion || '',
      servicios_incluidos: Array.isArray(hab.servicios_incluidos)
        ? hab.servicios_incluidos.join(', ') : '',
    });
    setEditingId(hab.id);
    setShowForm(true);
  };

  const handleChangeStatus = async (id, estado) => {
    try {
      await api.patch(`/api/rooms/${id}/estado`, { estado });
      loadRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'Error cambiando estado');
    }
  };

  const handleChangeRate = async (id) => {
    const nuevaTarifa = prompt('Ingrese la nueva tarifa base:');
    if (!nuevaTarifa) return;
    try {
      await api.patch(`/api/rooms/${id}/tarifa`, { tarifa_base: parseFloat(nuevaTarifa) });
      loadRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'Error actualizando tarifa');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar esta habitación?')) return;
    try {
      await api.delete(`/api/rooms/${id}`);
      loadRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'Error eliminando');
    }
  };

  const resetForm = () => {
    setForm({ numero: '', tipo: 'Sencilla', tarifa_base: '', capacidad: '', piso: '1', descripcion: '', servicios_incluidos: '' });
  };

  const estadoColor = {
    Disponible: 'bg-green-100 text-green-700',
    Ocupada: 'bg-red-100 text-red-700',
    Sucia: 'bg-yellow-100 text-yellow-700',
    Mantenimiento: 'bg-gray-100 text-gray-700',
  };

  const tipoIcon = { Sencilla: '🛏️', Doble: '🛏️🛏️', Suite: '⭐', Presidencial: '👑' };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Habitaciones</h1>
        {hasRole('Administrador') && (
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm(); }} className="btn-primary">
            {showForm ? 'Cancelar' : '+ Nueva Habitación'}
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <select value={filter.tipo} onChange={e => setFilter({ ...filter, tipo: e.target.value })} className="input-field w-auto">
            <option value="">Todos los tipos</option>
            <option value="Sencilla">Sencilla</option>
            <option value="Doble">Doble</option>
            <option value="Suite">Suite</option>
            <option value="Presidencial">Presidencial</option>
          </select>
          <select value={filter.estado} onChange={e => setFilter({ ...filter, estado: e.target.value })} className="input-field w-auto">
            <option value="">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Ocupada">Ocupada</option>
            <option value="Sucia">Sucia</option>
            <option value="Mantenimiento">Mantenimiento</option>
          </select>
          <button onClick={loadRooms} className="btn-secondary">Filtrar</button>
        </div>
      </div>

      {/* Formulario crear/editar */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Habitación' : 'Nueva Habitación'}</h2>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <input type="text" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="input-field">
                <option value="Sencilla">Sencilla</option>
                <option value="Doble">Doble</option>
                <option value="Suite">Suite</option>
                <option value="Presidencial">Presidencial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa Base ($)</label>
              <input type="number" step="0.01" value={form.tarifa_base} onChange={e => setForm({ ...form, tarifa_base: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
              <input type="number" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Piso</label>
              <input type="number" value={form.piso} onChange={e => setForm({ ...form, piso: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servicios (separados por coma)</label>
              <input type="text" value={form.servicios_incluidos} onChange={e => setForm({ ...form, servicios_incluidos: e.target.value })} className="input-field" placeholder="WiFi, TV, Minibar" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="input-field" rows="2" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary">{editingId ? 'Actualizar' : 'Crear Habitación'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de habitaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habitaciones.map(h => (
          <div key={h.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-2xl mr-2">{tipoIcon[h.tipo]}</span>
                <span className="text-xl font-bold">Hab. {h.numero}</span>
              </div>
              <span className={`badge ${estadoColor[h.estado]}`}>{h.estado}</span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Tipo:</strong> {h.tipo}</p>
              <p><strong>Capacidad:</strong> {h.capacidad} personas</p>
              <p><strong>Piso:</strong> {h.piso}</p>
              <p><strong>Tarifa:</strong> <span className="text-lg font-bold text-primary-500">${parseFloat(h.tarifa_base).toFixed(2)}</span>/noche</p>
              {h.servicios_incluidos?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {h.servicios_incluidos.map((s, i) => (
                    <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{s}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Acciones según rol */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100">
              {hasRole('Recepcionista', 'Administrador') && (
                <select
                  value={h.estado}
                  onChange={(e) => handleChangeStatus(h.id, e.target.value)}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Ocupada">Ocupada</option>
                  <option value="Sucia">Sucia</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                </select>
              )}
              {hasRole('Administrador') && (
                <>
                  <button onClick={() => handleChangeRate(h.id)} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200">Cambiar Tarifa</button>
                  <button onClick={() => handleEdit(h)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Editar</button>
                  <button onClick={() => handleDelete(h.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Eliminar</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {habitaciones.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">No hay habitaciones registradas</p>
        </div>
      )}
    </div>
  );
};

export default Rooms;
