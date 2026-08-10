import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import LibroCard from '../components/LibroCard';
import { useAuth } from '../context/AuthContext';

export default function Principal() {
  const { usuario } = useAuth();
  const [destacados, setDestacados] = useState([]);
  const [nuevos, setNuevos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [recomendados, setRecomendados] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [dest, todos, cats] = await Promise.all([
          api.get('/libros?destacado=true'),
          api.get('/libros'),
          api.get('/libros/categorias')
        ]);
        setDestacados(dest.data.slice(0, 4));
        setNuevos(todos.data.slice(0, 8));
        setCategorias(cats.data);
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  useEffect(() => {
    const cargarRecomendados = async () => {
      if (!usuario || usuario.rol !== 'cliente') {
        setRecomendados([]);
        setOfertas([]);
        return;
      }
      try {
        const [rec, of] = await Promise.all([
          api.get('/recomendaciones'),
          api.get('/ofertas')
        ]);
        setRecomendados(rec.data);
        setOfertas(of.data);
      } catch {
        setRecomendados([]);
        setOfertas([]);
      }
    };
    cargarRecomendados();
  }, [usuario]);

  if (cargando) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <section className="text-center py-5" style={{ background: 'linear-gradient(135deg,#2c3e50,#34495e)', color: '#fff', borderRadius: 16 }}>
        <h1 className="display-4 fw-bold mb-3"><i className="bi bi-book-half me-2"></i>Librería XP</h1>
        <p className="lead mb-4">El sistema de ventas de libros más completo: catálogo, carrito, compras y seguimiento de tus gustos.</p>
        <div className="d-flex justify-content-center gap-2">
          <Link to="/libros" className="btn btn-light btn-lg px-4">Ver catálogo</Link>
          {!localStorage.getItem('token') && (
            <Link to="/registro" className="btn btn-outline-light btn-lg px-4">Registrarme</Link>
          )}
        </div>
      </section>

      {usuario?.rol === 'cliente' && recomendados.length > 0 && (
        <section className="mt-5">
          <div className="d-flex align-items-center mb-1">
            <h3 className="mb-0 fw-bold"><i className="bi bi-magic text-primary me-2"></i>PARA TI</h3>
            <span className="badge bg-primary ms-2">Personalizado</span>
          </div>
          <p className="text-muted">Seleccionados según tus gustos, compras y categorías preferidas.</p>
          <div className="row g-3">
            {recomendados.map(libro => (
              <div className="col-6 col-md-3" key={libro._id}>
                <LibroCard libro={libro} />
              </div>
            ))}
          </div>
        </section>
      )}

      {usuario?.rol === 'cliente' && ofertas.length > 0 && (
        <section className="mt-5">
          <div className="d-flex align-items-center mb-1">
            <h3 className="mb-0 fw-bold"><i className="bi bi-tag-fill text-danger me-2"></i>OFERTAS PARA TI</h3>
            <span className="badge bg-danger ms-2">Según tus preferencias</span>
          </div>
          <p className="text-muted">Precios especiales en las categorías que más te gustan.</p>
          <div className="row g-3">
            {ofertas.map(libro => (
              <div className="col-6 col-md-3" key={libro._id}>
                <LibroCard libro={libro} />
              </div>
            ))}
          </div>
          <div className="text-center mt-3">
            <Link to="/ofertas" className="btn btn-danger btn-sm">Ver todas las ofertas <i className="bi bi-arrow-right ms-1"></i></Link>
          </div>
        </section>
      )}

      {categorias.length > 0 && (
        <section className="mt-4">
          <div className="d-flex gap-2 flex-wrap justify-content-center">
            {categorias.map(cat => (
              <Link key={cat} to={`/libros?categoria=${encodeURIComponent(cat)}`} className="btn btn-outline-secondary btn-sm">
                {cat}
              </Link>
            ))}
          </div>
        </section>
      )}

      {destacados.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-3"><i className="bi bi-star-fill text-warning me-2"></i>Libros destacados</h3>
          <div className="row g-3">
            {destacados.map(libro => (
              <div className="col-6 col-md-3" key={libro._id}>
                <LibroCard libro={libro} />
              </div>
            ))}
          </div>
        </section>
      )}

      {nuevos.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-3"><i className="bi bi-collection me-2"></i>Catálogo completo</h3>
          <div className="row g-3">
            {nuevos.map(libro => (
              <div className="col-6 col-md-3" key={libro._id}>
                <LibroCard libro={libro} />
              </div>
            ))}
          </div>
          <div className="text-center mt-3">
            <Link to="/libros" className="btn btn-primary">Ver todos los libros <i className="bi bi-arrow-right ms-1"></i></Link>
          </div>
        </section>
      )}
    </div>
  );
}