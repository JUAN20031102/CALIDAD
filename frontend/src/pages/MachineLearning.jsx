import { useEffect, useState } from 'react';
import api from '../api';
import { GraficaBarras, GraficaDona } from '../components/Graficas';

const CATEGORIAS_ML = ['Literatura', 'Fantasia', 'Ciencia Ficcion', 'Historia', 'Autoayuda', 'Romance', 'Infantil', 'Tecnologia', 'Misterio'];
const FRECUENCIAS_ML = ['A diario', 'Varias veces por semana', 'Semanal', 'Mensual', 'Casi nunca'];
const PROFESIONES_ML = [
  'Estudiante', 'Docente', 'Ingeniero', 'Médico', 'Abogado',
  'Arquitecto', 'Contador', 'Diseñador', 'Programador', 'Periodista',
  'Chef', 'Psicólogo', 'Enfermero', 'Veterinario', 'Comerciante',
  'Constructor', 'Electricista', 'Mecánico', 'Agricultor', 'Policía',
  'Bombero', 'Otros'
];

function conteoNivel(rows, columna) {
  const niveles = ['bajo', 'medio', 'alto'];
  return niveles.map(n => ({
    label: n.charAt(0).toUpperCase() + n.slice(1),
    valor: rows.filter(p => (p[columna] || '').toLowerCase() === n).length
  })).filter(x => x.valor > 0);
}

