/* ============================================================
   regime_slider.js — Drunkard's Walk / Mean First Passage Time
   Gopalakrishnan & Hogan (2011) — Transition Regime
   Low Kn : tiny diffusive steps (continuum)
   High Kn: large ballistic steps (free-molecular)
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('walk-canvas');
  const ctx    = canvas.getContext('2d');

  function resize() {
    const w = canvas.parentElement.clientWidth;
    canvas.width  = Math.max(280, Math.min(560, w - 4));
    canvas.height = 220;
  }
  resize();
  window.addEventListener('resize', function () { resize(); spawnParticle(); });

  const TARGET_R   = 20;
  const PARTICLE_R = 6;
  let kn = 1.0;
  let px, py;
  let trajectoryPoints = [];
  let collisionTimes   = [];
  let stepCount        = 0;
  let flashAlpha       = 0;

  function cx() { return canvas.width  / 2; }
  function cy() { return canvas.height / 2; }

  function spawnParticle() {
    const ang  = Math.random() * Math.PI * 2;
    const dist = Math.min(canvas.width, canvas.height) * 0.36;
    px = cx() + dist * Math.cos(ang);
    py = cy() + dist * Math.sin(ang);
    stepCount = 0;
    trajectoryPoints = [{ x: px, y: py }];
  }

  function stepSize() {
    return Math.max(0.8, Math.min(18, 2.8 * Math.sqrt(kn)));
  }

  function walkStep() {
    const s     = stepSize();
    const bias  = Math.min(0.22, kn * 0.055);
    const toAng = Math.atan2(cy() - py, cx() - px);
    const rnd   = Math.random() * Math.PI * 2;
    const dir   = rnd + bias * Math.sin(toAng - rnd);
    px += s * Math.cos(dir);
    py += s * Math.sin(dir);
    px = Math.max(4, Math.min(canvas.width  - 4, px));
    py = Math.max(4, Math.min(canvas.height - 4, py));
    stepCount++;
  }

  function checkHit() {
    return Math.hypot(px - cx(), py - cy()) < TARGET_R + PARTICLE_R;
  }

  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Grid */
    ctx.strokeStyle = 'rgba(0,212,255,0.04)';
    ctx.lineWidth   = 1;
    for (let x = 0; x < canvas.width;  x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    /* Flash */
    if (flashAlpha > 0) {
      var g = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), 70);
      g.addColorStop(0, 'rgba(0,255,136,' + (flashAlpha * 0.6) + ')');
      g.addColorStop(1, 'rgba(0,255,136,0)');
      ctx.beginPath(); ctx.arc(cx(), cy(), 70, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      flashAlpha = Math.max(0, flashAlpha - 0.05);
    }

    /* Target */
    var tg = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), TARGET_R);
    tg.addColorStop(0, 'rgba(255,107,53,0.45)');
    tg.addColorStop(1, 'rgba(255,107,53,0.1)');
    ctx.beginPath(); ctx.arc(cx(), cy(), TARGET_R, 0, Math.PI * 2);
    ctx.fillStyle = tg; ctx.fill();
    ctx.strokeStyle = '#ff6b35'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = '10px Courier New'; ctx.fillStyle = 'rgba(255,107,53,0.85)';
    ctx.textAlign = 'center'; ctx.fillText('target', cx(), cy() + 4);
    ctx.textAlign = 'left';

    /* Trail */
    if (trajectoryPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);
      for (var i = 1; i < trajectoryPoints.length; i++) {
        ctx.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
      }
      ctx.strokeStyle = 'rgba(0,212,255,0.38)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    /* Particle */
    var pg = ctx.createRadialGradient(px, py, 0, px, py, PARTICLE_R * 2.5);
    pg.addColorStop(0,   'rgba(0,212,255,0.9)');
    pg.addColorStop(0.4, 'rgba(0,212,255,0.3)');
    pg.addColorStop(1,   'rgba(0,212,255,0)');
    ctx.beginPath(); ctx.arc(px, py, PARTICLE_R * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = pg; ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, PARTICLE_R, 0, Math.PI * 2);
    ctx.fillStyle = '#00d4ff'; ctx.fill();

    /* HUD */
    ctx.font = '10px Courier New'; ctx.fillStyle = 'rgba(136,136,170,0.75)';
    ctx.fillText('Steps: ' + stepCount, 8, 16);
    if (collisionTimes.length > 0) {
      var avg = Math.round(
        collisionTimes.reduce(function (a, b) { return a + b; }, 0) / collisionTimes.length
      );
      ctx.fillText('Avg. steps to collision: ' + avg + '  (n=' + collisionTimes.length + ')', 8, 30);
    }

    var regime = kn < 0.1 ? 'Continuum — Diffusion'
               : kn < 10  ? 'Transition Regime'
               : 'Free-Molecular — Ballistic';
    var rc = kn < 0.1 ? '#00d4ff' : kn < 10 ? '#ffd700' : '#ff6b35';
    ctx.fillStyle = rc; ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText(regime, canvas.width - 8, 16);
    ctx.textAlign = 'left';
  }

  var MAX_TRAIL       = 120;
  var STEPS_PER_FRAME = 4;

  function loop() {
    for (var s = 0; s < STEPS_PER_FRAME; s++) {
      walkStep();
      trajectoryPoints.push({ x: px, y: py });
      if (trajectoryPoints.length > MAX_TRAIL) trajectoryPoints.shift();
      if (checkHit()) {
        collisionTimes.push(stepCount);
        if (collisionTimes.length > 30) collisionTimes.shift();
        flashAlpha = 1.0;
        trajectoryPoints = [];
        spawnParticle();
        break;
      }
    }
    drawFrame();
    requestAnimationFrame(loop);
  }

  var knSlider  = document.getElementById('kn-slider');
  var knDisplay = document.getElementById('kn-display');

  knSlider.addEventListener('input', function () {
    kn = Math.pow(10, parseFloat(this.value));
    knDisplay.textContent = kn < 0.01 ? kn.toExponential(1) : kn.toFixed(2);
    collisionTimes   = [];
    trajectoryPoints = [];
    spawnParticle();
  });

  document.getElementById('walk-reset').addEventListener('click', function () {
    collisionTimes   = [];
    trajectoryPoints = [];
    spawnParticle();
  });

  spawnParticle();
  requestAnimationFrame(loop);
})();
