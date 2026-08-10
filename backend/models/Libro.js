const mongoose = require('mongoose');

const LibroSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  autor: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  categoria: { type: String, required: true },
  descripcion: { type: String },
  precio: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  portada: { type: String },
  destacado: { type: Boolean, default: false },
  precioOferta: { type: Number },
  fechaRegistro: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Libro', LibroSchema);
