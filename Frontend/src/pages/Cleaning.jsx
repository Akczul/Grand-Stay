// ============================================================
// Limpieza & Mantenimiento - Schema Grand-Stay.sql
// insumos: nombre, categoria (quimico|herramienta|textil|papel|otro),
//          stock_actual, stock_minimo, unidad_medida, proveedor.
// consumo_insumos (tareas): tipo_tarea (limpieza_rutina|limpieza_profunda|
//          cambio_ropa|mantenimiento|checkin_prep), id_personal,
//          id_habitacion, id_insumo, cantidad, observaciones.
// ============================================================

import { useState, useEffect } from 'react';
import {
  Sparkles, Package, AlertTriangle, Plus, X, RefreshCw,
  ClipboardList, BedDouble, ArrowDownToLine,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { getErrorMessage } from '../utils/errorHelpers.js';
import useFormValidation from '../hooks/useFormValidation.js';

const CATEGORIAS_INSUMO = ['quimico', 'herramienta', 'textil', 'papel', 'otro'];
const TIPOS_TAREA = [
  'limpieza_rutina', 'limpieza_profunda', 'cambio_ropa',
  'mantenimiento', 'checkin_prep',
];
const ESTADOS_LIBERA = ['disponible', 'limpieza', 'mantenimiento', 'bloqueada'];

const insumoRules = {
  nombre:        v => !v?.trim() ? 'Nombre obligatorio.' : '',
  categoria:     v => !v ? 'Categoría obligatoria.' : '',
  stock_actual:  v => v === '' || isNaN(Number(v)) || Number(v) < 0 ? 'Stock inválido.' : '',
  stock_minimo:  v => v === '' || isNaN(Number(v)) || Number(v) < 0 ? 'Mínimo inválido.' : '',
  unidad_medida: v => !v?.trim() ? 'Unidad obligatoria.' : '',
};

const tareaRules = {
  id_habitacion: v => !v ? 'Habitación obligatoria.' : '',
  id_insumo:     v => !v ? 'Insumo obligatorio.' : '',
  tipo_tarea:    v => !v ? 'Tipo obligatorio.' : '',
  cantidad:      v => !v || Number(v) <= 0 ? 'Cantidad mayor a 0.' : '',
};

const Cleaning = () => {
  const { hasRole } = useAuth();
  const { toast } = useUI();
  const [tab, setTab] = useState('insumos'); // insumos | tareas | pendientes
  const [insumos, setInsumos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInsumoForm, setShowInsumoForm] = useState(false);
  const [showTareaForm, setShowTareaForm] = useState(false);
  const [editingInsumoId, setEditingInsumoId] = useState(null);
  const [restockTarget, setRestockTarget] = useState(null);

  const insumoForm = useFormValidation(
    { nombre: '', descripcion: '', categoria: 'quimico', unidad_medida: 'unidad',
      stock_actual: '0', stock_minimo: '0', proveedor: '' },
    insumoRules,
  );
  const tareaForm = useFormValidation(
    { id_habitacion: '', id_insumo: '', tipo_tarea: 'limpieza_rutina',
      cantidad: '1', observaciones: '', finaliza_estado: '' },
    tareaRules,
  );

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rIns, rTar, rPend, rRooms] = await Promise.all([
        api.get('/api/cleaning/insumos'),
        api.get('/api/cleaning/tareas').catch(() => ({ data: [] })),
        api.get('/api/cleaning/habitaciones/pendientes').catch(() => ({ data: { habitaciones: [] } })),
        api.get('/api/rooms').catch(() => ({ data: [] })),
      ]);
      setInsumos(rIns.data);
      setTareas(rTar.data);
      setPendientes(rPend.data.habitaciones || []);
      setHabitaciones(rRooms.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ─── Insumos ────────────────────────────────────────────
  const submitInsumo = async (e) => {
    e.preventDefault();
    if (!insumoForm.validateAll()) return;
    try {
      const payload = {
        nombre:        insumoForm.values.nombre,
        descripcion:   insumoForm.values.descripcion || null,
        categoria:     insumoForm.values.categoria,
        unidad_medida: insumoForm.values.unidad_medida,
        stock_actual:  Number(insumoForm.values.stock_actual),
        stock_minimo:  Number(insumoForm.values.stock_minimo),
        proveedor:     insumoForm.values.proveedor || null,
      };
      if (editingInsumoId) {
        await api.patch(`/api/cleaning/insumos/${editingInsumoId}`, payload);
        toast.success('Insumo actualizado.');
      } else {
        await api.post('/api/cleaning/insumos', payload);
        toast.success('Insumo creado.');
      }
      setShowInsumoForm(false); setEditingInsumoId(null);
      insumoForm.resetForm();
      loadAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const editInsumo = (i) => {
    insumoForm.resetForm({
      nombre: i.nombre,
      descripcion: i.descripcion || '',
      categoria: i.categoria,
      unidad_medida: i.unidad_medida,
      stock_actual: i.stock_actual.toString(),
      stock_minimo: i.stock_minimo.toString(),
      proveedor: i.proveedor || '',
    });
    setEditingInsumoId(i.id_insumo);
    setShowInsumoForm(true);
  };

  const submitRestock = async (cantidad) => {
    try {
      await api.patch(`/api/cleaning/insumos/${restockTarget.id_insumo}/reabastecer`, { cantidad });
      toast.success(`+${cantidad} ${restockTarget.unidad_medida} de ${restockTarget.nombre}.`);
      setRestockTarget(null); loadAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  // ─── Tareas ────────────────────────────────────────────
  const submitTarea = async (e) => {
    e.preventDefault();
    if (!tareaForm.validateAll()) return;
    try {
      const payload = {
        id_habitacion: parseInt(tareaForm.values.id_habitacion, 10),
        id_insumo:     parseInt(tareaForm.values.id_insumo, 10),
        tipo_tarea:    tareaForm.values.tipo_tarea,
        cantidad:      Number(tareaForm.values.cantidad),
        observaciones: tareaForm.values.observaciones || null,
      };
      if (tareaForm.values.finaliza_estado) payload.finaliza_estado = tareaForm.values.finaliza_estado;
      await api.post('/api/cleaning/tareas', payload);
      toast.success('Tarea registrada.');
      setShowTareaForm(false); tareaForm.resetForm();
      loadAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--gold)' }} />
      </div>
    );
  }

  // Restock prompt
  const restockPrompt = restockTarget && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-sm animate-slide-up">
        <h3 className="font-serif text-xl mb-3">Reabastecer</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
          {restockTarget.nombre} · stock actual: <strong style={{ color: 'var(--gold)' }}>{restockTarget.stock_actual}</strong> {restockTarget.unidad_medida}
        </p>
        <RestockInput onSubmit={submitRestock} onCancel={() => setRestockTarget(null)} />
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {restockPrompt}

      <div className="page-header">
        <h1 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--gold)' }}>Limpieza</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Insumos, tareas y habitaciones pendientes</p>
      </div>

      {/* Tabs */}
      <div className="card mb-6 p-2">
        <div className="flex gap-2">
          {[
            { key: 'insumos',    label: 'Insumos',    icon: Package },
            { key: 'tareas',     label: 'Tareas',     icon: ClipboardList },
            { key: 'pendientes', label: 'Pendientes', icon: AlertTriangle },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${
                tab === key ? 'bg-yellow-500/15 text-yellow-300' : 'text-[var(--text-muted)]'
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* INSUMOS ──────────────────────────────────────────── */}
      {tab === 'insumos' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{insumos.length} insumo(s)</p>
            {hasRole('Administrador', 'PersonalLimpieza') && (
              <button onClick={() => { setShowInsumoForm(s => !s); if (showInsumoForm) { insumoForm.resetForm(); setEditingInsumoId(null); } }}
                className={showInsumoForm ? 'btn-ghost' : 'btn-gold'}>
                {showInsumoForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Nuevo Insumo</>}
              </button>
            )}
          </div>

          {showInsumoForm && (
            <div className="card mb-6 animate-slide-up">
              <h2 className="font-serif text-2xl mb-5">{editingInsumoId ? 'Editar' : 'Nuevo'} <span style={{ color: 'var(--gold)' }}>Insumo</span></h2>
              <form onSubmit={submitInsumo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Nombre *</label>
                  <input name="nombre" value={insumoForm.values.nombre} onChange={insumoForm.handleChange} onBlur={insumoForm.handleBlur} className={insumoForm.fieldClass('nombre')} />
                  {insumoForm.errors.nombre && insumoForm.touched.nombre && <p className="error-msg">{insumoForm.errors.nombre}</p>}
                </div>
                <div>
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Categoría *</label>
                  <select name="categoria" value={insumoForm.values.categoria} onChange={insumoForm.handleChange} className="input-field">
                    {CATEGORIAS_INSUMO.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Unidad *</label>
                  <input name="unidad_medida" placeholder="unidad / ml / kg" value={insumoForm.values.unidad_medida} onChange={insumoForm.handleChange} onBlur={insumoForm.handleBlur} className={insumoForm.fieldClass('unidad_medida')} />
                </div>
                <div>
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Stock actual *</label>
                  <input name="stock_actual" type="number" min="0" value={insumoForm.values.stock_actual} onChange={insumoForm.handleChange} onBlur={insumoForm.handleBlur} className={insumoForm.fieldClass('stock_actual')} />
                </div>
                <div>
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Stock mínimo *</label>
                  <input name="stock_minimo" type="number" min="0" value={insumoForm.values.stock_minimo} onChange={insumoForm.handleChange} onBlur={insumoForm.handleBlur} className={insumoForm.fieldClass('stock_minimo')} />
                </div>
                <div>
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Proveedor</label>
                  <input name="proveedor" value={insumoForm.values.proveedor} onChange={insumoForm.handleChange} className="input-field" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Descripción</label>
                  <textarea name="descripcion" rows={2} value={insumoForm.values.descripcion} onChange={insumoForm.handleChange} className="input-field resize-none" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
                  <button type="submit" className="btn-gold">{editingInsumoId ? 'Actualizar' : 'Crear'}</button>
                  <button type="button" onClick={() => { setShowInsumoForm(false); setEditingInsumoId(null); insumoForm.resetForm(); }} className="btn-secondary">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {insumos.map(i => {
              const bajo = i.stock_actual <= i.stock_minimo;
              return (
                <div key={i.id_insumo} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package size={14} style={{ color: 'var(--gold)' }} />
                      <p className="font-medium">{i.nombre}</p>
                    </div>
                    {bajo && <span className="badge badge-danger"><AlertTriangle size={10} /> bajo</span>}
                  </div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{i.categoria} · {i.unidad_medida}</p>
                  <p className="font-serif text-2xl" style={{ color: bajo ? '#f87171' : 'var(--gold-light)' }}>
                    {i.stock_actual}
                    <span className="text-xs ml-2" style={{ color: 'var(--text-subtle)' }}>min: {i.stock_minimo}</span>
                  </p>
                  {hasRole('Administrador', 'PersonalLimpieza') && (
                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      <button onClick={() => setRestockTarget(i)} className="btn-secondary text-xs flex-1 justify-center">
                        <ArrowDownToLine size={12} /> Reabastecer
                      </button>
                      <button onClick={() => editInsumo(i)} className="btn-ghost text-xs">Editar</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TAREAS ──────────────────────────────────────────── */}
      {tab === 'tareas' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{tareas.length} tarea(s)</p>
            {hasRole('Administrador', 'PersonalLimpieza', 'ServicioTecnico') && (
              <button onClick={() => { setShowTareaForm(s => !s); if (showTareaForm) tareaForm.resetForm(); }}
                className={showTareaForm ? 'btn-ghost' : 'btn-gold'}>
                {showTareaForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Nueva Tarea</>}
              </button>
            )}
          </div>

          {showTareaForm && (
            <div className="card mb-6 animate-slide-up">
              <h2 className="font-serif text-2xl mb-5">Nueva <span style={{ color: 'var(--gold)' }}>Tarea</span></h2>
              <form onSubmit={submitTarea} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Habitación *</label>
                  <select name="id_habitacion" value={tareaForm.values.id_habitacion} onChange={tareaForm.handleChange} onBlur={tareaForm.handleBlur} className={tareaForm.fieldClass('id_habitacion')}>
                    <option value="">— Seleccionar —</option>
                    {habitaciones.map(h => (
                      <option key={h.id_habitacion} value={h.id_habitacion}>Hab. {h.numero_habitacion} ({h.estado})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Insumo *</label>
                  <select name="id_insumo" value={tareaForm.values.id_insumo} onChange={tareaForm.handleChange} onBlur={tareaForm.handleBlur} className={tareaForm.fieldClass('id_insumo')}>
                    <option value="">— Seleccionar —</option>
                    {insumos.map(i => <option key={i.id_insumo} value={i.id_insumo}>{i.nombre} ({i.stock_actual} {i.unidad_medida})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Cantidad *</label>
                  <input name="cantidad" type="number" min="1" step="0.01" value={tareaForm.values.cantidad} onChange={tareaForm.handleChange} onBlur={tareaForm.handleBlur} className={tareaForm.fieldClass('cantidad')} />
                </div>
                <div>
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Tipo *</label>
                  <select name="tipo_tarea" value={tareaForm.values.tipo_tarea} onChange={tareaForm.handleChange} className="input-field">
                    {TIPOS_TAREA.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Finaliza estado (opt.)</label>
                  <select name="finaliza_estado" value={tareaForm.values.finaliza_estado} onChange={tareaForm.handleChange} className="input-field">
                    <option value="">— No cambiar —</option>
                    {ESTADOS_LIBERA.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Observaciones</label>
                  <textarea name="observaciones" rows={2} value={tareaForm.values.observaciones} onChange={tareaForm.handleChange} className="input-field resize-none" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
                  <button type="submit" className="btn-gold">Registrar</button>
                  <button type="button" onClick={() => { setShowTareaForm(false); tareaForm.resetForm(); }} className="btn-secondary">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          <div className="card overflow-x-auto p-0">
            <table className="luxury-table">
              <thead>
                <tr><th>#</th><th>Habitación</th><th>Insumo</th><th>Tipo</th><th className="text-center">Cant.</th><th>Personal</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                {tareas.map(t => (
                  <tr key={t.id_consumo_insumo}>
                    <td className="text-xs font-mono">#{t.id_consumo_insumo}</td>
                    <td className="text-sm">Hab. {t.numero_habitacion || t.id_habitacion}</td>
                    <td className="text-sm">{t.insumo_nombre || `#${t.id_insumo}`}</td>
                    <td><span className="badge badge-info">{t.tipo_tarea}</span></td>
                    <td className="text-center">{Number(t.cantidad)}</td>
                    <td className="text-xs">{t.personal_nombre || '—'}</td>
                    <td className="text-xs">{t.fecha?.slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                ))}
                {tareas.length === 0 && <tr><td colSpan={7} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin tareas.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PENDIENTES ──────────────────────────────────────── */}
      {tab === 'pendientes' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{pendientes.length} habitación(es) pendiente(s)</p>
            <button onClick={loadAll} className="btn-secondary text-sm">
              <RefreshCw size={12} /> Refrescar
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendientes.map(h => (
              <div key={h.id_habitacion} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <BedDouble size={14} style={{ color: 'var(--gold)' }} />
                  <p className="font-serif text-lg">Hab. {h.numero_habitacion}</p>
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Piso {h.piso}</p>
                <span className={`badge ${h.estado === 'limpieza' ? 'badge-warning' : 'badge-neutral'}`}>{h.estado}</span>
                {h.ultima_limpieza && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-subtle)' }}>
                    Última limpieza: {h.ultima_limpieza.slice(0, 16).replace('T', ' ')}
                  </p>
                )}
              </div>
            ))}
            {pendientes.length === 0 && (
              <div className="card text-center py-12 col-span-full">
                <Sparkles size={32} className="mx-auto mb-2" style={{ color: 'var(--gold)' }} />
                <p style={{ color: 'var(--text-muted)' }}>Todas las habitaciones están al día.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const RestockInput = ({ onSubmit, onCancel }) => {
  const [v, setV] = useState('');
  return (
    <>
      <input type="number" min="1" autoFocus value={v}
        onChange={e => setV(e.target.value)}
        placeholder="Cantidad a agregar"
        className="input-field mb-4" />
      <div className="flex gap-3">
        <button onClick={() => v && Number(v) > 0 && onSubmit(Number(v))} className="btn-gold flex-1">Reabastecer</button>
        <button onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
      </div>
    </>
  );
};

export default Cleaning;
