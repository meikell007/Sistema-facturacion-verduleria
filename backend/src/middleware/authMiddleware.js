const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

// Middleware para verificar token JWT
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eco_fruver_secret_key_2026_unimagdalena');
    
    // Buscar usuario y su rol
    const user = await User.findOne({
      where: { id_usuario: decoded.id_usuario, activo: true },
      include: [{ model: Role, as: 'rol' }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo.' });
    }

    // Adjuntar usuario al objeto request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token no válido o expirado.' });
  }
};

// Middleware para autorizar roles específicos (RBAC)
const authorize = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(403).json({ error: 'Permisos insuficientes. Rol no especificado.' });
    }

    const tienePermiso = rolesPermitidos.includes(req.user.rol.nombre_rol);
    if (!tienePermiso) {
      return res.status(403).json({ error: `Permisos insuficientes. Se requiere rol: ${rolesPermitidos.join(' o ')}` });
    }

    next();
  };
};

module.exports = {
  auth,
  authorize
};
