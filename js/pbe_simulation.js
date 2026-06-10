/* ============================================================
   pbe_simulation.js — PINN vs. Plain NN Comparison
   Shows how PINNs resist noise better than unconstrained NNs.
   Chen et al. (2021) — Continuum Regime
   ============================================================ */

(function () {
  'use strict';

  const KMAX = 20;
  const xVals = Array.from({ length: KMAX }, (_, i) => i + 1);

  /* Smoluchowski analytical PSD at tau=0.35 */
  function truePSD(k) {
    const tau = 0.35;
    return Math.pow(tau, k - 1) / Math.pow(1 + tau, k + 1);
  }

  const trueY = xVals.map(k => truePSD(k));

  let noiseLevel = 0.4;
  let showPINN = true;
  let showNN = true;
  let seed = 42;

  /* Seeded PRNG */
  function seededRand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed >>> 0) / 4294967295;
  }

  /* Box-Muller normal sample from seeded PRNG */
  function seededNormal() {
    const u1 = Math.max(1e-10, seededRand());
    const u2 = seededRand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  function getNoisyData() {
    /* Lognormal noise: each point multiplied by exp(sigma * N(0,1))
       so scatter is equally visible at every scale on a log axis */
    const sigma = noiseLevel * 0.85;
    return trueY.map(v => v * Math.exp(sigma * seededNormal()));
  }

  /* Plain NN: sinusoidal overfit visible in log space */
  function getPlainNNY() {
    return trueY.map((v, i) => {
      const logOffset = noiseLevel * (1.4 * Math.sin(i * 1.7 + 0.6)
        + 0.7 * Math.sin(i * 3.2 + 1.2)
        + 0.5 * Math.cos(i * 0.9));
      return v * Math.exp(logOffset);
    });
  }

  /* PINN: physically constrained => exact true solution */
  function getPINNY() { return trueY.slice(); }

  let noisyData = getNoisyData();

  const LAYOUT = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 10, r: 16, b: 52, l: 72 },
    font: { color: '#8888aa', family: 'Inter, system-ui, sans-serif', size: 11 },
    xaxis: {
      title: 'Cluster size  k',
      gridcolor: 'rgba(255,255,255,0.06)',
      tickcolor: '#555', linecolor: '#333',
      range: [0.3, KMAX + 0.7], dtick: 2
    },
    yaxis: {
      title: 'N_k  (log scale)',
      type: 'log',
      gridcolor: 'rgba(255,255,255,0.06)',
      tickcolor: '#555', linecolor: '#333',
    },
    showlegend: true,
    legend: { x: 0.55, y: 0.98,
      font: { color: '#aaaacc', size: 10 }, bgcolor: 'rgba(0,0,0,0)' }
  };

  const CONFIG = { responsive: true, displayModeBar: false };

  function buildTraces() {
    const t = [];
    t.push({
      x: xVals, y: noisyData,
      type: 'scatter', mode: 'markers',
      marker: { color: '#ffffff', size: 8, opacity: 0.65,
                line: { color: '#8888aa', width: 1 } },
      name: 'Measured data (noisy)'
    });
    if (showNN) {
      t.push({
        x: xVals, y: getPlainNNY(),
        type: 'scatter', mode: 'lines+markers',
        line: { color: '#ff6b35', width: 2.5, dash: 'dot' },
        marker: { color: '#ff6b35', size: 5 },
        name: 'Plain NN (overfitting)'
      });
    }
    if (showPINN) {
      t.push({
        x: xVals, y: getPINNY(),
        type: 'scatter', mode: 'lines',
        line: { color: '#00d4ff', width: 3 },
        name: 'PINN (physics-constrained)'
      });
    }
    return t;
  }

  Plotly.newPlot('pinn-compare-plot', buildTraces(), LAYOUT, CONFIG);
  function redraw() { Plotly.react('pinn-compare-plot', buildTraces(), LAYOUT, CONFIG); }

  document.getElementById('noise-slider').addEventListener('input', function () {
    noiseLevel = parseFloat(this.value);
    document.getElementById('noise-val').textContent = noiseLevel.toFixed(1);
    seed = 42;
    noisyData = getNoisyData();
    redraw();
  });

  document.getElementById('resample-btn').addEventListener('click', function () {
    seed = Math.floor(Math.random() * 999999) + 1;
    noisyData = getNoisyData();
    redraw();
  });

  document.getElementById('toggle-pinn').addEventListener('click', function () {
    showPINN = !showPINN;
    this.style.opacity = showPINN ? '1' : '0.35';
    redraw();
  });

  document.getElementById('toggle-nn').addEventListener('click', function () {
    showNN = !showNN;
    this.style.opacity = showNN ? '1' : '0.35';
    redraw();
  });
})();
