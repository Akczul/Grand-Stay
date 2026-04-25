// ============================================================
// Plantillas HTML para emails - Grand-Stay
// 3 tipos: confirmación de reserva, código de acceso, factura
// ============================================================

// Estilos comunes para todas las plantillas
const baseStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
  .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #1e3a5f, #2d6a9f); color: #ffffff; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; }
  .header p { margin: 5px 0 0; opacity: 0.9; }
  .body { padding: 30px; color: #333; }
  .body h2 { color: #1e3a5f; margin-top: 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .info-table td { padding: 10px 15px; border-bottom: 1px solid #eee; }
  .info-table td:first-child { font-weight: bold; color: #555; width: 40%; }
  .highlight { background: #f0f7ff; border-left: 4px solid #2d6a9f; padding: 15px; margin: 15px 0; border-radius: 4px; }
  .code-box { background: #1e3a5f; color: #fff; text-align: center; padding: 20px; font-size: 32px; letter-spacing: 8px; font-weight: bold; border-radius: 8px; margin: 15px 0; }
  .total-box { background: #e8f5e9; border: 2px solid #4caf50; padding: 15px; text-align: center; border-radius: 8px; margin: 15px 0; }
  .total-box .amount { font-size: 28px; color: #2e7d32; font-weight: bold; }
  .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; }
`;

// --- Plantilla: Confirmación de Reserva ---
export const confirmacionReservaTemplate = (datos) => `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Grand-Stay Hotel</h1>
      <p>Confirmación de Reserva</p>
    </div>
    <div class="body">
      <h2>¡Hola ${datos.nombre}!</h2>
      <p>Tu reserva ha sido confirmada exitosamente. Aquí están los detalles:</p>

      <table class="info-table">
        <tr><td>Habitación</td><td>${datos.habitacion} (${datos.tipo})</td></tr>
        <tr><td>Fecha de llegada</td><td>${datos.fecha_inicio}</td></tr>
        <tr><td>Fecha de salida</td><td>${datos.fecha_fin}</td></tr>
        <tr><td>Noches</td><td>${datos.noches}</td></tr>
      </table>

      <div class="highlight">
        <strong>Tu código de acceso:</strong>
        <div class="code-box">${datos.codigoAcceso}</div>
        <p style="margin: 5px 0 0; font-size: 13px; color: #666;">
          Presenta este código en recepción al momento del check-in.
        </p>
      </div>

      <div class="total-box">
        <p style="margin: 0; color: #555;">Total de la estadía</p>
        <div class="amount">$${parseFloat(datos.total).toFixed(2)} MXN</div>
      </div>

      <p style="color: #666; font-size: 14px;">
        Si necesitas modificar tu reserva, contacta a recepción o responde este correo.
      </p>
    </div>
    <div class="footer">
      <p>Grand-Stay Hotel &copy; ${new Date().getFullYear()} - Sistema de Gestión Hotelera</p>
      <p>Este es un correo automático, por favor no responda directamente.</p>
    </div>
  </div>
</body>
</html>
`;

// --- Plantilla: Código de Acceso ---
export const codigoAccesoTemplate = (datos) => `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Grand-Stay Hotel</h1>
      <p>Código de Acceso</p>
    </div>
    <div class="body">
      <h2>¡Hola ${datos.nombre}!</h2>
      <p>Tu código de acceso para la habitación <strong>${datos.habitacion}</strong> es:</p>

      <div class="code-box">${datos.codigoAcceso}</div>

      <div class="highlight">
        <p style="margin: 0;"><strong>Instrucciones:</strong></p>
        <ul style="margin: 10px 0 0; padding-left: 20px;">
          <li>Presenta este código en la recepción al llegar</li>
          <li>El código es válido durante toda tu estadía</li>
          <li>No compartas este código con terceros</li>
        </ul>
      </div>

      <table class="info-table">
        <tr><td>Habitación</td><td>${datos.habitacion}</td></tr>
        <tr><td>Check-in</td><td>${datos.fecha_inicio}</td></tr>
        <tr><td>Check-out</td><td>${datos.fecha_fin}</td></tr>
      </table>
    </div>
    <div class="footer">
      <p>Grand-Stay Hotel &copy; ${new Date().getFullYear()} - Sistema de Gestión Hotelera</p>
    </div>
  </div>
</body>
</html>
`;

// --- Plantilla: Factura Electrónica ---
export const facturaElectronicaTemplate = (datos) => `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Grand-Stay Hotel</h1>
      <p>Factura Electrónica</p>
    </div>
    <div class="body">
      <h2>Factura para ${datos.nombre}</h2>
      <p>Gracias por hospedarte con nosotros. A continuación el detalle de tu factura:</p>

      <table class="info-table">
        <tr><td>Habitación</td><td>${datos.habitacion}</td></tr>
        <tr><td>Período</td><td>${datos.fecha_inicio} al ${datos.fecha_fin}</td></tr>
        <tr><td>Fecha de emisión</td><td>${datos.fecha_emision || new Date().toLocaleDateString()}</td></tr>
      </table>

      <h3 style="color: #1e3a5f; border-bottom: 2px solid #eee; padding-bottom: 8px;">Desglose</h3>

      <table class="info-table">
        <tr><td>Subtotal (Hospedaje)</td><td style="text-align:right;">$${parseFloat(datos.subtotal).toFixed(2)}</td></tr>
        <tr><td>Consumos adicionales</td><td style="text-align:right;">$${parseFloat(datos.consumos_total).toFixed(2)}</td></tr>
        <tr><td>IVA (16%)</td><td style="text-align:right;">$${(parseFloat(datos.total_final) - parseFloat(datos.subtotal) - parseFloat(datos.consumos_total)).toFixed(2)}</td></tr>
      </table>

      <div class="total-box">
        <p style="margin: 0; color: #555;">Total Final</p>
        <div class="amount">$${parseFloat(datos.total_final).toFixed(2)} MXN</div>
      </div>

      <p style="color: #666; font-size: 13px; margin-top: 20px;">
        Este documento es una representación electrónica de tu factura.
        Para cualquier aclaración, contacta a nuestro departamento de facturación.
      </p>
    </div>
    <div class="footer">
      <p>Grand-Stay Hotel &copy; ${new Date().getFullYear()} - Sistema de Gestión Hotelera</p>
      <p>RFC: GSH-240101-ABC | Dirección: Av. Principal #100, Ciudad</p>
    </div>
  </div>
</body>
</html>
`;
