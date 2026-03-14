// ============================================================
// Controlador de Autenticación
// Maneja registro, login y gestión de usuarios
// ============================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../database.js';
import { Usuario } from '../entities/Usuario.js';

const userRepo = () => AppDataSource.getRepository(Usuario);

// --- Registro de nuevo usuario ---
export const register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son requeridos' });
    }

    // Verificar si el email ya existe
    const existente = await userRepo().findOneBy({ email });
    if (existente) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Encriptar contraseña con bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const nuevoUsuario = userRepo().create({
      nombre,
      email,
      password: hashedPassword,
      rol: rol || 'Huesped',
    });

    const guardado = await userRepo().save(nuevoUsuario);

    // Responder sin exponer la contraseña
    const { password: _, ...usuarioSinPassword } = guardado;
    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: usuarioSinPassword,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Login de usuario ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    // Buscar usuario por email
    const usuario = await userRepo().findOneBy({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Cuenta desactivada, contacte al administrador' });
    }

    // Generar token JWT con payload: { id, nombre, rol }
    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      process.env.JWT_SECRET || 'grand_stay_secret_key_2024',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const { password: _, ...usuarioSinPassword } = usuario;
    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: usuarioSinPassword,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Obtener perfil del usuario autenticado ---
export const getProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const usuario = await userRepo().findOneBy({ id: parseInt(userId) });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { password: _, ...usuarioSinPassword } = usuario;
    res.json(usuarioSinPassword);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar todos los usuarios (solo Administrador) ---
export const getUsers = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el Administrador puede listar usuarios' });
    }

    const usuarios = await userRepo().find();
    const sinPasswords = usuarios.map(({ password, ...rest }) => rest);
    res.json(sinPasswords);
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Actualizar usuario ---
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, activo } = req.body;

    const usuario = await userRepo().findOneBy({ id: parseInt(id) });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (nombre) usuario.nombre = nombre;
    if (email) usuario.email = email;
    if (rol) usuario.rol = rol;
    if (activo !== undefined) usuario.activo = activo;

    const actualizado = await userRepo().save(usuario);
    const { password: _, ...sinPassword } = actualizado;
    res.json({ mensaje: 'Usuario actualizado', usuario: sinPassword });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
