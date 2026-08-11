const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://jgerardoqq_db_user:estudio2012@ac-5kj0be3-shard-00-00.kgznko4.mongodb.net:27017,ac-5kj0be3-shard-00-01.kgznko4.mongodb.net:27017,ac-5kj0be3-shard-00-02.kgznko4.mongodb.net:27017/libreria_mern?authSource=admin&ssl=true&replicaSet=atlas-ngsmvl-shard-0&appName=ClusterCulebra';
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
    console.error('No se pudo conectar a MongoDB Atlas. Verifica las credenciales y la conectividad');
    console.error(err.message);
    process.exit(1);
  });
