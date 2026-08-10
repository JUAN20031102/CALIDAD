const mongoose = require('mongoose');

const ConfiguracionSchema = new mongoose.Schema({
  clave: { type: String, required: true, unique: true },
  valor: mongoose.Schema.Types.Mixed
}, { versionKey: false });

module.exports = mongoose.model('Configuracion', ConfiguracionSchema);
