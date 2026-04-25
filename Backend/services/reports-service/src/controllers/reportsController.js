// ============================================================
// Controlador de Reportes (esquema unificado grandstay_db)
// Usa vistas SQL y queries agregadas. Solo Administrador.
// ============================================================

import { AppDataSource } from '../database.js';

const checkAdmin = (req, res) => {
  if (req.headers['x-user-rol'] !== 'Administrador') {
    res.status(403).json({ error: 'Solo el Administrador puede acceder a reportes' });
    return false;
  }
  return true;
};

// --- GET /ocupacion?mes=&anio= -------------------------------
export const getOccupancyReport = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;
    const anio = parseInt(req.query.anio, 10) || new Date().getFullYear();
    const mes  = parseInt(req.query.mes,  10) || (new Date().getMonth() + 1);

    const desde = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const hasta = new Date(anio, mes, 0).toISOString().slice(0, 10); // último día del mes
    const diasMes = new Date(anio, mes, 0).getDate();

    const [totalHabRow] = await AppDataSource.query(
      "SELECT COUNT(*) AS total FROM habitaciones WHERE activo = TRUE",
    );
    const totalHabitaciones = Number(totalHabRow.total);
    const capacidadTotal = totalHabitaciones * diasMes;

    const reservas = await AppDataSource.query(
      `SELECT r.id_reserva, r.estado, r.fecha_entrada, r.fecha_salida,
              th.nombre AS tipo_habitacion
         FROM reservas r
         JOIN tipos_habitacion th ON r.id_tipo_habitacion = th.id_tipo
        WHERE r.fecha_entrada <= ? AND r.fecha_salida >= ?`,
      [hasta, desde],
    );

    let nochesOcupadas = 0;
    let canceladas = 0;
    const porTipo = {};

    for (const r of reservas) {
      if (r.estado === 'cancelada' || r.estado === 'no_show') { canceladas++; continue; }
      const ini = new Date(Math.max(new Date(r.fecha_entrada), new Date(desde)));
      const fin = new Date(Math.min(new Date(r.fecha_salida), new Date(`${hasta}T23:59:59`)));
      const noches = Math.max(0, Math.ceil((fin - ini) / (1000 * 60 * 60 * 24)));
      nochesOcupadas += noches;

      const t = r.tipo_habitacion || 'Otro';
      if (!porTipo[t]) porTipo[t] = { reservas: 0, noches: 0 };
      porTipo[t].reservas++;
      porTipo[t].noches += noches;
    }

    const tasa = capacidadTotal > 0 ? Math.round((nochesOcupadas / capacidadTotal) * 10000) / 100 : 0;

    res.json({
      reporte: 'Ocupación Mensual',
      periodo: `${mes}/${anio}`,
      diasMes,
      totalHabitaciones,
      capacidadTotal,
      nochesOcupadas,
      tasaOcupacion: `${tasa}%`,
      totalReservas: reservas.length,
      reservasCanceladas: canceladas,
      ocupacionPorTipo: porTipo,
    });
  } catch (error) {
    console.error('Error generando reporte de ocupación:', error);
    res.status(500).json({ error: 'Error generando reporte' });
  }
};

// --- GET /ingresos?mes=&anio= --------------------------------
export const getRevenueReport = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;
    const anio = parseInt(req.query.anio, 10) || new Date().getFullYear();
    const mes  = parseInt(req.query.mes,  10) || (new Date().getMonth() + 1);

    const [tot] = await AppDataSource.query(
      `SELECT
          COUNT(*) AS total_facturas,
          COALESCE(SUM(f.subtotal), 0) AS subtotal,
          COALESCE(SUM(f.impuestos), 0) AS impuestos,
          COALESCE(SUM(f.descuentos), 0) AS descuentos,
          COALESCE(SUM(f.total), 0) AS total,
          SUM(CASE WHEN f.estado_pago='pagada' THEN f.total ELSE 0 END) AS total_pagado,
          SUM(CASE WHEN f.estado_pago='pendiente' THEN f.total ELSE 0 END) AS total_pendiente
         FROM facturas f
        WHERE YEAR(f.fecha_emision) = ? AND MONTH(f.fecha_emision) = ?
          AND f.estado_pago <> 'anulada'`,
      [anio, mes],
    );

    const porCategoria = await AppDataSource.query(
      `SELECT i.categoria, COUNT(*) AS items, COALESCE(SUM(i.subtotal), 0) AS total
         FROM items_factura i
         JOIN facturas f ON f.id_factura = i.id_factura
        WHERE YEAR(f.fecha_emision) = ? AND MONTH(f.fecha_emision) = ?
          AND f.estado_pago <> 'anulada'
        GROUP BY i.categoria
        ORDER BY total DESC`,
      [anio, mes],
    );

    const porMetodoPago = await AppDataSource.query(
      `SELECT metodo_pago, COUNT(*) AS facturas, COALESCE(SUM(total), 0) AS total
         FROM facturas
        WHERE YEAR(fecha_emision) = ? AND MONTH(fecha_emision) = ?
          AND estado_pago <> 'anulada'
        GROUP BY metodo_pago`,
      [anio, mes],
    );

    res.json({
      reporte: 'Ingresos Mensuales',
      periodo: `${mes}/${anio}`,
      ...tot,
      porCategoria,
      porMetodoPago,
    });
  } catch (error) {
    console.error('Error generando reporte de ingresos:', error);
    res.status(500).json({ error: 'Error generando reporte' });
  }
};

