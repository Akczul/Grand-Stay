// ============================================================
// Página de Limpieza - Tareas e insumos
// Gestión de tareas de limpieza y control de inventario
// ============================================================

import { useState, useEffect } from 'react';
import api from '../services/api.js';

const Cleaning = () => {
  const [tab, setTab] = useState('tareas');
  const [tareas, setTareas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormTarea, setShowFormTarea] = useState(false);
  const [showFormInsumo, setShowFormInsumo] = useState(false);
  const [formTarea, setFormTarea] = useState({
    habitacionId: '', habitacionNumero: '', asignadoA: '', prioridad: 'Normal', notas: '',
  });
  const [formInsumo, setFormInsumo] = useState({
    nombre: '', cantidad: '', unidad: 'unidades', stockMinimo: '5', categoria: '',
  });
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'tareas') {
        const res = await api.get('/api/cleaning/tareas');
        setTareas(res.data);
      } else {
        const res = await api.get('/api/cleaning/insumos');
        setInsumos(res.data);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTarea = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/cleaning/tareas', {
        habitacionId: parseInt(formTarea.habitacionId),
        habitacionNumero: formTarea.habitacionNumero,
        asignadoA: formTarea.asignadoA,
        prioridad: formTarea.prioridad,
        notas: formTarea.notas,
      });
      setShowFormTarea(false);
      setFormTarea({ habitacionId: '', habitacionNumero: '', asignadoA: '', prioridad: 'Normal', notas: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error creando tarea');
    }
  };

  const handleCompleteTarea = async (id) => {
    try {
      await api.patch(`/api/cleaning/tareas/${id}/completar`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error completando tarea');
    }
  };

  const handleSubmitInsumo = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/cleaning/insumos', {
        nombre: formInsumo.nombre,
        cantidad: parseInt(formInsumo.cantidad),
        unidad: formInsumo.unidad,
        stockMinimo: parseInt(formInsumo.stockMinimo),
        categoria: formInsumo.categoria,
      });
      setShowFormInsumo(false);
      setFormInsumo({ nombre: '', cantidad: '', unidad: 'unidades', stockMinimo: '5', categoria: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error creando insumo');
    }
  };

  const handleUpdateStock = async (id, currentQty) => {
    const nueva = prompt('Nueva cantidad:', currentQty);
    if (nueva === null) return;
    try {
      await api.put(`/api/cleaning/insumos/${id}`, { cantidad: parseInt(nueva) });
      loadData();
    } catch (err) {
      alert('Error actualizando stock');
    }
  };

  const handleDeleteInsumo = async (id) => {
    if (!confirm('¿Eliminar insumo?')) return;
    try {
      await api.delete(`/api/cleaning/insumos/${id}`);
      loadData();
    } catch (err) {
      alert('Error eliminando');
    }
  };

  const prioridadColor = {
    Baja: 'bg-gray-100 text-gray-600',
    Normal: 'bg-blue-100 text-blue-700',
    Alta: 'bg-orange-100 text-orange-700',
    Urgente: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Limpieza</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('tareas')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'tareas' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
          Tareas de Limpieza
        </button>
        <button onClick={() => setTab('insumos')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'insumos' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
          Insumos
        </button>
      </div>

      {/* ========== TAB TAREAS ========== */}
      {tab === 'tareas' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowFormTarea(!showFormTarea)} className="btn-primary">
              {showFormTarea ? 'Cancelar' : '+ Nueva Tarea'}
            </button>
          </div>

          {showFormTarea && (
            <div className="card mb-6">
              <h2 className="text-xl font-bold mb-4">Nueva Tarea de Limpieza</h2>
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
              <form onSubmit={handleSubmitTarea} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Habitación</label>
                  <input type="number" value={formTarea.habitacionId} onChange={e => setFormTarea({ ...formTarea, habitacionId: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número Habitación</label>
                  <input type="text" value={formTarea.habitacionNumero} onChange={e => setFormTarea({ ...formTarea, habitacionNumero: e.target.value })} className="input-field" placeholder="Ej: 101" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
                  <input type="text" value={formTarea.asignadoA} onChange={e => setFormTarea({ ...formTarea, asignadoA: e.target.value })} className="input-field" placeholder="Nombre del personal" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select value={formTarea.prioridad} onChange={e => setFormTarea({ ...formTarea, prioridad: e.target.value })} className="input-field">
                    <option value="Baja">Baja</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea value={formTarea.notas} onChange={e => setFormTarea({ ...formTarea, notas: e.target.value })} className="input-field" rows="2" />
                </div>
                <div><button type="submit" className="btn-primary">Crear Tarea</button></div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {tareas.map(t => (
              <div key={t.id} className="card flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-lg">Hab. {t.habitacionNumero || t.habitacionId}</span>
                    <span className={`badge ${prioridadColor[t.prioridad]}`}>{t.prioridad}</span>
                    <span className={`badge ${t.estado === 'Completada' ? 'bg-green-100 text-green-700' : t.estado === 'EnProceso' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                      {t.estado}
                    </span>
                  </div>
                  {t.asignadoA && <p className="text-sm text-gray-500">Asignado: {t.asignadoA}</p>}
                  {t.notas && <p className="text-sm text-gray-400">{t.notas}</p>}
                </div>
                {t.estado !== 'Completada' && (
                  <button onClick={() => handleCompleteTarea(t.id)} className="btn-success text-sm">
                    Completar
                  </button>
                )}
              </div>
            ))}
            {tareas.length === 0 && (
              <div className="card text-center py-8"><p className="text-gray-400">No hay tareas de limpieza</p></div>
            )}
          </div>
        </>
      )}

      {/* ========== TAB INSUMOS ========== */}
      {tab === 'insumos' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowFormInsumo(!showFormInsumo)} className="btn-primary">
              {showFormInsumo ? 'Cancelar' : '+ Nuevo Insumo'}
            </button>
          </div>

          {showFormInsumo && (
            <div className="card mb-6">
              <h2 className="text-xl font-bold mb-4">Nuevo Insumo</h2>
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
              <form onSubmit={handleSubmitInsumo} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input type="text" value={formInsumo.nombre} onChange={e => setFormInsumo({ ...formInsumo, nombre: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input type="number" value={formInsumo.cantidad} onChange={e => setFormInsumo({ ...formInsumo, cantidad: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <select value={formInsumo.unidad} onChange={e => setFormInsumo({ ...formInsumo, unidad: e.target.value })} className="input-field">
                    <option value="unidades">Unidades</option>
                    <option value="litros">Litros</option>
                    <option value="paquetes">Paquetes</option>
                    <option value="cajas">Cajas</option>
                    <option value="rollos">Rollos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                  <input type="number" value={formInsumo.stockMinimo} onChange={e => setFormInsumo({ ...formInsumo, stockMinimo: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input type="text" value={formInsumo.categoria} onChange={e => setFormInsumo({ ...formInsumo, categoria: e.target.value })} className="input-field" placeholder="Ej: limpieza, baño" />
                </div>
                <div className="flex items-end"><button type="submit" className="btn-primary">Crear Insumo</button></div>
              </form>
            </div>
          )}

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-3">Nombre</th>
                    <th className="text-center py-3 px-3">Cantidad</th>
                    <th className="text-left py-3 px-3">Unidad</th>
                    <th className="text-center py-3 px-3">Stock Mín.</th>
                    <th className="text-left py-3 px-3">Categoría</th>
                    <th className="text-left py-3 px-3">Estado</th>
                    <th className="text-center py-3 px-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map(i => (
                    <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium">{i.nombre}</td>
                      <td className="py-3 px-3 text-center font-bold text-lg">{i.cantidad}</td>
                      <td className="py-3 px-3">{i.unidad}</td>
                      <td className="py-3 px-3 text-center">{i.stockMinimo}</td>
                      <td className="py-3 px-3">{i.categoria || '-'}</td>
                      <td className="py-3 px-3">
                        {i.cantidad <= i.stockMinimo ? (
                          <span className="badge bg-red-100 text-red-700">Stock bajo</span>
                        ) : (
                          <span className="badge bg-green-100 text-green-700">OK</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => handleUpdateStock(i.id, i.cantidad)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Stock</button>
                          <button onClick={() => handleDeleteInsumo(i.id)} className="text-xs btn-danger py-1 px-2">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {insumos.length === 0 && (
                <p className="text-center text-gray-400 py-8">No hay insumos registrados</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cleaning;
