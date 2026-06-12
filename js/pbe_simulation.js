/* ============================================================
   pbe_simulation.js — PBNN vs. Plain ANN (SVG, adapted from Ali)
   Chen et al. (2021) — Continuum Regime
   Shows aggregation-time evolution of the particle size distribution.
   ============================================================ */

(function () {
  'use strict';

  var X0 = 70, X1 = 560, Y0 = 268, scaleY = 2120, CAP = 0.108;

  function xpx(xi) { return X0 + (xi / 10) * (X1 - X0); }
  function ypx(v)  { return Y0 - Math.min(v, CAP) * scaleY; }

  /* Analytical number density: normalised gamma-like shape */
  function nfun(xi, T) {
    var h = 0.092 / (1 + 1.1 * T);
    var p = 1 + 0.35 * T;
    return h * (xi / p) * Math.exp(1 - xi / p);
  }

  /* PBNN: tracks analytical with tiny deviation */
  function pbnnfun(xi, T) {
    return nfun(xi, T) * (1 + 0.05 * Math.sin(1.4 * xi + 0.7));
  }

  /* Plain ANN: overshoots peak, wrong tail (no physics) */
  function annfun(xi, T) {
    var h = 0.092 / (1 + 1.1 * T) * 1.16;
    var p = (1 + 0.35 * T) * 0.84;
    return h * (xi / p) * Math.exp(1 - xi / p);
  }

  function pathFor(fn, T) {
    var d = '', first = true;
    for (var xi = 0; xi <= 10.001; xi += 0.1) {
      var pt = xpx(xi).toFixed(1) + ',' + ypx(fn(xi, T)).toFixed(1);
      d += (first ? 'M' : 'L') + pt + ' ';
      first = false;
    }
    return d.trim();
  }

  var elRef  = document.getElementById('pbnn-ref');
  var elAnn  = document.getElementById('pbnn-ann');
  var elAna  = document.getElementById('pbnn-ana');
  var elPbnn = document.getElementById('pbnn-pbnn');
  var slider = document.getElementById('pbnn-slider');
  var tval   = document.getElementById('pbnn-tval');
  var nval   = document.getElementById('pbnn-nval');

  if (!elRef || !slider) return; /* guard: elements not yet in DOM */

  elRef.setAttribute('d', pathFor(nfun, 0));

  function update() {
    var T = parseFloat(slider.value);
    elAna.setAttribute('d',  pathFor(nfun,    T));
    elPbnn.setAttribute('d', pathFor(pbnnfun, T));
    elAnn.setAttribute('d',  pathFor(annfun,  T));
    tval.textContent = T.toFixed(2);
    nval.textContent = (2 / (T + 2)).toFixed(3);
  }

  slider.addEventListener('input', update);
  update();
})();
