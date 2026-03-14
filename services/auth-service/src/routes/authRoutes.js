// ============================================================
// Rutas de Autenticación
// POST /register  → Registro de usuario
// POST /login     → Login y obtención de JWT
// GET  /profile   → Perfil del usuario autenticado
// GET  /users     → Listar usuarios (solo Admin)
// PUT  /users/:id → Actualizar usuario
// ============================================================

import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  getUsers,
  updateUser,
} from '../controllers/authController.js';

const router = Router();

// Rutas públicas (no requieren JWT en el gateway)
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas (el gateway valida el JWT antes de llegar aquí)
router.get('/profile', getProfile);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);

export default router;
