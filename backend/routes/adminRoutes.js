const express = require('express');
const bcrypt = require('bcryptjs');
const Administrador = require('../models/Administrador');
const Cliente = require('../models/Cliente');
const Seguimiento = require('../models/Seguimiento');
const Venta = require('../models/Venta');
const { autenticar, soloAdmin } = require('../middlewares/auth');
const { validarObjectId, validarBody } = require('../middlewares/validacion');
const Joi = require('joi');

const router = express.Router();

const validarAdmin = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).max(128).required()
});

function escaparCsv(valor) {
  const texto = valor == null ? '' : String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

function expandirColumnas(arr, prefijo, total) {
  const valores = (arr || []);
  const fila = [];
  for (let i = 1; i <= total; i++) {
    fila.push(valores[i - 1] == null ? '' : String(valores[i - 1]));
  }
  return fila;
}

router.use(autenticar, soloAdmin);

router.post('/administradores', validarBody(validarAdmin), async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const admin = await Administrador.create({ nombre, email, password: hash });
    res.status(201).json({ id: admin._id, nombre: admin.nombre, email: admin.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al crear administrador' });
  }
});

router.get('/administradores', async (req, res) => {
  try {
    const admins = await Administrador.find().select('-password');
    res.json(admins);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al listar administradores' });
  }
});

router.get('/clientes', async (req, res) => {
  try {
    const clientes = await Cliente.find().select('-password');
    res.json(clientes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al listar clientes' });
  }
});

router.put('/clientes/:id', validarObjectId, async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
    if (!cliente) return res.status(404).json({ msg: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (e) {
    console.error(e);
    res.status(400).json({ msg: 'Error al actualizar cliente' });
  }
});

router.get('/configuracion/ofertas', async (req, res) => {
  res.json({ emailActivado: false });
});

router.get('/reportes/preferencias', async (req, res) => {
  try {
    const [clientes, seguimientos] = await Promise.all([
      Cliente.find().select('-password'),
      Seguimiento.find()
    ]);
    const segPorCliente = new Map(seguimientos.map(s => [s.cliente.toString(), s]));

    const reporte = clientes.map(c => {
      const seg = segPorCliente.get(c._id.toString());
      const categorias = (seg?.preferenciasCategorias || [])
        .slice()
        .sort((a, b) => b.contador - a.contador)
        .map(p => ({ categoria: p.categoria, contador: p.contador }));

      return {
        _id: c._id,
        nombre: c.nombre,
        email: c.email,
        preferenciasRegistro: c.preferenciasCategorias || [],
        categoriasPreferidas: categorias,
        gustos: (seg?.gustos || []).map(g => g.titulo),
        totalGustos: seg?.gustos?.length || 0,
        totalCompras: seg?.totalCompras || 0,
        gastoTotal: seg?.gastoTotal || 0
      };
    });

    res.json(reporte);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al generar reporte de preferencias' });
  }
});

router.get('/reportes/preferencias/csv', async (req, res) => {
  try {
    const [clientes, ventas] = await Promise.all([
      Cliente.find().select('-password'),
      Venta.find()
    ]);

    const comprasPorCliente = new Map();
    ventas.forEach(v => {
      if (!comprasPorCliente.has(v.cliente.toString())) comprasPorCliente.set(v.cliente.toString(), []);
      comprasPorCliente.get(v.cliente.toString()).push(v);
    });

    const columnas = [
      'NOMBRE', 'EMAIL', 'CELULAR', 'PROFESION', 'EDAD', 'FRECUENCIA_LECTURA',
      'CATEGORIAPREFERENCIA_1', 'CATEGORIAPREFERENCIA_2', 'CATEGORIAPREFERENCIA_3',
      'AUTOR_1', 'AUTOR_2', 'AUTOR_3',
      'GASTO_TOTAL', 'TOTAL_LIBROS'
    ];

    let csv = '\uFEFF';
    csv += columnas.join(',') + '\n';

    clientes.forEach(c => {
      const ventasCliente = comprasPorCliente.get(c._id.toString()) || [];
      const gastoTotal = ventasCliente.reduce((acc, v) => acc + (v.total || 0), 0);
      const totalLibros = ventasCliente.reduce((acc, v) => acc + (v.items || []).reduce((s, i) => s + (i.cantidad || 0), 0), 0);

      const fila = [
        escaparCsv(c.nombre),
        escaparCsv(c.email),
        escaparCsv(c.celular),
        escaparCsv(c.profesion),
        c.edad == null ? '' : c.edad,
        escaparCsv(c.frecuenciaLectura),
        ...expandirColumnas(c.preferenciasCategorias, 'CATEGORIAPREFERENCIA', 3).map(escaparCsv),
        ...expandirColumnas(c.autores, 'AUTOR', 3).map(escaparCsv),
        gastoTotal.toFixed(2),
        totalLibros
      ];
      csv += fila.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="clientes_machine_learning.csv"');
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al generar CSV de clientes' });
  }
});

module.exports = router;