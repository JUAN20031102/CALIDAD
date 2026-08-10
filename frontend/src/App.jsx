import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import Principal from './pages/Principal';
import Libros from './pages/Libros';
import Ofertas from './pages/Ofertas';
import DetalleLibro from './pages/DetalleLibro';
import Carrito from './pages/Carrito';
import Compras from './pages/Compras';
import Favoritos from './pages/Favoritos';
import Login from './pages/Login';
import Registro from './pages/Registro';
import AdminPanel from './pages/AdminPanel';

function RutaProtegida({ children, rol }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (rol && usuario.rol !== rol) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { cargando } = useAuth();
  if (cargando) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1 container py-4">
        <Routes>
          <Route path="/" element={<Principal />} />
          <Route path="/libros" element={<Libros />} />
          <Route path="/ofertas" element={<Ofertas />} />
          <Route path="/libros/:id" element={<DetalleLibro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/carrito" element={<RutaProtegida rol="cliente"><Carrito /></RutaProtegida>} />
          <Route path="/compras" element={<RutaProtegida rol="cliente"><Compras /></RutaProtegida>} />
          <Route path="/favoritos" element={<RutaProtegida rol="cliente"><Favoritos /></RutaProtegida>} />
          <Route path="/admin" element={<RutaProtegida rol="admin"><AdminPanel /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}