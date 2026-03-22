import { useState, useEffect } from 'react';
import {
  Sparkles, Plus, CheckCircle2, Package, AlertTriangle,
  X, Trash2, RefreshCw, ClipboardList,
} from 'lucide-react';
import api from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';
import { getErrorMessage } from '../utils/errorHelpers.js';
import useFormValidation from '../hooks/useFormValidation.js';

// ── Delete Modal ───────────────────────────────────────────
const DeleteModal = ({ item, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="card w-full max-w-sm animate-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <Trash2 size={20} className="text-red-400" />
        </div>
        <h2 className="font-semibold text-[var(--text-primary)]">Eliminar insumo</h2>
      </div>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        ¿Eliminar <strong className="text-[var(--text-primary)]">{item?.nombre}</strong>? Esta acción no se puede deshacer.
      </p>
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
        <button onClick={onConfirm} className="btn-danger flex-1">Eliminar</button>
      </div>
    </div>
  </div>
);

// ── Stock Modal ────────────────────────────────────────────
const StockModal = ({ insumo, onConfirm, onClose }) => {
  const [qty, setQty] = useState(String(insumo?.cantidad ?? ''));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Actualizar Stock</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-gold-400 font-medium mb-4">{insumo?.nombre}</p>
        <div className="mb-6">
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
            Nueva cantidad ({insumo?.unidad})
          </label>
          <input
            type="number"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="input-field"
            min="0"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={() => onConfirm(insumo.id, qty)} className="btn-gold flex-1">Guardar</button>
        </div>
      </div>
    </div>
  );
};

// ── Constants ──────────────────────────────────────────────
const PRIORIDAD_STYLE = {
  Urgente: { badge: 'badge badge-danger',   dot: 'bg-red-400' },
  Alta:    { badge: 'badge badge-warning',  dot: 'bg-orange-400' },
  Normal:  { badge: 'badge badge-info',     dot: 'bg-blue-400' },
  Baja:    { badge: 'badge badge-neutral',  dot: 'bg-slate-500' },
};

const TAREA_ESTADO_STYLE = {
  Completada: 'badge badge-success',
  EnProceso:  'badge badge-warning',
  Pendiente:  'badge badge-info',
};

const tareaRules = {
  habitacionId:     v => !v ? 'El ID de habitación es obligatorio' : isNaN(v) ? 'Debe ser un número' : '',
  habitacionNumero: v => !v?.trim() ? 'El número de habitación es obligatorio' : '',
  asignadoA:        v => !v?.trim() ? 'El nombre del personal es obligatorio' : '',
};

const insumoRules = {
  nombre:      v => !v?.trim() ? 'El nombre es obligatorio' : '',
  cantidad:    v => !v ? 'La cantidad es obligatoria' : isNaN(v) || Number(v) < 0 ? 'Cantidad inválida' : '',
  stockMinimo: v => !v ? 'El stock mínimo es obligatorio' : isNaN(v) || Number(v) < 0 ? 'Valor inválido' : '',
};

