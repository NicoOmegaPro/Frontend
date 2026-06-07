// Configuración compartida para todos los gráficos Chart.js de la app.
export const CHART_TICK = '#8B8B94';
export const CHART_GRID = 'rgba(255,255,255,0.06)';

// Cursor "pointer" al pasar el ratón por encima de los segmentos/barras del gráfico.
export function pointerOnHover(evt, elements) {
  const target = evt?.native?.target;
  if (target) target.style.cursor = elements && elements.length ? 'pointer' : 'default';
}

// onHover/onLeave para que la leyenda también muestre cursor pointer.
const legendCursor = {
  onHover: (evt) => { if (evt?.native?.target) evt.native.target.style.cursor = 'pointer'; },
  onLeave: (evt) => { if (evt?.native?.target) evt.native.target.style.cursor = 'default'; },
};

// Colores por estado de tarea: Pendiente, En progreso, En revisión, Finalizado.
export const STATUS_COLORS = ['#8B8B94', '#6E76F1', '#E0A82E', '#3FB950'];

// Plugin: dibuja en el centro del doughnut el total (o el % del estado seleccionado) + subtítulo.
export const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const cfg = chart.config.options.plugins?.centerText;
    if (!cfg) return;
    const { ctx, chartArea } = chart;
    const data = chart.data.datasets[0].data;
    const total = data.reduce((a, b) => a + (b || 0), 0);
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;

    let big, small;
    const idx = cfg.activeIndex;
    if (idx != null && idx >= 0) {
      const pct = total ? Math.round((data[idx] / total) * 100) : 0;
      big = `${pct}%`;
      small = chart.data.labels[idx];
    } else {
      big = String(total);
      small = cfg.label || 'Tareas';
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = cfg.color || '#fff';
    ctx.font = `700 34px Inter, system-ui, sans-serif`;
    ctx.fillText(big, cx, cy - 9);
    ctx.fillStyle = cfg.subColor || '#8892aa';
    ctx.font = `500 13px Inter, system-ui, sans-serif`;
    ctx.fillText(small, cx, cy + 16);
    ctx.restore();
  },
};

// Dataset del doughnut de estados: atenúa los no-activos y desplaza el segmento activo.
export function statusDoughnutDataset(data, activeStatus) {
  return {
    data,
    backgroundColor: STATUS_COLORS.map((c, i) =>
      activeStatus === null || activeStatus === i ? c : c + '2b'
    ),
    offset: STATUS_COLORS.map((_, i) => (activeStatus === i ? 14 : 0)),
    borderWidth: 0,
    hoverOffset: 6,
  };
}

// Opciones del doughnut de estados: texto central + leyenda clicable que selecciona un estado.
// `radius` permite agrandar SOLO el aro (útil en contenedores más pequeños).
export function statusDoughnutOptions(activeStatus, setActiveStatus, label = 'Tareas', radius = '82%') {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    onHover: pointerOnHover,
    layout: { padding: { top: 8, bottom: 4, left: 10, right: 10 } },
    radius,
    plugins: {
      centerText: { label, color: '#ffffff', subColor: '#8892aa', activeIndex: activeStatus },
      legend: {
        ...roundLegend('#c9ccd4', 14),
        onClick: (e, legendItem) => {
          setActiveStatus((prev) => (prev === legendItem.index ? null : legendItem.index));
        },
        labels: {
          ...roundLegend('#c9ccd4', 14).labels,
          generateLabels: (chart) =>
            chart.data.labels.map((lbl, i) => ({
              text: lbl,
              fillStyle: STATUS_COLORS[i],
              strokeStyle: STATUS_COLORS[i],
              fontColor: activeStatus === i ? '#ffffff' : '#c9ccd4',
              lineWidth: 0,
              index: i,
            })),
        },
      },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} tarea${ctx.raw !== 1 ? 's' : ''}` },
      },
    },
  };
}

// Leyenda con marcador REDONDO (círculo perfecto, no óvalo).
export function roundLegend(color = CHART_TICK, fontSize = 13) {
  return {
    position: 'bottom',
    ...legendCursor,
    labels: {
      color,
      font: { size: fontSize },
      padding: 16,
      usePointStyle: true,
      pointStyle: 'circle',
      boxWidth: 8,
      boxHeight: 8,
    },
  };
}
