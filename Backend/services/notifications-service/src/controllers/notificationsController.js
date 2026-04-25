// ============================================================
// Controlador de Notificaciones (esquema unificado grandstay_db)
// - Envía emails con Nodemailer (Ethereal en dev, SMTP real en prod)
// - Persiste cada intento en `notificaciones` (estado, intentos, fecha_envio)
// ============================================================

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { AppDataSource } from '../database.js';
import { Notificacion } from '../entities/Notificacion.js';
import {
  confirmacionReservaTemplate,
  codigoAccesoTemplate,
  facturaElectronicaTemplate,
} from '../templates/emailTemplates.js';

dotenv.config();

const notifRepo = () => AppDataSource.getRepository(Notificacion);

// --- Mailer ----------------------------------------------------
let transporter;

const initMailer = async () => {
  if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('tu_usuario')) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('📧 Usando cuenta de prueba Ethereal:', testAccount.user);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
};

initMailer().catch(console.error);

// --- Mapa tipo → plantilla / evento BD ------------------------
const templateMap = {
  confirmacion_reserva: {
    subject:  'Confirmación de Reserva - Grand-Stay Hotel',
    template: confirmacionReservaTemplate,
    evento:   'confirmacion_reserva',
  },
  codigo_acceso: {
    subject:  'Tu Código de Acceso - Grand-Stay Hotel',
    template: codigoAccesoTemplate,
    evento:   'recordatorio_checkin',
  },
  factura_electronica: {
    subject:  'Factura Electrónica - Grand-Stay Hotel',
    template: facturaElectronicaTemplate,
    evento:   'factura',
  },
};

// --- POST /notify ---------------------------------------------
export const sendNotification = async (req, res) => {
  try {
    const { tipo, destinatario, datos, id_reserva, id_huesped } = req.body;

    if (!tipo || !datos) {
      return res.status(400).json({ error: 'tipo y datos son requeridos' });
    }
    const config = templateMap[tipo];
    if (!config) {
      return res.status(400).json({
        error: `Tipo de notificación inválido. Tipos válidos: ${Object.keys(templateMap).join(', ')}`,
      });
    }

    const html = config.template(datos);

    // Crear registro pendiente (si la BD está disponible)
    let notif = null;
    if (AppDataSource.isInitialized && destinatario) {
      try {
        notif = notifRepo().create({
          id_reserva: id_reserva || null,
          id_huesped: id_huesped || null,
          tipo: 'email',
          evento: config.evento,
          destinatario,
          asunto: config.subject,
          cuerpo: html,
          estado: 'pendiente',
          intentos: 0,
        });
        notif = await notifRepo().save(notif);
      } catch (err) {
        console.warn(`⚠️ No se pudo persistir notificación: ${err.message}`);
      }
    }

    if (!destinatario) {
      console.warn('⚠️ No se proporcionó destinatario, notificación registrada pero no enviada');
      return res.json({ mensaje: 'Notificación registrada (sin destinatario)', enviado: false });
    }

    // Enviar
    let info, previewUrl = null, errMsg = null;
    try {
      info = await transporter.sendMail({
        from:    process.env.SMTP_FROM || '"Grand-Stay Hotel" <noreply@grandstay.com>',
        to:      destinatario,
        subject: config.subject,
        html,
      });
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Email enviado: ${info.messageId}`);
      if (previewUrl) console.log(`🔗 Vista previa: ${previewUrl}`);
    } catch (err) {
      errMsg = err.message;
      console.error('Error enviando email:', err);
    }

    // Actualizar registro
    if (notif) {
      try {
        notif.intentos = (notif.intentos || 0) + 1;
        notif.estado = errMsg ? 'fallida' : 'enviada';
        notif.fecha_envio = new Date();
        await notifRepo().save(notif);
      } catch (err) {
        console.warn(`⚠️ No se pudo actualizar notificación: ${err.message}`);
      }
    }

    if (errMsg) return res.status(502).json({ error: 'Error enviando notificación', detalle: errMsg });

    res.json({
      mensaje:    'Notificación enviada exitosamente',
      enviado:    true,
      messageId:  info.messageId,
      previewUrl: previewUrl || null,
      id_notificacion: notif?.id_notificacion ?? null,
    });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({ error: 'Error enviando notificación' });
  }
};

// --- GET /status ----------------------------------------------
export const getStatus = async (_req, res) => {
  try {
    const verified = await transporter.verify();
    res.json({
      service: 'notifications-service',
      smtp:    verified ? 'conectado' : 'desconectado',
      db:      AppDataSource.isInitialized ? 'conectada' : 'desconectada',
      tipos:   Object.keys(templateMap),
    });
  } catch (error) {
    res.json({
      service: 'notifications-service',
      smtp:    'error',
      db:      AppDataSource.isInitialized ? 'conectada' : 'desconectada',
      error:   error.message,
    });
  }
};

// --- GET /historial -------------------------------------------
export const getHistorial = async (req, res) => {
  try {
    if (!AppDataSource.isInitialized) {
      return res.status(503).json({ error: 'Persistencia no disponible' });
    }
    const { id_reserva, id_huesped, estado, evento } = req.query;
    const qb = notifRepo().createQueryBuilder('n').orderBy('n.created_at', 'DESC').limit(100);
    if (id_reserva) qb.andWhere('n.id_reserva = :r', { r: parseInt(id_reserva, 10) });
    if (id_huesped) qb.andWhere('n.id_huesped = :h', { h: parseInt(id_huesped, 10) });
    if (estado)     qb.andWhere('n.estado = :e',     { e: estado });
    if (evento)     qb.andWhere('n.evento = :ev',    { ev: evento });
    res.json(await qb.getMany());
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
