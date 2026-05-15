// ============================================================
// Controlador de Facturación (esquema unificado grandstay_db)
// facturas (cabecera) + items_factura (detalle).
// Los triggers de BD calculan subtotal/impuestos/total al
// insertar items. Aquí solo orquestamos la creación.
// ============================================================

import axios from 'axios';
import { AppDataSource } from '../database.js';
import { Factura } from '../entities/Factura.js';
import { ItemFactura } from '../entities/ItemFactura.js';

const facturaRepo = () => AppDataSource.getRepository(Factura);
const itemRepo    = () => AppDataSource.getRepository(ItemFactura);

const RESERVATIONS_URL = process.env.RESERVATIONS_SERVICE_URL  || 'http://localhost:3003';
const CONSUMPTIONS_URL = process.env.CONSUMPTIONS_SERVICE_URL  || 'http://localhost:3004';

const METODOS_PAGO  = ['efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'credito_hotel', 'mixto'];
const ESTADOS_PAGO  = ['pendiente', 'pagada', 'parcial', 'anulada'];

// ---------- Helpers ------------------------------------------
const calcularNoches = (fechaEntrada, fechaSalida) => {
  const ms = new Date(fechaSalida).getTime() - new Date(fechaEntrada).getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

const generarNumeroFactura = async () => {
  const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefijo = `F-${hoy}-`;
  const ultima = await facturaRepo()
    .createQueryBuilder('f')
    .where('f.numero_factura LIKE :p', { p: `${prefijo}%` })
    .orderBy('f.id_factura', 'DESC')
    .getOne();
  const seq = ultima ? parseInt(ultima.numero_factura.split('-').pop(), 10) + 1 : 1;
  return `${prefijo}${String(seq).padStart(4, '0')}`;
};

// ---------- POST /generar/:reservaId -------------------------
//   body: { metodo_pago, descuentos?, notas?, incluir_consumos? }
export const generateInvoice = async (req, res) => {
  try {
    const reservaId = parseInt(req.params.reservaId, 10);
    const { metodo_pago, descuentos = 0, notas, incluir_consumos = true } = req.body;

    if (!METODOS_PAGO.includes(metodo_pago)) {
      return res.status(400).json({ error: `metodo_pago inválido. Permitidos: ${METODOS_PAGO.join(', ')}` });
    }

    // 1) Reserva
    let reserva;
    try {
      const r = await axios.get(`${RESERVATIONS_URL}/${reservaId}`);
      reserva = r.data;
    } catch (err) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // 2) Check-in (FK obligatoria de facturas)
    let checkin;
    try {
      const r = await axios.get(`${RESERVATIONS_URL}/${reservaId}/checkin`);
      checkin = r.data;
    } catch (err) {
      return res.status(409).json({
        error: 'No se puede facturar: la reserva no tiene check-in registrado',
      });
    }

    // 3) Consumos pendientes de facturar
    let consumos = [];
    if (incluir_consumos) {
      try {
        const r = await axios.get(`${CONSUMPTIONS_URL}/reserva/${reservaId}`);
        const todos = r.data?.consumos ?? [];
        consumos = todos.filter(c => !c.id_factura && c.estado !== 'cancelado');
      } catch (err) {
        console.warn(`⚠️ No se pudo consultar consumos: ${err.message}`);
      }
    }

    // 4) Cálculo del alojamiento
    const noches = calcularNoches(reserva.fecha_entrada, reserva.fecha_salida);
    const totalAlojamiento = Number(reserva.precio_total || 0);
    const precioNoche = noches > 0 ? Math.round((totalAlojamiento / noches) * 100) / 100 : totalAlojamiento;

    // 5) Numeración
    const numero_factura = await generarNumeroFactura();

    // 6) Insertar cabecera (los totales se recalculan vía trigger)
    const cabecera = facturaRepo().create({
      id_checkin:    checkin.id_checkin,
      id_checkout:   null,
      numero_factura,
      subtotal:      0,
      impuesto_pct:  19.00,
      impuestos:     0,
      descuentos:    Number(descuentos) || 0,
      total:         0,
      metodo_pago,
      moneda:        'COP',
      estado_pago:   'pendiente',
      email_enviado: false,
      notas:         notas || null,
    });
    const facturaCreada = await facturaRepo().save(cabecera);

    // 7) Items: alojamiento + servicios. Triggers recalculan totales.
    const items = [];

    if (totalAlojamiento > 0) {
      items.push(itemRepo().create({
        id_factura:      facturaCreada.id_factura,
        concepto:        `Alojamiento - ${noches} noche(s)`,
        categoria:       'alojamiento',
        cantidad:        noches,
        precio_unitario: precioNoche,
        subtotal:        Math.round(precioNoche * noches * 100) / 100,
      }));
    }

    for (const c of consumos) {
      items.push(itemRepo().create({
        id_factura:      facturaCreada.id_factura,
        concepto:        c.servicio_nombre || `Servicio #${c.id_servicio}`,
        categoria:       'servicio_adicional',
        cantidad:        Number(c.cantidad),
        precio_unitario: Number(c.precio_aplicado),
        subtotal:        Number(c.subtotal),
      }));
    }

    if (items.length === 0) {
      // Sin items → revertir cabecera y rechazar
      await facturaRepo().delete({ id_factura: facturaCreada.id_factura });
      return res.status(400).json({ error: 'No hay conceptos a facturar' });
    }

    await itemRepo().save(items);

    // 8) Marcar consumos como facturados (UPDATE directo)
    if (consumos.length > 0) {
      const ids = consumos.map(c => c.id_consumo_servicio);
      await AppDataSource.query(
        `UPDATE consumo_servicios SET id_factura = ? WHERE id_consumo_servicio IN (${ids.map(() => '?').join(',')})`,
        [facturaCreada.id_factura, ...ids],
      );
    }

    // 9) Recargar factura con totales calculados por trigger
    const facturaFinal = await facturaRepo().findOne({ where: { id_factura: facturaCreada.id_factura } });
    const itemsFinales = await itemRepo().find({ where: { id_factura: facturaCreada.id_factura } });

    res.status(201).json({
      mensaje: 'Factura generada exitosamente',
      factura: facturaFinal,
      items: itemsFinales,
    });
  } catch (error) {
    console.error('Error generando factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---------- GET / -------------------------------------------
export const getInvoices = async (req, res) => {
  try {
    const { estado_pago, desde, hasta } = req.query;
    const qb = facturaRepo().createQueryBuilder('f').orderBy('f.fecha_emision', 'DESC');
    if (estado_pago) qb.andWhere('f.estado_pago = :e', { e: estado_pago });
    if (desde)       qb.andWhere('DATE(f.fecha_emision) >= :d', { d: desde });
    if (hasta)       qb.andWhere('DATE(f.fecha_emision) <= :h', { h: hasta });
    res.json(await qb.getMany());
  } catch (error) {
    console.error('Error listando facturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---------- GET /:id ----------------------------------------
export const getInvoiceById = async (req, res) => {
  try {
    const factura = await facturaRepo().findOne({ where: { id_factura: parseInt(req.params.id, 10) } });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    const items = await itemRepo().find({ where: { id_factura: factura.id_factura }, order: { id_item: 'ASC' } });
    res.json({ factura, items });
  } catch (error) {
    console.error('Error obteniendo factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---------- GET /checkin/:checkinId -------------------------
export const getInvoicesByCheckin = async (req, res) => {
  try {
    const id = parseInt(req.params.checkinId, 10);
    const facturas = await facturaRepo().find({ where: { id_checkin: id }, order: { fecha_emision: 'DESC' } });
    res.json(facturas);
  } catch (error) {
    console.error('Error obteniendo facturas por check-in:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---------- PATCH /:id/pagar --------------------------------
export const payInvoice = async (req, res) => {
  try {
    const factura = await facturaRepo().findOne({ where: { id_factura: parseInt(req.params.id, 10) } });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    if (factura.estado_pago === 'pagada') {
      return res.status(409).json({ error: 'La factura ya está pagada' });
    }
    if (factura.estado_pago === 'anulada') {
      return res.status(409).json({ error: 'No se puede pagar una factura anulada' });
    }
    const { metodo_pago } = req.body;
    if (metodo_pago && !METODOS_PAGO.includes(metodo_pago)) {
      return res.status(400).json({ error: `metodo_pago inválido. Permitidos: ${METODOS_PAGO.join(', ')}` });
    }
    if (metodo_pago) factura.metodo_pago = metodo_pago;
    factura.estado_pago = 'pagada';
    await facturaRepo().save(factura);
    res.json({ mensaje: 'Factura marcada como pagada', factura });
  } catch (error) {
    console.error('Error procesando pago:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---------- PATCH /:id/estado -------------------------------
export const updateInvoiceStatus = async (req, res) => {
  try {
    const factura = await facturaRepo().findOne({ where: { id_factura: parseInt(req.params.id, 10) } });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    const { estado_pago } = req.body;
    if (!ESTADOS_PAGO.includes(estado_pago)) {
      return res.status(400).json({ error: `estado_pago inválido. Permitidos: ${ESTADOS_PAGO.join(', ')}` });
    }
    factura.estado_pago = estado_pago;
    await facturaRepo().save(factura);
    res.json({ mensaje: 'Estado actualizado', factura });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---------- PATCH /:id/anular -------------------------------
export const cancelInvoice = async (req, res) => {
  try {
    if (req.headers['x-user-rol'] !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el Administrador puede anular facturas' });
    }
    const factura = await facturaRepo().findOne({ where: { id_factura: parseInt(req.params.id, 10) } });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    if (factura.estado_pago === 'anulada') {
      return res.status(409).json({ error: 'La factura ya está anulada' });
    }
    factura.estado_pago = 'anulada';
    factura.notas = (factura.notas ? factura.notas + '\n' : '') + `[ANULADA: ${req.body?.motivo || 'Sin motivo'}]`;
    await facturaRepo().save(factura);

    // Liberar consumos asociados (id_factura -> NULL) para refacturación
    await AppDataSource.query(
      'UPDATE consumo_servicios SET id_factura = NULL WHERE id_factura = ?',
      [factura.id_factura],
    );

    res.json({ mensaje: 'Factura anulada', factura });
  } catch (error) {
    console.error('Error anulando factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
