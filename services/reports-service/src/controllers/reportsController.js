// ============================================================
// Controlador de Reportes
// Genera reportes de ocupación, ingresos y servicios rentables
// Solo accesible para Administradores
// ============================================================

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ROOMS_URL = process.env.ROOMS_SERVICE_URL || 'http://localhost:3002';
const RESERVATIONS_URL = process.env.RESERVATIONS_SERVICE_URL || 'http://localhost:3003';
const CONSUMPTIONS_URL = process.env.CONSUMPTIONS_SERVICE_URL || 'http://localhost:3004';
const BILLING_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3005';

// Verificar que el usuario sea Administrador
const checkAdmin = (req, res) => {
  const rol = req.headers['x-user-rol'];
  if (rol !== 'Administrador') {
    res.status(403).json({ error: 'Solo el Administrador puede acceder a reportes' });
    return false;
  }
  return true;
};

// --- Reporte de ocupación mensual ---
export const getOccupancyReport = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    const { mes, anio } = req.query;
    const year = parseInt(anio) || new Date().getFullYear();
    const month = parseInt(mes) || new Date().getMonth() + 1;

    // Obtener todas las habitaciones
    let habitaciones = [];
    try {
      const roomsRes = await axios.get(ROOMS_URL);
      habitaciones = roomsRes.data;
    } catch {
      return res.status(500).json({ error: 'No se pudo conectar con rooms-service' });
    }

    // Obtener reservas del mes
    let reservas = [];
    try {
      const resRes = await axios.get(RESERVATIONS_URL);
      reservas = resRes.data;
    } catch {
      return res.status(500).json({ error: 'No se pudo conectar con reservations-service' });
    }

    // Filtrar reservas del mes indicado
    const reservasMes = reservas.filter(r => {
      const fecha = new Date(r.fecha_inicio);
      return fecha.getFullYear() === year && (fecha.getMonth() + 1) === month;
    });

    const totalHabitaciones = habitaciones.length;
    const diasMes = new Date(year, month, 0).getDate();
    const capacidadTotal = totalHabitaciones * diasMes;

    // Calcular noches ocupadas
    let nochesOcupadas = 0;
    reservasMes.forEach(r => {
      if (r.estado !== 'Cancelada') {
        const inicio = new Date(r.fecha_inicio);
        const fin = new Date(r.fecha_fin);
        const noches = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
        nochesOcupadas += noches;
      }
    });

    const tasaOcupacion = capacidadTotal > 0
      ? Math.round((nochesOcupadas / capacidadTotal) * 100 * 100) / 100
      : 0;

    // Ocupación por tipo de habitación
    const porTipo = {};
    habitaciones.forEach(h => {
      const tipo = h.tipo;
      if (!porTipo[tipo]) porTipo[tipo] = { total: 0, ocupadas: 0 };
      porTipo[tipo].total++;
    });

    reservasMes.forEach(r => {
      if (r.estado !== 'Cancelada') {
        const hab = habitaciones.find(h => h.id === r.habitacionId);
        if (hab && porTipo[hab.tipo]) {
          porTipo[hab.tipo].ocupadas++;
        }
      }
    });

    res.json({
      reporte: 'Ocupación Mensual',
      periodo: `${month}/${year}`,
      totalHabitaciones,
      diasMes,
      capacidadTotal,
      nochesOcupadas,
      tasaOcupacion: `${tasaOcupacion}%`,
      totalReservas: reservasMes.length,
      reservasCanceladas: reservasMes.filter(r => r.estado === 'Cancelada').length,
      ocupacionPorTipo: porTipo,
    });
  } catch (error) {
    console.error('Error generando reporte de ocupación:', error);
    res.status(500).json({ error: 'Error generando reporte' });
  }
};

// --- Reporte de ingresos por tipo de habitación ---
export const getRevenueReport = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    const { mes, anio } = req.query;
    const year = parseInt(anio) || new Date().getFullYear();
    const month = parseInt(mes) || new Date().getMonth() + 1;

    // Obtener facturas
    let facturas = [];
    try {
      const billingRes = await axios.get(BILLING_URL);
      facturas = billingRes.data;
    } catch {
      return res.status(500).json({ error: 'No se pudo conectar con billing-service' });
    }

    // Obtener habitaciones para mapear tipos
    let habitaciones = [];
    try {
      const roomsRes = await axios.get(ROOMS_URL);
      habitaciones = roomsRes.data;
    } catch {
      console.warn('No se pudieron obtener habitaciones');
    }

    // Obtener reservas
    let reservas = [];
    try {
      const resRes = await axios.get(RESERVATIONS_URL);
      reservas = resRes.data;
    } catch {
      console.warn('No se pudieron obtener reservas');
    }

    // Filtrar facturas del mes
    const facturasMes = facturas.filter(f => {
      const fecha = new Date(f.fecha_emision);
      return fecha.getFullYear() === year && (fecha.getMonth() + 1) === month;
    });

    // Calcular ingresos por tipo de habitación
    const ingresosPorTipo = {};
    let ingresoTotal = 0;
    let ingresosHospedaje = 0;
    let ingresosConsumos = 0;

    facturasMes.forEach(f => {
      const total = parseFloat(f.total_final) || 0;
      ingresoTotal += total;
      ingresosHospedaje += parseFloat(f.subtotal) || 0;
      ingresosConsumos += parseFloat(f.consumos_total) || 0;

      // Buscar tipo de habitación a través de la reserva
      const reserva = reservas.find(r => r.id === f.reservaId);
      if (reserva) {
        const hab = habitaciones.find(h => h.id === reserva.habitacionId);
        const tipo = hab ? hab.tipo : 'Desconocido';
        if (!ingresosPorTipo[tipo]) ingresosPorTipo[tipo] = { cantidad: 0, total: 0 };
        ingresosPorTipo[tipo].cantidad++;
        ingresosPorTipo[tipo].total += total;
      }
    });

    res.json({
      reporte: 'Ingresos por Tipo de Habitación',
      periodo: `${month}/${year}`,
      totalFacturas: facturasMes.length,
      ingresoTotal: Math.round(ingresoTotal * 100) / 100,
      ingresosHospedaje: Math.round(ingresosHospedaje * 100) / 100,
      ingresosConsumos: Math.round(ingresosConsumos * 100) / 100,
      ingresosPorTipo,
    });
  } catch (error) {
    console.error('Error generando reporte de ingresos:', error);
    res.status(500).json({ error: 'Error generando reporte' });
  }
};

