const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  celular: { type: String },
  password: { type: String, required: true },
  profesion: { type: String },
  edad: { type: Number, min: 0 },
  frecuenciaLectura: { type: String },
  preferenciasCategorias: [{ type: String }],
  autores: [{ type: String }],
  fechaRegistro: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Cliente', ClienteSchema);
