const mongoose = require('mongoose');

const CarritoSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true, unique: true },
  items: [{
    libro: { type: mongoose.Schema.Types.ObjectId, ref: 'Libro', required: true },
    titulo: { type: String },
    autor: { type: String },
    categoria: { type: String },
    portada: { type: String },
    precio: { type: Number },
    cantidad: { type: Number, default: 1 }
  }],
  actualizadoEn: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Carrito', CarritoSchema);
