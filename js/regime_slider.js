/* ============================================================
   regime_slider.js — Dimensionless collision kernel H(Kn_D)
   Dahneke interpolation (Gopalakrishnan & Hogan 2011):
     H(Kn_D) = 1/(1 + Kn_D)  +  (π/4) * Kn_D
   ============================================================ */

(function () {
  'use strict';

  /* ---------- H(Kn_D) formula ---------- */
  function H(kn) {
    return 1.0 / (1.0 + kn) + (Math.PI / 4.0) * kn;
  }

  /* ---------- Generate curve (200 points, log scale) ---------- */
  const N_PTS  = 280;
  const KN_MIN = 1e-3;
  const KN_MAX = 1e3;

  const knArr  = [];
  const hArr   = [];

  for (let i = 0; i < N_PTS; i++) {
    const logKn = Math.log10(KN_MIN) + (i / (N_PTS - 1)) * (Math.log10(KN_MAX) - Math.log10(KN_MIN));
    const kn    = Math.pow(10, logKn);
    knArr.push(kn);
    hArr.push(H(kn));
  }

  /* ---------- Regime boundary helper ---------- */
  function getRegime(kn) {
    if (kn < 0.1)  return { label: 'Continuum',     cls: 'continuum-tag' };
    if (kn < 10.0) return { label: 'Transition',    cls: 'transition-tag' };
    return             { label: 'Free-Molecular', cls: 'freemolecular-tag' };
  }

  /* ---------- Plotly layout ---------- */
  const LAYOUT = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    margin: { t: 10, r: 16, b: 52, l: 62 },
    font: { color: '#8888aa', family: 'Courier New, monospace', size: 11 },
    xaxis: {
      title: 'Kn_D  (diffusive Knudsen number)',
      type: 'log',
      range: [Math.log10(KN_MIN), Math.log10(KN_MAX)],
      gridcolor: 'rgba(255,255,255,0.06)',
      tickcolor: '#555',
      linecolor: '#333',
    },
    yaxis: {
      title: 'H(Kn_D)',
      gridcolor: 'rgba(255,255,255,0.06)',
      tickcolor: '#555',
      linecolor: '#333',
      range: [0, 10],
    },
    showlegend: false,
    /* Colored background regions */
    shapes: [
      /* Continuum: Kn_D < 0.1 */
      {
        type: 'rect', layer: 'below',
        x0: KN_MIN, x1: 0.1,
        y0: 0,      y1: 10,
        xref: 'x', yref: 'y',
        fillcolor: 'rgba(0,212,255,0.06)',
        line: { width: 0 },
      },
      /* Transition: 0.1 – 10 */
      {
        type: 'rect', layer: 'below',
        x0: 0.1, x1: 10.0,
        y0: 0,   y1: 10,
        xref: 'x', yref: 'y',
        fillcolor: 'rgba(255,210,0,0.05)',
        line: { width: 0 },
      },
      /* Free-Molecular: > 10 */
      {
        type: 'rect', layer: 'below',
        x0: 10.0, x1: KN_MAX,
        y0: 0,    y1: 10,
        xref: 'x', yref: 'y',
        fillcolor: 'rgba(255,107,53,0.06)',
        line: { width: 0 },
      },
      /* Moving vertical marker — initial at Kn_D = 1 */
      {
        type: 'line',
        x0: 1, x1: 1,
        y0: 0, y1: 10,
        xref: 'x', yref: 'y',
        line: { color: '#ffffff', width: 1.5, dash: 'dot' },
      },
    ],
    annotations: [
      { x: Math.log10(0.007), y: 9.3, xref: 'x', yref: 'y', text: 'Continuum',
        showarrow: false, font: { color: 'rgba(0,212,255,0.55)', size: 11 }, textangle: 0 },
      { x: Math.log10(1.0),   y: 9.3, xref: 'x', yref: 'y', text: 'Transition',
        showarrow: false, font: { color: 'rgba(255,210,0,0.55)', size: 11 }, textangle: 0 },
      { x: Math.log10(200),   y: 9.3, xref: 'x', yref: 'y', text: 'Free-Molecular',
        showarrow: false, font: { color: 'rgba(255,107,53,0.55)', size: 11 }, textangle: 0 },
    ],
  };

  const CONFIG = { responsive: true, displayModeBar: false };

  /* ---------- Traces ---------- */
  const curvTrace = {
    x: knArr, y: hArr,
    type: 'scatter', mode: 'lines',
    line: { color: '#00d4ff', width: 2.5 },
    name: 'H(Kn_D)',
  };

  /* Continuum limit line: H = 1 */
  const contLimit = {
    x: [KN_MIN, KN_MAX],
    y: [1, 1],
    type: 'scatter', mode: 'lines',
    line: { color: 'rgba(0,212,255,0.25)', width: 1, dash: 'dash' },
    name: 'H = 1 (continuum)',
  };

  /* Free-molecular asymptote: H = π/4 * Kn */
  const fmLine = {
    x: [0.1, KN_MAX],
    y: [0.1 * Math.PI / 4, KN_MAX * Math.PI / 4],
    type: 'scatter', mode: 'lines',
    line: { color: 'rgba(255,107,53,0.3)', width: 1, dash: 'dash' },
    name: 'H ~ π/4 · Kn_D',
  };

  /* Highlighted point (current slider position) */
  const pointTrace = {
    x: [1], y: [H(1)],
    type: 'scatter', mode: 'markers',
    marker: { size: 10, color: '#ffffff', symbol: 'circle',
              line: { color: '#00d4ff', width: 2 } },
    name: 'Current Kn_D',
  };

  Plotly.newPlot('regime-plot', [curvTrace, contLimit, fmLine, pointTrace], LAYOUT, CONFIG);

  /* ---------- Slider update ---------- */
  const slider     = document.getElementById('regime-slider');
  const knDisplay  = document.getElementById('regime-kn-display');
  const readout    = document.getElementById('regime-readout');
  const regLabel   = document.getElementById('regime-label');

  function updateRegimePlot() {
    const logKn = parseFloat(slider.value);
    const kn    = Math.pow(10, logKn);
    const h     = H(kn);
    const regime = getRegime(kn);

    /* Move vertical line in shape[3] */
    Plotly.relayout('regime-plot', { 'shapes[3].x0': kn, 'shapes[3].x1': kn });

    /* Update highlighted point */
    Plotly.restyle('regime-plot', { x: [[kn]], y: [[h]] }, [3]);

    /* Update text */
    knDisplay.textContent = `Kn\u2082 = ${kn < 0.01 ? kn.toExponential(2) : kn.toFixed(3)}`;
    const hStr = h.toFixed(3);
    readout.innerHTML = `H(Kn<sub>D</sub>) = <strong style="color:#00d4ff">${hStr}</strong>
      &nbsp;&middot;&nbsp; Regime: <span class="regime-tag ${regime.cls}">${regime.label}</span>`;
  }

  slider.addEventListener('input', updateRegimePlot);
  updateRegimePlot(); /* Run once on load */
})();
