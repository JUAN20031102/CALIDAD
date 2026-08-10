import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Carrito() {
  const navigate = useNavigate();
  const [carrito, setCarrito] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [comprando, setComprando] = useState(false);

  const cargar = async () => {
    try {
      const res = await api.get('/carrito');
      setCarrito(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const total = carrito?.items?.reduce((a, i) => a + i.precio * i.cantidad, 0) || 0;

  const cambiarCantidad = async (libroId, cantidad) => {
    if (cantidad < 1) return;
    const res = await api.put(`/carrito/item/${libroId}`, { cantidad });
    setCarrito(res.data);
    window.dispatchEvent(new Event('carrito-actualizado'));
  };

  const eliminar = async (libroId) => {
    const res = await api.delete(`/carrito/item/${libroId}`);
    setCarrito(res.data);
    window.dispatchEvent(new Event('carrito-actualizado'));
  };

  const comprar = async () => {
    setComprando(true);
    try {
      await api.post('/ventas/checkout');
      alert('¡Compra realizada con éxito!');
      window.dispatchEvent(new Event('carrito-actualizado'));
      navigate('/compras');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al realizar la compra');
    } finally {
      setComprando(false);
    }
  };

  if (cargando) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  if (!carrito || carrito.items.length === 0) {
    return (
      <div className="text-center p-5">
        <i className="bi bi-cart-x display-1 text-muted d-block mb-3"></i>
        <h3>Tu carrito está vacío</h3>
        <p className="text-muted">Explora el catálogo y agrega tus libros favoritos.</p>
        <Link to="/libros" className="btn btn-primary btn-lg">Ir al catálogo</Link>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4"><i className="bi bi-cart3 me-2"></i>Mi carrito de compras</h3>
      <div className="row g-4">
        <div className="col-lg-8">
          {carrito.items.map(item => (
            <div className="card mb-3" key={item.libro}>
              <div className="card-body d-flex align-items-center gap-3 flex-wrap">
                {item.portada ? (
                  <img src={item.portada} alt={item.titulo} style={{ width: 70, height: 90, objectFit: 'cover' }} className="rounded" />
                ) : (
                  <div className="bg-light d-flex align-items-center justify-content-center rounded" style={{ width: 70, height: 90 }}>
                    <i className="bi bi-book"></i>
                  </div>
                )}
                <div className="flex-grow-1">
                  <h6 className="mb-1">{item.titulo}</h6>
                  <p className="small text-muted mb-0">{item.autor} · {item.categoria}</p>
                  <p className="small mb-0">Precio: <strong>{item.precio.toFixed(2)} $</strong></p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="input-group input-group-sm" style={{ width: 110 }}>
                    <button className="btn btn-outline-secondary" onClick={() => cambiarCantidad(item.libro, item.cantidad - 1)}>-</button>
                    <input className="form-control text-center" value={item.cantidad} readOnly />
                    <button className="btn btn-outline-secondary" onClick={() => cambiarCantidad(item.libro, item.cantidad + 1)}>+</button>
                  </div>
                  <span className="fw-bold" style={{ minWidth: 90 }}>{(item.precio * item.cantidad).toFixed(2)} $</span>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => eliminar(item.libro)} title="Eliminar">
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="fw-bold">Resumen de compra</h5>
              <hr />
              <p>Subtotal: <strong className="float-end">${total.toFixed(2)}</strong></p>
              <p>Envío: <strong className="float-end text-success">Gratis</strong></p>
              <hr />
              <h5>Total: <span className="text-price float-end">${total.toFixed(2)}</span></h5>
              <button className="btn btn-primary btn-lg w-100 mt-3" onClick={comprar} disabled={comprando}>
                {comprando ? <><span className="spinner-border spinner-border-sm me-2"></span>Procesando...</> : <><i className="bi bi-check2-circle me-1"></i>Finalizar compra</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}