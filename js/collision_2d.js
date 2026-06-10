/* ============================================================
   collision_2d.js — Pinball Collision + Neural Network Predictor
   Tamadate, Yang & Hogan Jr. (2022) — Free-Molecular Regime
   Sliders: impact angle + temperature.
   NN predicts STICK or BOUNCE via sigmoid model.
   ============================================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('pinball-canvas');
  var ctx    = canvas.getContext('2d');

  function resize() {
    var w = canvas.parentElement.clientWidth;
    canvas.width  = Math.max(280, Math.min(560, w - 4));
    canvas.height = 220;
  }
  resize();
  window.addEventListener('resize', resize);

  var TARGET_R   = 28;
  var PARTICLE_R = 13;

  var impactAngle = 20;   /* degrees 0=head-on, 90=grazing */
  var temp        = 1.0;  /* normalised temperature */
  var phase       = 'idle';
  var outcome     = null;
  var px, py, vx, vy;
  var bounceVx = 0, bounceVy = 0;
  var flashAlpha = 0;
  var holdFrames = 0;

  function TX() { return canvas.width * 0.62; }
  function TY() { return canvas.height / 2; }

  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

  function stickProb(angleDeg, tempVal) {
    return sigmoid(0.058 * (90 - angleDeg) - 0.80 * tempVal);
  }

  function updateProbBar() {
    var p   = stickProb(impactAngle, temp);
    var pct = (p * 100).toFixed(0);
    var bar = document.getElementById('stick-prob-bar');
    var lbl = document.getElementById('stick-prob-val');
    if (bar) bar.style.width  = pct + '%';
    if (lbl) lbl.textContent  = pct + '%';
  }

  function animateNN(p) {
    var el   = document.getElementById('nn-outcome');
    var conf = document.getElementById('nn-confidence');
    if (!el) return;
    el.textContent  = '\u00b7 \u00b7 \u00b7';
    el.style.color  = '#8888aa';
    conf.textContent = '';
    setTimeout(function () {
      if (outcome === 'stick') {
        el.textContent   = 'STICK  \u2713';
        el.style.color   = '#00ff88';
        conf.textContent = 'Confidence: ' + Math.round(p * 100) + '%';
      } else {
        el.textContent   = 'BOUNCE  \u2717';
        el.style.color   = '#ff6b35';
        conf.textContent = 'Confidence: ' + Math.round((1 - p) * 100) + '%';
      }
    }, 600);
  }

  function launch() {
    if (phase === 'flying') return;
    var p    = stickProb(impactAngle, temp);
    outcome  = Math.random() < p ? 'stick' : 'bounce';
    var speed   = 3.2 + temp * 0.55;
    var offsetY = Math.sin((impactAngle * Math.PI) / 180) * canvas.height * 0.30;
    px = PARTICLE_R + 18;
    py = TY() + offsetY;
    var dx = TX() - px, dy = TY() - py;
    var dist = Math.hypot(dx, dy);
    vx = (dx / dist) * speed;
    vy = (dy / dist) * speed;
    phase = 'flying';
    flashAlpha = 0;
    holdFrames = 0;
    animateNN(p);
  }

  function update() {
    if (phase === 'flying') {
      px += vx; py += vy;
      if (Math.hypot(px - TX(), py - TY()) < TARGET_R + PARTICLE_R) {
        flashAlpha = 1.0;
        if (outcome === 'stick') {
          var dx = TX() - px, dy = TY() - py;
          var n  = Math.hypot(dx, dy);
          px = TX() - (dx / n) * (TARGET_R + PARTICLE_R * 0.7);
          py = TY() - (dy / n) * (TARGET_R + PARTICLE_R * 0.7);
          phase = 'hit'; holdFrames = 90;
        } else {
          bounceVx = -vx * 0.65 + (Math.random() - 0.5) * 0.6;
          bounceVy =  vy * 0.65 + (Math.random() - 0.5) * 0.6;
          phase = 'bounce';
        }
      }
      if (px < -60 || px > canvas.width + 60 || py < -60 || py > canvas.height + 60) phase = 'idle';
    } else if (phase === 'bounce') {
      px += bounceVx; py += bounceVy;
      bounceVy += 0.06;
      if (px > canvas.width + 60 || py > canvas.height + 60 || px < -60) phase = 'idle';
    } else if (phase === 'hit') {
      holdFrames--;
      if (holdFrames <= 0) phase = 'idle';
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Grid */
    ctx.strokeStyle = 'rgba(0,212,255,0.04)'; ctx.lineWidth = 1;
    for (var x = 0; x < canvas.width;  x += 44) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (var y = 0; y < canvas.height; y += 44) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    /* Flash */
    if (flashAlpha > 0) {
      var color = outcome === 'stick' ? '0,255,136' : '255,107,53';
      var fg = ctx.createRadialGradient(TX(), TY(), 0, TX(), TY(), 85);
      fg.addColorStop(0, 'rgba(' + color + ',' + (flashAlpha * 0.7) + ')');
      fg.addColorStop(1, 'rgba(' + color + ',0)');
      ctx.beginPath(); ctx.arc(TX(), TY(), 85, 0, Math.PI * 2);
      ctx.fillStyle = fg; ctx.fill();
      flashAlpha = Math.max(0, flashAlpha - 0.028);
    }

    /* Trajectory dashed line + idle particle */
    if (phase === 'idle') {
      var oY   = Math.sin((impactAngle * Math.PI) / 180) * canvas.height * 0.30;
      var sX   = PARTICLE_R + 18, sY = TY() + oY;
      ctx.save(); ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(0,212,255,0.22)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(sX, sY); ctx.lineTo(TX(), TY()); ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(sX, sY, PARTICLE_R, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,255,0.28)'; ctx.fill();
      ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = '9px Courier New'; ctx.fillStyle = 'rgba(0,212,255,0.7)';
      ctx.textAlign = 'center'; ctx.fillText('cluster 1', sX, sY - PARTICLE_R - 5);
      ctx.textAlign = 'left';
    }

    /* Target */
    var hitGreen = (phase === 'hit' && outcome === 'stick');
    var tg = ctx.createRadialGradient(TX(), TY(), 0, TX(), TY(), TARGET_R);
    tg.addColorStop(0, hitGreen ? 'rgba(0,255,136,0.5)' : 'rgba(255,107,53,0.45)');
    tg.addColorStop(1, hitGreen ? 'rgba(0,255,136,0.1)' : 'rgba(255,107,53,0.1)');
    ctx.beginPath(); ctx.arc(TX(), TY(), TARGET_R, 0, Math.PI * 2);
    ctx.fillStyle = tg; ctx.fill();
    ctx.strokeStyle = hitGreen ? '#00ff88' : '#ff6b35'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = 'bold 10px Courier New';
    ctx.fillStyle = hitGreen ? '#00ff88' : '#ff6b35';
    ctx.textAlign = 'center'; ctx.fillText('cluster 2', TX(), TY() + 4);
    ctx.textAlign = 'left';

    /* Flying / bouncing particle */
    if (phase === 'flying' || phase === 'bounce' || phase === 'hit') {
      var pg = ctx.createRadialGradient(px, py, 0, px, py, PARTICLE_R * 2.4);
      pg.addColorStop(0,   'rgba(0,212,255,0.85)');
      pg.addColorStop(0.4, 'rgba(0,212,255,0.25)');
      pg.addColorStop(1,   'rgba(0,212,255,0)');
      ctx.beginPath(); ctx.arc(px, py, PARTICLE_R * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = pg; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, PARTICLE_R, 0, Math.PI * 2);
      ctx.fillStyle = '#00d4ff'; ctx.fill();
    }
  }

  function loop() { update(); drawFrame(); requestAnimationFrame(loop); }

  /* Sliders */
  document.getElementById('angle-slider').addEventListener('input', function () {
    impactAngle = parseFloat(this.value);
    document.getElementById('angle-val').textContent = impactAngle.toFixed(0) + '\u00b0';
    phase = 'idle'; updateProbBar();
  });

  document.getElementById('temp-slider').addEventListener('input', function () {
    temp = parseFloat(this.value);
    document.getElementById('temp-val').textContent = temp.toFixed(1);
    phase = 'idle'; updateProbBar();
  });

  document.getElementById('launch-btn').addEventListener('click', launch);

  updateProbBar();
  loop();
})();
