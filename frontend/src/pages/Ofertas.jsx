import { useEffect, useState } from 'react';
import api from '../api';
import LibroCard from '../components/LibroCard';
import { useAuth } from '../context/AuthContext';

export default function Ofertas() {
  const { usuario } = useAuth();
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/ofertas/todas').then(r => setOfertas(r.data)).catch(console.error).finally(() => setCargando(false));
  }, []);

  return (
    <div>
      <div className="d-flex align-items-center mb-1">
        <h3 className="mb-0 fw-bold"><i className="bi bi-tag-fill text-danger me-2"></i>Ofertas</h3>
        {usuario?.rol === 'cliente' && <span className="badge bg-primary ms-2">Para ti</span>}
      </div>
      <p className="text-muted">Precios especiales por tiempo limitado. ¡Aprovecha las promociones!</p>

      {cargando ? (
        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
      ) : ofertas.length === 0 ? (
        <div className="text-center p-5 text-muted">
          <i className="bi bi-tag display-3 d-block mb-2"></i>
          No hay ofertas disponibles por el momento.
        </div>
      ) : (
        <div className="row g-3">
          {ofertas.map(libro => (
            <div className="col-6 col-md-4 col-lg-3" key={libro._id}>
              <LibroCard libro={libro} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
