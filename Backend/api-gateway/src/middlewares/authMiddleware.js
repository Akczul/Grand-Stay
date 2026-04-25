// ============================================================
// Middleware de Autenticación JWT - API Gateway
// Valida el token en cada petición entrante y extrae el payload
// ============================================================

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'grand_stay_secret_key_2024';

export const authMiddleware = (req, res, next) => {
  // Obtener token del header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    // Adjuntar datos del usuario a la petición
    req.user = {
      id: decoded.id,
      nombre: decoded.nombre,
      rol: decoded.rol,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado, inicie sesión nuevamente' });
    }
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar roles específicos
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`,
      });
    }
    next();
  };
};
