// ============================================================
// Consumos - Schema Grand-Stay.sql (grandstay_db)
// Catálogo: servicios_adicionales (categorías).
// Registro: consumo_servicios (id_reserva, id_servicio, cantidad,
// precio_aplicado, estado solicitado|en_proceso|completado|cancelado).
// ============================================================

import { useState, useEffect } from 'react';
import {
  UtensilsCrossed, Plus, X, Coffee, Shirt, Wine, Car,
  Sparkles, Music, Map, Package, DollarSign, RefreshCw,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { getErrorMessage } from '../utils/errorHelpers.js';
import useFormValidation from '../hooks/useFormValidation.js';

const CATEGORIAS = {
  spa:             { icon: Sparkles,         color: 'text-purple-400'  },
  restaurante:     { icon: UtensilsCrossed,  color: 'text-orange-400'  },
  transporte:      { icon: Car,              color: 'text-yellow-400'  },
  lavanderia:      { icon: Shirt,            color: 'text-blue-400'    },
  room_service:    { icon: Coffee,           color: 'text-emerald-400' },
  entretenimiento: { icon: Music,            color: 'text-pink-400'    },
  tour:            { icon: Map,              color: 'text-cyan-400'    },
  otro:            { icon: Package,          color: 'text-slate-400'   },
};

const ESTADO_BADGE = {
  solicitado: 'badge-info',
  en_proceso: 'badge-warning',
  completado: 'badge-success',
  cancelado:  'badge-danger',
};

const consumoRules = {
  id_reserva:  v => !v ? 'ID de reserva obligatorio.' : isNaN(v) ? 'Debe ser número.' : '',
  id_servicio: v => !v ? 'Seleccione un servicio.' : '',
  cantidad:    v => !v || Number(v) <= 0 ? 'Cantidad mayor a 0.' : '',
};

const Consumptions = () => {
  const { hasRole } = useAuth();
  const { toast } = useUI();
  const [consumos, setConsumos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const form = useFormValidation(
    { id_reserva: '', id_servicio: '', cantidad: '1', notas: '' },
    consumoRules,
  );

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rServ, rCons] = await Promise.all([
        api.get('/api/consumptions/servicios'),
        api.get('/api/consumptions', { params: filtroEstado ? { estado: filtroEstado } : {} }),
      ]);
      setServicios(rServ.data);
      setConsumos(rCons.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.validateAll()) return;
    try {
      await api.post('/api/consumptions', {
        id_reserva:   parseInt(form.values.id_reserva, 10),
        id_servicio:  parseInt(form.values.id_servicio, 10),
        cantidad:     Number(form.values.cantidad),
        notas:        form.values.notas || undefined,
      });
      toast.success('Consumo registrado.');
      setShowForm(false);
      form.resetForm({ id_reserva: '', id_servicio: '', cantidad: '1', notas: '' });
      loadData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleStatus = async (id, estado) => {
    try {
      await api.patch(`/api/consumptions/${id}/estado`, { estado });
      toast.success(`Estado: ${estado}`);
      loadData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este consumo?')) return;
    try {
      await api.delete(`/api/consumptions/${id}`);
      toast.success('Consumo eliminado.');
      loadData();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  // Servicio actualmente seleccionado en el formulario (para mostrar precio)
  const servicioSel = servicios.find(s => s.id_servicio === parseInt(form.values.id_servicio, 10));

  const filtrados = filtroCategoria
    ? consumos.filter(c => {
        const s = servicios.find(x => x.id_servicio === c.id_servicio);
        return s?.categoria === filtroCategoria;
      })
    : consumos;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTopColor: 'var(--gold)' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--gold)' }}>Consumos</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Servicios adicionales · {filtrados.length} registro(s)
          </p>
        </div>
        <button onClick={() => { setShowForm(s => !s); form.resetForm({ id_reserva: '', id_servicio: '', cantidad: '1', notas: '' }); }}
          className={showForm ? 'btn-ghost' : 'btn-gold'}>
          {showForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Registrar</>}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 animate-slide-up">
          <h2 className="font-serif text-2xl mb-5">Nuevo <span style={{ color: 'var(--gold)' }}>consumo</span></h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>ID Reserva *</label>
              <input name="id_reserva" type="number" placeholder="Ej. 1"
                value={form.values.id_reserva} onChange={form.handleChange} onBlur={form.handleBlur}
                className={form.fieldClass('id_reserva')} />
              {form.errors.id_reserva && form.touched.id_reserva && <p className="error-msg">{form.errors.id_reserva}</p>}
            </div>
            <div>
              <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Cantidad *</label>
              <input name="cantidad" type="number" min="1" step="0.01"
                value={form.values.cantidad} onChange={form.handleChange} onBlur={form.handleBlur}
                className={form.fieldClass('cantidad')} />
              {form.errors.cantidad && form.touched.cantidad && <p className="error-msg">{form.errors.cantidad}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Servicio *</label>
              <select name="id_servicio" value={form.values.id_servicio}
                onChange={form.handleChange} onBlur={form.handleBlur}
                className={form.fieldClass('id_servicio')}>
                <option value="">— Seleccionar —</option>
                {servicios.map(s => (
                  <option key={s.id_servicio} value={s.id_servicio}>
                    [{s.categoria}] {s.nombre} · ${Number(s.precio).toLocaleString('es-CO')}
                  </option>
                ))}
              </select>
              {form.errors.id_servicio && form.touched.id_servicio && <p className="error-msg">{form.errors.id_servicio}</p>}
              {servicioSel && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--gold)' }}>
                  Subtotal estimado: ${(Number(servicioSel.precio) * Number(form.values.cantidad || 0)).toLocaleString('es-CO')}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase font-medium mb-1.5" style={{ color: 'var(--gold)' }}>Notas</label>
              <textarea name="notas" rows={2} value={form.values.notas}
                onChange={form.handleChange} className="input-field resize-none" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-gold">Registrar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input-field w-auto text-sm">
            <option value="">Todos los estados</option>
            {Object.keys(ESTADO_BADGE).map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="input-field w-auto text-sm">
            <option value="">Todas las categorías</option>
            {Object.keys(CATEGORIAS).map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={loadData} className="btn-gold text-sm py-2 px-4">
            <RefreshCw size={12} className="inline mr-1" /> Aplicar
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="card overflow-x-auto p-0">
        <table className="luxury-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Reserva</th>
              <th>Servicio</th>
              <th className="text-center">Cant.</th>
              <th className="text-right">Precio</th>
              <th className="text-right">Subtotal</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(c => {
              const serv = servicios.find(s => s.id_servicio === c.id_servicio);
              const cat = serv?.categoria || 'otro';
              const Cfg = CATEGORIAS[cat] || CATEGORIAS.otro;
              const Icon = Cfg.icon;
              return (
                <tr key={c.id_consumo_servicio}>
                  <td className="text-xs font-mono">#{c.id_consumo_servicio}</td>
                  <td className="text-sm">R-{c.id_reserva}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={Cfg.color} />
                      <span className="text-sm">{serv?.nombre || `Servicio #${c.id_servicio}`}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{cat}</p>
                  </td>
                  <td className="text-center">{Number(c.cantidad)}</td>
                  <td className="text-right">${Number(c.precio_aplicado).toLocaleString('es-CO')}</td>
                  <td className="text-right font-medium" style={{ color: 'var(--gold-light)' }}>
                    ${Number(c.subtotal).toLocaleString('es-CO')}
                  </td>
                  <td><span className={`badge ${ESTADO_BADGE[c.estado] || 'badge-neutral'}`}>{c.estado}</span></td>
                  <td className="text-xs">{c.fecha?.slice(0, 16).replace('T', ' ')}</td>
                  <td>
                    <div className="flex justify-center gap-1">
                      {hasRole('Administrador', 'Recepcionista') && c.estado !== 'completado' && c.estado !== 'cancelado' && (
                        <select value={c.estado}
                          onChange={e => handleStatus(c.id_consumo_servicio, e.target.value)}
                          className="input-field text-xs py-1 px-2">
                          {Object.keys(ESTADO_BADGE).map(s => <option key={s}>{s}</option>)}
                        </select>
                      )}
                      {hasRole('Administrador') && !c.id_factura && (
                        <button onClick={() => handleDelete(c.id_consumo_servicio)} title="Eliminar"
                          className="h-7 w-7 flex items-center justify-center rounded-lg"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan={9} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Sin consumos.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Catálogo */}
      <div className="mt-8">
        <h2 className="font-serif text-2xl mb-4">Catálogo de <span style={{ color: 'var(--gold)' }}>servicios</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {servicios.map(s => {
            const Cfg = CATEGORIAS[s.categoria] || CATEGORIAS.otro;
            const Icon = Cfg.icon;
            return (
              <div key={s.id_servicio} className="card flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(201,160,71,0.1)', border: '1px solid rgba(201,160,71,0.2)' }}>
                  <Icon size={16} className={Cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.nombre}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.categoria}</p>
                  <p className="text-sm mt-1 flex items-center gap-1" style={{ color: 'var(--gold-light)' }}>
                    <DollarSign size={11} />{Number(s.precio).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Consumptions;
