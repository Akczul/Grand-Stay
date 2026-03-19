import { useState } from 'react';
import {
  BarChart2, DollarSign, Activity, PieChart,
  Calendar, RefreshCw, ArrowRight, Hotel,
} from 'lucide-react';
import api from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';
import { getErrorMessage } from '../utils/errorHelpers.js';

// ── Report type definitions ────────────────────────────────
const REPORT_TYPES = [
  {
    id:       'ocupacion',
    icon:     Hotel,
    title:    'Ocupación',
    desc:     'Tasa de ocupación mensual por tipo de habitación',
    color:    'text-blue-400',
    bg:       'bg-blue-400/10',
    border:   'border-blue-400/30',
  },
  {
    id:       'ingresos',
    icon:     DollarSign,
    title:    'Ingresos',
    desc:     'Ingresos totales desglosados por tipo de habitación',
    color:    'text-emerald-400',
    bg:       'bg-emerald-400/10',
    border:   'border-emerald-400/30',
  },
  {
    id:       'servicios',
    icon:     PieChart,
    title:    'Servicios Rentables',
    desc:     'Ranking de servicios por ingresos generados',
    color:    'text-purple-400',
    bg:       'bg-purple-400/10',
    border:   'border-purple-400/30',
  },
  {
    id:       'dashboard',
    icon:     Activity,
    title:    'Dashboard General',
    desc:     'Resumen completo del estado del hotel',
    color:    'text-gold-400',
    bg:       'bg-gold-400/10',
    border:   'border-gold-400/30',
  },
];

const MEDAL_BG = ['bg-gold-500', 'bg-slate-400', 'bg-amber-700', 'bg-[var(--bg-elevated)]'];

// ── Reusable stat card ─────────────────────────────────────
const StatCard = ({ label, value, color = 'text-[var(--text-primary)]' }) => (
  <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-center">
    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
  </div>
);

