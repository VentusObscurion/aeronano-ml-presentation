/* ============================================================
   pinn_diagram.js — D3.js PINN architecture diagram
   Shows the proposed neural network for learning beta(Kn_D, q1, q2, T)
   with two physics-informed loss terms: L_PBE and L_MD.
   ============================================================ */

(function () {
  'use strict';

  const SVG_W = 760;
  const SVG_H = 440;
  const CY    = SVG_H / 2;    // vertical center

  /* ---------- Network architecture definition ---------- */
  const LAYERS = [
    { id: 'input',  label: 'Input',      sublabel: '',         nodes: ['Kn_D', 'q\u2081', 'q\u2082', 'T'],   x: 80  },
    { id: 'h1',     label: 'Hidden 1',   sublabel: '(32)',     nodes: [1,2,3,4,5],                            x: 230 },
    { id: 'h2',     label: 'Hidden 2',   sublabel: '(64)',     nodes: [1,2,3,4,5],                            x: 380 },
    { id: 'h3',     label: 'Hidden 3',   sublabel: '(32)',     nodes: [1,2,3,4,5],                            x: 530 },
    { id: 'output', label: 'Output',     sublabel: '',         nodes: ['\u03B2'],                              x: 680 },
  ];

  const NODE_R     = 14;
  const NODE_SPACE = 46;

  /* ---------- Colors ---------- */
  const COL_CYAN   = '#00d4ff';
  const COL_ORANGE = '#ff6b35';
  const COL_GREEN  = '#00ff88';
  const COL_DIM    = 'rgba(136,136,170,0.7)';

  /* ---------- Select SVG ---------- */
  const svg = d3.select('#pinn-svg');

  /* Defs: gradients & glow filter */
  const defs = svg.append('defs');

  // Glow filter for nodes
  const filt = defs.append('filter').attr('id', 'glow');
  filt.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
  const feMerge = filt.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  /* ---------- Draw connections (all-to-all between adjacent layers) ---------- */
  for (let li = 0; li < LAYERS.length - 1; li++) {
    const from = LAYERS[li];
    const to   = LAYERS[li + 1];
    const nF   = from.nodes.length;
    const nT   = to.nodes.length;

    for (let i = 0; i < nF; i++) {
      for (let j = 0; j < nT; j++) {
        const y1 = CY + (i - (nF - 1) / 2) * NODE_SPACE;
        const y2 = CY + (j - (nT - 1) / 2) * NODE_SPACE;

        svg.append('line')
          .attr('x1', from.x).attr('y1', y1)
          .attr('x2', to.x).attr('y2', y2)
          .attr('stroke', 'rgba(0,212,255,0.08)')
          .attr('stroke-width', 0.7);
      }
    }
  }

  /* ---------- Draw nodes ---------- */
  LAYERS.forEach((layer) => {
    const n = layer.nodes.length;
    const isInput  = layer.id === 'input';
    const isOutput = layer.id === 'output';

    layer.nodes.forEach((node, i) => {
      const y = CY + (i - (n - 1) / 2) * NODE_SPACE;
      const isLabeled = isInput || isOutput;

      /* Node circle */
      svg.append('circle')
        .attr('cx', layer.x).attr('cy', y).attr('r', NODE_R)
        .attr('fill',   isInput ? 'rgba(0,212,255,0.12)' :
                        isOutput ? 'rgba(0,255,136,0.12)' :
                        'rgba(0,212,255,0.07)')
        .attr('stroke', isInput ? COL_CYAN :
                        isOutput ? COL_GREEN :
                        'rgba(0,212,255,0.45)')
        .attr('stroke-width', isLabeled ? 1.8 : 1.1)
        .attr('filter', isLabeled ? 'url(#glow)' : null);

      /* Node label */
      if (isLabeled) {
        svg.append('text')
          .attr('x', layer.x).attr('y', y + 4)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-family', 'Courier New, monospace')
          .attr('fill', isOutput ? COL_GREEN : COL_CYAN)
          .attr('font-weight', '600')
          .text(String(node));
      }
    });

    /* Layer title */
    svg.append('text')
      .attr('x', layer.x).attr('y', SVG_H - 26)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'Courier New, monospace')
      .attr('fill', isInput ? COL_CYAN : isOutput ? COL_GREEN : COL_DIM)
      .text(layer.label);

    if (layer.sublabel) {
      svg.append('text')
        .attr('x', layer.x).attr('y', SVG_H - 13)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'Courier New, monospace')
        .attr('fill', 'rgba(136,136,170,0.45)')
        .text(layer.sublabel);
    }
  });

  /* ---------- Loss function callout boxes ---------- */

  /* Shared callout helper */
  function drawCallout(options) {
    const { bx, by, bw, bh, rx, title, lines, color, dashEndX, dashEndY } = options;

    /* Dashed arrow from output node to box */
    const outX = LAYERS[LAYERS.length - 1].x;
    const outY = CY;
    svg.append('line')
      .attr('x1', outX).attr('y1', outY)
      .attr('x2', dashEndX).attr('y2', dashEndY)
      .attr('stroke', color)
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '5,3')
      .attr('opacity', 0.6);

    /* Arrowhead */
    svg.append('polygon')
      .attr('points', arrowHead(dashEndX, dashEndY, outX, outY, 6))
      .attr('fill', color)
      .attr('opacity', 0.6);

    /* Box */
    svg.append('rect')
      .attr('x', bx - bw / 2).attr('y', by - bh / 2)
      .attr('width', bw).attr('height', bh).attr('rx', rx)
      .attr('fill',   color.replace(')', ', 0.07)').replace('rgb', 'rgba').replace('#', 'rgba(').replace('ff)', '255,255,255,0.07)'))
      .attr('stroke', color)
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.9);

    /* Use a simpler fill approach */
    svg.select('rect:last-child')
      .attr('fill', `rgba(${hexToRgb(color)},0.07)`)
      .attr('stroke', color);

    /* Title */
    svg.append('text')
      .attr('x', bx).attr('y', by - bh / 2 + 16)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'Courier New, monospace')
      .attr('font-weight', '700')
      .attr('fill', color)
      .text(title);

    /* Lines */
    lines.forEach((line, idx) => {
      svg.append('text')
        .attr('x', bx).attr('y', by - bh / 2 + 30 + idx * 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9.5px')
        .attr('font-family', 'Courier New, monospace')
        .attr('fill', 'rgba(220,220,240,0.75)')
        .text(line);
    });
  }

  /* Arrow head helper: returns SVG points string for small triangle */
  function arrowHead(x, y, fromX, fromY, size) {
    const angle = Math.atan2(y - fromY, x - fromX);
    const a1 = angle + Math.PI * 0.85;
    const a2 = angle - Math.PI * 0.85;
    const p1 = [x + size * Math.cos(a1), y + size * Math.sin(a1)];
    const p2 = [x + size * Math.cos(a2), y + size * Math.sin(a2)];
    return `${x},${y} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }

  /* Hex → r,g,b string helper */
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r},${g},${b}`;
  }

  const outputX = LAYERS[LAYERS.length - 1].x;
  const outputY = CY;

  /* ---- L_PBE box (top) ---- */
  const pbeBoxX = 580;
  const pbeBoxY = 68;
  const pbeBoxW = 200;
  const pbeBoxH = 68;

  svg.append('rect')
    .attr('x', pbeBoxX - pbeBoxW / 2).attr('y', pbeBoxY - pbeBoxH / 2)
    .attr('width', pbeBoxW).attr('height', pbeBoxH).attr('rx', 8)
    .attr('fill', 'rgba(0,212,255,0.07)')
    .attr('stroke', COL_CYAN)
    .attr('stroke-width', 1.2);

  svg.append('line')
    .attr('x1', outputX).attr('y1', outputY - NODE_R)
    .attr('x2', pbeBoxX).attr('y2', pbeBoxY + pbeBoxH / 2)
    .attr('stroke', COL_CYAN).attr('stroke-width', 1.2)
    .attr('stroke-dasharray', '5,3').attr('opacity', 0.55);

  svg.append('text')
    .attr('x', pbeBoxX).attr('y', pbeBoxY - pbeBoxH / 2 + 16)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px').attr('font-family', 'Courier New, monospace')
    .attr('font-weight', '700').attr('fill', COL_CYAN)
    .text('Physics Loss  \u2112_PBE');

  svg.append('text')
    .attr('x', pbeBoxX).attr('y', pbeBoxY - pbeBoxH / 2 + 31)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px').attr('font-family', 'Courier New, monospace')
    .attr('fill', 'rgba(220,220,240,0.7)')
    .text('\u2016 \u2202n/\u2202t \u2212 C[n;\u03B2\u2099\u2099] \u2016\u00B2');

  svg.append('text')
    .attr('x', pbeBoxX).attr('y', pbeBoxY - pbeBoxH / 2 + 46)
    .attr('text-anchor', 'middle')
    .attr('font-size', '8.5px').attr('font-family', 'Courier New, monospace')
    .attr('fill', 'rgba(0,212,255,0.5)')
    .text('PBE residual constraint');

  svg.append('text')
    .attr('x', pbeBoxX).attr('y', pbeBoxY - pbeBoxH / 2 + 60)
    .attr('text-anchor', 'middle')
    .attr('font-size', '8px').attr('font-family', 'Courier New, monospace')
    .attr('fill', 'rgba(0,212,255,0.4)')
    .text('H\u2192 1 as Kn_D \u2192 0');

  /* ---- L_MD box (bottom) ---- */
  const mdBoxX = 580;
  const mdBoxY = SVG_H - 68;
  const mdBoxW = 200;
  const mdBoxH = 68;

  svg.append('rect')
    .attr('x', mdBoxX - mdBoxW / 2).attr('y', mdBoxY - mdBoxH / 2)
    .attr('width', mdBoxW).attr('height', mdBoxH).attr('rx', 8)
    .attr('fill', 'rgba(255,107,53,0.07)')
    .attr('stroke', COL_ORANGE)
    .attr('stroke-width', 1.2);

  svg.append('line')
    .attr('x1', outputX).attr('y1', outputY + NODE_R)
    .attr('x2', mdBoxX).attr('y2', mdBoxY - mdBoxH / 2)
    .attr('stroke', COL_ORANGE).attr('stroke-width', 1.2)
    .attr('stroke-dasharray', '5,3').attr('opacity', 0.55);

  svg.append('text')
    .attr('x', mdBoxX).attr('y', mdBoxY - mdBoxH / 2 + 16)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px').attr('font-family', 'Courier New, monospace')
    .attr('font-weight', '700').attr('fill', COL_ORANGE)
    .text('Data Loss  \u2112_MD');

  svg.append('text')
    .attr('x', mdBoxX).attr('y', mdBoxY - mdBoxH / 2 + 31)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px').attr('font-family', 'Courier New, monospace')
    .attr('fill', 'rgba(220,220,240,0.7)')
    .text('\u03A3 | \u03B2\u2099\u2099(Kn_D\u1D35) \u2212 \u03B2_MD\u1D35 |\u00B2');

  svg.append('text')
    .attr('x', mdBoxX).attr('y', mdBoxY - mdBoxH / 2 + 46)
    .attr('text-anchor', 'middle')
    .attr('font-size', '8.5px').attr('font-family', 'Courier New, monospace')
    .attr('fill', 'rgba(255,107,53,0.5)')
    .text('MD simulation data fidelity');

  svg.append('text')
    .attr('x', mdBoxX).attr('y', mdBoxY - mdBoxH / 2 + 60)
    .attr('text-anchor', 'middle')
    .attr('font-size', '8px').attr('font-family', 'Courier New, monospace')
    .attr('fill', 'rgba(255,107,53,0.4)')
    .text('TiO\u2082, SiO\u2082, \u2026 multi-material');

  /* ---- Combined loss annotation (center right) ---- */
  svg.append('text')
    .attr('x', outputX + 14).attr('y', outputY - NODE_R - 12)
    .attr('text-anchor', 'start')
    .attr('font-size', '9.5px').attr('font-family', 'Courier New, monospace')
    .attr('fill', COL_GREEN)
    .text('\u2112 = \u2112_PBE + \u03BB \u2112_MD');

  /* ---- "MD Data" input arrow from left ---- */
  const mdDataX = 28;
  const mdDataY = CY + 30;

  svg.append('line')
    .attr('x1', mdDataX + 10).attr('y1', mdDataY)
    .attr('x2', LAYERS[0].x - NODE_R).attr('y2', CY + (3 / 2) * NODE_SPACE)
    .attr('stroke', 'rgba(0,255,136,0.35)')
    .attr('stroke-width', 1).attr('stroke-dasharray', '4,3');

  svg.append('text')
    .attr('x', mdDataX).attr('y', mdDataY - 6)
    .attr('font-size', '8.5px').attr('font-family', 'Courier New, monospace')
    .attr('fill', 'rgba(0,255,136,0.55)').attr('text-anchor', 'start')
    .text('MD');
  svg.append('text')
    .attr('x', mdDataX).attr('y', mdDataY + 6)
    .attr('font-size', '8.5px').attr('font-family', 'Courier New, monospace')
    .attr('fill', 'rgba(0,255,136,0.55)').attr('text-anchor', 'start')
    .text('data');

  /* ---- "PBE Solver" output arrow from right ---- */
  const pbeOutX = SVG_W - 14;

  svg.append('line')
    .attr('x1', LAYERS[LAYERS.length - 1].x + NODE_R).attr('y1', CY)
    .attr('x2', pbeOutX - 10).attr('y2', CY)
    .attr('stroke', COL_GREEN).attr('stroke-width', 1.5).attr('opacity', 0.5);

  /* Arrowhead right */
  svg.append('polygon')
    .attr('points', `${pbeOutX},${CY} ${pbeOutX - 8},${CY - 5} ${pbeOutX - 8},${CY + 5}`)
    .attr('fill', COL_GREEN).attr('opacity', 0.5);

  svg.append('text')
    .attr('x', pbeOutX - 3).attr('y', CY - 8)
    .attr('text-anchor', 'end')
    .attr('font-size', '8.5px').attr('font-family', 'Courier New, monospace')
    .attr('fill', 'rgba(0,255,136,0.55)')
    .text('\u03B2_NN \u2192 PBE');

  /* ---- Title ---- */
  svg.append('text')
    .attr('x', SVG_W / 2).attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px').attr('font-family', 'Courier New, monospace')
    .attr('fill', 'rgba(136,136,170,0.6)').attr('letter-spacing', '0.12em')
    .text('PROPOSED PINN ARCHITECTURE — PHYSICS-INFORMED \u03B2(Kn_D, q\u2081, q\u2082, T) NETWORK');
})();
