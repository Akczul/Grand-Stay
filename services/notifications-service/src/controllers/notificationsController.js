// ============================================================
// Controlador de Notificaciones
// Envía emails usando Nodemailer con plantillas HTML
// ============================================================

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {
  confirmacionReservaTemplate,
  codigoAccesoTemplate,
  facturaElectronicaTemplate,
} from '../templates/emailTemplates.js';

dotenv.config();

// Configurar transporter de Nodemailer
// En desarrollo usa Ethereal; en producción usa tu SMTP real
let transporter;

const initMailer = async () => {
  // Si no hay credenciales configuradas, crear cuenta de prueba Ethereal
  if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('tu_usuario')) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Usando cuenta de prueba Ethereal:', testAccount.user);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
};

// Inicializar mailer al cargar el módulo
initMailer().catch(console.error);

// Mapa de plantillas y asuntos por tipo de notificación
const templateMap = {
  confirmacion_reserva: {
    subject: 'Confirmación de Reserva - Grand-Stay Hotel',
    template: confirmacionReservaTemplate,
  },
  codigo_acceso: {
    subject: 'Tu Código de Acceso - Grand-Stay Hotel',
    template: codigoAccesoTemplate,
  },
  factura_electronica: {
    subject: 'Factura Electrónica - Grand-Stay Hotel',
    template: facturaElectronicaTemplate,
  },
};

// --- POST /notify  →  Endpoint principal para enviar emails ---
export const sendNotification = async (req, res) => {
  try {
    const { tipo, destinatario, datos } = req.body;

    if (!tipo || !datos) {
      return res.status(400).json({ error: 'tipo y datos son requeridos' });
    }

    const config = templateMap[tipo];
    if (!config) {
      return res.status(400).json({
        error: `Tipo de notificación inválido. Tipos válidos: ${Object.keys(templateMap).join(', ')}`,
      });
    }

    // Si no hay destinatario, solo loguear (no falla)
    if (!destinatario) {
      console.warn('⚠️ No se proporcionó destinatario, notificación registrada pero no enviada');
      return res.json({ mensaje: 'Notificación registrada (sin destinatario)', enviado: false });
    }

    // Generar HTML usando la plantilla correspondiente
    const html = config.template(datos);

    // Enviar email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Grand-Stay Hotel" <noreply@grandstay.com>',
      to: destinatario,
      subject: config.subject,
      html,
    });

    console.log(`📧 Email enviado: ${info.messageId}`);

    // En desarrollo con Ethereal, mostrar URL de vista previa
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Vista previa: ${previewUrl}`);
    }

    res.json({
      mensaje: 'Notificación enviada exitosamente',
      enviado: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
    });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({ error: 'Error enviando notificación' });
  }
};

// --- GET /status  →  Estado del servicio de email ---
export const getStatus = async (req, res) => {
  try {
    const verified = await transporter.verify();
    res.json({
      service: 'notifications-service',
      smtp: verified ? 'conectado' : 'desconectado',
      tipos: Object.keys(templateMap),
    });
  } catch (error) {
    res.json({
      service: 'notifications-service',
      smtp: 'error',
      error: error.message,
    });
  }
};
