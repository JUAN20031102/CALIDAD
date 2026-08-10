const express = require('express');
const Libro = require('../models/Libro');
const Cliente = require('../models/Cliente');
const Seguimiento = require('../models/Seguimiento');
const Venta = require('../models/Venta');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

// Ofertas personalizadas segun las preferencias del cliente logueado
router.get('/', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'cliente') return res.json([]);
    const clienteId = req.usuario.id;

    const [cliente, seg, ventas] = await Promise.all([
      Cliente.findById(clienteId),
      Seguimiento.findOne({ cliente: clienteId }),
      Venta.find({ cliente: clienteId })
    ]);

    // Categorias preferidas: registro del cliente + interacciones de seguimiento
    const pesos = {};
    const sumar = (cat, peso) => {
      if (!cat) return;
      pesos[cat] = (pesos[cat] || 0) + peso;
    };

    (cliente?.preferenciasCategorias || []).forEach(c => sumar(c, 2));
    if (seg) {
      (seg.preferenciasCategorias || []).forEach(p => sumar(p.categoria, p.contador || 1));
    }

    // Excluir libros que ya compro
    const excluir = new Set();
    ventas.forEach(v => v.items.forEach(i => {
      if (i.libro) excluir.add(i.libro.toString());
    }));

    const categoriasPreferidas = Object.entries(pesos)
      .map(([categoria, peso]) => ({ categoria, peso }))
      .sort((a, b) => b.peso - a.peso)
      .slice(0, 4)
      .map(p => p.categoria);

    const filtro = { precioOferta: { $ne: null }, stock: { $gt: 0 } };
    if (categoriasPreferidas.length > 0) filtro.categoria = { $in: categoriasPreferidas };

    const ofertas = await Libro.find(filtro)
      .sort({ precioOferta: 1 })
      .limit(8)
      .lean();

    res.json(ofertas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al obtener ofertas' });
  }
});

// Todas las ofertas disponibles (publico, para la pagina de ofertas)
router.get('/todas', async (req, res) => {
  try {
    const ofertas = await Libro.find({ precioOferta: { $ne: null }, stock: { $gt: 0 } })
      .sort({ precioOferta: 1 })
      .limit(12);
    res.json(ofertas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al obtener ofertas' });
  }
});

module.exports = router;
