import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Compras() {
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/ventas/mias')
      .then(res => setCompras(res.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  if (compras.length === 0) {
    return (
      <div className="text-center p-5">
        <i className="bi bi-receipt display-1 text-muted d-block mb-3"></i>
        <h3>Aún no tienes compras</h3>
        <p className="text-muted">Cuando realices una compra, aquí verás el historial.</p>
        <Link to="/libros" className="btn btn-primary">Explorar libros</Link>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4"><i className="bi bi-receipt me-2"></i>Mis compras</h3>
      <p className="text-muted">Historial de {compras.length} compra(s).</p>
      {compras.map(compra => (
        <div className="card mb-4 shadow-sm" key={compra._id}>
          <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <strong>Compra #{compra._id.slice(-6).toUpperCase()}</strong>
              <span className="text-muted ms-2 small">{new Date(compra.fecha).toLocaleString('es-ES')}</span>
            </div>
            <div>
              <span className={`badge ${compra.estado === 'Pagada' ? 'bg-success' : 'bg-warning text-dark'} me-2`}>{compra.estado}</span>
              <span className="fw-bold text-price">Total: ${compra.total.toFixed(2)}</span>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Portada</th>
                    <th>Libro</th>
                    <th>Autor</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ width: 60 }}>
                        {item.portada ? (
                          <img src={item.portada} alt={item.titulo} style={{ width: 40, height: 52, objectFit: 'cover' }} className="rounded" />
                        ) : <i className="bi bi-book fs-4"></i>}
                      </td>
                      <td>{item.titulo}</td>
                      <td className="text-muted">{item.autor}</td>
                      <td>${item.precio.toFixed(2)}</td>
                      <td>{item.cantidad}</td>
                      <td className="text-end fw-bold">${(item.precio * item.cantidad).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}