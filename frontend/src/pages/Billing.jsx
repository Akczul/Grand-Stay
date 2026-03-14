// ============================================================
// Página de Facturación - Facturas consolidadas
// Visualizar, pagar y listar facturas
// ============================================================

import { useState, useEffect } from 'react';
import api from '../services/api.js';

const Billing = () => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [selectedFactura, setSelectedFactura] = useState(null);

  useEffect(() => { loadFacturas(); }, []);

  const loadFacturas = async () => {
    try {
      const params = {};
      if (filterEstado) params.estado = filterEstado;
      const res = await api.get('/api/billing', { params });
      setFacturas(res.data);
    } catch (err) {
      console.error('Error cargando facturas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id) => {
    const metodo = prompt('Método de pago (Efectivo, Tarjeta, Transferencia):');
    if (!metodo) return;
    try {
      await api.patch(`/api/billing/${id}/pagar`, { metodo_pago: metodo });
      loadFacturas();
      setSelectedFactura(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error procesando pago');
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await api.get(`/api/billing/${id}`);
      setSelectedFactura(res.data);
    } catch (err) {
      alert('Error cargando detalle');
    }
  };

  const estadoBadge = {
    Pendiente: 'bg-yellow-100 text-yellow-700',
    Pagada: 'bg-green-100 text-green-700',
    Anulada: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Facturación</h1>

      {/* Filtro */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="input-field w-auto">
            <option value="">Todas</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Pagada">Pagadas</option>
            <option value="Anulada">Anuladas</option>
          </select>
          <button onClick={loadFacturas} className="btn-secondary">Filtrar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de facturas */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-bold mb-4">Lista de Facturas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-3">ID</th>
                  <th className="text-left py-3 px-3">Huésped</th>
                  <th className="text-left py-3 px-3">Hab.</th>
                  <th className="text-right py-3 px-3">Hospedaje</th>
                  <th className="text-right py-3 px-3">Consumos</th>
                  <th className="text-right py-3 px-3">Total</th>
                  <th className="text-left py-3 px-3">Estado</th>
                  <th className="text-center py-3 px-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map(f => (
                  <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetail(f.id)}>
                    <td className="py-3 px-3 font-medium">#{f.id}</td>
                    <td className="py-3 px-3">{f.huespedNombre}</td>
                    <td className="py-3 px-3">{f.habitacionNumero}</td>
                    <td className="py-3 px-3 text-right">${parseFloat(f.subtotal).toFixed(2)}</td>
                    <td className="py-3 px-3 text-right">${parseFloat(f.consumos_total).toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-bold text-lg">${parseFloat(f.total_final).toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span className={`badge ${estadoBadge[f.estado]}`}>{f.estado}</span>
                    </td>
                    <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                      {f.estado === 'Pendiente' && (
                        <button onClick={() => handlePay(f.id)} className="text-xs btn-success py-1 px-2">Pagar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {facturas.length === 0 && (
              <p className="text-center text-gray-400 py-8">No hay facturas</p>
            )}
          </div>
        </div>

        {/* Detalle de factura */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Detalle de Factura</h2>
          {selectedFactura ? (
            <div className="space-y-3">
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500">Factura #{selectedFactura.id}</p>
                <p className="font-bold text-lg">{selectedFactura.huespedNombre}</p>
                <p className="text-sm">Habitación: {selectedFactura.habitacionNumero}</p>
                <p className="text-sm">{selectedFactura.fecha_inicio} al {selectedFactura.fecha_fin}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hospedaje:</span>
                  <span className="font-medium">${parseFloat(selectedFactura.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consumos:</span>
                  <span className="font-medium">${parseFloat(selectedFactura.consumos_total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA (16%):</span>
                  <span className="font-medium">${parseFloat(selectedFactura.impuestos).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-gray-200">
                  <span className="font-bold text-lg">TOTAL:</span>
                  <span className="font-bold text-lg text-primary-500">${parseFloat(selectedFactura.total_final).toFixed(2)}</span>
                </div>
              </div>

              {/* Detalle de consumos */}
              {selectedFactura.detalle_consumos?.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold text-sm mb-2">Consumos:</h3>
                  <div className="space-y-1">
                    {selectedFactura.detalle_consumos.map((c, i) => (
                      <div key={i} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                        <span>{c.tipo} - {c.descripcion}</span>
                        <span className="font-medium">${parseFloat(c.monto).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <span className={`badge ${estadoBadge[selectedFactura.estado]}`}>{selectedFactura.estado}</span>
                {selectedFactura.metodo_pago && (
                  <span className="ml-2 text-sm text-gray-500">Pago: {selectedFactura.metodo_pago}</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Selecciona una factura para ver los detalles</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;
