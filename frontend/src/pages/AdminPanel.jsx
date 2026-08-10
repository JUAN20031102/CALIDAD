import { useEffect, useState } from 'react';
import api from '../api';
import { GraficaBarras, GraficaDona } from '../components/Graficas';
import MachineLearning from './MachineLearning';

const TABS = {
  reporte: 'Reportes',
  preferencias: 'Preferencias',
  ventas: 'Ventas',
  libros: 'Libros',
  clientes: 'Clientes',
  seguimiento: 'Seguimiento',
  admins: 'Administradores',
  ml: 'Machine Learning'
};

async function descargarCSV(url, nombre) {
  try {
    const res = await api.get(url, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    alert(err.response?.data?.msg || 'Error al descargar el reporte');
  }
}

export default function AdminPanel() {
  const [tab, setTab] = useState('reporte');

  return (
    <div>
      <h3 className="mb-3"><i className="bi bi-speedometer2 me-2"></i>Panel de administración</h3>
      <ul className="nav nav-tabs mb-4 flex-wrap">
        {Object.entries(TABS).map(([clave, label]) => (
          <li className="nav-item" key={clave}>
            <button className={`nav-link ${tab === clave ? 'active fw-bold' : ''}`} onClick={() => setTab(clave)}>{label}</button>
          </li>
        ))}
      </ul>
      {tab === 'reporte' && <Reportes />}
      {tab === 'preferencias' && <Preferencias />}
      {tab === 'ventas' && <Ventas />}
      {tab === 'libros' && <LibrosAdmin />}
      {tab === 'clientes' && <Clientes />}
      {tab === 'seguimiento' && <SeguimientoAdmin />}
      {tab === 'admins' && <Admins />}
      {tab === 'ml' && <MachineLearning />}
    </div>
  );
}

function Reportes() {
  const [reporte, setReporte] = useState(null);

  useEffect(() => {
    api.get('/ventas/reporte').then(r => setReporte(r.data)).catch(console.error);
  }, []);

  if (!reporte) return <div className="text-center p-4"><div className="spinner-border text-primary"></div></div>;

  const cards = [
    { icon: 'bi-receipt', titulo: 'Ventas totales', valor: reporte.totalVentas },
    { icon: 'bi-cash-stack', titulo: 'Ingresos', valor: `$${reporte.totalVendido.toFixed(2)}` },
    { icon: 'bi-book', titulo: 'Libros vendidos', valor: reporte.librosVendidos },
    { icon: 'bi-calendar-month', titulo: 'Ventas este mes', valor: reporte.ventasMes }
  ];

  const formatDia = (f) => {
    const d = f.split('-');
    return `${d[2]}/${d[1]}`;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => descargarCSV('/ventas/reporte/csv', 'reporte_ventas.csv')}>
            <i className="bi bi-download me-1"></i> Descargar reporte de ventas (CSV)
          </button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => descargarCSV('/admin/reportes/preferencias/csv', 'clientes_machine_learning.csv')}>
            <i className="bi bi-download me-1"></i> Descargar preferencias (CSV)
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {cards.map((c, i) => (
          <div className="col-6 col-lg-3" key={i}>
            <div className="stats-card p-3 text-center">
              <i className={`bi ${c.icon} icon`}></i>
              <div className="fs-3 fw-bold">{c.valor}</div>
              <small>{c.titulo}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-7">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-bold mb-3"><i className="bi bi-graph-up me-2 text-primary"></i>Ventas por día (últimos 30 días)</h5>
              {reporte.ventasPorDia.every(d => d.total === 0) ? (
                <p className="text-muted">Aún no hay ventas en los últimos 30 días.</p>
              ) : (
                <div className="table-responsive">
                  <GraficaBarras
                    datos={reporte.ventasPorDia.map(d => ({ label: formatDia(d.fecha), valor: d.total }))}
                    color="#0d6efd"
                    formato={v => `$${v.toFixed(2)}`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-bold mb-3"><i className="bi bi-pie-chart me-2 text-success"></i>Ingresos por categoría</h5>
              <GraficaDona
                datos={reporte.ventasPorCategoria.map(c => ({ label: c.categoria, valor: c.ingreso }))}
                formato={v => `$${v.toFixed(2)}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="fw-bold mb-3"><i className="bi bi-trophy me-2"></i>Top 5 libros más vendidos</h5>
          {reporte.topLibros.length === 0 ? (
            <p className="text-muted">Aún no hay ventas registradas.</p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead><tr><th>#</th><th>Libro</th><th>Cantidad</th><th>Ingreso</th></tr></thead>
                <tbody>
                  {reporte.topLibros.map((l, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className="fw-bold">{l.titulo}</td>
                      <td>{l.cantidad}</td>
                      <td className="text-price">${l.ingreso.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Preferencias() {
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/admin/reportes/preferencias').then(r => setReporte(r.data)).catch(console.error).finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="text-center p-4"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <p className="text-muted mb-0">Preferencias y comportamiento de cada usuario registrado. El CSV exporta los datos en columnas planas (sin arrays) para machine learning.</p>
        <button className="btn btn-primary btn-sm" onClick={() => descargarCSV('/admin/reportes/preferencias/csv', 'clientes_machine_learning.csv')}>
          <i className="bi bi-download me-1"></i> Descargar (CSV)
        </button>
      </div>
      {reporte.length === 0 ? (
        <p className="text-muted">No hay clientes registrados.</p>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Preferencias de registro</th>
                  <th>Categorías preferidas</th>
                  <th>Gustos</th>
                  <th>Compras</th>
                  <th>Gasto total</th>
                </tr>
              </thead>
              <tbody>
                {reporte.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div className="fw-bold">{c.nombre}</div>
                      <div className="small text-muted">{c.email}</div>
                    </td>
                    <td>
                      {c.preferenciasRegistro?.length ? c.preferenciasRegistro.map(p => <span className="badge bg-info text-dark me-1" key={p}>{p}</span>) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      {c.categoriasPreferidas.length ? c.categoriasPreferidas.map(p => (
                        <span className="badge bg-primary me-1 mb-1" key={p.categoria}>{p.categoria} × {p.contador}</span>
                      )) : <span className="text-muted">—</span>}
                    </td>
                    <td>{c.totalGustos}</td>
                    <td>{c.totalCompras}</td>
                    <td className="text-price">${c.gastoTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/ventas/todas').then(r => setVentas(r.data)).catch(console.error).finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="text-center p-4"><div className="spinner-border text-primary"></div></div>;
  if (ventas.length === 0) return <p className="text-muted">No hay ventas registradas.</p>;

  return (
    <div className="card shadow-sm">
      <div className="card-body table-responsive">
        <table className="table align-middle">
          <thead><tr><th>#</th><th>Cliente</th><th>Libros</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            {ventas.map((v, i) => (
              <tr key={v._id}>
                <td>{i + 1}</td>
                <td>{v.nombreCliente || v.cliente}</td>
                <td>
                  {v.items.map((it, j) => (
                    <div key={j} className="small">{it.titulo} × {it.cantidad}</div>
                  ))}
                </td>
                <td className="text-price">${v.total.toFixed(2)}</td>
                <td><span className={`badge ${v.estado === 'Pagada' ? 'bg-success' : 'bg-warning text-dark'}`}>{v.estado}</span></td>
                <td className="small text-muted">{new Date(v.fecha).toLocaleString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LibrosAdmin() {
  const [libros, setLibros] = useState([]);
  const [form, setForm] = useState({ titulo: '', autor: '', isbn: '', categoria: '', descripcion: '', precio: '', stock: '', portada: '', destacado: false, precioOferta: '' });
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = () => api.get('/libros').then(r => setLibros(r.data)).catch(console.error).finally(() => setCargando(false));
  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.titulo || !form.autor || !form.isbn || !form.categoria || form.precio === '') {
      return alert('Completa los campos obligatorios (título, autor, ISBN, categoría, precio)');
    }
    try {
      const datos = {
        ...form,
        precio: Number(form.precio),
        stock: Number(form.stock) || 0,
        precioOferta: form.precioOferta !== '' ? Number(form.precioOferta) : null
      };
      if (editando) await api.put(`/libros/${editando}`, datos);
      else await api.post('/libros', datos);
      setForm({ titulo: '', autor: '', isbn: '', categoria: '', descripcion: '', precio: '', stock: '', portada: '', destacado: false, precioOferta: '' });
      setEditando(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al guardar libro');
    }
  };

  const editar = (l) => {
    setEditando(l._id);
    setForm({ titulo: l.titulo, autor: l.autor, isbn: l.isbn, categoria: l.categoria, descripcion: l.descripcion || '', precio: l.precio, stock: l.stock, portada: l.portada || '', destacado: l.destacado, precioOferta: l.precioOferta ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminar = async (id, titulo) => {
    if (!confirm(`¿Eliminar el libro "${titulo}"?`)) return;
    await api.delete(`/libros/${id}`);
    cargar();
  };

  if (cargando) return <div className="text-center p-4"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="card shadow-sm sticky-top" style={{ top: 80 }}>
          <div className="card-body">
            <h5 className="fw-bold mb-3">{editando ? 'Editar libro' : 'Nuevo libro'}</h5>
            <form onSubmit={guardar}>
              <div className="row g-2">
                <div className="col-12"><input className="form-control form-control-sm" placeholder="Título *" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></div>
                <div className="col-6"><input className="form-control form-control-sm" placeholder="Autor *" value={form.autor} onChange={e => setForm({ ...form, autor: e.target.value })} /></div>
                <div className="col-6"><input className="form-control form-control-sm" placeholder="ISBN *" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} /></div>
                <div className="col-6"><input className="form-control form-control-sm" placeholder="Categoría *" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} /></div>
                <div className="col-6"><input className="form-control form-control-sm" placeholder="URL de portada (opcional)" value={form.portada} onChange={e => setForm({ ...form, portada: e.target.value })} /></div>
                <div className="col-12"><textarea className="form-control form-control-sm" rows="2" placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></div>
                <div className="col-6"><input className="form-control form-control-sm" type="number" min="0" step="0.01" placeholder="Precio *" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} /></div>
                <div className="col-6"><input className="form-control form-control-sm" type="number" min="0" step="0.01" placeholder="Precio de oferta (opcional)" value={form.precioOferta} onChange={e => setForm({ ...form, precioOferta: e.target.value })} /></div>
                <div className="col-6"><input className="form-control form-control-sm" type="number" min="0" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
                <div className="col-12">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="destacado" checked={form.destacado} onChange={e => setForm({ ...form, destacado: e.target.checked })} />
                    <label className="form-check-label small" htmlFor="destacado">Marcar como destacado</label>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary btn-sm flex-fill">{editando ? 'Guardar cambios' : 'Agregar libro'}</button>
                {editando && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setEditando(null); setForm({ titulo: '', autor: '', isbn: '', categoria: '', descripcion: '', precio: '', stock: '', portada: '', destacado: false, precioOferta: '' }); }}>Cancelar</button>}
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="col-lg-8">
        <div className="card shadow-sm">
          <div className="card-body table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Título</th><th>Autor</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
              <tbody>
                {libros.map(l => (
                  <tr key={l._id}>
                    <td>{l.titulo} {l.destacado && <span className="badge bg-warning text-dark">★</span>} {l.precioOferta && <span className="badge bg-danger">OFERTA</span>}</td>
                    <td>{l.autor}</td>
                    <td><span className="badge bg-secondary">{l.categoria}</span></td>
                    <td>
                      {l.precioOferta && l.precioOferta < l.precio ? (
                        <>
                          <span className="text-decoration-line-through text-muted small">${l.precio.toFixed(2)}</span>{' '}
                          <span className="text-danger fw-bold">${l.precioOferta.toFixed(2)}</span>
                        </>
                      ) : (
                        <>${l.precio.toFixed(2)}</>
                      )}
                    </td>
                    <td className={l.stock <= 0 ? 'text-danger fw-bold' : ''}>{l.stock}</td>
                    <td>
                      <button className="btn btn-outline-primary btn-sm me-1" onClick={() => editar(l)}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => eliminar(l._id, l.titulo)}><i className="bi bi-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Clientes() {
  const [clientes, setClientes] = useState([]);
  useEffect(() => {
    api.get('/admin/clientes').then(r => setClientes(r.data)).catch(console.error);
  }, []);

  return (
    <div className="card shadow-sm">
      <div className="card-body table-responsive">
        <table className="table align-middle">
          <thead><tr><th>Nombre</th><th>Email</th><th>Preferencias</th><th>Registro</th></tr></thead>
          <tbody>
            {clientes.map(c => (
              <tr key={c._id}>
                <td className="fw-bold">{c.nombre}</td>
                <td>{c.email}</td>
                <td>
                  {c.preferenciasCategorias?.length ? c.preferenciasCategorias.map(p => <span className="badge bg-secondary me-1" key={p}>{p}</span>) : <span className="text-muted">—</span>}
                </td>
                <td className="small text-muted">{new Date(c.fechaRegistro).toLocaleDateString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeguimientoAdmin() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/seguimiento/todos').then(r => setRegistros(r.data)).catch(console.error).finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="text-center p-4"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <p className="text-muted">Tabla de <strong>seguimiento</strong>: aquí se registra qué libros le gustan a cada cliente, qué agregó al carrito, sus categorías preferidas, compras y gasto total.</p>
      {registros.length === 0 ? <p>Sin datos de seguimiento.</p> : (
        <div className="row g-3">
          {registros.map(seg => (
            <div className="col-lg-6" key={seg._id}>
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <strong><i className="bi bi-person-circle me-1"></i>{seg.cliente?.nombre || 'Cliente'}</strong>
                  <span className="small text-muted">{seg.cliente?.email}</span>
                </div>
                <div className="card-body">
                  <div className="row text-center g-2 mb-3">
                    <div className="col-3"><div className="border rounded p-2"><div className="fs-5 fw-bold">{seg.gustos.length}</div><small>Gustos</small></div></div>
                    <div className="col-3"><div className="border rounded p-2"><div className="fs-5 fw-bold">{seg.agregadosCarrito.length}</div><small>Carrito</small></div></div>
                    <div className="col-3"><div className="border rounded p-2"><div className="fs-5 fw-bold">{seg.totalCompras}</div><small>Compras</small></div></div>
                    <div className="col-3"><div className="border rounded p-2"><div className="fs-5 fw-bold">${seg.gastoTotal.toFixed(2)}</div><small>Gasto</small></div></div>
                  </div>
                  <h6 className="small fw-bold text-uppercase text-muted">Categorías preferidas</h6>
                  {seg.preferenciasCategorias.length === 0 ? <p className="small text-muted">Sin datos</p> : (
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {seg.preferenciasCategorias.sort((a, b) => b.contador - a.contador).map((p, i) => (
                        <span className="badge bg-primary" key={i}>{p.categoria} × {p.contador}</span>
                      ))}
                    </div>
                  )}
                  <h6 className="small fw-bold text-uppercase text-muted">Libros que le gustan</h6>
                  {seg.gustos.length === 0 ? <p className="small text-muted">Ninguno aún</p> : (
                    <ul className="list-unstyled mb-0">
                      {seg.gustos.map(g => <li key={g._id} className="small"><i className="bi bi-heart-fill text-danger me-1"></i>{g.titulo}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Admins() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [msg, setMsg] = useState('');

  const cargar = () => api.get('/admin/administradores').then(r => setAdmins(r.data)).catch(console.error);
  useEffect(() => { cargar(); }, []);

  const crear = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/administradores', form);
      setForm({ nombre: '', email: '', password: '' });
      setMsg('Administrador creado correctamente');
      cargar();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.msg || 'Error al crear administrador');
    }
  };

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Nuevo administrador</h5>
            {msg && <div className="alert alert-success py-2">{msg}</div>}
            <form onSubmit={crear}>
              <div className="mb-2"><input className="form-control" placeholder="Nombre *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></div>
              <div className="mb-2"><input type="email" className="form-control" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="mb-3"><input type="password" className="form-control" placeholder="Contraseña *" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
              <button className="btn btn-primary w-100">Crear administrador</button>
            </form>
          </div>
        </div>
      </div>
      <div className="col-lg-8">
        <div className="card shadow-sm">
          <div className="card-body table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Nombre</th><th>Email</th><th>Registro</th></tr></thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a._id}>
                    <td className="fw-bold">{a.nombre}</td>
                    <td>{a.email}</td>
                    <td className="small text-muted">{new Date(a.fechaRegistro).toLocaleDateString('es-ES')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
