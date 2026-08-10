const express = require('express');
const Venta = require('../models/Venta');
const Carrito = require('../models/Carrito');
const Libro = require('../models/Libro');
const Seguimiento = require('../models/Seguimiento');
const Cliente = require('../models/Cliente');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

function escaparCsv(valor) {
  const texto = valor == null ? '' : String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

function formatearFecha(fecha) {
  const d = new Date(fecha);
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}-${mes}-${dia}`;
}

// Realizar compra (checkout del carrito)
router.post('/checkout', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'cliente') return res.status(403).json({ msg: 'Solo clientes' });

    const carrito = await Carrito.findOne({ cliente: req.usuario.id });
    if (!carrito || carrito.items.length === 0) {
      return res.status(400).json({ msg: 'El carrito esta vacio' });
    }

    // Validar stock y descontar
    for (const item of carrito.items) {
      const libro = await Libro.findById(item.libro);
      if (!libro) return res.status(404).json({ msg: `Libro ${item.titulo} no encontrado` });
      if (libro.stock < item.cantidad) {
        return res.status(400).json({ msg: `Stock insuficiente de "${item.titulo}" (disponible: ${libro.stock})` });
      }
    }
    for (const item of carrito.items) {
      await Libro.findByIdAndUpdate(item.libro, { $inc: { stock: -item.cantidad } });
    }

    const total = carrito.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

    const venta = await Venta.create({
      cliente: req.usuario.id,
      items: carrito.items.map(i => ({
        libro: i.libro,
        titulo: i.titulo,
        autor: i.autor,
        categoria: i.categoria,
        portada: i.portada,
        precio: i.precio,
        cantidad: i.cantidad
      })),
      total
    });

    // Actualizar seguimiento con la compra
    let seg = await Seguimiento.findOne({ cliente: req.usuario.id });
    if (!seg) seg = await Seguimiento.create({ cliente: req.usuario.id });
    seg.compras.push({ venta: venta._id, total, fecha: venta.fecha });
    seg.gastoTotal += total;
    seg.totalCompras += 1;
    seg.actualizadoEn = new Date();
    await seg.save();

    // Vaciar carrito
    carrito.items = [];
    carrito.actualizadoEn = new Date();
    await carrito.save();

    res.status(201).json(venta);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Error al realizar la compra' });
  }
});

// Compras del cliente logueado
router.get('/mias', autenticar, async (req, res) => {
  try {
    const ventas = await Venta.find({ cliente: req.usuario.id }).sort({ fecha: -1 });
    res.json(ventas);
  } catch (e) {
    res.status(500).json({ msg: 'Error al obtener compras' });
  }
});

// Todas las ventas (solo admin)
router.get('/todas', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ msg: 'Solo administradores' });
    const ventas = await Venta.find().sort({ fecha: -1 });
    res.json(ventas);
  } catch (e) {
    res.status(500).json({ msg: 'Error al obtener ventas' });
  }
});

// Reporte general (solo admin)
router.get('/reporte', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ msg: 'Solo administradores' });
    const ventas = await Venta.find();
    const totalVendido = ventas.reduce((a, v) => a + v.total, 0);
    const librosVendidos = ventas.reduce((a, v) => a + v.items.reduce((x, i) => x + i.cantidad, 0), 0);
    const ventasMes = (await Venta.find({ fecha: { $gte: new Date(new Date().setDate(1)) } })).length;

    // Top libros mas vendidos
    const mapa = {};
    ventas.forEach(v => v.items.forEach(i => {
      if (!mapa[i.titulo]) mapa[i.titulo] = { titulo: i.titulo, cantidad: 0, ingreso: 0 };
      mapa[i.titulo].cantidad += i.cantidad;
      mapa[i.titulo].ingreso += i.precio * i.cantidad;
    }));
    const topLibros = Object.values(mapa).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    // Ventas por categoria (para grafica)
    const porCategoria = {};
    ventas.forEach(v => v.items.forEach(i => {
      const cat = i.categoria || 'Sin categoría';
      if (!porCategoria[cat]) porCategoria[cat] = { categoria: cat, cantidad: 0, ingreso: 0 };
      porCategoria[cat].cantidad += i.cantidad;
      porCategoria[cat].ingreso += i.precio * i.cantidad;
    }));
    const ventasPorCategoria = Object.values(porCategoria).sort((a, b) => b.ingreso - a.ingreso);

    // Ventas de los ultimos 30 dias (para grafica de tendencia)
    const dias = new Map();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      dias.set(formatearFecha(d), { fecha: formatearFecha(d), total: 0, cantidad: 0 });
    }
    ventas.forEach(v => {
      const clave = formatearFecha(v.fecha);
      if (!dias.has(clave)) return;
      const dia = dias.get(clave);
      dia.total += v.total;
      dia.cantidad += v.items.reduce((x, i) => x + i.cantidad, 0);
    });
    const ventasPorDia = [...dias.values()];

    res.json({ totalVentas: ventas.length, totalVendido, librosVendidos, ventasMes, topLibros, ventasPorCategoria, ventasPorDia });
  } catch (e) {
    res.status(500).json({ msg: 'Error al obtener reporte' });
  }
});

// Descargar reporte de ventas en CSV (solo admin)
router.get('/reporte/csv', autenticar, async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') return res.status(403).json({ msg: 'Solo administradores' });
    const ventas = await Venta.find().sort({ fecha: 1 });

    let csv = '\uFEFF'; // BOM para que Excel lea bien los acentos
    csv += [
      'ID Venta', 'Fecha', 'Cliente', 'Email', 'Libro', 'Categoria', 'Autor',
      'Precio', 'Cantidad', 'Subtotal', 'Total venta', 'Estado'
    ].join(',') + '\n';

    const clientes = await Cliente.find().select('_id nombre email');
    const porId = new Map(clientes.map(c => [c._id.toString(), c]));

    ventas.forEach(v => {
      const cli = porId.get(v.cliente?.toString()) || {};
      v.items.forEach(i => {
        csv += [
          escaparCsv(v._id), escaparCsv(v.fecha ? formatearFecha(v.fecha) : ''),
          escaparCsv(v.nombreCliente || cli.nombre || ''), escaparCsv(cli.email || ''),
          escaparCsv(i.titulo), escaparCsv(i.categoria), escaparCsv(i.autor),
          i.precio, i.cantidad, (i.precio * i.cantidad).toFixed(2),
          v.total.toFixed(2), escaparCsv(v.estado)
        ].join(',') + '\n';
      });
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_ventas.csv"');
    res.send(csv);
  } catch (e) {
    res.status(500).json({ msg: 'Error al generar CSV de ventas' });
  }
});

module.exports = router;
