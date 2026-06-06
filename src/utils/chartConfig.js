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
