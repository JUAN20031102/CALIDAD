const Joi = require('joi');

const validarRegistroCliente = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  celular: Joi.string().pattern(/^[0-9]{10}$/).allow('', null).optional(),
  password: Joi.string().min(8).max(128).required(),
  profesion: Joi.string().max(50).allow('', null).optional(),
  edad: Joi.number().integer().min(1).max(120).allow(null).optional(),
  frecuenciaLectura: Joi.string().valid('A diario', 'Varias veces por semana', 'Semanal', 'Mensual', 'Casi nunca').allow('', null).optional(),
  preferenciasCategorias: Joi.array().items(Joi.string().max(50)).max(5).default([]).optional(),
  autores: Joi.array().items(Joi.string().max(100)).max(5).default([]).optional()
});

const validarLogin = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required()
});

const validarLibro = Joi.object({
  titulo: Joi.string().min(1).max(200).required(),
  autor: Joi.string().min(1).max(150).required(),
  isbn: Joi.string().pattern(/^[0-9]{10,13}$/).required(),
  categoria: Joi.string().min(1).max(50).required(),
  descripcion: Joi.string().max(2000).allow('', null).optional(),
  precio: Joi.number().positive().precision(2).required(),
  stock: Joi.number().integer().min(0).default(0).optional(),
  portada: Joi.string().uri().allow('', null).optional(),
  destacado: Joi.boolean().default(false).optional(),
  precioOferta: Joi.number().positive().precision(2).allow(null).optional()
});

const validarCarritoAgregar = Joi.object({
  libroId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  cantidad: Joi.number().integer().min(1).max(99).default(1).optional()
});

const validarCarritoActualizar = Joi.object({
  cantidad: Joi.number().integer().min(0).max(99).required()
});

const validarSeguimientoGusto = Joi.object({
  libroId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  gustar: Joi.boolean().required()
});

const validarObjectId = (req, res, next) => {
  const params = req.params;
  for (const key of Object.keys(params)) {
    if (params[key] && !/^[0-9a-fA-F]{24}$/.test(params[key])) {
      return res.status(400).json({ msg: `ID inválido en parámetro ${key}` });
    }
  }
  next();
};

const validarBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const detalles = error.details.map(d => d.message).join('; ');
    return res.status(400).json({ msg: 'Datos inválidos', detalles });
  }
  req.body = value;
  next();
};

const validarQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) {
    const detalles = error.details.map(d => d.message).join('; ');
    return res.status(400).json({ msg: 'Parámetros de consulta inválidos', detalles });
  }
  req.query = value;
  next();
};

module.exports = {
  validarRegistroCliente,
  validarLogin,
  validarLibro,
  validarCarritoAgregar,
  validarCarritoActualizar,
  validarSeguimientoGusto,
  validarObjectId,
  validarBody,
  validarQuery
};