const express = require('express');
const Seguimiento = require('../models/Seguimiento');
const Libro = require('../models/Libro');
const { autenticar, soloAdmin } = require('../middlewares/auth');
const { validarSeguimientoGusto, validarObjectId, validarBody } = require('../middlewares/validacion');

const router = express.Router();

// Registrar libro que le gusta al cliente
router.post('/gusto', autenticar, validarBody(validarSeguimientoGusto), async (req, res) => {
  try {
    if (req.usuario.rol !== 'cliente') return res.status(403).json({ msg: 'Solo clientes' });
    const { libroId, gustar } = req.body;
    const libro = await Libro.findById(libroId);
    if (!libro) return res.status(404).json({ msg: 'Libro no encontrado' });

    let seg = await Seguimiento.findOne({ cliente: req.usuario.id });
    if (!seg) seg = await Seguimiento.create({ cliente: req.usuario.id });

    const yaExiste = seg.gustos.some(g => g.libro.toString() === libroId);

    if (gustar) {
      if (!yaExiste) {
        seg.gustos.push({
          libro: libro._id,
          titulo: libro.titulo,
          categoria: libro.categoria,
          autor: libro.autor,
          portada: libro.portada
        });
      }
      const pref = seg.preferenciasCategorias.find(p => p.categoria === libro.categoria);
      if (pref) pref.contador += 1;
      else seg.preferenciasCategorias.push({ categoria: libro.categoria, contador: 1 });
    } else {
      seg.gustos = seg.gustos.filter(g => g.libro.toString() !== libroId);
    }

    seg.actualizadoEn = new Date();
    await seg.save();

    const estado = gustar ? { gustado: true, gustos: seg.gustos.length } : { gustado: false, gustos: seg.gustos.length };
    res.json(estado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al registrar gusto' });
  }
});

// Obtener seguimiento del cliente logueado
router.get('/mio', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'cliente') return res.status(403).json({ msg: 'Solo clientes' });
    let seg = await Seguimiento.findOne({ cliente: req.usuario.id })
      .populate('gustos.libro')
      .populate('agregadosCarrito.libro')
      .populate('compras.venta');
    if (!seg) seg = await Seguimiento.create({ cliente: req.usuario.id });

    seg.preferenciasCategorias.sort((a, b) => b.contador - a.contador);
    res.json(seg);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al obtener seguimiento' });
  }
});

// Ver si el cliente ya "gusta" un libro
router.get('/gusto/:libroId', autenticar, validarObjectId, async (req, res) => {
  try {
    if (req.usuario.rol !== 'cliente') return res.status(403).json({ msg: 'Solo clientes' });
    const seg = await Seguimiento.findOne({ cliente: req.usuario.id });
    const gustado = !!(seg && seg.gustos.some(g => g.libro.toString() === req.params.libroId));
    res.json({ gustado });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error' });
  }
});

// Ver seguimiento de todos los clientes (solo admin)
router.get('/todos', autenticar, soloAdmin, async (req, res) => {
  try {
    const registros = await Seguimiento.find()
      .populate('cliente', 'nombre email')
      .populate('gustos.libro', 'titulo autor categoria portada');
    res.json(registros);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al obtener seguimientos' });
  }
});

// Ver seguimiento de un cliente específico (solo admin)
router.get('/:clienteId', autenticar, soloAdmin, validarObjectId, async (req, res) => {
  try {
    const seg = await Seguimiento.findOne({ cliente: req.params.clienteId })
      .populate('cliente', 'nombre email')
      .populate('gustos.libro')
      .populate('agregadosCarrito.libro')
      .populate('compras.venta');
    if (!seg) return res.status(404).json({ msg: 'Sin seguimiento para ese cliente' });
    res.json(seg);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al obtener seguimiento' });
  }
});

module.exports = router;