const mongoose = require('mongoose');

const SeguimientoSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true, unique: true },

  // Libros que le gustan al cliente (favoritos)
  gustos: [{
    libro: { type: mongoose.Schema.Types.ObjectId, ref: 'Libro' },
    titulo: { type: String },
    categoria: { type: String },
    autor: { type: String },
    portada: { type: String },
    fecha: { type: Date, default: Date.now }
  }],

  // Registro de lo que el cliente ha agregado al carrito
  agregadosCarrito: [{
    libro: { type: mongoose.Schema.Types.ObjectId, ref: 'Libro' },
    titulo: { type: String },
    categoria: { type: String },
    autor: { type: String },
    portada: { type: String },
    precio: { type: Number },
    cantidad: { type: Number },
    fecha: { type: Date, default: Date.now }
  }],

  // Preferencia de categorias (contador de interacciones por categoria)
  preferenciasCategorias: [{
    categoria: { type: String },
    contador: { type: Number, default: 0 }
  }],

  // Historial de compras del cliente
  compras: [{
    venta: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta' },
    total: { type: Number },
    fecha: { type: Date, default: Date.now }
  }],

  gastoTotal: { type: Number, default: 0 },
  totalCompras: { type: Number, default: 0 },
  actualizadoEn: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Seguimiento', SeguimientoSchema);
