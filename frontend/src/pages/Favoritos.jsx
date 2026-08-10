import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import LibroCard from '../components/LibroCard';

export default function Favoritos() {
  const [seguimiento, setSeguimiento] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [verActividad, setVerActividad] = useState(false);

  const cargar = async () => {
    try {
      const res = await api.get('/seguimiento/mio');
      setSeguimiento(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  if (cargando) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
  if (!seguimiento) return null;

  const maxPref = Math.max(1, ...(seguimiento.preferenciasCategorias.map(p => p.contador)));

  return (
    <div>
      <h3 className="mb-2"><i className="bi bi-heart-fill text-danger me-2"></i>Libros que me gustan</h3>
      <p className="text-muted">Esta sección usa la tabla de <strong>seguimiento</strong> para guardar tus gustos, preferencias y actividad.</p>

      {seguimiento.gustos.length === 0 ? (
        <div className="text-center p-5">
          <i className="bi bi-heart display-1 text-muted d-block mb-3"></i>
          <h4>Aún no tienes libros favoritos</h4>
          <p className="text-muted">Marca el corazón en cualquier libro para guardarlo aquí.</p>
          <Link to="/libros" className="btn btn-primary">Buscar libros</Link>
        </div>
      ) : (
        <div className="row g-3 mb-5">
          {seguimiento.gustos.map(g => (
            <div className="col-6 col-md-4 col-lg-3" key={g._id}>
              <LibroCard libro={g.libro || { _id: g._id, titulo: g.titulo, autor: g.autor, categoria: g.categoria, portada: g.portada }} />
            </div>
          ))}
        </div>
      )}

      <div className="d-flex gap-2 mb-3">
        <button className={`btn ${verActividad ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setVerActividad(!verActividad)}>
          <i className="bi bi-graph-up me-1"></i> Mi actividad / preferencias
        </button>
      </div>

      {verActividad && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="fw-bold"><i className="bi bi-tags me-2"></i>Preferencias por categoría</h5>
                <p className="small text-muted">Se calcula con cada interacción: gustos, carrito y compras.</p>
                {seguimiento.preferenciasCategorias.length === 0 ? (
                  <p className="text-muted">Sin datos aún. Interactúa con los libros para generar preferencias.</p>
                ) : (
                  seguimiento.preferenciasCategorias.map(pref => (
                    <div className="mb-3" key={pref.categoria}>
                      <div className="d-flex justify-content-between small">
                        <span>{pref.categoria}</span>
                        <span className="fw-bold">{pref.contador} interacción(es)</span>
                      </div>
                      <div className="progress" style={{ height: 8 }}>
                        <div className="progress-bar bg-primary" style={{ width: `${(pref.contador / maxPref) * 100}%` }}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="fw-bold mb-3"><i className="bi bi-activity me-2"></i>Historial de actividad</h5>
                <div className="d-flex gap-4 mb-3 flex-wrap">
                  <div className="stats-card p-3 flex-fill text-center">
                    <i className="bi bi-heart-fill icon"></i>
                    <div className="fs-3 fw-bold">{seguimiento.gustos.length}</div>
                    <small>Gustos</small>
                  </div>
                  <div className="stats-card p-3 flex-fill text-center">
                    <i className="bi bi-cart-plus icon"></i>
                    <div className="fs-3 fw-bold">{seguimiento.agregadosCarrito.length}</div>
                    <small>Agregados al carrito</small>
                  </div>
                  <div className="stats-card p-3 flex-fill text-center">
                    <i className="bi bi-bag-check icon"></i>
                    <div className="fs-3 fw-bold">{seguimiento.totalCompras}</div>
                    <small>Compras</small>
                  </div>
                  <div className="stats-card p-3 flex-fill text-center">
                    <i className="bi bi-cash-coin icon"></i>
                    <div className="fs-3 fw-bold">${seguimiento.gastoTotal.toFixed(2)}</div>
                    <small>Gastado</small>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Acción</th>
                        <th>Libro</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...seguimiento.agregadosCarrito].reverse().slice(0, 10).map((a, i) => (
                        <tr key={i}>
                          <td><span className="badge bg-primary">Agregó al carrito</span></td>
                          <td>{a.titulo} <span className="text-muted small">({a.categoria})</span></td>
                          <td className="small text-muted">{new Date(a.fecha).toLocaleString('es-ES')}</td>
                        </tr>
                      ))}
                      {seguimiento.compras.slice().reverse().slice(0, 5).map((c, i) => (
                        <tr key={`c${i}`}>
                          <td><span className="badge bg-success">Compró</span></td>
                          <td>Compra por ${c.total.toFixed(2)}</td>
                          <td className="small text-muted">{new Date(c.fecha).toLocaleString('es-ES')}</td>
                        </tr>
                      ))}
                      {seguimiento.agregadosCarrito.length === 0 && seguimiento.compras.length === 0 && (
                        <tr><td colSpan="3" className="text-muted">Aún no hay actividad registrada.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}