import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const data = await login(email, password);
      navigate(data.usuario.rol === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-5 col-lg-4">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h4 className="text-center fw-bold mb-1"><i className="bi bi-box-arrow-in-right me-2"></i>Iniciar sesión</h4>
            <p className="text-center text-muted small mb-4">Accede como cliente o administrador</p>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={enviar}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-primary w-100" disabled={cargando}>
                {cargando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            <hr />
            <p className="text-center small mb-2">¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link></p>
            <div className="alert alert-light small mb-0">
              <strong>Demo:</strong><br />
              Admin: admin@libreria.com / admin123<br />
              Cliente: ana@cliente.com / cliente123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}