function Metricas({ resultado }) {
  const items = [
    { icono: 'bi-cash-coin', titulo: 'Gasto total (R²)', valor: resultado.gasto?.r2 != null ? resultado.gasto.r2.toFixed(3) : '—' },
    { icono: 'bi-book', titulo: 'Cant. libros (MAE)', valor: resultado.libros?.mae != null ? resultado.libros.mae.toFixed(2) : '—' },
    { icono: 'bi-pie-chart', titulo: 'Nivel gasto (acc)', valor: resultado.nivel_gasto?.accuracy != null ? resultado.nivel_gasto.accuracy.toFixed(3) : '—' },
    { icono: 'bi-graph-up', titulo: 'Nivel lectura (acc)', valor: resultado.nivel_lectura?.accuracy != null ? resultado.nivel_lectura.accuracy.toFixed(3) : '—' },
    { icono: 'bi-tag', titulo: 'Categoría (acc)', valor: resultado.categoria?.accuracy != null ? resultado.categoria.accuracy.toFixed(3) : '—' },
    { icono: 'bi-person-badge', titulo: 'Autor (acc)', valor: resultado.autor?.accuracy != null ? resultado.autor.accuracy.toFixed(3) : '—' }
  ];
  return (
    <div className="row g-3">
      {items.map((it, i) => (
        <div className="col-6 col-lg-2" key={i}>
          <div className="stats-card p-3 text-center">
            <i className={`bi ${it.icono} icon`}></i>
            <div className="fs-4 fw-bold">{it.valor}</div>
            <small>{it.titulo}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClienteSimilar({ c }) {
  return (
    <tr>
      <td className="fw-bold">{c.nombre}</td>
      <td>{c.email}</td>
      <td>{c.edad}</td>
      <td>{c.profesion}</td>
      <td className="text-capitalize">{c.frecuenciaLectura}</td>
      <td>{(c.preferenciasCategorias || []).join(', ')}</td>
      <td>{(c.autores || []).join(', ')}</td>
      <td className="text-price">${(c.gastoTotal || 0).toFixed(2)}</td>
      <td>{c.totalCompras}</td>
    </tr>
  );
}

export default function MachineLearning() {
  const [estado, setEstado] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [entrenando, setEntrenando] = useState(false);
  const [progreso, setProgreso] = useState(null);
  const [pred, setPred] = useState(null);
  const [predCargando, setPredCargando] = useState(false);
  const [similares, setSimilares] = useState([]);
  const [cargandoSimilares, setCargandoSimilares] = useState(false);
  const [form, setForm] = useState({ nombre: '', edad: '', profesion: '', frecuenciaLectura: '', autores: '' });
  const [cateSel, setCateSel] = useState([]);
  const [autoresSel, setAutoresSel] = useState([]);
  const [autoresDisponibles, setAutoresDisponibles] = useState([]);
  const [cargandoAutores, setCargandoAutores] = useState(true);

  async function refetch() {
    try {
      const [e, d] = await Promise.all([api.get('/ml/estado'), api.get('/ml/dashboard')]);
      setEstado(e.data);
      setDashboard(d.data);
    } catch (err) { console.error(err); }
  }

  useEffect(() => { refetch(); api.get('/libros/autores').then(r => { setAutoresDisponibles(r.data); setCargandoAutores(false); }).catch(() => setCargandoAutores(false)); }, []);

  async function entrenar() {
    setEntrenando(true);
    setProgreso({ etapa: 'iniciando', porcentaje: 2, mensaje: 'Preparando datos...' });
    const poll = setInterval(async () => {
      try { const r = await api.get('/ml/progreso'); if (r.data.entrenando) setProgreso(r.data); } catch { }
    }, 700);
    try { await api.post('/ml/entrenar'); } catch (err) { alert(err.response?.data?.msg || err.response?.data?.detalle || 'Error al entrenar'); }
    finally { clearInterval(poll); setEntrenando(false); setProgreso(null); await refetch(); }
  }

  function alternarCategoria(c) { setCateSel(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]); }
  function alternarAutor(a) { setAutoresSel(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]); }

  async function predecir(e) {
    e.preventDefault();
    if (!estado?.entrenado) { alert('Primero debes entrenar los modelos.'); return; }
    setPredCargando(true); setPred(null); setSimilares([]);
    try {
      const [predRes, simRes] = await Promise.all([
        api.post('/ml/predecir', {
          edad: form.edad ? Number(form.edad) : null,
          profesion: form.profesion,
          frecuenciaLectura: form.frecuenciaLectura,
          categorias: cateSel,
          autores: autoresSel
        }),
        api.post('/ml/similares', {
          edad: form.edad ? Number(form.edad) : null,
          profesion: form.profesion,
          frecuenciaLectura: form.frecuenciaLectura,
          categorias: cateSel,
          autores: autoresSel
        })
      ]);
      setPred(predRes.data);
      setSimilares(simRes.data.similares || []);
    } catch (err) { alert(err.response?.data?.msg || err.response?.data?.detalle || 'Error al predecir'); }
    finally { setPredCargando(false); }
  }

  const predEntrenadas = dashboard?.predicciones || [];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h5 className="fw-bold mb-0"><i className="bi bi-cpu me-2"></i>Machine Learning</h5>
          <p className="text-muted mb-0 small">Modelos entrenados con los datos reales de los clientes de la librería.</p>
        </div>
        <button className="btn btn-primary" onClick={entrenar} disabled={entrenando}>
          {entrenando ? (<><span className="spinner-border spinner-border-sm me-2"></span>Entrenando...</>) : (<><i className="bi bi-play-fill me-1"></i>Entrenar Modelos</>)}
        </button>
      </div>

      {entrenando && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between small mb-1">
              <span><strong>{progreso?.etapa}</strong> · {progreso?.mensaje}</span>
              <span className="fw-bold">{progreso?.porcentaje || 0}%</span>
            </div>
            <div className="progress" style={{ height: 12 }}>
              <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary" style={{ width: `${progreso?.porcentaje || 0}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {!estado?.entrenado && !entrenando && (
        <div className="alert alert-info py-2"><i className="bi bi-info-circle me-2"></i>Aún no hay modelos entrenados. Pulsa <strong>Entrenar Modelos</strong>.</div>
      )}

      {estado?.entrenado && (
        <>
          <Metricas resultado={estado} />
          <div className="row g-3 mt-1">
            <div className="col-lg-6">
              <div className="card shadow-sm h-100"><div className="card-body">
                <h6 className="fw-bold mb-3"><i className="bi bi-bar-chart me-1 text-primary"></i>Distribución del nivel de gasto (predicho)</h6>
                <GraficaDona datos={conteoNivel(predEntrenadas, 'NIVEL_GASTO_PRED')} />
              </div></div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm h-100"><div className="card-body">
                <h6 className="fw-bold mb-3"><i className="bi bi-pie-chart me-1 text-success"></i>Distribución del nivel de lectura (predicho)</h6>
                <GraficaBarras datos={conteoNivel(predEntrenadas, 'NIVEL_LECTURA_PRED')} color="#0d6efd" />
              </div></div>
            </div>
          </div>
          {predEntrenadas.length > 0 && (
            <div className="card shadow-sm mt-3"><div className="card-body table-responsive">
              <h6 className="fw-bold mb-3"><i className="bi bi-table me-1 text-warning"></i>Predicciones del dataset <span className="text-muted small fw-normal">({predEntrenadas.length} clientes)</span></h6>
              <table className="table align-middle"><thead><tr><th>Cliente</th><th>Email</th><th>Gasto pred</th><th>Libros pred</th><th>Categoría pred</th><th>Nivel gasto</th><th>Nivel lectura</th></tr></thead>
              <tbody>{predEntrenadas.map((p, i) => (
                <tr key={i}><td className="fw-bold">{p.NOMBRE}</td><td>{p.EMAIL}</td><td className="text-price">${Number(p.GASTO_PRED || 0).toFixed(2)}</td><td>{Number(p.LIBROS_PRED || 0)}</td><td>{p.CATEGORIA_PRED || '—'}</td><td className="fw-bold text-capitalize">{p.NIVEL_GASTO_PRED || '—'}</td><td className="fw-bold text-capitalize">{p.NIVEL_LECTURA_PRED || '—'}</td></tr>
              ))}</tbody></table>
            </div></div>
          )}
        </>
      )}

      <hr className="my-4" />
      <h5 className="fw-bold mb-3"><i className="bi bi-person-plus me-2"></i>Predecir nuevo cliente</h5>
      <div className="row g-3">
        <div className="col-lg-5">
          <div className="card shadow-sm h-100"><div className="card-body">
            <form onSubmit={predecir}>
              <div className="mb-2"><label className="form-label">Edad</label><input type="number" min="1" max="120" className="form-control" value={form.edad} onChange={e => setForm({ ...form, edad: e.target.value })} /></div>
              <div className="mb-2"><label className="form-label">Profesión</label>
                <select className="form-select" value={form.profesion} onChange={e => setForm({ ...form, profesion: e.target.value })}>
                  <option value="">Selecciona...</option>
                  {PROFESIONES_ML.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="mb-2"><label className="form-label">Frecuencia de lectura</label>
                <select className="form-select" value={form.frecuenciaLectura} onChange={e => setForm({ ...form, frecuenciaLectura: e.target.value })}>
                  <option value="">Selecciona...</option>
                  {FRECUENCIAS_ML.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="mb-2"><label className="form-label mb-1">Categorías de interés</label>
                <div className="d-flex flex-wrap gap-2">
                  {CATEGORIAS_ML.map(c => (
                    <div className="form-check form-check-inline m-0" key={c}>
                      <input className="form-check-input" type="checkbox" id={`mlcat-${c}`} checked={cateSel.includes(c)} onChange={() => alternarCategoria(c)} />
                      <label className="form-check-label" htmlFor={`mlcat-${c}`}>{c}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-3"><label className="form-label">Autores favoritos <span className="text-muted">(selecciona de la base de datos)</span></label>
                {cargandoAutores ? <p className="text-muted small">Cargando autores...</p> : (
                  <div className="border rounded p-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                    <div className="row g-1">
                      {autoresDisponibles.map(a => (
                        <div className="col-6 col-md-4 col-lg-3" key={a}>
                          <div className="form-check form-check-inline">
                            <input className="form-check-input" type="checkbox" id={`mlaut-${a}`} checked={autoresSel.includes(a)} onChange={() => alternarAutor(a)} />
                            <label className="form-check-label small" htmlFor={`mlaut-${a}`}>{a}</label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {autoresSel.length > 0 && <div className="mt-1"><small className="text-muted">Seleccionados: {autoresSel.join(', ')}</small></div>}
              </div>
              <button className="btn btn-success w-100" disabled={predCargando || !estado?.entrenado}>
                {predCargando ? (<><span className="spinner-border spinner-border-sm me-2"></span>Prediciendo...</>) : (<><i className="bi bi-arrow-right-circle me-1"></i>Obtener predicción</>)}
              </button>
            </form>
          </div></div>
        </div>

        <div className="col-lg-7">
            <div className="card shadow-sm h-100"><div className="card-body">
              <h6 className="fw-bold mb-3"><i className="bi bi-cpu me-1"></i>Resultados de la predicción</h6>
              {!pred ? (
                <p className="text-muted small">Completa el formulario y pulsa <strong>Obtener predicción</strong> para ver los resultados.</p>
              ) : (
                <div className="row g-3">
                  <div className="col-6 col-lg-3"><div className="stats-card p-3 text-center"><i className="bi bi-cash-coin icon"></i><div className="fs-4 fw-bold">${(pred.gasto_estimado || 0).toFixed(2)}</div><small>Gasto estimado</small></div></div>
                  <div className="col-6 col-lg-3"><div className="stats-card p-3 text-center"><i className="bi bi-book icon"></i><div className="fs-4 fw-bold">{pred.libros_estimados ?? 0}</div><small>Libros estimados</small></div></div>
                  <div className="col-6 col-lg-3"><div className="stats-card p-3 text-center"><i className="bi bi-tag icon"></i><div className="fs-5 fw-bold text-capitalize">{pred.categoria_probable?.valor || '—'}</div><small>Categoría probable</small></div></div>
                  <div className="col-6 col-lg-3"><div className="stats-card p-3 text-center"><i className="bi bi-person-badge icon"></i><div className="fs-6 fw-bold">{pred.autor_probable?.valor || '—'}</div><small>Autor probable</small></div></div>
                  <div className="col-6 col-lg-3"><span className="badge text-bg-warning me-2">Nivel gasto</span><span className="fw-bold text-capitalize">{pred.nivel_gasto || '—'}</span></div>
                  <div className="col-6 col-lg-3"><span className="badge text-bg-info me-2">Nivel lectura</span><span className="fw-bold text-capitalize">{pred.nivel_lectura || '—'}</span></div>
                  {pred.categorias_top?.length > 0 && (
                    <div className="col-12"><small className="text-muted">Categorías más probables: </small>{pred.categorias_top.map((c, i) => <span key={i} className="badge text-bg-light border me-1">{c.valor} · {(c.probabilidad * 100).toFixed(1)}%</span>)}</div>
                  )}
                </div>
              )}

              {pred?.recomendaciones?.length > 0 && (
                <div className="mt-4"><h6 className="fw-bold mb-2"><i className="bi bi-stars me-1 text-warning"></i>Recomendaciones inteligentes</h6>
                  <div className="list-group list-group-flush">
                    {pred.recomendaciones.map((r, i) => (
                      <div className="list-group-item d-flex justify-content-between align-items-center" key={i}>
                        <div><div className="fw-bold">{r.titulo}</div><small className="text-muted">{r.autor} · {r.categoria}</small></div>
                        <div className="text-end"><div className="text-price fw-bold">${r.precio}</div><small className="text-muted">{r.popularidad} vendidos · puntaje {r.puntaje}</small></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {similares.length > 0 && (
                <div className="mt-4"><h6 className="fw-bold mb-2"><i className="bi bi-people me-1 text-primary"></i>Clientes con características similares ({similares.length})</h6>
                  <div className="table-responsive"><table className="table align-middle table-sm"><thead><tr><th>Cliente</th><th>Email</th><th>Edad</th><th>Profesión</th><th>Frecuencia</th><th>Categorías</th><th>Autores</th><th>Gasto</th><th>Compras</th></tr></thead>
                  <tbody>{similares.map((c, i) => <ClienteSimilar key={i} c={c} />)}</tbody></table></div>
                </div>
              )}
</div></div>
          </div>
        </div>
      </div>
  );
}