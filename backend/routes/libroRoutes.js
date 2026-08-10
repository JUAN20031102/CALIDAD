const express = require('express');
const Libro = require('../models/Libro');
const { autenticar, soloAdmin } = require('../middlewares/auth');

const router = express.Router();

// Listar libros con filtros de busqueda
router.get('/', async (req, res) => {
  try {
    const { q, categoria, destacado } = req.query;
    const filtro = {};

    if (q) {
      filtro.$or = [
        { titulo: { $regex: q, $options: 'i' } },
        { autor: { $regex: q, $options: 'i' } },
        { categoria: { $regex: q, $options: 'i' } },
        { isbn: { $regex: q, $options: 'i' } }
      ];
    }
    if (categoria && categoria !== 'Todas') filtro.categoria = categoria;
    if (destacado === 'true') filtro.destacado = true;

    const libros = await Libro.find(filtro).sort({ titulo: 1 });
    res.json(libros);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al listar libros' });
  }
});

// Obtener categorias disponibles
router.get('/categorias', async (req, res) => {
  try {
    const cats = await Libro.distinct('categoria');
    res.json(cats);
  } catch (e) {
    res.status(500).json({ msg: 'Error al obtener categorias' });
  }
});

// Obtener autores disponibles
router.get('/autores', async (req, res) => {
  try {
    const autores = await Libro.distinct('autor');
    res.json(autores.sort());
  } catch (e) {
    res.status(500).json({ msg: 'Error al obtener autores' });
  }
});

// Detalle de un libro
router.get('/:id', async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id);
    if (!libro) return res.status(404).json({ msg: 'Libro no encontrado' });
    res.json(libro);
  } catch (e) {
    res.status(400).json({ msg: 'Id invalido' });
  }
});

// Crear libro (solo admin)
router.post('/', autenticar, soloAdmin, async (req, res) => {
  try {
    const { titulo, autor, isbn, categoria, descripcion, precio, stock, portada, destacado, precioOferta } = req.body;
    if (!titulo || !autor || !isbn || !categoria || precio == null) {
      return res.status(400).json({ msg: 'Faltan campos obligatorios' });
    }
    const existe = await Libro.findOne({ isbn });
    if (existe) return res.status(400).json({ msg: 'Ya existe un libro con ese ISBN' });
    const libro = await Libro.create({
      titulo, autor, isbn, categoria, descripcion,
      precio, stock: stock || 0, portada, destacado: destacado || false,
      precioOferta: precioOferta || null
    });
    res.status(201).json(libro);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al crear libro' });
  }
});

// Actualizar libro (solo admin)
router.put('/:id', autenticar, soloAdmin, async (req, res) => {
  try {
    const libro = await Libro.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!libro) return res.status(404).json({ msg: 'Libro no encontrado' });
    res.json(libro);
  } catch (e) {
    res.status(400).json({ msg: 'Error al actualizar libro' });
  }
});

// Eliminar libro (solo admin)
router.delete('/:id', autenticar, soloAdmin, async (req, res) => {
  try {
    await Libro.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Libro eliminado' });
  } catch (e) {
    res.status(400).json({ msg: 'Error al eliminar libro' });
  }
});

module.exports = router;
