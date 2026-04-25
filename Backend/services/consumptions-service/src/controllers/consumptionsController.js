// ============================================================
// Controlador de Consumos (esquema unificado grandstay_db)
// consumo_servicios: id_reserva + id_habitacion + id_servicio
// ============================================================

import axios from 'axios';
import { AppDataSource } from '../database.js';
import { Consumo } from '../entities/Consumo.js';
import { ServicioAdicional } from '../entities/ServicioAdicional.js';

const consumoRepo  = () => AppDataSource.getRepository(Consumo);
const servicioRepo = () => AppDataSource.getRepository(ServicioAdicional);

const RESERVATIONS_URL = process.env.RESERVATIONS_SERVICE_URL || 'http://localhost:3003';

const CATEGORIAS = ['spa', 'restaurante', 'transporte', 'lavanderia', 'room_service', 'entretenimiento', 'tour', 'otro'];

// --- Catálogo: listar servicios disponibles -------------------
export const getServicios = async (req, res) => {
  try {
    const { categoria } = req.query;
    const where = { activo: true };
    if (categoria) where.categoria = categoria;
    const servicios = await servicioRepo().find({ where, order: { categoria: 'ASC', nombre: 'ASC' } });
    res.json(servicios);
  } catch (error) {
    console.error('Error listando servicios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Crear servicio ------------------------------------------
export const createServicio = async (req, res) => {
  try {
    if (req.headers['x-user-rol'] !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el Administrador puede crear servicios' });
    }
    const { nombre, descripcion, categoria, precio, duracion_minutos, requiere_reserva } = req.body;
    if (!nombre || !precio || !categoria) {
      return res.status(400).json({ error: 'nombre, categoria y precio son requeridos' });
    }
    if (!CATEGORIAS.includes(categoria)) {
      return res.status(400).json({ error: `categoria inválida. Permitidas: ${CATEGORIAS.join(', ')}` });
    }
    const nuevo = servicioRepo().create({
      nombre,
      descripcion: descripcion || null,
      categoria,
      precio,
      duracion_minutos: duracion_minutos || null,
      requiere_reserva: !!requiere_reserva,
      disponible: true,
      activo: true,
    });
    res.status(201).json(await servicioRepo().save(nuevo));
  } catch (error) {
    console.error('Error creando servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Registrar consumo ---------------------------------------
export const createConsumption = async (req, res) => {
  try {
    const {
      id_reserva,
      id_habitacion: id_habitacion_in,
      id_servicio,
      cantidad = 1,
      precio_aplicado: precio_in,
      notas,
    } = req.body;

    if (!id_reserva || !id_servicio) {
      return res.status(400).json({ error: 'id_reserva e id_servicio son requeridos' });
    }
    if (Number(cantidad) <= 0) return res.status(400).json({ error: 'cantidad debe ser mayor a 0' });

    // Validar reserva confirmada y obtener id_habitacion si no se envió
    let id_habitacion = id_habitacion_in;
    try {
      const r = await axios.get(`${RESERVATIONS_URL}/${id_reserva}`);
      const reserva = r.data;
      if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
      if (reserva.estado !== 'confirmada') {
        return res.status(409).json({
          error: 'Solo se permiten consumos en reservas confirmadas',
          estado_actual: reserva.estado,
        });
      }
      id_habitacion = id_habitacion || reserva.id_habitacion;
    } catch (err) {
      if (err.response?.status === 404) return res.status(404).json({ error: 'Reserva no encontrada' });
      console.warn(`⚠️ No se pudo validar reserva: ${err.message}`);
    }

    if (!id_habitacion) {
      return res.status(400).json({ error: 'id_habitacion no se pudo determinar (la reserva no tiene check-in?)' });
    }

    const servicio = await servicioRepo().findOne({ where: { id_servicio: parseInt(id_servicio, 10) } });
    if (!servicio || !servicio.activo || !servicio.disponible) {
      return res.status(404).json({ error: 'Servicio no encontrado o no disponible' });
    }

    const precio = Number(precio_in ?? servicio.precio);
    if (precio <= 0) return res.status(400).json({ error: 'precio_aplicado debe ser mayor a 0' });

    const subtotal = Math.round(Number(cantidad) * precio * 100) / 100;

    const consumo = consumoRepo().create({
      id_reserva: parseInt(id_reserva, 10),
      id_habitacion: parseInt(id_habitacion, 10),
      id_servicio: servicio.id_servicio,
      cantidad,
      precio_aplicado: precio,
      subtotal,
      estado: 'solicitado',
      notas: notas || null,
    });
    const guardado = await consumoRepo().save(consumo);
    res.status(201).json({ mensaje: 'Consumo registrado', consumo: guardado });
  } catch (error) {
    console.error('Error registrando consumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar consumos por reserva -----------------------------
export const getConsumptionsByReservation = async (req, res) => {
  try {
    const id = parseInt(req.params.reservaId, 10);
    const consumos = await consumoRepo()
      .createQueryBuilder('c')
      .leftJoin(ServicioAdicional, 's', 's.id_servicio = c.id_servicio')
      .addSelect(['s.nombre', 's.categoria'])
      .where('c.id_reserva = :id', { id })
      .orderBy('c.fecha', 'DESC')
      .getRawAndEntities();

    const lista = consumos.entities.map((e, i) => ({
      ...e,
      servicio_nombre:    consumos.raw[i]?.s_nombre,
      servicio_categoria: consumos.raw[i]?.s_categoria,
    }));
    const total = lista.reduce((s, c) => s + Number(c.subtotal || 0), 0);
    res.json({ consumos: lista, total: Math.round(total * 100) / 100 });
  } catch (error) {
    console.error('Error listando consumos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar todos --------------------------------------------
export const getAllConsumptions = async (req, res) => {
  try {
    const { id_servicio, estado } = req.query;
    const qb = consumoRepo().createQueryBuilder('c').orderBy('c.fecha', 'DESC');
    if (id_servicio) qb.andWhere('c.id_servicio = :s', { s: parseInt(id_servicio, 10) });
    if (estado)      qb.andWhere('c.estado = :e', { e: estado });
    res.json(await qb.getMany());
  } catch (error) {
    console.error('Error listando consumos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Filtro por rango ----------------------------------------
export const filterConsumptions = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, id_reserva, id_servicio, estado } = req.query;
    const qb = consumoRepo().createQueryBuilder('c').orderBy('c.fecha', 'DESC');

    if (fecha_inicio) qb.andWhere('DATE(c.fecha) >= :fi', { fi: fecha_inicio });
    if (fecha_fin)    qb.andWhere('DATE(c.fecha) <= :ff', { ff: fecha_fin });
    if (id_reserva)   qb.andWhere('c.id_reserva = :r', { r: parseInt(id_reserva, 10) });
    if (id_servicio)  qb.andWhere('c.id_servicio = :s', { s: parseInt(id_servicio, 10) });
    if (estado)       qb.andWhere('c.estado = :e', { e: estado });

    const consumos = await qb.getMany();
    const total = consumos.reduce((s, c) => s + Number(c.subtotal || 0), 0);
    res.json({ cantidad: consumos.length, total: Math.round(total * 100) / 100, consumos });
  } catch (error) {
    console.error('Error filtrando consumos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Cambiar estado de un consumo ----------------------------
export const updateConsumptionStatus = async (req, res) => {
  try {
    const consumo = await consumoRepo().findOne({ where: { id_consumo_servicio: parseInt(req.params.id, 10) } });
    if (!consumo) return res.status(404).json({ error: 'Consumo no encontrado' });

    const estadosValidos = ['solicitado', 'en_proceso', 'completado', 'cancelado'];
    const { estado } = req.body;
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: `estado inválido. Permitidos: ${estadosValidos.join(', ')}` });
    }
    consumo.estado = estado;
    await consumoRepo().save(consumo);
    res.json({ mensaje: 'Estado actualizado', consumo });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Validar límite ------------------------------------------
export const validateLimit = async (req, res) => {
  try {
    const { id_reserva, limite = 1000000 } = req.body;
    if (!id_reserva) return res.status(400).json({ error: 'id_reserva es requerido' });

    const totalRow = await consumoRepo()
      .createQueryBuilder('c')
      .where('c.id_reserva = :r', { r: parseInt(id_reserva, 10) })
      .andWhere('c.estado <> :cancel', { cancel: 'cancelado' })
      .select('COALESCE(SUM(c.subtotal), 0)', 'total')
      .getRawOne();

    const consumido = Number(totalRow?.total) || 0;
    const lim = Number(limite);
    res.json({
      id_reserva: parseInt(id_reserva, 10),
      limite: lim,
      consumido: Math.round(consumido * 100) / 100,
      disponible: Math.round((lim - consumido) * 100) / 100,
      excedido: consumido > lim,
    });
  } catch (error) {
    console.error('Error validando límite:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Obtener uno ---------------------------------------------
export const getConsumptionById = async (req, res) => {
  try {
    const consumo = await consumoRepo().findOne({ where: { id_consumo_servicio: parseInt(req.params.id, 10) } });
    if (!consumo) return res.status(404).json({ error: 'Consumo no encontrado' });
    res.json(consumo);
  } catch (error) {
    console.error('Error obteniendo consumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Eliminar (sólo si no facturado) -------------------------
export const deleteConsumption = async (req, res) => {
  try {
    const consumo = await consumoRepo().findOne({ where: { id_consumo_servicio: parseInt(req.params.id, 10) } });
    if (!consumo) return res.status(404).json({ error: 'Consumo no encontrado' });
    if (consumo.id_factura) {
      return res.status(409).json({ error: 'No se puede eliminar un consumo ya facturado' });
    }
    await consumoRepo().delete({ id_consumo_servicio: consumo.id_consumo_servicio });
    res.json({ mensaje: 'Consumo eliminado' });
  } catch (error) {
    console.error('Error eliminando consumo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
