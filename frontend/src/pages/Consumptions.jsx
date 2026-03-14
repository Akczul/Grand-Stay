// ============================================================
// Página de Consumos - Cargos adicionales por reserva
// Restaurante, spa, lavandería, minibar
// ============================================================

import { useState, useEffect } from 'react';
import api from '../services/api.js';

const Consumptions = () => {
  const [consumos, setConsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterTipo, setFilterTipo] = useState('');
  const [form, setForm] = useState({
    reservaId: '', tipo: 'restaurante', descripcion: '', monto: '', cantidad: '1',
  });
  const [error, setError] = useState('');

  useEffect(() => { loadConsumos(); }, []);

  const loadConsumos = async () => {
    try {
      const params = {};
      if (filterTipo) params.tipo = filterTipo;
      const res = await api.get('/api/consumptions', { params });
      setConsumos(res.data);
    } catch (err) {
      console.error('Error cargando consumos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/consumptions', {
        reservaId: parseInt(form.reservaId),
        tipo: form.tipo,
        descripcion: form.descripcion,
        monto: parseFloat(form.monto),
        cantidad: parseInt(form.cantidad),
      });
      setShowForm(false);
      setForm({ reservaId: '', tipo: 'restaurante', descripcion: '', monto: '', cantidad: '1' });
      loadConsumos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error registrando consumo');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este consumo?')) return;
    try {
      await api.delete(`/api/consumptions/${id}`);
      loadConsumos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error eliminando');
    }
  };

  const tipoColor = {
    restaurante: 'bg-orange-100 text-orange-700',
    spa: 'bg-purple-100 text-purple-700',
    lavanderia: 'bg-blue-100 text-blue-700',
    minibar: 'bg-green-100 text-green-700',
    otros: 'bg-gray-100 text-gray-700',
  };

  const tipoIcon = {
    restaurante: '🍽️', spa: '💆', lavanderia: '👔', minibar: '🍷', otros: '📦',
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Consumos</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Registrar Consumo'}
        </button>
      </div>

      {/* Filtro */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="input-field w-auto">
            <option value="">Todos los tipos</option>
            <option value="restaurante">Restaurante</option>
            <option value="spa">Spa</option>
            <option value="lavanderia">Lavandería</option>
            <option value="minibar">Minibar</option>
            <option value="otros">Otros</option>
          </select>
          <button onClick={loadConsumos} className="btn-secondary">Filtrar</button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Registrar Consumo</h2>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID de Reserva</label>
              <input type="number" value={form.reservaId} onChange={e => setForm({ ...form, reservaId: e.target.value })} className="input-field" required placeholder="Ej: 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="input-field">
                <option value="restaurante">Restaurante</option>
                <option value="spa">Spa</option>
                <option value="lavanderia">Lavandería</option>
                <option value="minibar">Minibar</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="input-field" required placeholder="Ej: Cena buffet" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
              <input type="number" step="0.01" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input type="number" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} className="input-field" min="1" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary">Registrar</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-3">ID</th>
                <th className="text-left py-3 px-3">Reserva</th>
                <th className="text-left py-3 px-3">Tipo</th>
                <th className="text-left py-3 px-3">Descripción</th>
                <th className="text-right py-3 px-3">Monto</th>
                <th className="text-center py-3 px-3">Cant.</th>
                <th className="text-right py-3 px-3">Subtotal</th>
                <th className="text-left py-3 px-3">Fecha</th>
                <th className="text-center py-3 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {consumos.map(c => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3">#{c.id}</td>
                  <td className="py-3 px-3 font-medium">Reserva #{c.reservaId}</td>
                  <td className="py-3 px-3">
                    <span className={`badge ${tipoColor[c.tipo]}`}>
                      {tipoIcon[c.tipo]} {c.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-3">{c.descripcion}</td>
                  <td className="py-3 px-3 text-right">${parseFloat(c.monto).toFixed(2)}</td>
                  <td className="py-3 px-3 text-center">{c.cantidad}</td>
                  <td className="py-3 px-3 text-right font-bold">
                    ${(parseFloat(c.monto) * (c.cantidad || 1)).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-xs">{new Date(c.fecha).toLocaleDateString()}</td>
                  <td className="py-3 px-3 text-center">
                    <button onClick={() => handleDelete(c.id)} className="text-xs btn-danger py-1 px-2">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {consumos.length === 0 && (
            <p className="text-center text-gray-400 py-8">No hay consumos registrados</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Consumptions;
