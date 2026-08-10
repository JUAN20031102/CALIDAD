import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CATEGORIAS = [
  'Literatura', 'Fantasia', 'Ciencia Ficcion', 'Historia',
  'Autoayuda', 'Romance', 'Infantil', 'Tecnologia', 'Misterio'
];

const FRECUENCIAS = [
  'A diario', 'Varias veces por semana', 'Semanal', 'Mensual', 'Casi nunca'
];

const PROFESIONES = [
  'Estudiante', 'Docente', 'Ingeniero', 'Médico', 'Abogado',
  'Arquitecto', 'Contador', 'Diseñador', 'Programador', 'Periodista',
  'Chef', 'Psicólogo', 'Enfermero', 'Veterinario', 'Comerciante',
  'Constructor', 'Electricista', 'Mecánico', 'Agricultor', 'Policía',
  'Bombero', 'Otros'
];

export default function Registro() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '', email: '', celular: '', password: '',
    profesion: '', edad: '', frecuenciaLectura: '', autores: ''
  });
  const [categorias, setCategorias] = useState([]);
  const [autoresDisponibles, setAutoresDisponibles] = useState([]);
  const [autoresSel, setAutoresSel] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoAutores, setCargandoAutores] = useState(true);

  useEffect(() => {
    api.get('/libros/autores').then(r => { setAutoresDisponibles(r.data); setCargandoAutores(false); }).catch(() => setCargandoAutores(false));
  }, []);

  const cambiar = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  const alternarCategoria = (cat) => {
    setCategorias(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const alternarAutor = (autor) => {
    setAutoresSel(prev => prev.includes(autor) ? prev.filter(a => a !== autor) : [...prev, autor]);
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await registro({
        ...form,
        edad: form.edad ? Number(form.edad) : null,
        preferenciasCategorias: categorias,
        autores: autoresSel
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al registrarse');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-6">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h4 className="text-center fw-bold mb-4"><i className="bi bi-person-plus me-2"></i>Crear cuenta de cliente</h4>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={enviar}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Nombre completo</label>
                  <input className="form-control" value={form.nombre} onChange={e => cambiar('nombre', e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={e => cambiar('email', e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Celular</label>
                  <input type="tel" className="form-control" value={form.celular} onChange={e => cambiar('celular', e.target.value)} placeholder="Ej. 0991234567" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Profesión</label>
                  <select className="form-select" value={form.profesion} onChange={e => cambiar('profesion', e.target.value)} required>
                    <option value="">Selecciona una opción</option>
                    {PROFESIONES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Edad</label>
                  <input type="number" min="1" max="120" className="form-control" value={form.edad} onChange={e => cambiar('edad', e.target.value)} required />
                </div>
                <div className="col-12">
                  <label className="form-label">Frecuencia de lectura</label>
                  <select className="form-select" value={form.frecuenciaLectura} onChange={e => cambiar('frecuenciaLectura', e.target.value)} required>
                    <option value="">Selecciona una opción</option>
                    {FRECUENCIAS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Contraseña</label>
                  <input type="password" className="form-control" value={form.password} onChange={e => cambiar('password', e.target.value)} required minLength={6} />
                </div>
                <div className="col-12">
                  <label className="form-label mb-2">Categorías que te gustan <span className="text-muted">(marca las que prefieras)</span></label>
                  <div className="d-flex flex-wrap gap-2">
                    {CATEGORIAS.map(cat => (
                      <div className="form-check form-check-inline m-0" key={cat}>
                        <input className="form-check-input" type="checkbox" id={`cat-${cat}`} checked={categorias.includes(cat)} onChange={() => alternarCategoria(cat)} />
                        <label className="form-check-label" htmlFor={`cat-${cat}`}>{cat}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label">Autores que te gustan <span className="text-muted">(selecciona de la lista)</span></label>
                  {cargandoAutores ? (
                    <p className="text-muted small">Cargando autores...</p>
                  ) : (
                    <div className="border rounded p-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                      <div className="row g-1">
                        {autoresDisponibles.map(a => (
                          <div className="col-6 col-md-4 col-lg-3" key={a}>
                            <div className="form-check form-check-inline">
                              <input className="form-check-input" type="checkbox" id={`autor-${a}`} checked={autoresSel.includes(a)} onChange={() => alternarAutor(a)} />
                              <label className="form-check-label small" htmlFor={`autor-${a}`}>{a}</label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {autoresSel.length > 0 && (
                    <div className="mt-1">
                      <small className="text-muted">Seleccionados: {autoresSel.join(', ')}</small>
                    </div>
                  )}
                </div>
              </div>
              <button className="btn btn-primary w-100 mt-3" disabled={cargando}>
                {cargando ? 'Creando cuenta...' : 'Registrarme'}
              </button>
            </form>
            <hr />
            <p className="text-center small mb-0">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}