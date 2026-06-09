/* ============================================================
   pbe_simulation.js — Smoluchowski Population Balance Equation
   Discrete form with constant kernel K_ij = 1.
   dN_k/dt = 0.5 * sum_{i=1}^{k-1} N_i N_{k-i}  -  N_k * sum_{j=1}^{kmax} N_j
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Parameters ---------- */
  const KMAX          = 100;   // max cluster size tracked
  const K_DISPLAY     = 20;    // show sizes 1..K_DISPLAY
  const N_FRAMES      = 100;   // animation frames
  const STEPS_FRAME   = 8;     // Euler steps per frame
  const DT            = 0.04;  // time step
  const N0            = 1.0;   // initial monomer concentration

  /* ---------- One forward-Euler step of the discrete Smoluchowski PBE ---------- */
  function pbeStep(N) {
    const dN  = new Float64Array(KMAX + 1);
    let totalN = 0;
    for (let j = 1; j <= KMAX; j++) totalN += N[j];

    for (let k = 1; k <= KMAX; k++) {
      let birth = 0;
      for (let i = 1; i < k; i++) birth += N[i] * N[k - i];
      dN[k] = 0.5 * birth - N[k] * totalN;
    }

    const Nnew = new Float64Array(KMAX + 1);
    for (let k = 1; k <= KMAX; k++) {
      Nnew[k] = Math.max(0, N[k] + DT * dN[k]);
    }
    return Nnew;
  }

  /* ---------- Pre-compute all frames ---------- */
  const precomputed = [];   // precomputed[f] = Float64Array of N[1..K_DISPLAY]
  const times       = [];   // time label per frame

  let N = new Float64Array(KMAX + 1);
  N[1] = N0;

  for (let f = 0; f < N_FRAMES; f++) {
    // Store current state (k = 1..K_DISPLAY)
    const snap = new Float64Array(K_DISPLAY);
    for (let k = 1; k <= K_DISPLAY; k++) snap[k - 1] = Math.max(N[k], 1e-12);
    precomputed.push(snap);
    times.push((f * STEPS_FRAME * DT).toFixed(2));

    // Advance
    for (let s = 0; s < STEPS_FRAME; s++) N = pbeStep(N);
  }

  const xVals = Array.from({ length: K_DISPLAY }, (_, i) => i + 1);

  /* ---------- Plotly layout (dark theme) ---------- */
  const LAYOUT = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    margin: { t: 10, r: 10, b: 50, l: 60 },
    font:  { color: '#8888aa', family: 'Courier New, monospace', size: 11 },
    xaxis: {
      title: 'Cluster size  k',
      gridcolor: 'rgba(255,255,255,0.06)',
      tickcolor: '#555',
      linecolor: '#333',
      range: [0.4, K_DISPLAY + 0.6],
      dtick: 2,
    },
    yaxis: {
      title: 'N_k(t)',
      type: 'log',
      range: [-12, 0.3],
      gridcolor: 'rgba(255,255,255,0.06)',
      tickcolor: '#555',
      linecolor: '#333',
    },
    showlegend: false,
    annotations: [],
  };

  const CONFIG = { responsive: true, displayModeBar: false };

  /* ---------- Build initial trace ---------- */
  function makeTrace(frameIdx) {
    const y = Array.from(precomputed[frameIdx]);
    return {
      x: xVals,
      y: y,
      type: 'bar',
      marker: {
        color: y.map((v) => {
          const logv = Math.log10(v + 1e-13);
          const t = Math.max(0, Math.min(1, (logv + 12) / 12));
          // Gradient: cyan (small k, large N) → orange (large k, small N)
          const r = Math.round(t * 255);
          const g = Math.round((1 - t) * 212 + t * 107);
          const b = Math.round((1 - t) * 255 + t * 53);
          return `rgb(${r},${g},${b})`;
        }),
        opacity: 0.85,
        line: { width: 0 },
      },
    };
  }

  /* ---------- Render ---------- */
  Plotly.newPlot('pbe-plot', [makeTrace(0)], LAYOUT, CONFIG);

  /* ---------- Time label annotation ---------- */
  function setTimeAnnotation(frameIdx) {
    const t = parseFloat(times[frameIdx]);
    const tau = (t / 2).toFixed(2);
    Plotly.relayout('pbe-plot', {
      annotations: [{
        x: 0.98, y: 0.97,
        xref: 'paper', yref: 'paper',
        xanchor: 'right', yanchor: 'top',
        text: `t = ${times[frameIdx]}  (τ = ${tau})`,
        showarrow: false,
        font: { color: '#00d4ff', size: 12, family: 'Courier New' },
        bgcolor: 'rgba(0,0,0,0.4)',
        bordercolor: 'rgba(0,212,255,0.3)',
        borderwidth: 1,
        borderpad: 6,
      }],
    });
  }

  /* ---------- Slider ---------- */
  const slider   = document.getElementById('pbe-slider');
  const timeLabel = document.getElementById('pbe-time-val');

  function goToFrame(f) {
    Plotly.restyle('pbe-plot', { y: [Array.from(precomputed[f])], 'marker.color': [makeTrace(f).marker.color] }, [0]);
    setTimeAnnotation(f);
    timeLabel.textContent = `t = ${times[f]}`;
    slider.value = f;
  }

  slider.addEventListener('input', () => goToFrame(parseInt(slider.value)));

  /* ---------- Play / Reset ---------- */
  let playing  = false;
  let animFrame = null;
  let currentF  = 0;

  function stopPlay() {
    playing = false;
    if (animFrame) { clearTimeout(animFrame); animFrame = null; }
    document.getElementById('pbe-play').textContent = '▶ Play';
  }

  function step() {
    if (!playing) return;
    currentF = (currentF + 1) % N_FRAMES;
    goToFrame(currentF);
    if (currentF === N_FRAMES - 1) { stopPlay(); return; }
    animFrame = setTimeout(() => requestAnimationFrame(step), 80);
  }

  document.getElementById('pbe-play').addEventListener('click', function () {
    if (playing) { stopPlay(); return; }
    if (currentF >= N_FRAMES - 1) currentF = 0;
    playing = true;
    this.textContent = '⏸ Pause';
    animFrame = requestAnimationFrame(step);
  });

  document.getElementById('pbe-reset').addEventListener('click', () => {
    stopPlay();
    currentF = 0;
    goToFrame(0);
  });

  /* ---------- Initial annotation ---------- */
  setTimeAnnotation(0);
})();