// --- Reporte de servicios más rentables ---
export const getServicesReport = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    const { mes, anio } = req.query;
    const year = parseInt(anio) || new Date().getFullYear();
    const month = parseInt(mes) || new Date().getMonth() + 1;

    // Obtener todos los consumos
    let consumos = [];
    try {
      const consRes = await axios.get(CONSUMPTIONS_URL);
      consumos = consRes.data;
    } catch {
      return res.status(500).json({ error: 'No se pudo conectar con consumptions-service' });
    }

    // Filtrar consumos del mes
    const consumosMes = consumos.filter(c => {
      const fecha = new Date(c.fecha);
      return fecha.getFullYear() === year && (fecha.getMonth() + 1) === month;
    });

    // Agrupar por tipo de servicio
    const porServicio = {};
    consumosMes.forEach(c => {
      const tipo = c.tipo;
      if (!porServicio[tipo]) {
        porServicio[tipo] = { cantidad: 0, ingresoTotal: 0, items: [] };
      }
      porServicio[tipo].cantidad += c.cantidad || 1;
      porServicio[tipo].ingresoTotal += parseFloat(c.monto) * (c.cantidad || 1);
    });

    // Ordenar por ingreso total (más rentable primero)
    const ranking = Object.entries(porServicio)
      .map(([tipo, data]) => ({
        tipo,
        cantidad: data.cantidad,
        ingresoTotal: Math.round(data.ingresoTotal * 100) / 100,
      }))
      .sort((a, b) => b.ingresoTotal - a.ingresoTotal);

    const totalConsumos = ranking.reduce((sum, s) => sum + s.ingresoTotal, 0);

    res.json({
      reporte: 'Servicios Más Rentables',
      periodo: `${month}/${year}`,
      totalConsumos: Math.round(totalConsumos * 100) / 100,
      cantidadTransacciones: consumosMes.length,
      ranking,
    });
  } catch (error) {
    console.error('Error generando reporte de servicios:', error);
    res.status(500).json({ error: 'Error generando reporte' });
  }
};

// --- Reporte general / dashboard ---
export const getDashboardReport = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    let habitaciones = [], reservas = [], facturas = [];

    try { habitaciones = (await axios.get(ROOMS_URL)).data; } catch {}
    try { reservas = (await axios.get(RESERVATIONS_URL)).data; } catch {}
    try { facturas = (await axios.get(BILLING_URL)).data; } catch {}

    const disponibles = habitaciones.filter(h => h.estado === 'Disponible').length;
    const ocupadas = habitaciones.filter(h => h.estado === 'Ocupada').length;
    const sucias = habitaciones.filter(h => h.estado === 'Sucia').length;
    const mantenimiento = habitaciones.filter(h => h.estado === 'Mantenimiento').length;

    const reservasActivas = reservas.filter(r =>
      r.estado === 'Confirmada' || r.estado === 'CheckIn'
    ).length;

    const ingresosMes = facturas
      .filter(f => {
        const fecha = new Date(f.fecha_emision);
        const now = new Date();
        return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
      })
      .reduce((sum, f) => sum + (parseFloat(f.total_final) || 0), 0);

    res.json({
      reporte: 'Dashboard General',
      habitaciones: {
        total: habitaciones.length,
        disponibles,
        ocupadas,
        sucias,
        mantenimiento,
      },
      reservas: {
        total: reservas.length,
        activas: reservasActivas,
        hoy: reservas.filter(r => {
          const hoy = new Date().toISOString().split('T')[0];
          return r.fecha_inicio === hoy;
        }).length,
      },
      facturacion: {
        totalFacturas: facturas.length,
        ingresosMesActual: Math.round(ingresosMes * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error generando dashboard:', error);
    res.status(500).json({ error: 'Error generando reporte' });
  }
};
