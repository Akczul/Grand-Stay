// ============================================================
// Controlador de Autenticación (esquema unificado grandstay_db)
// - usuarios.id_usuario / password_hash / id_rol -> roles.nombre
// - JWT payload mantiene { id, nombre, rol } para compat. con
//   middlewares y front-end existentes.
// ============================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../database.js';
import { Usuario } from '../entities/Usuario.js';
import { Rol } from '../entities/Rol.js';

const userRepo = () => AppDataSource.getRepository(Usuario);
const rolRepo  = () => AppDataSource.getRepository(Rol);

const resolverIdRol = async (nombreRol) => {
  if (!nombreRol) return null;
  const rol = await rolRepo()
    .createQueryBuilder('r')
    .where('LOWER(r.nombre) = LOWER(:n)', { n: nombreRol })
    .getOne();
  return rol ? rol.id_rol : null;
};

const sanitize = (u) => {
  if (!u) return u;
  const { password_hash, ...rest } = u;
  return { ...rest, rol: u.rol ? u.rol.nombre : undefined };
};

// --- Registro de nuevo usuario ---
export const register = async (req, res) => {
  try {
    let { nombre, apellido, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password son requeridos' });
    }

    // Si no llega "apellido", lo derivamos partiendo "nombre" por el primer espacio.
    if (!apellido) {
      const partes = String(nombre).trim().split(/\s+/);
      if (partes.length > 1) {
        nombre   = partes[0];
        apellido = partes.slice(1).join(' ');
      } else {
        apellido = '-';
      }
    }

    const existente = await userRepo().findOne({ where: { email } });
    if (existente) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const id_rol = await resolverIdRol(rol || 'Huesped');
    if (!id_rol) {
      return res.status(400).json({ error: `Rol "${rol}" no existe en la tabla roles` });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const nuevo = userRepo().create({
      id_rol,
      nombre,
      apellido,
      email,
      password_hash,
      activo: true,
    });

    const guardado = await userRepo().save(nuevo);
    const conRol = await userRepo().findOne({ where: { id_usuario: guardado.id_usuario } });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: sanitize(conRol),
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Login ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    const usuario = await userRepo().findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Cuenta desactivada, contacte al administrador' });
    }

    usuario.ultimo_acceso = new Date();
    await userRepo().save(usuario);

    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim();
    const rolNombre = usuario.rol ? usuario.rol.nombre : null;

    const token = jwt.sign(
      { id: usuario.id_usuario, nombre: nombreCompleto, rol: rolNombre },
      process.env.JWT_SECRET || 'grand_stay_secret_key_2024',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: sanitize(usuario),
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Perfil del usuario autenticado ---
export const getProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const usuario = await userRepo().findOne({ where: { id_usuario: parseInt(userId, 10) } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(sanitize(usuario));
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Listar usuarios (solo Administrador) ---
export const getUsers = async (req, res) => {
  try {
    const rol = req.headers['x-user-rol'];
    if (rol !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el Administrador puede listar usuarios' });
    }

    const usuarios = await userRepo().find({ order: { id_usuario: 'ASC' } });
    res.json(usuarios.map(sanitize));
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// --- Actualizar usuario ---
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, rol, activo } = req.body;

    const usuario = await userRepo().findOne({ where: { id_usuario: parseInt(id, 10) } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (nombre)   usuario.nombre   = nombre;
    if (apellido) usuario.apellido = apellido;
    if (email)    usuario.email    = email;
    if (activo !== undefined) usuario.activo = activo;

    if (rol) {
      const id_rol = await resolverIdRol(rol);
      if (!id_rol) return res.status(400).json({ error: `Rol "${rol}" no existe` });
      usuario.id_rol = id_rol;
    }

    await userRepo().save(usuario);
    const conRol = await userRepo().findOne({ where: { id_usuario: usuario.id_usuario } });
    res.json({ mensaje: 'Usuario actualizado', usuario: sanitize(conRol) });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