// --- GET /servicios?mes=&anio= -------------------------------
export const getServicesReport = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;
    const anio = parseInt(req.query.anio, 10) || new Date().getFullYear();
    const mes  = parseInt(req.query.mes,  10) || (new Date().getMonth() + 1);

    const ranking = await AppDataSource.query(
      `SELECT s.id_servicio, s.nombre, s.categoria,
              COUNT(c.id_consumo_servicio) AS veces_consumido,
              COALESCE(SUM(c.cantidad), 0) AS unidades,
              COALESCE(SUM(c.subtotal), 0) AS ingresos
         FROM servicios_adicionales s
         LEFT JOIN consumo_servicios c
                ON c.id_servicio = s.id_servicio
               AND YEAR(c.fecha) = ?
               AND MONTH(c.fecha) = ?
               AND c.estado <> 'cancelado'
        GROUP BY s.id_servicio, s.nombre, s.categoria
        ORDER BY ingresos DESC`,
      [anio, mes],
    );

    res.json({ reporte: 'Servicios Más Rentables', periodo: `${mes}/${anio}`, ranking });
  } catch (error) {
    console.error('Error generando reporte de servicios:', error);
    res.status(500).json({ error: 'Error generando reporte' });
  }
};

// --- GET /dashboard ------------------------------------------
export const getDashboard = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;

    const [estados] = [
      await AppDataSource.query(
        `SELECT estado, COUNT(*) AS total FROM habitaciones WHERE activo = TRUE GROUP BY estado`,
      ),
    ];
    const [ocupacionHoy] = await AppDataSource.query(`SELECT * FROM v_ocupacion_hoy`);
    const reservasHoy = await AppDataSource.query(
      `SELECT COUNT(*) AS total FROM reservas WHERE DATE(fecha_entrada) = CURDATE() AND estado IN ('confirmada','pendiente')`,
    );
    const checkoutsHoy = await AppDataSource.query(
      `SELECT COUNT(*) AS total FROM reservas WHERE DATE(fecha_salida) = CURDATE() AND estado = 'confirmada'`,
    );
    const stockCritico = await AppDataSource.query(`SELECT * FROM v_stock_critico LIMIT 10`);

    res.json({
      habitaciones_por_estado: estados,
      ocupacion_hoy: ocupacionHoy || { total_checkins_hoy: 0, ingresos_hoy: 0 },
      reservas_hoy: reservasHoy[0]?.total ?? 0,
      checkouts_hoy: checkoutsHoy[0]?.total ?? 0,
      stock_critico: stockCritico,
    });
  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({ error: 'Error obteniendo dashboard' });
  }
};

// --- GET /disponibilidad -------------------------------------
export const getDisponibilidad = async (req, res) => {
  try {
    const rows = await AppDataSource.query(`SELECT * FROM v_disponibilidad`);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// --- GET /reservas-activas -----------------------------------
export const getReservasActivas = async (req, res) => {
  try {
    const rows = await AppDataSource.query(`SELECT * FROM v_reservas_activas`);
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo reservas activas:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// --- GET /auditoria?desde=&hasta=&accion=&tabla= -------------
export const getAuditoria = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;
    const { desde, hasta, accion, tabla, id_usuario, limite = 200 } = req.query;
    const where = [];
    const params = [];
    if (desde)       { where.push('DATE(l.fecha_hora) >= ?'); params.push(desde); }
    if (hasta)       { where.push('DATE(l.fecha_hora) <= ?'); params.push(hasta); }
    if (accion)      { where.push('l.accion = ?');            params.push(accion); }
    if (tabla)       { where.push('l.tabla_afectada = ?');    params.push(tabla); }
    if (id_usuario)  { where.push('l.id_usuario = ?');        params.push(parseInt(id_usuario, 10)); }
    const sql = `SELECT l.*, u.nombre AS usuario_nombre, u.email AS usuario_email
                   FROM log_auditoria l
                   LEFT JOIN usuarios u ON u.id_usuario = l.id_usuario
                  ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                  ORDER BY l.fecha_hora DESC
                  LIMIT ?`;
    params.push(parseInt(limite, 10));
    res.json(await AppDataSource.query(sql, params));
  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// --- POST /guardar  →  Persiste un reporte en la tabla reportes
export const saveReport = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;
    const { tipo_reporte, titulo, periodo_inicio, periodo_fin, parametros, formato = 'PDF', ruta_archivo } = req.body;
    if (!tipo_reporte || !titulo || !periodo_inicio || !periodo_fin) {
      return res.status(400).json({ error: 'tipo_reporte, titulo, periodo_inicio y periodo_fin son requeridos' });
    }
    const generado_por = parseInt(req.headers['x-user-id'], 10);
    if (!generado_por) return res.status(401).json({ error: 'Usuario no autenticado' });

    const result = await AppDataSource.query(
      `INSERT INTO reportes (generado_por, tipo_reporte, titulo, periodo_inicio, periodo_fin, parametros, ruta_archivo, formato)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generado_por, tipo_reporte, titulo, periodo_inicio, periodo_fin,
       parametros ? JSON.stringify(parametros) : null, ruta_archivo || null, formato],
    );
    res.status(201).json({ mensaje: 'Reporte guardado', id_reporte: result.insertId });
  } catch (error) {
    console.error('Error guardando reporte:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

// --- GET /historial ------------------------------------------
export const getHistorial = async (req, res) => {
  try {
    if (!checkAdmin(req, res)) return;
    const rows = await AppDataSource.query(
      `SELECT r.*, u.nombre AS generado_por_nombre
         FROM reportes r
         LEFT JOIN usuarios u ON u.id_usuario = r.generado_por
        ORDER BY r.created_at DESC
        LIMIT 100`,
    );
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};
