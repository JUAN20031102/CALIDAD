const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_local_2026';

function generarToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Autentica cualquier usuario (cliente o admin)
function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No autorizado' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ msg: 'Token invalido o expirado' });
  }
}

// Solo administradores
function soloAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ msg: 'Acceso restringido a administradores' });
  }
  next();
}

module.exports = { generarToken, autenticar, soloAdmin, JWT_SECRET };