// ── Main Component ─────────────────────────────────────────
const Reports = () => {
  const { toast } = useUI();
  const [activeReport, setActiveReport] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const loadReport = async (tipo) => {
    setLoading(true);
    setActiveReport(tipo);
    setReportData(null);
    try {
      const res = await api.get(`/api/reports/${tipo}`, { params: { mes, anio } });
      setReportData(res.data);
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      setReportData({ error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)]">Reportes</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Análisis de ocupación, ingresos y servicios</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Calendar size={16} />
            <span className="text-sm font-medium">Período:</span>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider">Mes</label>
            <select
              value={mes}
              onChange={e => setMes(parseInt(e.target.value))}
              className="input-field w-auto text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i, 1).toLocaleString('es', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider">Año</label>
            <select
              value={anio}
              onChange={e => setAnio(parseInt(e.target.value))}
              className="input-field w-auto text-sm"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {activeReport && (
            <button
              onClick={() => loadReport(activeReport)}
              className="btn-ghost text-sm py-2 px-3 flex items-center gap-2"
            >
              <RefreshCw size={14} />Actualizar
            </button>
          )}
        </div>
      </div>

      {/* Report type grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {REPORT_TYPES.map(({ id, icon: Icon, title, desc, color, bg, border }) => (
          <button
            key={id}
            onClick={() => loadReport(id)}
            className={`card text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
              activeReport === id ? 'border-gold-500/50 bg-gold-500/5' : 'hover:border-[var(--border-hover)]'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl ${bg} ${border} border flex items-center justify-center mb-3`}>
              <Icon size={22} className={color} />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
            {activeReport === id && (
              <div className="mt-3 flex items-center gap-1 text-xs text-gold-400">
                <span>Activo</span>
                <ArrowRight size={12} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Loader */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-12 h-12 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty prompt */}
      {!loading && !reportData && (
        <div className="card text-center py-16">
          <BarChart2 size={48} className="mx-auto text-[var(--text-muted)] opacity-20 mb-4" />
          <p className="text-[var(--text-muted)]">Selecciona un tipo de reporte para comenzar</p>
        </div>
      )}

      {/* Results */}
      {reportData && !loading && (
        <div className="card animate-fade-in">
          {reportData.error ? (
            <div className="text-center py-10">
              <BarChart2 size={48} className="mx-auto text-red-400/30 mb-4" />
              <p className="text-red-400">{reportData.error}</p>
              <p className="text-[var(--text-muted)] text-sm mt-2">Verifica que los microservicios estén corriendo</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-serif text-xl text-[var(--text-primary)]">{reportData.reporte}</h2>
                <span className="badge badge-neutral">{reportData.periodo}</span>
              </div>
              <div className="gold-divider mb-6" />

              {/* Ocupación */}
              {activeReport === 'ocupacion' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Habitaciones" value={reportData.totalHabitaciones} />
                    <StatCard label="Noches Ocupadas"    value={reportData.nochesOcupadas}    color="text-blue-400" />
                    <StatCard label="Tasa de Ocupación"  value={reportData.tasaOcupacion}     color="text-gold-400" />
                    <StatCard label="Total Reservas"     value={reportData.totalReservas}     color="text-emerald-400" />
                  </div>
                  {reportData.ocupacionPorTipo && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        Ocupación por Tipo
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(reportData.ocupacionPorTipo).map(([tipo, data]) => (
                          <div key={tipo} className="flex items-center justify-between bg-[var(--bg-input)] px-4 py-3 rounded-lg">
                            <span className="font-medium text-[var(--text-primary)]">{tipo}</span>
                            <span className="text-sm text-[var(--text-muted)]">
                              <span className="font-bold text-[var(--text-primary)]">{data.ocupadas}</span> de {data.total}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ingresos */}
              {activeReport === 'ingresos' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Ingreso Total" value={`$${reportData.ingresoTotal?.toFixed(2)}`}        color="text-gold-400" />
                    <StatCard label="Hospedaje"     value={`$${reportData.ingresosHospedaje?.toFixed(2)}`}  color="text-blue-400" />
                    <StatCard label="Consumos"      value={`$${reportData.ingresosConsumos?.toFixed(2)}`}   color="text-purple-400" />
                  </div>
                  {reportData.ingresosPorTipo && Object.keys(reportData.ingresosPorTipo).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        Ingresos por Tipo de Habitación
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(reportData.ingresosPorTipo).map(([tipo, data]) => (
                          <div key={tipo} className="flex items-center justify-between bg-[var(--bg-input)] px-4 py-3 rounded-lg">
                            <span className="font-medium text-[var(--text-primary)]">{tipo}</span>
                            <div className="text-right">
                              <p className="font-bold text-gold-400">${data.total?.toFixed(2)}</p>
                              <p className="text-xs text-[var(--text-muted)]">{data.cantidad} facturas</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Servicios */}
              {activeReport === 'servicios' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Total Consumos"  value={`$${reportData.totalConsumos?.toFixed(2)}`} color="text-emerald-400" />
                    <StatCard label="Transacciones"   value={reportData.cantidadTransacciones}           color="text-blue-400" />
                  </div>
                  {reportData.ranking?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        Ranking de Servicios
                      </h3>
                      <div className="space-y-2">
                        {reportData.ranking.map((s, i) => (
                          <div key={s.tipo} className="flex items-center gap-4 bg-[var(--bg-input)] px-4 py-3 rounded-lg">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${MEDAL_BG[Math.min(i, 3)]}`}>
                              {i + 1}
                            </span>
                            <span className="flex-1 font-medium text-[var(--text-primary)] capitalize">{s.tipo}</span>
                            <div className="text-right">
                              <p className="font-bold text-gold-400">${parseFloat(s.total).toFixed(2)}</p>
                              <p className="text-xs text-[var(--text-muted)]">{s.cantidad} transacciones</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dashboard */}
              {activeReport === 'dashboard' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {reportData.habitacionesLibres    !== undefined && <StatCard label="Habitaciones Libres"    value={reportData.habitacionesLibres}    color="text-emerald-400" />}
                  {reportData.habitacionesOcupadas  !== undefined && <StatCard label="Habitaciones Ocupadas"  value={reportData.habitacionesOcupadas}  color="text-blue-400" />}
                  {reportData.reservasActivas       !== undefined && <StatCard label="Reservas Activas"       value={reportData.reservasActivas}       color="text-gold-400" />}
                  {reportData.facturasPendientes    !== undefined && <StatCard label="Facturas Pendientes"    value={reportData.facturasPendientes}    color="text-amber-400" />}
                  {reportData.ingresosMes           !== undefined && <StatCard label="Ingresos del Mes"      value={`$${parseFloat(reportData.ingresosMes).toFixed(2)}`} color="text-gold-400" />}
                  {reportData.tasaOcupacion         !== undefined && <StatCard label="Tasa Ocupación"        value={reportData.tasaOcupacion}         color="text-purple-400" />}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;

const Reports = () => {
  const [activeReport, setActiveReport] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const loadReport = async (tipo) => {
    setLoading(true);
    setActiveReport(tipo);
    try {
      const res = await api.get(`/api/reports/${tipo}`, { params: { mes, anio } });
      setReportData(res.data);
    } catch (err) {
      console.error('Error cargando reporte:', err);
      setReportData({ error: err.response?.data?.error || 'Error cargando reporte' });
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: 'ocupacion', label: 'Ocupaci\u00f3n', icon: '🏨', desc: 'Tasa de ocupaci\u00f3n mensual por tipo de habitaci\u00f3n' },
    { id: 'ingresos', label: 'Ingresos', icon: '💰', desc: 'Ingresos totales y desglose por tipo de habitaci\u00f3n' },
    { id: 'servicios', label: 'Servicios Rentables', icon: '📊', desc: 'Ranking de servicios por ingresos generados' },
    { id: 'dashboard', label: 'Dashboard General', icon: '📋', desc: 'Reumen general del estado del hotel' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reportes</h1>

      {/* Selector de período */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <select value={mes} onChange={e => setMes(parseInt(e.target.value))} className="input-field w-auto">
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i, 1).toLocaleString('es', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <select value={anio} onChange={e => setAnio(parseInt(e.target.value))} className="input-field w-auto">
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Botones de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reportTypes.map(r => (
          <button
            key={r.id}
            onClick={() => loadReport(r.id)}
            className={`card text-left hover:shadow-lg transition-all cursor-pointer ${
              activeReport === r.id ? 'ring-2 ring-primary-500 border-primary-500' : ''
            }`}
          >
            <span className="text-3xl">{r.icon}</span>
            <h3 className="font-bold text-lg mt-2">{r.label}</h3>
            <p className="text-sm text-gray-500">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Resultado del reporte */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      )}

      {reportData && !loading && (
        <div className="card">
          {reportData.error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-lg">{reportData.error}</p>
              <p className="text-gray-400 text-sm mt-2">Verifica que los microservicios est\u00e9n corriendo</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{reportData.reporte}</h2>
              <p className="text-sm text-gray-500 mb-6">Per\u00edodo: {reportData.periodo}</p>

              {/* ========== REPORTE OCUPACIÓN ========== */}
              {activeReport === 'ocupacion' && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-blue-600">Total Habitaciones</p>
                      <p className="text-2xl font-bold text-blue-800">{reportData.totalHabitaciones}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-green-600">Noches Ocupadas</p>
                      <p className="text-2xl font-bold text-green-800">{reportData.nochesOcupadas}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-purple-600">Tasa de Ocupaci\u00f3n</p>
                      <p className="text-2xl font-bold text-purple-800">{reportData.tasaOcupacion}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-orange-600">Total Reservas</p>
                      <p className="text-2xl font-bold text-orange-800">{reportData.totalReservas}</p>
                    </div>
                  </div>

                  {reportData.ocupacionPorTipo && (
                    <div>
                      <h3 className="font-bold mb-3">Ocupaci\u00f3n por Tipo</h3>
                      <div className="space-y-2">
                        {Object.entries(reportData.ocupacionPorTipo).map(([tipo, data]) => (
                          <div key={tipo} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium">{tipo}</span>
                            <div className="text-sm text-gray-600">
                              <span className="font-bold">{data.ocupadas}</span> ocupadas de <span>{data.total}</span> totales
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========== REPORTE INGRESOS ========== */}
              {activeReport === 'ingresos' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-green-600">Ingreso Total</p>
                      <p className="text-2xl font-bold text-green-800">${reportData.ingresoTotal?.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-blue-600">Hospedaje</p>
                      <p className="text-2xl font-bold text-blue-800">${reportData.ingresosHospedaje?.toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-purple-600">Consumos</p>
                      <p className="text-2xl font-bold text-purple-800">${reportData.ingresosConsumos?.toFixed(2)}</p>
                    </div>
                  </div>

                  {reportData.ingresosPorTipo && Object.keys(reportData.ingresosPorTipo).length > 0 && (
                    <div>
                      <h3 className="font-bold mb-3">Ingresos por Tipo de Habitaci\u00f3n</h3>
                      <div className="space-y-2">
                        {Object.entries(reportData.ingresosPorTipo).map(([tipo, data]) => (
                          <div key={tipo} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium">{tipo}</span>
                            <div className="text-right">
                              <p className="font-bold text-primary-500">${data.total?.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">{data.cantidad} facturas</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========== REPORTE SERVICIOS ========== */}
              {activeReport === 'servicios' && (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-green-600">Total Consumos</p>
                      <p className="text-2xl font-bold text-green-800">${reportData.totalConsumos?.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-blue-600">Transacciones</p>
                      <p className="text-2xl font-bold text-blue-800">{reportData.cantidadTransacciones}</p>
                    </div>
                  </div>

                  {reportData.ranking?.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-3">Ranking de Servicios</h3>
                      <div className="space-y-2">
                        {reportData.ranking.map((s, i) => (
                          <div key={s.tipo} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-300'
                              }`}>
                                {i + 1}
                              </span>
                              <span className="font-medium capitalize">{s.tipo}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary-500">${s.ingresoTotal?.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">{s.cantidad} usos</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reportData.ranking?.length === 0 && (
                    <p className="text-center text-gray-400 py-4">No hay consumos en este per\u00edodo</p>
                  )}
                </div>
              )}

              {/* ========== DASHBOARD GENERAL ========== */}
              {activeReport === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold mb-3">Habitaciones</h3>
                    <div className="space-y-2">
                      {reportData.habitaciones && Object.entries(reportData.habitaciones).map(([key, val]) => (
                        <div key={key} className="flex justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="capitalize">{key}</span>
                          <span className="font-bold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold mb-3">Reservas y Facturaci\u00f3n</h3>
                    <div className="space-y-2">
                      {reportData.reservas && Object.entries(reportData.reservas).map(([key, val]) => (
                        <div key={key} className="flex justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="capitalize">{key}</span>
                          <span className="font-bold">{val}</span>
                        </div>
                      ))}
                      {reportData.facturacion && Object.entries(reportData.facturacion).map(([key, val]) => (
                        <div key={key} className="flex justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="capitalize">{key === 'ingresosMesActual' ? 'Ingresos mes actual' : key}</span>
                          <span className="font-bold">{typeof val === 'number' && key.includes('ingreso') ? `$${val.toFixed(2)}` : val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!reportData && !loading && (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-lg">Selecciona un tipo de reporte para generar</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
