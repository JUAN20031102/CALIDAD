const mongoose = require('mongoose');

const AdministradorSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  rol: { type: String, default: 'admin' },
  fechaRegistro: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Administrador', AdministradorSchema);
