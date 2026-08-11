const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');

const Cliente = require('../models/Cliente');
const Venta = require('../models/Venta');
const Libro = require('../models/Libro');
const { autenticar, soloAdmin } = require('../middlewares/auth');
const { validarBody } = require('../middlewares/validacion');

const router = express.Router();

const ML_DIR = path.join(__dirname, '..', 'ml');
const MODELOS_DIR = path.join(ML_DIR, 'modelos');
const DATA_DIR = path.join(ML_DIR, 'data');
const PROGRESO_FILE = path.join(MODELOS_DIR, 'progreso.json');
const ESTADO_FILE = path.join(MODELOS_DIR, 'estado.json');
const DATASET_FILE = path.join(DATA_DIR, 'dataset.csv');
const LIBROS_FILE = path.join(DATA_DIR, 'libros.json');
const INPUT_FILE = path.join(DATA_DIR, 'input.json');
const PREDICCIONES_FILE = path.join(MODELOS_DIR, 'predicciones.csv');

const JSON_COLS = ['NOMBRE', 'EMAIL', 'CELULAR', 'PROFESION', 'EDAD', 'FRECUENCIA_LECTURA',
  'CAT1', 'CAT2', 'CAT3', 'AUT1', 'AUT2', 'AUT3', 'GASTO_TOTAL', 'TOTAL_LIBROS',
  'CATEGORIA_COMPRA', 'AUTOR_COMPRA', 'NIVEL_GASTO', 'NIVEL_LECTURA'];

const validarPredecir = Joi.object({
  edad: Joi.number().integer().min(1).max(120).optional(),
  profesion: Joi.string().max(50).allow('').optional(),
  frecuenciaLectura: Joi.string().valid('A diario', 'Varias veces por semana', 'Semanal', 'Mensual', 'Casi nunca').allow('').optional(),
  categorias: Joi.array().items(Joi.string().max(50)).max(10).default([]).optional(),
  autores: Joi.array().items(Joi.string().max(100)).max(10).default([]).optional()
});

const validarSimilares = Joi.object({
  edad: Joi.number().integer().min(1).max(120).optional(),
  profesion: Joi.string().max(50).allow('').optional(),
  frecuenciaLectura: Joi.string().valid('A diario', 'Varias veces por semana', 'Semanal', 'Mensual', 'Casi nunca').allow('').optional(),
  categorias: Joi.array().items(Joi.string().max(50)).max(10).default([]).optional(),
  autores: Joi.array().items(Joi.string().max(100)).max(10).default([]).optional()
});

function escapar(v) {
  const t = v == null ? '' : String(v);
  return `"${t.replace(/"/g, '""')}"`;
}

function frecPeso(f) {
  return { 'A diario': 3, 'Varias veces por semana': 3, 'Semanal': 2, 'Mensual': 1, 'Casi nunca': 0 }[f] ?? 0;
}

function nivelLectura(frecuencia, totalLibros) {
  const libros = totalLibros === 0 ? 0 : totalLibros <= 2 ? 1 : totalLibros <= 5 ? 2 : 3;
  const score = frecPeso(frecuencia) + libros;
  if (score >= 5) return 'alto';
  if (score <= 2) return 'bajo';
  return 'medio';
}

function prepararDirectorios() {
  fs.mkdirSync(MODELOS_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function ejecutarPython(script, args) {
  return new Promise((resolve, reject) => {
    execFile('python', [script, ...args], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
        return;
      }
      const lineas = stdout.split('\n').filter(l => l.trim().startsWith('{'));
      const ultimo = lineas[lineas.length - 1] || '{}';
      try {
        resolve(JSON.parse(ultimo));
      } catch (e) {
        resolve({});
      }
    });
  });
}

