// ============================================================
// Controlador de Facturación
// Genera factura consolidando reserva + consumos
// ============================================================

import axios from 'axios';
import { AppDataSource } from '../database.js';
import { Factura } from '../entities/Factura.js';

const facturaRepo = () => AppDataSource.getRepository(Factura);

const RESERVATIONS_URL = process.env.RESERVATIONS_SERVICE_URL || 'http://localhost:3003';
const CONSUMPTIONS_URL = process.env.CONSUMPTIONS_SERVICE_URL || 'http://localhost:3004';

const TASA_IMPUESTO = 0.16; // 16% IVA

// --- Generar factura (llamado automáticamente en check-out) ---
export const generateInvoice = async (req, res) => {
  try {
    // Soporta tanto POST /generar/:reservaId como POST /generar { reservaId }
    const reservaId = req.params.reservaId || req.body?.reservaId;

    if (!reservaId) {
      return res.status(400).json({ error: 'reservaId es requerido' });
    }

    // Verificar si ya existe factura para esta reserva
    const existente = await facturaRepo().findOneBy({ reservaId: parseInt(reservaId) });
    if (existente) {
      return res.status(409).json({ error: 'Ya existe una factura para esta reserva', factura: existente });
    }

    // Obtener datos de la reserva
    let reserva;
    try {
      const resReserva = await axios.get(`${RESERVATIONS_URL}/${reservaId}`);
      reserva = resReserva.data;
    } catch {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Obtener consumos de la reserva
    let consumos = [];
    let consumosTotal = 0;
    try {
      const resConsumos = await axios.get(`${CONSUMPTIONS_URL}/reserva/${reservaId}`);
      consumos = resConsumos.data.consumos || [];
      consumosTotal = resConsumos.data.total || 0;
    } catch {
      console.warn('⚠️ No se pudieron obtener consumos, se asume 0');
    }

    // Calcular totales
    const subtotal = parseFloat(reserva.total) || 0;
    const impuestos = (subtotal + consumosTotal) * TASA_IMPUESTO;
    const totalFinal = subtotal + consumosTotal + impuestos;

    const factura = facturaRepo().create({
      reservaId: parseInt(reservaId),
      huespedNombre: reserva.huespedNombre,
      habitacionNumero: reserva.habitacionNumero,
      fecha_inicio: reserva.fecha_inicio,
      fecha_fin: reserva.fecha_fin,
      subtotal,
      consumos_total: consumosTotal,
      impuestos: Math.round(impuestos * 100) / 100,
      total_final: Math.round(totalFinal * 100) / 100,
      detalle_consumos: JSON.stringify(consumos),
      estado: 'Emitida',  // RF-08: Factura emitida al generar
    });

    const guardada = await facturaRepo().save(factura);
    
    res.status(201).json({ 
      mensaje: 'Factura generada',
      factura: guardada,
      id: guardada.id
    });
  } catch (error) {
    console.error('Error generando factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar facturas ---
export const getInvoices = async (req, res) => {
  try {
    const { estado } = req.query;
    const where = {};
    if (estado) where.estado = estado;

    const facturas = await facturaRepo().find({ where, order: { fecha_emision: 'DESC' } });
    res.json(facturas);
  } catch (error) {
    console.error('Error listando facturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Obtener factura por ID ---
export const getInvoiceById = async (req, res) => {
  try {
    const factura = await facturaRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    factura.detalle_consumos = factura.detalle_consumos ? JSON.parse(factura.detalle_consumos) : [];
    res.json(factura);
  } catch (error) {
    console.error('Error obteniendo factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Obtener factura por reservaId ---
export const getInvoiceByReservation = async (req, res) => {
  try {
    const factura = await facturaRepo().findOneBy({ reservaId: parseInt(req.params.reservaId) });
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada para esta reserva' });
    }
    factura.detalle_consumos = factura.detalle_consumos ? JSON.parse(factura.detalle_consumos) : [];
    res.json(factura);
  } catch (error) {
    console.error('Error obteniendo factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Marcar factura como pagada ---
export const payInvoice = async (req, res) => {
  try {
    const factura = await facturaRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const { metodo_pago } = req.body;
    factura.estado = 'Pagada';
    factura.metodo_pago = metodo_pago || 'Efectivo';

    const actualizada = await facturaRepo().save(factura);
    res.json({ mensaje: 'Factura pagada', factura: actualizada });
  } catch (error) {
    console.error('Error pagando factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
