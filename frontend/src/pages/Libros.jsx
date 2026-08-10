import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import LibroCard from '../components/LibroCard';

export default function Libros() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [libros, setLibros] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  const q = searchParams.get('q') || '';
  const categoria = searchParams.get('categoria') || 'Todas';

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const params = {};
        if (q) params.q = q;
        if (categoria && categoria !== 'Todas') params.categoria = categoria;
        const [res, cats] = await Promise.all([
          api.get('/libros', { params }),
          api.get('/libros/categorias')
        ]);
        setLibros(res.data);
        setCategorias(['Todas', ...cats.data]);
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [q, categoria]);

  const setFiltro = (clave, valor) => {
    const nuevos = new URLSearchParams(searchParams);
    if (valor) nuevos.set(clave, valor);
    else nuevos.delete(clave);
    setSearchParams(nuevos);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h3 className="mb-0"><i className="bi bi-book me-2"></i>Catálogo de libros</h3>
        <div className="d-flex gap-2 flex-wrap">
          <input
            type="search"
            className="form-control"
            placeholder="Buscar por título, autor, ISBN..."
            value={q}
            onChange={e => setFiltro('q', e.target.value)}
            style={{ width: 260 }}
          />
          <select className="form-select" style={{ width: 180 }} value={categoria} onChange={e => setFiltro('categoria', e.target.value)}>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="alert alert-info d-flex align-items-center py-2">
        <i className="bi bi-info-circle me-2"></i>
        <span className="small">{libros.length} libro(s) encontrados</span>
      </div>

      {cargando ? (
        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
      ) : libros.length === 0 ? (
        <div className="text-center p-5 text-muted">
          <i className="bi bi-search display-3 d-block mb-2"></i>
          No hay libros que coincidan con tu búsqueda.
        </div>
      ) : (
        <div className="row g-3">
          {libros.map(libro => (
            <div className="col-6 col-md-4 col-lg-3" key={libro._id}>
              <LibroCard libro={libro} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}