async function construirDataset() {
  const [clientes, ventas] = await Promise.all([Cliente.find().select('-password'), Venta.find()]);
  const comprasPorCliente = new Map();
  ventas.forEach(v => {
    if (!comprasPorCliente.has(v.cliente.toString())) comprasPorCliente.set(v.cliente.toString(), []);
    comprasPorCliente.get(v.cliente.toString()).push(v);
  });

  const filas = [];
  clientes.forEach(c => {
    const vs = (comprasPorCliente.get(c._id.toString()) || []).filter(v => v.estado !== 'Cancelada');
    let gastoTotal = 0;
    let totalLibros = 0;
    const tallyCat = {};
    const tallyAut = {};
    vs.forEach(v => {
      gastoTotal += v.total || 0;
      (v.items || []).forEach(it => {
        const cant = it.cantidad || 0;
        totalLibros += cant;
        if (it.categoria) tallyCat[it.categoria] = (tallyCat[it.categoria] || 0) + cant;
        if (it.autor) tallyAut[it.autor] = (tallyAut[it.autor] || 0) + cant;
      });
    });
    const topCat = Object.entries(tallyCat).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const topAut = Object.entries(tallyAut).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const cats = c.preferenciasCategorias || [];
    const auts = c.autores || [];
    filas.push({
      NOMBRE: c.nombre,
      EMAIL: c.email,
      CELULAR: c.celular || '',
      PROFESION: c.profesion || '',
      EDAD: c.edad == null ? '' : c.edad,
      FRECUENCIA_LECTURA: c.frecuenciaLectura || '',
      CAT1: cats[0] || '', CAT2: cats[1] || '', CAT3: cats[2] || '',
      AUT1: auts[0] || '', AUT2: auts[1] || '', AUT3: auts[2] || '',
      GASTO_TOTAL: gastoTotal,
      TOTAL_LIBROS: totalLibros,
      CATEGORIA_COMPRA: topCat,
      AUTOR_COMPRA: topAut,
      NIVEL_GASTO: '',
      NIVEL_LECTURA: nivelLectura(c.frecuenciaLectura || '', totalLibros),
      _gasto: gastoTotal
    });
  });

  const gastos = filas.filter(f => f._gasto > 0).map(f => f._gasto).sort((a, b) => a - b);
  if (gastos.length) {
    const q1 = gastos[Math.floor(gastos.length * 0.33)];
    const q2 = gastos[Math.floor(gastos.length * 0.66)];
    filas.forEach(f => {
      if (f._gasto >= q2) f.NIVEL_GASTO = 'alto';
      else if (f._gasto >= q1) f.NIVEL_GASTO = 'medio';
      else f.NIVEL_GASTO = 'bajo';
      delete f._gasto;
    });
  } else {
    filas.forEach(f => { f.NIVEL_GASTO = 'bajo'; delete f._gasto; });
  }
  return filas;
}

function csvDesdeFilas(filas) {
  let csv = '\uFEFF' + JSON_COLS.join(',') + '\n';
  filas.forEach(f => csv += JSON_COLS.map(col => escapar(f[col])).join(',') + '\n');
  return csv;
}

router.use(autenticar, soloAdmin);

router.get('/estado', (req, res) => {
  if (fs.existsSync(ESTADO_FILE)) {
    try {
      const estado = JSON.parse(fs.readFileSync(ESTADO_FILE, 'utf8'));
      res.json({ entrenado: true, ...estado });
    } catch (e) {
      res.json({ entrenado: false });
    }
    return;
  }
  res.json({ entrenado: false });
});

router.get('/progreso', (req, res) => {
  if (fs.existsSync(PROGRESO_FILE)) {
    try {
      res.json({ ...JSON.parse(fs.readFileSync(PROGRESO_FILE, 'utf8')), entrenando: true });
    } catch (e) {
      res.json({ entrenando: false });
    }
    return;
  }
  res.json({ entrenando: false });
});

router.post('/entrenar', async (req, res) => {
  try {
    prepararDirectorios();
    const filas = await construirDataset();
    fs.writeFileSync(DATASET_FILE, csvDesdeFilas(filas), 'utf8');

    const resultado = await ejecutarPython(path.join(ML_DIR, 'entrenar.py'), [
      '--csv', DATASET_FILE,
      '--out', MODELOS_DIR,
      '--progress', PROGRESO_FILE
    ]);

    fs.writeFileSync(ESTADO_FILE, JSON.stringify({ ...resultado, fecha: new Date().toISOString() }), 'utf8');
    res.json({ ok: true, ...resultado });
  } catch (e) {
    console.error('Error al entrenar modelos:', e.message);
    res.status(500).json({ msg: 'Error al entrenar modelos', detalle: e.message });
  }
});

