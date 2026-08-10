const express = require('express');
const bcrypt = require('bcryptjs');
const Cliente = require('../models/Cliente');
const Administrador = require('../models/Administrador');
const Seguimiento = require('../models/Seguimiento');
const { generarToken, autenticar } = require('../middlewares/auth');

const router = express.Router();

// Verificar token y devolver datos del usuario logueado
router.get('/verify', autenticar, async (req, res) => {
  try {
    const { id, rol } = req.usuario;
    let datos;
    if (rol === 'admin') {
      const admin = await Administrador.findById(id).select('-password');
      if (!admin) return res.status(404).json({ msg: 'Admin no encontrado' });
      datos = { id: admin._id, nombre: admin.nombre, email: admin.email, rol: 'admin' };
    } else {
      const cliente = await Cliente.findById(id).select('-password');
      if (!cliente) return res.status(404).json({ msg: 'Cliente no encontrado' });
      datos = {
        id: cliente._id,
        nombre: cliente.nombre,
        email: cliente.email,
        celular: cliente.celular,
        profesion: cliente.profesion,
        edad: cliente.edad,
        frecuenciaLectura: cliente.frecuenciaLectura,
        preferenciasCategorias: cliente.preferenciasCategorias,
        autores: cliente.autores,
        rol: 'cliente'
      };
    }
    res.json({ usuario: datos });
  } catch (e) {
    res.status(500).json({ msg: 'Error al verificar sesion' });
  }
});

// Registro de cliente
router.post('/registro/cliente', async (req, res) => {
  try {
    const {
      nombre, email, celular, password, profesion, edad,
      frecuenciaLectura, preferenciasCategorias, autores
    } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ msg: 'Nombre, email y password son obligatorios' });
    }
    const existe = await Cliente.findOne({ email: email.toLowerCase() });
    if (existe) return res.status(400).json({ msg: 'El email ya esta registrado' });

    const hash = await bcrypt.hash(password, 10);
    const cliente = await Cliente.create({
      nombre,
      email: email.toLowerCase(),
      celular: celular || '',
      password: hash,
      profesion: profesion || '',
      edad: edad || null,
      frecuenciaLectura: frecuenciaLectura || '',
      preferenciasCategorias: preferenciasCategorias || [],
      autores: autores || []
    });

    // Se crea el seguimiento inicial del cliente (tabla de tracking)
    await Seguimiento.create({ cliente: cliente._id });

    const token = generarToken({ id: cliente._id, email: cliente.email, rol: 'cliente' });
    res.status(201).json({
      token,
      usuario: {
        id: cliente._id,
        nombre: cliente.nombre,
        email: cliente.email,
        celular: cliente.celular,
        profesion: cliente.profesion,
        edad: cliente.edad,
        frecuenciaLectura: cliente.frecuenciaLectura,
        preferenciasCategorias: cliente.preferenciasCategorias,
        autores: cliente.autores,
        rol: 'cliente'
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al registrar cliente' });
  }
});

// Login generico (detecta cliente o admin)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Email y password son obligatorios' });

    let usuario = await Cliente.findOne({ email: email.toLowerCase() });
    let rol = 'cliente';

    if (!usuario) {
      usuario = await Administrador.findOne({ email: email.toLowerCase() });
      rol = 'admin';
    }

    if (!usuario) return res.status(401).json({ msg: 'Credenciales invalidas' });

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) return res.status(401).json({ msg: 'Credenciales invalidas' });

    const token = generarToken({ id: usuario._id, email: usuario.email, rol });
    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol,
        celular: rol === 'cliente' ? usuario.celular : undefined,
        profesion: rol === 'cliente' ? usuario.profesion : undefined,
        edad: rol === 'cliente' ? usuario.edad : undefined,
        frecuenciaLectura: rol === 'cliente' ? usuario.frecuenciaLectura : undefined,
        autores: rol === 'cliente' ? usuario.autores : undefined,
        preferenciasCategorias: rol === 'cliente' ? usuario.preferenciasCategorias : undefined
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al iniciar sesion' });
  }
});

module.exports = router;
