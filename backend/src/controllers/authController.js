const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, Audit } = require('../models');

// Iniciar sesión (Login)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    // Buscar usuario con su rol
    const user = await User.findOne({
      where: { username, activo: true },
      include: [{ model: Role, as: 'rol' }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Verificar contraseña
    const passwordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!passwordCorrect) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Generar Token JWT
    const token = jwt.sign(
      { id_usuario: user.id_usuario, username: user.username, role: user.rol.nombre_rol },
      process.env.JWT_SECRET || 'eco_fruver_secret_key_2026_unimagdalena',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Registrar en auditoría
    await Audit.create({
      id_usuario: user.id_usuario,
      accion: 'LOGIN',
      tabla_afectada: 'USUARIOS',
      descripcion: `El usuario ${user.username} inició sesión en el sistema.`
    });

    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        username: user.username,
        rol: user.rol.nombre_rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
};

// Cerrar sesión (Logout)
exports.logout = async (req, res) => {
  try {
    // Registrar en auditoría antes de invalidar en cliente
    await Audit.create({
      id_usuario: req.user.id_usuario,
      accion: 'LOGOUT',
      tabla_afectada: 'USUARIOS',
      descripcion: `El usuario ${req.user.username} cerró sesión en el sistema.`
    });

    res.json({ message: 'Sesión cerrada exitosamente.' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor al cerrar sesión.' });
  }
};

// Obtener perfil de usuario actual
exports.getProfile = async (req, res) => {
  try {
    res.json({
      user: {
        id_usuario: req.user.id_usuario,
        nombre: req.user.nombre,
        apellido: req.user.apellido,
        username: req.user.username,
        rol: req.user.rol.nombre_rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil.' });
  }
};

// Registrar un nuevo usuario (Solo Administrador)
exports.registerUser = async (req, res) => {
  try {
    const { nombre, apellido, username, password, id_rol } = req.body;

    if (!nombre || !apellido || !username || !password || !id_rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Verificar si el username ya existe
    const userExists = await User.findOne({ where: { username } });
    if (userExists) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
    }

    // Verificar si el rol existe
    const role = await Role.findByPk(id_rol);
    if (!role) {
      return res.status(400).json({ error: 'El rol especificado no existe.' });
    }

    // Cifrar contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Crear usuario
    const newUser = await User.create({
      nombre,
      apellido,
      username,
      password_hash,
      id_rol,
      activo: true
    });

    // Registrar en auditoría
    await Audit.create({
      id_usuario: req.user.id_usuario,
      accion: 'INSERT',
      tabla_afectada: 'USUARIOS',
      descripcion: `Creación del usuario ${username} con rol ${role.nombre_rol}.`
    });

    res.status(201).json({
      message: 'Usuario registrado con éxito.',
      user: {
        id_usuario: newUser.id_usuario,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        username: newUser.username,
        id_rol: newUser.id_rol
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario.' });
  }
};

// Listar todos los usuarios (Solo Administrador)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id_usuario', 'nombre', 'apellido', 'username', 'activo', 'fecha_creacion'],
      include: [{ model: Role, as: 'rol', attributes: ['id_rol', 'nombre_rol'] }]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar usuarios.' });
  }
};
