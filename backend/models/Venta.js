const mongoose = require('mongoose');

const VentaSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  nombreCliente: { type: String },
  items: [{
    libro: { type: mongoose.Schema.Types.ObjectId, ref: 'Libro' },
    titulo: { type: String },
    autor: { type: String },
    categoria: { type: String },
    portada: { type: String },
    precio: { type: Number },
    cantidad: { type: Number }
  }],
  total: { type: Number, required: true },
  estado: { type: String, enum: ['Pagada', 'Pendiente', 'Cancelada'], default: 'Pagada' },
  fecha: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Venta', VentaSchema);
