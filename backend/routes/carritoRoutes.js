const express = require('express');
const Carrito = require('../models/Carrito');
const Libro = require('../models/Libro');
const Seguimiento = require('../models/Seguimiento');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

// Todas las rutas requieren sesion de cliente
router.use(autenticar, (req, res, next) => {
  if (req.usuario.rol !== 'cliente') return res.status(403).json({ msg: 'Solo clientes' });
  next();
});

async function registrarSeguimiento(clienteId, libro, cantidad, tipo) {
  let seg = await Seguimiento.findOne({ cliente: clienteId });
  if (!seg) seg = await Seguimiento.create({ cliente: clienteId });

  if (tipo === 'agregar') {
    // Historial de agregados al carrito
    seg.agregadosCarrito.push({
      libro: libro._id,
      titulo: libro.titulo,
      categoria: libro.categoria,
      autor: libro.autor,
      portada: libro.portada,
      precio: libro.precio,
      cantidad
    });
    // Limitar historial a 100 registros
    if (seg.agregadosCarrito.length > 100) seg.agregadosCarrito.shift();
  }

  // Preferencias por categoria (incrementa contador)
  const pref = seg.preferenciasCategorias.find(p => p.categoria === libro.categoria);
  if (pref) pref.contador += cantidad;
  else seg.preferenciasCategorias.push({ categoria: libro.categoria, contador: cantidad });

  seg.actualizadoEn = new Date();
  await seg.save();
  return seg;
}

// Obtener carrito del cliente
router.get('/', async (req, res) => {
  try {
    let carrito = await Carrito.findOne({ cliente: req.usuario.id });
    if (!carrito) {
      carrito = await Carrito.create({ cliente: req.usuario.id, items: [] });
    }
    res.json(carrito);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al obtener carrito' });
  }
});

// Agregar libro al carrito
router.post('/agregar', async (req, res) => {
  try {
    const { libroId, cantidad } = req.body;
    const libro = await Libro.findById(libroId);
    if (!libro) return res.status(404).json({ msg: 'Libro no encontrado' });
    const cant = Math.max(1, parseInt(cantidad) || 1);

    let carrito = await Carrito.findOne({ cliente: req.usuario.id });
    if (!carrito) carrito = await Carrito.create({ cliente: req.usuario.id, items: [] });

    const item = carrito.items.find(i => i.libro.toString() === libroId);
    if (item) item.cantidad += cant;
    else carrito.items.push({
      libro: libro._id,
      titulo: libro.titulo,
      autor: libro.autor,
      categoria: libro.categoria,
      portada: libro.portada,
      precio: libro.precio,
      cantidad: cant
    });

    carrito.actualizadoEn = new Date();
    await carrito.save();

    // Registrar en la tabla de seguimiento
    await registrarSeguimiento(req.usuario.id, libro, cant, 'agregar');

    res.json(carrito);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al agregar al carrito' });
  }
});

// Actualizar cantidad
router.put('/item/:libroId', async (req, res) => {
  try {
    const { cantidad } = req.body;
    const carrito = await Carrito.findOne({ cliente: req.usuario.id });
    if (!carrito) return res.status(404).json({ msg: 'Carrito no encontrado' });

    const item = carrito.items.find(i => i.libro.toString() === req.params.libroId);
    if (!item) return res.status(404).json({ msg: 'Item no encontrado' });

    if (cantidad <= 0) carrito.items = carrito.items.filter(i => i.libro.toString() !== req.params.libroId);
    else item.cantidad = cantidad;

    carrito.actualizadoEn = new Date();
    await carrito.save();
    res.json(carrito);
  } catch (e) {
    res.status(400).json({ msg: 'Error al actualizar carrito' });
  }
});

// Eliminar item del carrito
router.delete('/item/:libroId', async (req, res) => {
  try {
    const carrito = await Carrito.findOne({ cliente: req.usuario.id });
    if (!carrito) return res.status(404).json({ msg: 'Carrito no encontrado' });
    carrito.items = carrito.items.filter(i => i.libro.toString() !== req.params.libroId);
    carrito.actualizadoEn = new Date();
    await carrito.save();
    res.json(carrito);
  } catch (e) {
    res.status(400).json({ msg: 'Error al eliminar item' });
  }
});

// Vaciar carrito
router.delete('/', async (req, res) => {
  try {
    const carrito = await Carrito.findOne({ cliente: req.usuario.id });
    if (carrito) {
      carrito.items = [];
      carrito.actualizadoEn = new Date();
      await carrito.save();
    }
    res.json({ msg: 'Carrito vaciado' });
  } catch (e) {
    res.status(400).json({ msg: 'Error al vaciar carrito' });
  }
});

module.exports = router;
