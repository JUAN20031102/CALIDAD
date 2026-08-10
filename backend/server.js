const express = require('express');
const cors = require('cors');
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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/libreria_mern';
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ruta de salud
app.get('/', (req, res) => res.json({ msg: 'API Libreria MERN funcionando' }));

app.use('/api/auth', authRoutes);
app.use('/api/libros', libroRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/seguimiento', seguimientoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recomendaciones', recomendacionRoutes);
app.use('/api/ofertas', ofertaRoutes);
app.use('/api/ml', mlRoutes);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Conectado a MongoDB:', MONGO_URI);
    app.listen(PORT, () => console.log(`Servidor backend en http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('No se pudo conectar a MongoDB. Verifica que MongoDB Compass/Server este corriendo en localhost:27017');
    console.error(err.message);
    process.exit(1);
  });
