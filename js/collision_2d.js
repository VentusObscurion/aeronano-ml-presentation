/* ============================================================
   collision_2d.js — 2D cluster collision animation (Canvas API)
   Projectile (cyan) approaches stationary target (orange).
   Impact parameter b (in units of R) controls vertical offset.
   Collision occurs iff |b| <= 2  (i.e., b <= R1 + R2 = 2R).
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('collision-canvas');
  const ctx    = canvas.getContext('2d');

  /* ---------- Canvas intrinsic resolution ---------- */
  const W = canvas.width;   // 540
  const H = canvas.height;  // 220

  const R = 22;             // cluster radius in pixels

  /* Target (stationary, centered) */
  const TX = W * 0.68;
  const TY = H / 2;

  /* Projectile start x */
  const PX_START = R + 8;

  /* ---------- State ---------- */
  let b      = 0;    // impact parameter in units of R
  let speed  = 2.0;  // animation speed (px per frame for the projectile)
  let px     = PX_START;
  let py     = H / 2;
  let phase  = 'approach'; // 'approach' | 'result'
  let outcome = null;      // 'hit' | 'miss'
  let resetTimer = 0;

  /* ---------- UI refs ---------- */
  const bSlider   = document.getElementById('b-slider');
  const vSlider   = document.getElementById('v-slider');
  const bLabel    = document.getElementById('b-val');
  const vLabel    = document.getElementById('v-val');
  const statusDiv = document.getElementById('collision-status');

  /* ---------- Reset animation ---------- */
  function resetAnim() {
    b      = parseFloat(bSlider.value);
    speed  = parseFloat(vSlider.value);
    bLabel.textContent = b.toFixed(2);
    vLabel.textContent = speed.toFixed(1);
    px     = PX_START;
    py     = TY + b * R;
    phase  = 'approach';
    outcome = null;
    resetTimer = 0;
    statusDiv.className   = 'viz-status';
    statusDiv.textContent = '\u2014';
  }

  bSlider.addEventListener('input', resetAnim);
  vSlider.addEventListener('input', resetAnim);

  /* ---------- Drawing helpers ---------- */
  function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 44) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 44) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function drawCluster(x, y, colorCore, colorGlow, label) {
    /* Glow halo */
    const grd = ctx.createRadialGradient(x, y, R * 0.3, x, y, R * 2.2);
    grd.addColorStop(0,   colorGlow.replace(')', ', 0.45)').replace('rgb', 'rgba'));
    grd.addColorStop(0.5, colorGlow.replace(')', ', 0.15)').replace('rgb', 'rgba'));
    grd.addColorStop(1,   colorGlow.replace(')', ', 0)').replace('rgb', 'rgba'));
    ctx.beginPath();
    ctx.arc(x, y, R * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* Core sphere */
    const core = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.25, colorCore);
    core.addColorStop(1,   colorCore.replace(')', ', 0.6)').replace('rgb', 'rgba'));
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();

    /* Ring */
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.strokeStyle = colorCore;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    /* Label */
    ctx.font = '10px Courier New';
    ctx.fillStyle = colorCore;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - R - 5);
    ctx.textAlign = 'left';
  }

  function drawImpactArrow() {
    if (b <= 0.05) return;
    const by = b * R;
    /* Dashed vertical line from TY to py */
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(255,107,53,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(TX, TY);
    ctx.lineTo(TX, TY + by);
    ctx.stroke();
    /* b label */
    ctx.fillStyle = 'rgba(255,107,53,0.75)';
    ctx.font = '11px Courier New';
    ctx.fillText('b', TX + 5, TY + by / 2 + 4);
    ctx.restore();
  }

  function drawTrajectory() {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(0,212,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PX_START, py);
    ctx.lineTo(W - 10, py);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- Collision flash ---------- */
  let flashAlpha = 0;

  function drawFlash() {
    if (flashAlpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle   = '#00ff88';
    const grd = ctx.createRadialGradient(TX, TY, 0, TX, TY, R * 4);
    grd.addColorStop(0, 'rgba(0,255,136,0.6)');
    grd.addColorStop(1, 'rgba(0,255,136,0)');
    ctx.beginPath();
    ctx.arc(TX, TY, R * 4, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.restore();
    flashAlpha = Math.max(0, flashAlpha - 0.04);
  }

  /* ---------- Main draw ---------- */
  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawTrajectory();
    drawImpactArrow();
    drawFlash();
    drawCluster(TX, TY, 'rgb(255,107,53)', 'rgb(255,107,53)', 'cluster 2');
    drawCluster(px, py, 'rgb(0,212,255)',   'rgb(0,212,255)',   'cluster 1');
  }

  /* ---------- Physics update ---------- */
  function update() {
    if (phase === 'approach') {
      px += speed * 1.8;

      const dist = Math.sqrt((px - TX) ** 2 + (py - TY) ** 2);

      if (dist <= 2 * R) {
        /* Collision! */
        phase  = 'result';
        outcome = 'hit';
        flashAlpha = 1.0;
        statusDiv.className   = 'viz-status hit';
        statusDiv.textContent = '\u26A1 Collision!  b \u2264 R\u2081 + R\u2082 = 2R';
        /* Freeze projectile at contact point */
        const dx   = TX - px;
        const dy   = TY - py;
        const norm = Math.sqrt(dx * dx + dy * dy);
        px = TX - (dx / norm) * 2 * R;
        py = TY - (dy / norm) * 2 * R;
        resetTimer = 0;

      } else if (px > TX + R * 3.5) {
        /* Missed */
        phase  = 'result';
        outcome = 'miss';
        statusDiv.className   = 'viz-status miss';
        statusDiv.textContent = '\u2715 Miss!  b > R\u2081 + R\u2082 = 2R';
        resetTimer = 0;
      }

    } else if (phase === 'result') {
      if (outcome === 'miss') px += speed * 1.8;
      resetTimer++;
      if (resetTimer > 100) resetAnim();
    }
  }

  /* ---------- Animation loop ---------- */
  function loop() {
    update();
    drawFrame();
    requestAnimationFrame(loop);
  }

  /* ---------- Init ---------- */
  resetAnim();
  loop();
})();
