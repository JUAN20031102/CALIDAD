const express = require('express');
const Seguimiento = require('../models/Seguimiento');
const Libro = require('../models/Libro');
const Venta = require('../models/Venta');
const Carrito = require('../models/Carrito');
const { autenticar } = require('../middlewares/auth');
const { validarObjectId } = require('../middlewares/validacion');

const router = express.Router();

// Recomendaciones personalizadas basadas en seguimiento del cliente
router.get('/', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'cliente') return res.json([]);
    const clienteId = req.usuario.id;

    const [seg, ventas, carrito] = await Promise.all([
      Seguimiento.findOne({ cliente: clienteId }),
      Venta.find({ cliente: clienteId }),
      Carrito.findOne({ cliente: clienteId })
    ]);

    const pesos = {};
    const excluir = new Set();

    ventas.forEach(v => v.items.forEach(it => {
      if (it.libro) excluir.add(it.libro.toString());
      if (!it.categoria) return;
      pesos[it.categoria] = (pesos[it.categoria] || 0) + (it.cantidad || 1) * 3;
    }));

    if (seg) {
      seg.gustos.forEach(g => {
        if (g.libro) excluir.add(g.libro.toString());
        if (!g.categoria) return;
        pesos[g.categoria] = (pesos[g.categoria] || 0) + 1;
      });

      seg.preferenciasCategorias.forEach(p => {
        pesos[p.categoria] = (pesos[p.categoria] || 0) + p.contador * 2;
      });
    }

    if (carrito) carrito.items.forEach(i => excluir.add(i.libro.toString()));

    const categoriasOrdenadas = Object.entries(pesos)
      .map(([categoria, peso]) => ({ categoria, peso }))
      .sort((a, b) => b.peso - a.peso);

    if (categoriasOrdenadas.length === 0) return res.json([]);

    const resultado = [];
    const vistos = new Set(excluir);

    for (const { categoria } of categoriasOrdenadas.slice(0, 4)) {
      if (resultado.length >= 8) break;
      const libros = await Libro.find({
        categoria,
        _id: { $nin: [...vistos] },
        stock: { $gt: 0 }
      }).sort({ destacado: -1 }).limit(8 - resultado.length);

      libros.forEach(l => {
        if (!vistos.has(l._id.toString()) && resultado.length < 8) {
          vistos.add(l._id.toString());
          resultado.push(l);
        }
      });
    }

    res.json(resultado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al generar recomendaciones' });
  }
});

module.exports = router;