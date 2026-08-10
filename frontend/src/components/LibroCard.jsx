import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function LibroCard({ libro, onCarritoChange }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [gustado, setGustado] = useState(false);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    if (!usuario || usuario.rol !== 'cliente') return;
    api.get(`/seguimiento/gusto/${libro._id}`)
      .then(res => setGustado(res.data.gustado))
      .catch(() => {});
  }, [libro._id, usuario]);

  const toggleGusto = async (e) => {
    e.preventDefault();
    if (!usuario) return navigate('/login');
    if (usuario.rol !== 'cliente') return;
    try {
      const nuevo = !gustado;
      await api.post('/seguimiento/gusto', { libroId: libro._id, gustar: nuevo });
      setGustado(nuevo);
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al registrar');
    }
  };

  const agregarCarrito = async (e) => {
    e.preventDefault();
    if (!usuario) return navigate('/login');
    if (usuario.rol !== 'cliente') return alert('Debes iniciar sesión como cliente');
    setAgregando(true);
    try {
      const res = await api.post('/carrito/agregar', { libroId: libro._id, cantidad: 1 });
      window.dispatchEvent(new Event('carrito-actualizado'));
      if (onCarritoChange) onCarritoChange(res.data);
      alert(`"${libro.titulo}" agregado al carrito`);
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al agregar al carrito');
    }
    setAgregando(false);
  };

  const tieneOferta = libro.precioOferta && libro.precioOferta < libro.precio;
  const descuento = tieneOferta ? Math.round((1 - libro.precioOferta / libro.precio) * 100) : 0;

  return (
    <div className="card h-100 position-relative">
      {tieneOferta && <span className="badge bg-danger position-absolute top-0 start-0 m-2 z-1">-{descuento}% OFERTA</span>}
      {!tieneOferta && libro.destacado && <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-2 z-1">Destacado</span>}
      {usuario?.rol === 'cliente' && (
        <button
          onClick={toggleGusto}
          className="btn position-absolute top-0 end-0 m-2 z-1 rounded-circle p-2"
          style={{ background: gustado ? '#e74c3c' : 'rgba(255,255,255,0.9)', color: gustado ? '#fff' : '#e74c3c' }}
          title={gustado ? 'Ya me gusta' : 'Me gusta'}
        >
          <i className={gustado ? 'bi bi-heart-fill' : 'bi bi-heart'}></i>
        </button>
      )}
      <Link to={`/libros/${libro._id}`}>
        {libro.portada ? (
          <img src={libro.portada} className="card-img-top" alt={libro.titulo} />
        ) : (
          <div className="card-img-top d-flex align-items-center justify-content-center bg-light text-secondary">
            <i className="bi bi-book" style={{ fontSize: '4rem' }}></i>
          </div>
        )}
      </Link>
      <div className="card-body d-flex flex-column">
        <span className="badge bg-secondary align-self-start mb-2">{libro.categoria}</span>
        <h6 className="card-title fw-bold">{libro.titulo}</h6>
        <p className="card-text small text-muted">{libro.autor}</p>
        <div className="mt-auto">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div>
              {tieneOferta ? (
                <>
                  <span className="text-decoration-line-through text-muted me-1 small">${libro.precio.toFixed(2)}</span>
                  <span className="text-price text-danger fw-bold">${libro.precioOferta.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-price">${libro.precio.toFixed(2)}</span>
              )}
            </div>
            <span className={`small ${libro.stock > 0 ? 'text-success' : 'text-danger'}`}>
              {libro.stock > 0 ? `${libro.stock} disponibles` : 'Agotado'}
            </span>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary btn-sm flex-fill" disabled={agregando || libro.stock <= 0} onClick={agregarCarrito}>
              <i className="bi bi-cart-plus me-1"></i>
              {agregando ? '...' : 'Comprar'}
            </button>
            <Link className="btn btn-outline-secondary btn-sm" to={`/libros/${libro._id}`}>
              <i className="bi bi-eye"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}