// Graficas simples en SVG, sin dependencias externas.

export function GraficaBarras({ datos, color = '#0d6efd', formato = v => v, alto = 200 }) {
  const max = Math.max(...datos.map(d => d.valor), 1);

  return (
    <div className="d-flex align-items-end justify-content-between gap-1" style={{ height: alto, minWidth: 420 }}>
      {datos.map((d, i) => {
        const h = Math.round((d.valor / max) * (alto - 30));
        return (
          <div className="d-flex flex-column align-items-center flex-grow-1" key={i} title={`${d.label}: ${formato(d.valor)}`}>
            <div style={{ height: alto - 30, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
              <div
                className="rounded-top w-100"
                style={{ height: h, background: color, minHeight: d.valor > 0 ? 2 : 1, opacity: 0.9 }}
              ></div>
            </div>
            <div className="small text-muted text-truncate w-100 text-center" style={{ fontSize: 9 }}>
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const COLORES = ['#0d6efd', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];

export function GraficaDona({ datos, formato = v => v }) {
  const total = datos.reduce((a, d) => a + d.valor, 0);
  if (total === 0) return <p className="text-muted small">Sin datos para graficar.</p>;

  const R = 42;
  const CIRC = 2 * Math.PI * R;
  let acumulado = 0;

  const segmentos = datos.map((d, i) => {
    const fraccion = d.valor / total;
    const inicio = acumulado * CIRC;
    const largo = fraccion * CIRC;
    acumulado += fraccion;
    return {
      ...d,
      color: COLORES[i % COLORES.length],
      inicio,
      largo,
      fraccion
    };
  });

  return (
    <div className="d-flex align-items-center flex-wrap gap-3">
      <div style={{ width: 130, height: 130 }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={R} fill="none" stroke="#e9ecef" strokeWidth="16" />
          {segmentos.map((s, i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${Math.max(s.largo - 1.5, 0)} ${CIRC}`}
              strokeDashoffset={-s.inicio}
            />
          ))}
        </svg>
      </div>
      <ul className="list-unstyled mb-0 small">
        {segmentos.map((s, i) => (
          <li key={i} className="d-flex align-items-center gap-2 mb-1">
            <span style={{ width: 12, height: 12, background: s.color, borderRadius: 3, display: 'inline-block' }}></span>
            {s.label} <strong>{formato(s.valor)}</strong>
            <span className="text-muted">({Math.round(s.fraccion * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
