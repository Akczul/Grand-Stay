// ============================================================
// Controlador de Consumos
// Cargos adicionales vinculados a una reserva
// ============================================================

import axios from 'axios';
import { AppDataSource } from '../database.js';
import { Consumo } from '../entities/Consumo.js';

const consumoRepo = () => AppDataSource.getRepository(Consumo);

const RESERVATIONS_URL = process.env.RESERVATIONS_SERVICE_URL || 'http://localhost:3003';

// --- Registrar consumo ---
export const createConsumption = async (req, res) => {
  try {
    const { reservaId, tipo, descripcion, monto, cantidad } = req.body;

    if (!reservaId || !tipo || !descripcion || !monto) {
      return res.status(400).json({ error: 'reservaId, tipo, descripcion y monto son requeridos' });
    }

    // Validar que la reserva existe y está en estado "Activa"
    try {
      const resReserva = await axios.get(`${RESERVATIONS_URL}/${reservaId}`);
      const reserva = resReserva.data;
      
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      // RF-06: Solo permitir consumos en reservas con estado "Activa"
      if (reserva.estado !== 'Activa' && reserva.estado !== 'CheckIn') {
        return res.status(409).json({ 
          error: 'Solo se permiten consumos en reservas con estado "Activa"',
          estado_actual: reserva.estado
        });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }
      console.warn('⚠️ No se pudo validar reserva:', error.message);
      // Permitir continuar con advertencia si el servicio está no disponible
    }

    const consumo = consumoRepo().create({
      reservaId,
      tipo,
      descripcion,
      monto,
      cantidad: cantidad || 1,
    });

    const guardado = await consumoRepo().save(consumo);
    res.status(201).json({ 
      mensaje: 'Consumo registrado',
      consumo: guardado,
      id: guardado.id,
      fecha_registro: guardado.fecha
    });
  } catch (error) {
    console.error('Error registrando consumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar consumos por reserva ---
export const getConsumptionsByReservation = async (req, res) => {
  try {
    const { reservaId } = req.params;
    const consumos = await consumoRepo().find({
      where: { reservaId: parseInt(reservaId) },
      order: { fecha: 'DESC' },
    });

    // Calcular total de consumos
    const total = consumos.reduce((sum, c) => sum + parseFloat(c.monto) * c.cantidad, 0);

    res.json({ consumos, total });
  } catch (error) {
    console.error('Error listando consumos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar todos los consumos ---
export const getAllConsumptions = async (req, res) => {
  try {
    const { tipo } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;

    const consumos = await consumoRepo().find({ where, order: { fecha: 'DESC' } });
    res.json(consumos);
  } catch (error) {
    console.error('Error listando consumos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Obtener consumo por ID ---
export const getConsumptionById = async (req, res) => {
  try {
    const consumo = await consumoRepo().findOneBy({ id: parseInt(req.params.id) });
    if (!consumo) {
      return res.status(404).json({ error: 'Consumo no encontrado' });
    }
    res.json(consumo);
  } catch (error) {
    console.error('Error obteniendo consumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Eliminar consumo ---
export const deleteConsumption = async (req, res) => {
  try {
    const result = await consumoRepo().delete(parseInt(req.params.id));
    if (result.affected === 0) {
      return res.status(404).json({ error: 'Consumo no encontrado' });
    }
    res.json({ mensaje: 'Consumo eliminado' });
  } catch (error) {
    console.error('Error eliminando consumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
