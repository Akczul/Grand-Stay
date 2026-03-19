// ============================================================
// Controlador de Consumos
// Cargos adicionales vinculados a una reserva
// ============================================================

import { AppDataSource } from '../database.js';
import { Consumo } from '../entities/Consumo.js';

const consumoRepo = () => AppDataSource.getRepository(Consumo);
const VALID_TIPOS = new Set(['restaurante', 'spa', 'lavanderia', 'minibar', 'otros']);

// --- Registrar consumo ---
export const createConsumption = async (req, res) => {
  try {
    const {
      reservaId,
      concepto,
      tipo,
      descripcion,
      monto,
      cantidad,
      fecha,
      estado,
    } = req.body;

    const conceptoNormalizado = (concepto || tipo || '').trim();
    const fechaConsumo = fecha || new Date().toISOString().split('T')[0];
    const tipoNormalizado = (tipo || '').toLowerCase();

    if (!reservaId || !conceptoNormalizado || monto === undefined || monto === null) {
      return res.status(400).json({
        error: 'reservaId, concepto (o tipo) y monto son requeridos',
      });
    }

    if (Number.isNaN(new Date(fechaConsumo).getTime())) {
      return res.status(400).json({ error: 'fecha inválida, formato esperado YYYY-MM-DD' });
    }

    if (tipoNormalizado && !VALID_TIPOS.has(tipoNormalizado)) {
      return res.status(400).json({ error: `tipo inválido. Valores permitidos: ${[...VALID_TIPOS].join(', ')}` });
    }

    if (parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'monto debe ser mayor a 0' });
    }

    // Buscar consumo duplicado en el mismo día por reserva/concepto/monto
    const duplicado = await consumoRepo()
      .createQueryBuilder('c')
      .where('c.reservaId = :reservaId', { reservaId: parseInt(reservaId) })
      .andWhere('(c.concepto = :concepto OR c.tipo = :concepto)', { concepto: conceptoNormalizado })
      .andWhere('DATE(c.fecha) = DATE(:fecha)', { fecha: fechaConsumo })
      .andWhere('c.monto = :monto', { monto: parseFloat(monto) })
      .getOne();

    if (duplicado) {
      return res.status(409).json({ error: 'Consumo duplicado detectado para hoy' });
    }

    const consumo = consumoRepo().create({
      reservaId: parseInt(reservaId),
      concepto: conceptoNormalizado,
      tipo: tipoNormalizado || 'otros',
      descripcion: descripcion || conceptoNormalizado,
      monto: parseFloat(monto),
      cantidad: cantidad || 1,
      fecha: fechaConsumo,
      estado: estado || 'Pendiente',
    });

    const guardado = await consumoRepo().save(consumo);
    res.status(201).json({ mensaje: 'Consumo registrado', consumo: guardado });
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
    const total = consumos.reduce((sum, c) => sum + parseFloat(c.monto) * (c.cantidad || 1), 0);

    res.json({ consumos, total });
  } catch (error) {
    console.error('Error listando consumos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar todos los consumos ---
export const getAllConsumptions = async (req, res) => {
  try {
    const { tipo, concepto, estado } = req.query;
    const qb = consumoRepo().createQueryBuilder('c');

    if (tipo) qb.andWhere('c.tipo = :tipo', { tipo: tipo.toLowerCase() });
    if (concepto) qb.andWhere('c.concepto = :concepto', { concepto });
    if (estado) qb.andWhere('c.estado = :estado', { estado });

    qb.orderBy('c.fecha', 'DESC');

    const consumos = await qb.getMany();
    res.json(consumos);
  } catch (error) {
    console.error('Error listando consumos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Filtrar consumos por rango de fechas/tipo/concepto/reserva ---
export const filterConsumptions = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, reservaId, concepto, tipo, estado } = req.query;
    const qb = consumoRepo().createQueryBuilder('c');

    if (fecha_inicio && Number.isNaN(new Date(fecha_inicio).getTime())) {
      return res.status(400).json({ error: 'fecha_inicio inválida. Use formato YYYY-MM-DD' });
    }

    if (fecha_fin && Number.isNaN(new Date(fecha_fin).getTime())) {
      return res.status(400).json({ error: 'fecha_fin inválida. Use formato YYYY-MM-DD' });
    }

    if (fecha_inicio && fecha_fin && new Date(fecha_fin) < new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'fecha_fin no puede ser menor que fecha_inicio' });
    }

    if (fecha_inicio) qb.andWhere('DATE(c.fecha) >= DATE(:fecha_inicio)', { fecha_inicio });
    if (fecha_fin) qb.andWhere('DATE(c.fecha) <= DATE(:fecha_fin)', { fecha_fin });
    if (reservaId) qb.andWhere('c.reservaId = :reservaId', { reservaId: parseInt(reservaId) });
    if (concepto) qb.andWhere('c.concepto = :concepto', { concepto });
    if (tipo) qb.andWhere('c.tipo = :tipo', { tipo: tipo.toLowerCase() });
    if (estado) qb.andWhere('c.estado = :estado', { estado });

    qb.orderBy('c.fecha', 'DESC').addOrderBy('c.id', 'DESC');

    const consumos = await qb.getMany();
    const total = consumos.reduce((sum, c) => sum + parseFloat(c.monto) * (c.cantidad || 1), 0);

    res.json({
      total: Math.round(total * 100) / 100,
      cantidad: consumos.length,
      consumos,
    });
  } catch (error) {
    console.error('Error filtrando consumos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Validar límite de consumos por reserva ---
export const validateLimit = async (req, res) => {
  try {
    const { reservaId, limite = 5000 } = req.body;

    if (!reservaId) {
      return res.status(400).json({ error: 'reservaId es requerido' });
    }

    const totalConsumos = await consumoRepo()
      .createQueryBuilder('c')
      .where('c.reservaId = :reservaId', { reservaId: parseInt(reservaId) })
      .select('SUM(c.monto * c.cantidad)', 'total')
      .getRawOne();

    const totalActual = parseFloat(totalConsumos?.total) || 0;
    const limiteNumerico = parseFloat(limite);
    const disponible = limiteNumerico - totalActual;

    return res.json({
      reservaId: parseInt(reservaId),
      limite: limiteNumerico,
      consumido: Math.round(totalActual * 100) / 100,
      disponible: Math.round(disponible * 100) / 100,
      excedido: disponible < 0,
    });
  } catch (error) {
    console.error('Error validando límite:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Auditoría de consumos ---
export const getAuditLog = async (req, res) => {
  try {
    const consumos = await consumoRepo().find({ order: { createdAt: 'DESC' } });

    const auditoria = consumos.map(c => ({
      id: c.id,
      reservaId: c.reservaId,
      concepto: c.concepto || c.tipo,
      monto: parseFloat(c.monto),
      fecha: c.fecha,
      creado_en: c.createdAt,
      actualizado_en: c.updatedAt || c.createdAt,
      estado: c.estado || 'Pendiente',
    }));

    res.json(auditoria);
  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
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
