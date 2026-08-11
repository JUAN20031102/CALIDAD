import { useEffect, useState } from "react";
import api from "../api";
import { GraficaBarras, GraficaDona } from "../components/Graficas";
const CATEGORIAS_ML = ["Literatura", "Fantasia", "Ciencia Ficcion", "Historia", "Autoayuda", "Romance", "Infantil", "Tecnologia", "Misterio"];
const FRECUENCIAS_ML = ["A diario", "Varias veces por semana", "Semanal", "Mensual", "Casi nunca"];
const PROFESIONES_ML = [
  "Estudiante",
  "Docente",
  "Ingeniero",
  "M\xE9dico",
  "Abogado",
  "Arquitecto",
  "Contador",
  "Dise\xF1ador",
  "Programador",
  "Periodista",
  "Chef",
  "Psic\xF3logo",
  "Enfermero",
  "Veterinario",
  "Comerciante",
  "Constructor",
  "Electricista",
  "Mec\xE1nico",
  "Agricultor",
  "Polic\xEDa",
  "Bombero",
  "Otros"
];
function conteoNivel(rows, columna) {
  const niveles = ["bajo", "medio", "alto"];
  return niveles.map((n) => ({
    label: n.charAt(0).toUpperCase() + n.slice(1),
    valor: rows.filter((p) => (p[columna] || "").toLowerCase() === n).length
  })).filter((x) => x.valor > 0);
}
function Metricas({ resultado }) {
  const items = [
    { icono: "bi-cash-coin", titulo: "Gasto total (R\xB2)", valor: resultado.gasto?.r2 != null ? resultado.gasto.r2.toFixed(3) : "\u2014" },
    { icono: "bi-book", titulo: "Cant. libros (MAE)", valor: resultado.libros?.mae != null ? resultado.libros.mae.toFixed(2) : "\u2014" },
    { icono: "bi-pie-chart", titulo: "Nivel gasto (acc)", valor: resultado.nivel_gasto?.accuracy != null ? resultado.nivel_gasto.accuracy.toFixed(3) : "\u2014" },
    { icono: "bi-graph-up", titulo: "Nivel lectura (acc)", valor: resultado.nivel_lectura?.accuracy != null ? resultado.nivel_lectura.accuracy.toFixed(3) : "\u2014" },
    { icono: "bi-tag", titulo: "Categor\xEDa (acc)", valor: resultado.categoria?.accuracy != null ? resultado.categoria.accuracy.toFixed(3) : "\u2014" },
    { icono: "bi-person-badge", titulo: "Autor (acc)", valor: resultado.autor?.accuracy != null ? resultado.autor.accuracy.toFixed(3) : "\u2014" }
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, items.map((it, i) => /* @__PURE__ */ React.createElement("div", { className: "col-6 col-lg-2", key: i }, /* @__PURE__ */ React.createElement("div", { className: "stats-card p-3 text-center" }, /* @__PURE__ */ React.createElement("i", { className: `bi ${it.icono} icon` }), /* @__PURE__ */ React.createElement("div", { className: "fs-4 fw-bold" }, it.valor), /* @__PURE__ */ React.createElement("small", null, it.titulo)))));
}
function ClienteSimilar({ c }) {
  return /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { className: "fw-bold" }, c.nombre), /* @__PURE__ */ React.createElement("td", null, c.email), /* @__PURE__ */ React.createElement("td", null, c.edad), /* @__PURE__ */ React.createElement("td", null, c.profesion), /* @__PURE__ */ React.createElement("td", { className: "text-capitalize" }, c.frecuenciaLectura), /* @__PURE__ */ React.createElement("td", null, (c.preferenciasCategorias || []).join(", ")), /* @__PURE__ */ React.createElement("td", null, (c.autores || []).join(", ")), /* @__PURE__ */ React.createElement("td", { className: "text-price" }, "$", (c.gastoTotal || 0).toFixed(2)), /* @__PURE__ */ React.createElement("td", null, c.totalCompras));
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
  const [form, setForm] = useState({ nombre: "", edad: "", profesion: "", frecuenciaLectura: "", autores: "" });
  const [cateSel, setCateSel] = useState([]);
  const [autoresSel, setAutoresSel] = useState([]);
  const [autoresDisponibles, setAutoresDisponibles] = useState([]);
  const [cargandoAutores, setCargandoAutores] = useState(true);
  async function refetch() {
    try {
      const [e, d] = await Promise.all([api.get("/ml/estado"), api.get("/ml/dashboard")]);
      setEstado(e.data);
      setDashboard(d.data);
    } catch (err) {
      console.error(err);
    }
  }
  useEffect(() => {
    refetch();
    api.get("/libros/autores").then((r) => {
      setAutoresDisponibles(r.data);
      setCargandoAutores(false);
    }).catch(() => setCargandoAutores(false));
  }, []);
  async function entrenar() {
    setEntrenando(true);
    setProgreso({ etapa: "iniciando", porcentaje: 2, mensaje: "Preparando datos..." });
    const poll = setInterval(async () => {
      try {
        const r = await api.get("/ml/progreso");
        if (r.data.entrenando) setProgreso(r.data);
      } catch {
      }
    }, 700);
    try {
      await api.post("/ml/entrenar");
    } catch (err) {
      alert(err.response?.data?.msg || err.response?.data?.detalle || "Error al entrenar");
    } finally {
      clearInterval(poll);
      setEntrenando(false);
      setProgreso(null);
      await refetch();
    }
  }
  function alternarCategoria(c) {
    setCateSel((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }
  function alternarAutor(a) {
    setAutoresSel((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }
  async function predecir(e) {
    e.preventDefault();
    if (!estado?.entrenado) {
      alert("Primero debes entrenar los modelos.");
      return;
    }
    setPredCargando(true);
    setPred(null);
    setSimilares([]);
    try {
      const [predRes, simRes] = await Promise.all([
        api.post("/ml/predecir", {
          edad: form.edad ? Number(form.edad) : null,
          profesion: form.profesion,
          frecuenciaLectura: form.frecuenciaLectura,
          categorias: cateSel,
          autores: autoresSel
        }),
        api.post("/ml/similares", {
          edad: form.edad ? Number(form.edad) : null,
          profesion: form.profesion,
          frecuenciaLectura: form.frecuenciaLectura,
          categorias: cateSel,
          autores: autoresSel
        })
      ]);
      setPred(predRes.data);
      setSimilares(simRes.data.similares || []);
    } catch (err) {
      alert(err.response?.data?.msg || err.response?.data?.detalle || "Error al predecir");
    } finally {
      setPredCargando(false);
    }
  }
  const predEntrenadas = dashboard?.predicciones || [];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h5", { className: "fw-bold mb-0" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-cpu me-2" }), "Machine Learning"), /* @__PURE__ */ React.createElement("p", { className: "text-muted mb-0 small" }, "Modelos entrenados con los datos reales de los clientes de la librer\xEDa.")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: entrenar, disabled: entrenando }, entrenando ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "spinner-border spinner-border-sm me-2" }), "Entrenando...") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "bi bi-play-fill me-1" }), "Entrenar Modelos"))), entrenando && /* @__PURE__ */ React.createElement("div", { className: "card shadow-sm mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "card-body" }, /* @__PURE__ */ React.createElement("div", { className: "d-flex justify-content-between small mb-1" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, progreso?.etapa), " \xB7 ", progreso?.mensaje), /* @__PURE__ */ React.createElement("span", { className: "fw-bold" }, progreso?.porcentaje || 0, "%")), /* @__PURE__ */ React.createElement("div", { className: "progress", style: { height: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "progress-bar progress-bar-striped progress-bar-animated bg-primary", style: { width: `${progreso?.porcentaje || 0}%` } })))), !estado?.entrenado && !entrenando && /* @__PURE__ */ React.createElement("div", { className: "alert alert-info py-2" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-info-circle me-2" }), "A\xFAn no hay modelos entrenados. Pulsa ", /* @__PURE__ */ React.createElement("strong", null, "Entrenar Modelos"), "."), estado?.entrenado && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Metricas, { resultado: estado }), /* @__PURE__ */ React.createElement("div", { className: "row g-3 mt-1" }, /* @__PURE__ */ React.createElement("div", { className: "col-lg-6" }, /* @__PURE__ */ React.createElement("div", { className: "card shadow-sm h-100" }, /* @__PURE__ */ React.createElement("div", { className: "card-body" }, /* @__PURE__ */ React.createElement("h6", { className: "fw-bold mb-3" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-bar-chart me-1 text-primary" }), "Distribuci\xF3n del nivel de gasto (predicho)"), /* @__PURE__ */ React.createElement(GraficaDona, { datos: conteoNivel(predEntrenadas, "NIVEL_GASTO_PRED") })))), /* @__PURE__ */ React.createElement("div", { className: "col-lg-6" }, /* @__PURE__ */ React.createElement("div", { className: "card shadow-sm h-100" }, /* @__PURE__ */ React.createElement("div", { className: "card-body" }, /* @__PURE__ */ React.createElement("h6", { className: "fw-bold mb-3" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-pie-chart me-1 text-success" }), "Distribuci\xF3n del nivel de lectura (predicho)"), /* @__PURE__ */ React.createElement(GraficaBarras, { datos: conteoNivel(predEntrenadas, "NIVEL_LECTURA_PRED"), color: "#0d6efd" }))))), predEntrenadas.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "card shadow-sm mt-3" }, /* @__PURE__ */ React.createElement("div", { className: "card-body table-responsive" }, /* @__PURE__ */ React.createElement("h6", { className: "fw-bold mb-3" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-table me-1 text-warning" }), "Predicciones del dataset ", /* @__PURE__ */ React.createElement("span", { className: "text-muted small fw-normal" }, "(", predEntrenadas.length, " clientes)")), /* @__PURE__ */ React.createElement("table", { className: "table align-middle" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Cliente"), /* @__PURE__ */ React.createElement("th", null, "Email"), /* @__PURE__ */ React.createElement("th", null, "Gasto pred"), /* @__PURE__ */ React.createElement("th", null, "Libros pred"), /* @__PURE__ */ React.createElement("th", null, "Categor\xEDa pred"), /* @__PURE__ */ React.createElement("th", null, "Nivel gasto"), /* @__PURE__ */ React.createElement("th", null, "Nivel lectura"))), /* @__PURE__ */ React.createElement("tbody", null, predEntrenadas.map((p, i) => /* @__PURE__ */ React.createElement("tr", { key: i }, /* @__PURE__ */ React.createElement("td", { className: "fw-bold" }, p.NOMBRE), /* @__PURE__ */ React.createElement("td", null, p.EMAIL), /* @__PURE__ */ React.createElement("td", { className: "text-price" }, "$", Number(p.GASTO_PRED || 0).toFixed(2)), /* @__PURE__ */ React.createElement("td", null, Number(p.LIBROS_PRED || 0)), /* @__PURE__ */ React.createElement("td", null, p.CATEGORIA_PRED || "\u2014"), /* @__PURE__ */ React.createElement("td", { className: "fw-bold text-capitalize" }, p.NIVEL_GASTO_PRED || "\u2014"), /* @__PURE__ */ React.createElement("td", { className: "fw-bold text-capitalize" }, p.NIVEL_LECTURA_PRED || "\u2014")))))))), /* @__PURE__ */ React.createElement("hr", { className: "my-4" }), /* @__PURE__ */ React.createElement("h5", { className: "fw-bold mb-3" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-person-plus me-2" }), "Predecir nuevo cliente"), /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, /* @__PURE__ */ React.createElement("div", { className: "col-lg-5" }, /* @__PURE__ */ React.createElement("div", { className: "card shadow-sm h-100" }, /* @__PURE__ */ React.createElement("div", { className: "card-body" }, /* @__PURE__ */ React.createElement("form", { onSubmit: predecir }, /* @__PURE__ */ React.createElement("div", { className: "mb-2" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Edad"), /* @__PURE__ */ React.createElement("input", { type: "number", min: "1", max: "120", className: "form-control", value: form.edad, onChange: (e) => setForm({ ...form, edad: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "mb-2" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Profesi\xF3n"), /* @__PURE__ */ React.createElement("select", { className: "form-select", value: form.profesion, onChange: (e) => setForm({ ...form, profesion: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecciona..."), PROFESIONES_ML.map((p) => /* @__PURE__ */ React.createElement("option", { key: p, value: p }, p)))), /* @__PURE__ */ React.createElement("div", { className: "mb-2" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Frecuencia de lectura"), /* @__PURE__ */ React.createElement("select", { className: "form-select", value: form.frecuenciaLectura, onChange: (e) => setForm({ ...form, frecuenciaLectura: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecciona..."), FRECUENCIAS_ML.map((f) => /* @__PURE__ */ React.createElement("option", { key: f, value: f }, f)))), /* @__PURE__ */ React.createElement("div", { className: "mb-2" }, /* @__PURE__ */ React.createElement("label", { className: "form-label mb-1" }, "Categor\xEDas de inter\xE9s"), /* @__PURE__ */ React.createElement("div", { className: "d-flex flex-wrap gap-2" }, CATEGORIAS_ML.map((c) => /* @__PURE__ */ React.createElement("div", { className: "form-check form-check-inline m-0", key: c }, /* @__PURE__ */ React.createElement("input", { className: "form-check-input", type: "checkbox", id: `mlcat-${c}`, checked: cateSel.includes(c), onChange: () => alternarCategoria(c) }), /* @__PURE__ */ React.createElement("label", { className: "form-check-label", htmlFor: `mlcat-${c}` }, c))))), /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, /* @__PURE__ */ React.createElement("label", { className: "form-label" }, "Autores favoritos ", /* @__PURE__ */ React.createElement("span", { className: "text-muted" }, "(selecciona de la base de datos)")), cargandoAutores ? /* @__PURE__ */ React.createElement("p", { className: "text-muted small" }, "Cargando autores...") : /* @__PURE__ */ React.createElement("div", { className: "border rounded p-2", style: { maxHeight: 180, overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "row g-1" }, autoresDisponibles.map((a) => /* @__PURE__ */ React.createElement("div", { className: "col-6 col-md-4 col-lg-3", key: a }, /* @__PURE__ */ React.createElement("div", { className: "form-check form-check-inline" }, /* @__PURE__ */ React.createElement("input", { className: "form-check-input", type: "checkbox", id: `mlaut-${a}`, checked: autoresSel.includes(a), onChange: () => alternarAutor(a) }), /* @__PURE__ */ React.createElement("label", { className: "form-check-label small", htmlFor: `mlaut-${a}` }, a)))))), autoresSel.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-1" }, /* @__PURE__ */ React.createElement("small", { className: "text-muted" }, "Seleccionados: ", autoresSel.join(", ")))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-success w-100", disabled: predCargando || !estado?.entrenado }, predCargando ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "spinner-border spinner-border-sm me-2" }), "Prediciendo...") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("i", { className: "bi bi-arrow-right-circle me-1" }), "Obtener predicci\xF3n")))))), /* @__PURE__ */ React.createElement("div", { className: "col-lg-7" }, /* @__PURE__ */ React.createElement("div", { className: "card shadow-sm h-100" }, /* @__PURE__ */ React.createElement("div", { className: "card-body" }, /* @__PURE__ */ React.createElement("h6", { className: "fw-bold mb-3" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-cpu me-1" }), "Resultados de la predicci\xF3n"), !pred ? /* @__PURE__ */ React.createElement("p", { className: "text-muted small" }, "Completa el formulario y pulsa ", /* @__PURE__ */ React.createElement("strong", null, "Obtener predicci\xF3n"), " para ver los resultados.") : /* @__PURE__ */ React.createElement("div", { className: "row g-3" }, /* @__PURE__ */ React.createElement("div", { className: "col-6 col-lg-3" }, /* @__PURE__ */ React.createElement("div", { className: "stats-card p-3 text-center" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-cash-coin icon" }), /* @__PURE__ */ React.createElement("div", { className: "fs-4 fw-bold" }, "$", (pred.gasto_estimado || 0).toFixed(2)), /* @__PURE__ */ React.createElement("small", null, "Gasto estimado"))), /* @__PURE__ */ React.createElement("div", { className: "col-6 col-lg-3" }, /* @__PURE__ */ React.createElement("div", { className: "stats-card p-3 text-center" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-book icon" }), /* @__PURE__ */ React.createElement("div", { className: "fs-4 fw-bold" }, pred.libros_estimados ?? 0), /* @__PURE__ */ React.createElement("small", null, "Libros estimados"))), /* @__PURE__ */ React.createElement("div", { className: "col-6 col-lg-3" }, /* @__PURE__ */ React.createElement("div", { className: "stats-card p-3 text-center" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-tag icon" }), /* @__PURE__ */ React.createElement("div", { className: "fs-5 fw-bold text-capitalize" }, pred.categoria_probable?.valor || "\u2014"), /* @__PURE__ */ React.createElement("small", null, "Categor\xEDa probable"))), /* @__PURE__ */ React.createElement("div", { className: "col-6 col-lg-3" }, /* @__PURE__ */ React.createElement("div", { className: "stats-card p-3 text-center" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-person-badge icon" }), /* @__PURE__ */ React.createElement("div", { className: "fs-6 fw-bold" }, pred.autor_probable?.valor || "\u2014"), /* @__PURE__ */ React.createElement("small", null, "Autor probable"))), /* @__PURE__ */ React.createElement("div", { className: "col-6 col-lg-3" }, /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-warning me-2" }, "Nivel gasto"), /* @__PURE__ */ React.createElement("span", { className: "fw-bold text-capitalize" }, pred.nivel_gasto || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "col-6 col-lg-3" }, /* @__PURE__ */ React.createElement("span", { className: "badge text-bg-info me-2" }, "Nivel lectura"), /* @__PURE__ */ React.createElement("span", { className: "fw-bold text-capitalize" }, pred.nivel_lectura || "\u2014")), pred.categorias_top?.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "col-12" }, /* @__PURE__ */ React.createElement("small", { className: "text-muted" }, "Categor\xEDas m\xE1s probables: "), pred.categorias_top.map((c, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "badge text-bg-light border me-1" }, c.valor, " \xB7 ", (c.probabilidad * 100).toFixed(1), "%")))), pred?.recomendaciones?.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-4" }, /* @__PURE__ */ React.createElement("h6", { className: "fw-bold mb-2" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-stars me-1 text-warning" }), "Recomendaciones inteligentes"), /* @__PURE__ */ React.createElement("div", { className: "list-group list-group-flush" }, pred.recomendaciones.map((r, i) => /* @__PURE__ */ React.createElement("div", { className: "list-group-item d-flex justify-content-between align-items-center", key: i }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "fw-bold" }, r.titulo), /* @__PURE__ */ React.createElement("small", { className: "text-muted" }, r.autor, " \xB7 ", r.categoria)), /* @__PURE__ */ React.createElement("div", { className: "text-end" }, /* @__PURE__ */ React.createElement("div", { className: "text-price fw-bold" }, "$", r.precio), /* @__PURE__ */ React.createElement("small", { className: "text-muted" }, r.popularidad, " vendidos \xB7 puntaje ", r.puntaje)))))), similares.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-4" }, /* @__PURE__ */ React.createElement("h6", { className: "fw-bold mb-2" }, /* @__PURE__ */ React.createElement("i", { className: "bi bi-people me-1 text-primary" }), "Clientes con caracter\xEDsticas similares (", similares.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "table-responsive" }, /* @__PURE__ */ React.createElement("table", { className: "table align-middle table-sm" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Cliente"), /* @__PURE__ */ React.createElement("th", null, "Email"), /* @__PURE__ */ React.createElement("th", null, "Edad"), /* @__PURE__ */ React.createElement("th", null, "Profesi\xF3n"), /* @__PURE__ */ React.createElement("th", null, "Frecuencia"), /* @__PURE__ */ React.createElement("th", null, "Categor\xEDas"), /* @__PURE__ */ React.createElement("th", null, "Autores"), /* @__PURE__ */ React.createElement("th", null, "Gasto"), /* @__PURE__ */ React.createElement("th", null, "Compras"))), /* @__PURE__ */ React.createElement("tbody", null, similares.map((c, i) => /* @__PURE__ */ React.createElement(ClienteSimilar, { key: i, c })))))))))), ")}");
}