// ── Main Component ─────────────────────────────────────────
const Cleaning = () => {
  const { toast } = useUI();
  const [tab, setTab] = useState('tareas');
  const [tareas, setTareas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormTarea, setShowFormTarea] = useState(false);
  const [showFormInsumo, setShowFormInsumo] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [stockTarget, setStockTarget] = useState(null);
  const [extraTarea, setExtraTarea] = useState({ prioridad: 'Normal', notas: '' });
  const [extraInsumo, setExtraInsumo] = useState({ unidad: 'unidades', categoria: '' });

  const tareaForm = useFormValidation(
    { habitacionId: '', habitacionNumero: '', asignadoA: '' },
    tareaRules,
  );
  const insumoForm = useFormValidation(
    { nombre: '', cantidad: '', stockMinimo: '5' },
    insumoRules,
  );

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
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTarea = async (e) => {
    e.preventDefault();
    if (!tareaForm.validateAll()) return;
    try {
      await api.post('/api/cleaning/tareas', {
        habitacionId:     parseInt(tareaForm.values.habitacionId),
        habitacionNumero: tareaForm.values.habitacionNumero,
        asignadoA:        tareaForm.values.asignadoA,
        prioridad:        extraTarea.prioridad,
        notas:            extraTarea.notas,
      });
      toast.success('Tarea creada exitosamente');
      setShowFormTarea(false);
      tareaForm.resetForm();
      setExtraTarea({ prioridad: 'Normal', notas: '' });
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleCompleteTarea = async (id) => {
    try {
      await api.patch(`/api/cleaning/tareas/${id}/completar`);
      toast.success('Tarea completada');
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSubmitInsumo = async (e) => {
    e.preventDefault();
    if (!insumoForm.validateAll()) return;
    try {
      await api.post('/api/cleaning/insumos', {
        nombre:      insumoForm.values.nombre,
        cantidad:    parseInt(insumoForm.values.cantidad),
        unidad:      extraInsumo.unidad,
        stockMinimo: parseInt(insumoForm.values.stockMinimo),
        categoria:   extraInsumo.categoria,
      });
      toast.success('Insumo creado exitosamente');
      setShowFormInsumo(false);
      insumoForm.resetForm();
      setExtraInsumo({ unidad: 'unidades', categoria: '' });
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUpdateStock = async (id, qty) => {
    try {
      await api.put(`/api/cleaning/insumos/${id}`, { cantidad: parseInt(qty) });
      toast.success('Stock actualizado');
      setStockTarget(null);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteInsumo = async () => {
    try {
      await api.delete(`/api/cleaning/insumos/${deleteTarget.id}`);
      toast.success('Insumo eliminado');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const lowStock = insumos.filter(i => i.cantidad <= i.stockMinimo);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onConfirm={handleDeleteInsumo}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {stockTarget && (
        <StockModal
          insumo={stockTarget}
          onConfirm={handleUpdateStock}
          onClose={() => setStockTarget(null)}
        />
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)]">Limpieza</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Control de tareas e inventario de insumos</p>
        </div>
      </div>

      {/* Low stock alert */}
      {tab === 'insumos' && lowStock.length > 0 && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-fade-in">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-sm">
            <strong>{lowStock.length}</strong> insumo{lowStock.length > 1 ? 's' : ''} por debajo del stock mínimo:{' '}
            {lowStock.map(i => i.nombre).join(', ')}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] mb-6 w-fit">
        {[
          { key: 'tareas',  icon: ClipboardList, label: 'Tareas' },
          { key: 'insumos', icon: Package,        label: 'Insumos' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ========== TAREAS TAB ========== */}
      {tab === 'tareas' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowFormTarea(!showFormTarea); tareaForm.resetForm(); }}
              className={showFormTarea ? 'btn-ghost' : 'btn-gold'}
            >
              {showFormTarea
                ? <><X size={16} className="mr-2" />Cancelar</>
                : <><Plus size={16} className="mr-2" />Nueva Tarea</>
              }
            </button>
          </div>

          {showFormTarea && (
            <div className="card mb-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={18} className="text-gold-400" />
                <h2 className="font-semibold text-[var(--text-primary)]">Nueva Tarea de Limpieza</h2>
              </div>
              <form onSubmit={handleSubmitTarea} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">ID Habitación *</label>
                  <input
                    type="number"
                    name="habitacionId"
                    value={tareaForm.values.habitacionId}
                    onChange={tareaForm.handleChange}
                    onBlur={tareaForm.handleBlur}
                    className={tareaForm.fieldClass('habitacionId')}
                    placeholder="Ej: 1"
                  />
                  {tareaForm.errors.habitacionId && tareaForm.touched.habitacionId && (
                    <p className="error-msg">{tareaForm.errors.habitacionId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Número Habitación *</label>
                  <input
                    type="text"
                    name="habitacionNumero"
                    value={tareaForm.values.habitacionNumero}
                    onChange={tareaForm.handleChange}
                    onBlur={tareaForm.handleBlur}
                    className={tareaForm.fieldClass('habitacionNumero')}
                    placeholder="Ej: 101"
                  />
                  {tareaForm.errors.habitacionNumero && tareaForm.touched.habitacionNumero && (
                    <p className="error-msg">{tareaForm.errors.habitacionNumero}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Asignado a *</label>
                  <input
                    type="text"
                    name="asignadoA"
                    value={tareaForm.values.asignadoA}
                    onChange={tareaForm.handleChange}
                    onBlur={tareaForm.handleBlur}
                    className={tareaForm.fieldClass('asignadoA')}
                    placeholder="Nombre del personal"
                  />
                  {tareaForm.errors.asignadoA && tareaForm.touched.asignadoA && (
                    <p className="error-msg">{tareaForm.errors.asignadoA}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Prioridad</label>
                  <select
                    value={extraTarea.prioridad}
                    onChange={e => setExtraTarea(p => ({ ...p, prioridad: e.target.value }))}
                    className="input-field"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Notas</label>
                  <textarea
                    value={extraTarea.notas}
                    onChange={e => setExtraTarea(p => ({ ...p, notas: e.target.value }))}
                    className="input-field"
                    rows={2}
                    placeholder="Instrucciones adicionales..."
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button type="submit" className="btn-gold">
                    <Plus size={16} className="mr-2" />Crear Tarea
                  </button>
                </div>
              </form>
            </div>
          )}

          {tareas.length === 0 ? (
            <div className="card text-center py-16">
              <Sparkles size={48} className="mx-auto text-[var(--text-muted)] opacity-20 mb-4" />
              <p className="text-[var(--text-muted)]">No hay tareas de limpieza pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tareas.map(t => {
                const prioStyle = PRIORIDAD_STYLE[t.prioridad] || PRIORIDAD_STYLE.Normal;
                return (
                  <div key={t.id} className="card flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-in">
                    <div className={`w-1 min-h-[3rem] rounded-full self-stretch ${prioStyle.dot} hidden sm:block shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-[var(--text-primary)]">
                          Hab. {t.habitacionNumero || t.habitacionId}
                        </span>
                        <span className={prioStyle.badge}>{t.prioridad}</span>
                        <span className={TAREA_ESTADO_STYLE[t.estado] || 'badge badge-neutral'}>{t.estado}</span>
                      </div>
                      {t.asignadoA && (
                        <p className="text-sm text-[var(--text-muted)]">Asignado: {t.asignadoA}</p>
                      )}
                      {t.notas && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 italic">{t.notas}</p>
                      )}
                    </div>
                    {t.estado !== 'Completada' && (
                      <button
                        onClick={() => handleCompleteTarea(t.id)}
                        className="btn-success text-sm shrink-0 self-start sm:self-auto flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={15} />Completar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========== INSUMOS TAB ========== */}
      {tab === 'insumos' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setShowFormInsumo(!showFormInsumo); insumoForm.resetForm(); }}
              className={showFormInsumo ? 'btn-ghost' : 'btn-gold'}
            >
              {showFormInsumo
                ? <><X size={16} className="mr-2" />Cancelar</>
                : <><Plus size={16} className="mr-2" />Nuevo Insumo</>
              }
            </button>
          </div>

          {showFormInsumo && (
            <div className="card mb-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-6">
                <Package size={18} className="text-gold-400" />
                <h2 className="font-semibold text-[var(--text-primary)]">Nuevo Insumo</h2>
              </div>
              <form onSubmit={handleSubmitInsumo} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={insumoForm.values.nombre}
                    onChange={insumoForm.handleChange}
                    onBlur={insumoForm.handleBlur}
                    className={insumoForm.fieldClass('nombre')}
                    placeholder="Ej: Jabón desinfectante"
                  />
                  {insumoForm.errors.nombre && insumoForm.touched.nombre && (
                    <p className="error-msg">{insumoForm.errors.nombre}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Cantidad *</label>
                  <input
                    type="number"
                    name="cantidad"
                    value={insumoForm.values.cantidad}
                    onChange={insumoForm.handleChange}
                    onBlur={insumoForm.handleBlur}
                    className={insumoForm.fieldClass('cantidad')}
                    min="0"
                  />
                  {insumoForm.errors.cantidad && insumoForm.touched.cantidad && (
                    <p className="error-msg">{insumoForm.errors.cantidad}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Unidad</label>
                  <select
                    value={extraInsumo.unidad}
                    onChange={e => setExtraInsumo(p => ({ ...p, unidad: e.target.value }))}
                    className="input-field"
                  >
                    <option value="unidades">Unidades</option>
                    <option value="litros">Litros</option>
                    <option value="paquetes">Paquetes</option>
                    <option value="cajas">Cajas</option>
                    <option value="rollos">Rollos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Stock Mínimo *</label>
                  <input
                    type="number"
                    name="stockMinimo"
                    value={insumoForm.values.stockMinimo}
                    onChange={insumoForm.handleChange}
                    onBlur={insumoForm.handleBlur}
                    className={insumoForm.fieldClass('stockMinimo')}
                    min="0"
                  />
                  {insumoForm.errors.stockMinimo && insumoForm.touched.stockMinimo && (
                    <p className="error-msg">{insumoForm.errors.stockMinimo}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Categoría</label>
                  <input
                    type="text"
                    value={extraInsumo.categoria}
                    onChange={e => setExtraInsumo(p => ({ ...p, categoria: e.target.value }))}
                    className="input-field"
                    placeholder="Ej: limpieza, baño"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button type="submit" className="btn-gold">
                    <Plus size={16} className="mr-2" />Crear Insumo
                  </button>
                </div>
              </form>
            </div>
          )}

          {insumos.length === 0 ? (
            <div className="card text-center py-16">
              <Package size={48} className="mx-auto text-[var(--text-muted)] opacity-20 mb-4" />
              <p className="text-[var(--text-muted)]">No hay insumos registrados</p>
            </div>
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="luxury-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th className="hidden sm:table-cell">Categoría</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right hidden sm:table-cell">Stock Mín.</th>
                    <th>Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map(i => {
                    const isLow = i.cantidad <= i.stockMinimo;
                    return (
                      <tr key={i.id}>
                        <td>
                          <p className="font-medium text-[var(--text-primary)]">{i.nombre}</p>
                          <p className="text-xs text-[var(--text-muted)]">{i.unidad}</p>
                        </td>
                        <td className="hidden sm:table-cell text-[var(--text-muted)]">{i.categoria || '—'}</td>
                        <td className={`text-right font-bold ${isLow ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                          {i.cantidad}
                        </td>
                        <td className="text-right hidden sm:table-cell text-[var(--text-muted)]">{i.stockMinimo}</td>
                        <td>
                          {isLow
                            ? <span className="badge badge-danger">Stock bajo</span>
                            : <span className="badge badge-success">OK</span>
                          }
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setStockTarget(i)}
                              title="Actualizar stock"
                              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-gold-400 hover:bg-gold-500/10 transition-all"
                            >
                              <RefreshCw size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(i)}
                              title="Eliminar"
                              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Cleaning;

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
