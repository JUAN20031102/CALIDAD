import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function DetalleLibro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [libro, setLibro] = useState(null);
  const [gustado, setGustado] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get(`/libros/${id}`);
        setLibro(res.data);
        if (usuario?.rol === 'cliente') {
          const g = await api.get(`/seguimiento/gusto/${id}`);
          setGustado(g.data.gustado);
        }
      } catch {
        alert('Libro no encontrado');
        navigate('/libros');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id, usuario]);

  const toggleGusto = async () => {
    if (!usuario) return navigate('/login');
    if (usuario.rol !== 'cliente') return alert('Solo clientes pueden marcar favoritos');
    const nuevo = !gustado;
    await api.post('/seguimiento/gusto', { libroId: id, gustar: nuevo });
    setGustado(nuevo);
  };

  const agregarCarrito = async () => {
    if (!usuario) return navigate('/login');
    if (usuario.rol !== 'cliente') return alert('Debes iniciar sesión como cliente');
    try {
      await api.post('/carrito/agregar', { libroId: id, cantidad });
      window.dispatchEvent(new Event('carrito-actualizado'));
      alert('Agregado al carrito correctamente');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al agregar al carrito');
    }
  };

  if (cargando) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
  if (!libro) return null;

  return (
    <div className="row g-4">
      <div className="col-md-4">
        {libro.portada ? (
          <img src={libro.portada} className="img-fluid rounded shadow" alt={libro.titulo} />
        ) : (
          <div className="rounded shadow d-flex align-items-center justify-content-center bg-light text-secondary" style={{ height: 400 }}>
            <i className="bi bi-book" style={{ fontSize: '6rem' }}></i>
          </div>
        )}
      </div>
      <div className="col-md-8">
        <nav>
          <Link to="/libros" className="text-muted small"><i className="bi bi-arrow-left me-1"></i>Volver al catálogo</Link>
        </nav>
        <h1 className="fw-bold mt-2">{libro.titulo}</h1>
        <p className="text-muted mb-1">Autor: <strong>{libro.autor}</strong></p>
        <p className="text-muted mb-1">ISBN: {libro.isbn}</p>
        <p className="mb-3"><span className="badge bg-secondary">{libro.categoria}</span> {libro.destacado && <span className="badge bg-warning text-dark ms-1">Destacado</span>}</p>
        <p className="lead">{libro.descripcion}</p>
        <p className="mb-2">Disponibles: <strong className={libro.stock > 0 ? 'text-success' : 'text-danger'}>{libro.stock}</strong></p>
        {libro.precioOferta && libro.precioOferta < libro.precio ? (
          <div className="d-flex align-items-center gap-3">
            <h2 className="text-price display-6 text-danger mb-0">{libro.precioOferta.toFixed(2)} $</h2>
            <span className="text-decoration-line-through text-muted fs-5">{libro.precio.toFixed(2)} $</span>
            <span className="badge bg-danger">{Math.round((1 - libro.precioOferta / libro.precio) * 100)}% OFERTA</span>
          </div>
        ) : (
          <h2 className="text-price display-6">{libro.precio.toFixed(2)} $</h2>
        )}

        <div className="d-flex align-items-center gap-3 mt-3 flex-wrap">
          <div className="input-group" style={{ width: 140 }}>
            <button className="btn btn-outline-secondary" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>-</button>
            <input className="form-control text-center" value={cantidad} readOnly />
            <button className="btn btn-outline-secondary" onClick={() => setCantidad(Math.min(libro.stock, cantidad + 1))}>+</button>
          </div>
          <button className="btn btn-primary btn-lg" disabled={libro.stock <= 0} onClick={agregarCarrito}>
            <i className="bi bi-cart-plus me-1"></i> Agregar al carrito
          </button>
          {usuario?.rol === 'cliente' && (
            <button className={`btn btn-lg ${gustado ? 'btn-danger' : 'btn-outline-danger'}`} onClick={toggleGusto}>
              <i className={`bi ${gustado ? 'bi-heart-fill' : 'bi-heart'} me-1`}></i>
              {gustado ? 'Me gusta' : 'Me gusta este libro'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}