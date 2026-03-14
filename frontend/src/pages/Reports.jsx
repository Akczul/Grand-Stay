// ============================================================
// Página de Reportes - Solo Administrador
// Ocupación, ingresos por tipo y servicios más rentables
// ============================================================

import { useState } from 'react';
import api from '../services/api.js';

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