router.get('/dashboard', async (req, res) => {
  const estado = fs.existsSync(ESTADO_FILE) ? (() => { try { return JSON.parse(fs.readFileSync(ESTADO_FILE, 'utf8')); } catch (e) { return {}; } })() : {};
  const predicciones = [];
  if (fs.existsSync(PREDICCIONES_FILE)) {
    const lineas = fs.readFileSync(PREDICCIONES_FILE, 'utf8').split('\n').filter(Boolean);
    if (lineas.length > 1) {
      const cab = lineas[0].split(',').map(c => c.replace(/"/g, '').replace(/^\uFEFF/, '').trim());
      for (let i = 1; i < lineas.length; i++) {
        const vals = lineas[i].split(',');
        const obj = {};
        cab.forEach((c, j) => { obj[c] = (vals[j] || '').replace(/"/g, '').trim(); });
        predicciones.push(obj);
      }
    }
  }
  res.json({ entrenado: !!estado.entrenado, ...estado, predicciones });
});

router.post('/predecir', validarBody(validarPredecir), async (req, res) => {
  try {
    const { edad, profesion, frecuenciaLectura, categorias, autores } = req.body;
    const fila = {
      edad: edad || 30,
      profesion: profesion || '',
      frecuenciaLectura: frecuenciaLectura || '',
      categorias: Array.isArray(categorias) ? categorias : [],
      autores: Array.isArray(autores) ? autores : []
    };
    fs.writeFileSync(INPUT_FILE, JSON.stringify(fila), 'utf8');

    const [libros, ventas] = await Promise.all([Libro.find().lean(), Venta.find().lean()]);
    const pops = {};
    ventas.forEach(v => (v.items || []).forEach(it => {
      if (it.titulo) pops[it.titulo] = (pops[it.titulo] || 0) + (it.cantidad || 0);
    }));
    const catalogo = libros.map(l => ({
      titulo: l.titulo, autor: l.autor, categoria: l.categoria,
      precio: l.precio, portada: l.portada || '', popularidad: pops[l.titulo] || 0
    }));
    fs.writeFileSync(LIBROS_FILE, JSON.stringify(catalogo), 'utf8');

    const resultado = await ejecutarPython(path.join(ML_DIR, 'predecir.py'), [
      '--modelos', MODELOS_DIR,
      '--input', INPUT_FILE,
      '--libros', LIBROS_FILE
    ]);
    res.json({ ok: true, ...resultado });
  } catch (e) {
    console.error('Error en prediccion:', e.message);
    res.status(500).json({ msg: 'Error en el módulo de predicción', detalle: e.message });
  }
});

router.post('/similares', validarBody(validarSimilares), async (req, res) => {
  try {
    const { edad, profesion, frecuenciaLectura, categorias, autores } = req.body;
    const filtros = {};
    if (profesion) filtros.profesion = profesion;
    if (frecuenciaLectura) filtros.frecuenciaLectura = frecuenciaLectura;
    if (edad) {
      filtros.edad = { $gte: Math.max(1, edad - 5), $lte: edad + 5 };
    }
    if (categorias && categorias.length > 0) {
      filtros.preferenciasCategorias = { $in: categorias };
    }
    const candidatos = await Cliente.find(filtros).select('nombre email edad profesion frecuenciaLectura preferenciasCategorias autores gastoTotal totalCompras').lean();
    const puntuados = candidatos.map(c => {
      let score = 0;
      if (c.profesion === profesion) score += 3;
      if (c.frecuenciaLectura === frecuenciaLectura) score += 2;
      if (edad && Math.abs(c.edad - edad) <= 2) score += 2;
      if (edad && Math.abs(c.edad - edad) <= 5) score += 1;
      const catsCliente = c.preferenciasCategorias || [];
      const overlapCat = categorias.filter(cat => catsCliente.includes(cat)).length;
      score += overlapCat * 2;
      const autCliente = c.autores || [];
      const overlapAut = autores.filter(a => autCliente.includes(a)).length;
      score += overlapAut * 3;
      return { ...c, score };
    });
    puntuados.sort((a, b) => b.score - a.score);
    const similares = puntuados.slice(0, 10).map(c => ({
      nombre: c.nombre, email: c.email, edad: c.edad, profesion: c.profesion,
      frecuenciaLectura: c.frecuenciaLectura, preferenciasCategorias: c.preferenciasCategorias,
      autores: c.autores, gastoTotal: c.gastoTotal || 0, totalCompras: c.totalCompras || 0
    }));
    res.json({ ok: true, similares, totalEncontrados: candidatos.length });
  } catch (e) {
    console.error('Error en similares:', e.message);
    res.status(500).json({ msg: 'Error al buscar clientes similares', detalle: e.message });
  }
});

module.exports = router;