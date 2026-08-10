import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const [carrito, setCarrito] = useState(null);

  useEffect(() => {
    const cargarCarrito = async () => {
      if (!usuario || usuario.rol !== 'cliente') return;
      try {
        const res = await api.get('/carrito');
        setCarrito(res.data);
      } catch { setCarrito(null); }
    };
    cargarCarrito();
    window.addEventListener('carrito-actualizado', cargarCarrito);
    return () => window.removeEventListener('carrito-actualizado', cargarCarrito);
  }, [usuario]);

  const totalItems = carrito?.items?.reduce((a, i) => a + i.cantidad, 0) || 0;

  const salir = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-book-half me-1"></i> Librería XP
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Principal</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/libros">Libros</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/ofertas">
                <i className="bi bi-tag me-1"></i> Ofertas
              </NavLink>
            </li>
            {usuario?.rol === 'cliente' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/favoritos">
                    <i className="bi bi-heart me-1"></i> Favoritos
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/compras">Mis Compras</NavLink>
                </li>
              </>
            )}
            {usuario?.rol === 'admin' && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin">
                  <i className="bi bi-gear me-1"></i> Panel Admin
                </NavLink>
              </li>
            )}
          </ul>
          <ul className="navbar-nav ms-auto align-items-lg-center">
            {usuario?.rol === 'cliente' && (
              <li className="nav-item me-2">
                <Link className="btn btn-outline-dark position-relative" to="/carrito">
                  <i className="bi bi-cart3 me-1"></i> Carrito
                  {totalItems > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </li>
            )}
            {usuario ? (
              <>
                <li className="nav-item me-3">
                  <span className="navbar-text fw-bold">
                    <i className="bi bi-person-circle me-1"></i> {usuario.nombre}
                    <span className={`badge ms-1 ${usuario.rol === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                      {usuario.rol === 'admin' ? 'Admin' : 'Cliente'}
                    </span>
                  </span>
                </li>
                <li className="nav-item">
                  <button type="button" className="btn btn-outline-danger" onClick={salir}>
                    <i className="bi bi-box-arrow-right me-1"></i> Cerrar sesión
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item me-2">
                  <Link className="btn btn-outline-primary" to="/login">Iniciar sesión</Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary" to="/registro">Registrarme</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}