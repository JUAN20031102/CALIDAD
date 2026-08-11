const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const libroRoutes = require('./routes/libroRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const seguimientoRoutes = require('./routes/seguimientoRoutes');
const adminRoutes = require('./routes/adminRoutes');
const recomendacionRoutes = require('./routes/recomendacionRoutes');
const ofertaRoutes = require('./routes/ofertaRoutes');
const mlRoutes = require('./routes/mlRoutes');

const app = express();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI no está configurado. Define MONGO_URI en las variables de entorno.');
}
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Seguridad: Helmet para cabeceras HTTP seguras
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// CORS restrictivo: solo permite el frontend configurado
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { msg: 'Demasiadas peticiones, intenta más tarde' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Rate limiting estricto para auth (login/registro)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { msg: 'Demasiados intentos de autenticación, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Ruta de salud
app.get('/', (req, res) => res.json({ msg: 'API Librería MERN funcionando' }));

// Rutas con rate limiting específico
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/libros', libroRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/seguimiento', seguimientoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recomendaciones', recomendacionRoutes);
app.use('/api/ofertas', ofertaRoutes);
app.use('/api/ml', mlRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ msg: 'Ruta no encontrada' });
});

// Manejo global de errores (no exponer stack traces)
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  const status = err.status || 500;
  const mensaje = status === 500 ? 'Error interno del servidor' : err.message;
  res.status(status).json({ msg: mensaje });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Conectado a MongoDB Atlas');
    app.listen(PORT, () => console.log(`Servidor backend en http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('No se pudo conectar a MongoDB Atlas. Verifica las credenciales y la conectividad');
    console.error(err.message);
    process.exit(1);
  });