/* ============================================================
   collision_3d.js — Three.js r128 3D nanocluster collision
   Two glowing spheres approach each other with impact parameter b_y.
   Auto-rotating camera. Emissive material for glow effect.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Wait for container to have layout dimensions ---------- */
  function init() {
    const container = document.getElementById('canvas3d-container');
    const W = container.clientWidth;
    const H = container.clientHeight;
    if (W === 0 || H === 0) {
      requestAnimationFrame(init);
      return;
    }
    startScene(container, W, H);
  }

  requestAnimationFrame(init);

  /* ---------- Three.js scene ---------- */
  function startScene(container, W, H) {
    /* Scene */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03030f);

    /* Subtle starfield */
    const starGeo = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 400; i++) {
      starPositions.push(
        (Math.random() - 0.5) * 160,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xaaaacc, size: 0.12 });
    scene.add(new THREE.Points(starGeo, starMat));

    /* Camera */
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 500);
    camera.position.set(0, 7, 22);
    camera.lookAt(0, 0, 0);

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('canvas3d'),
      antialias: true,
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /* Ambient light */
    scene.add(new THREE.AmbientLight(0x111122, 1));

    /* ---- Sphere geometry (shared) ---- */
    const GEO = new THREE.SphereGeometry(1.2, 36, 36);

    /* Sphere 1 — cyan (projectile, starts left) */
    const mat1 = new THREE.MeshStandardMaterial({
      color:             0x003366,
      emissive:          0x0099ee,
      emissiveIntensity: 1.0,
      metalness:         0.4,
      roughness:         0.35,
    });
    const sphere1 = new THREE.Mesh(GEO, mat1);
    scene.add(sphere1);

    const light1 = new THREE.PointLight(0x00aaff, 2.5, 18);
    sphere1.add(light1);

    /* Sphere 2 — orange (target, starts right) */
    const mat2 = new THREE.MeshStandardMaterial({
      color:             0x552200,
      emissive:          0xff5500,
      emissiveIntensity: 1.0,
      metalness:         0.4,
      roughness:         0.35,
    });
    const sphere2 = new THREE.Mesh(GEO, mat2);
    scene.add(sphere2);

    const light2 = new THREE.PointLight(0xff6600, 2.5, 18);
    sphere2.add(light2);

    /* Trajectory guide lines */
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, opacity: 0.15, transparent: true });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-14, 0, 0),
      new THREE.Vector3(14, 0, 0),
    ]);
    const trajectoryLine = new THREE.Line(lineGeo, lineMat);
    scene.add(trajectoryLine);

    /* Impact parameter indicator (dashed vertical line) */
    const impactMat = new THREE.LineBasicMaterial({ color: 0xff6b35, opacity: 0.25, transparent: true });
    const impactGeo = new THREE.BufferGeometry();
    const impactLine = new THREE.Line(impactGeo, impactMat);
    scene.add(impactLine);

    /* ---- State variables ---- */
    let b_y   = 0.0;  // impact parameter offset
    let speedMult = 1.0;
    let t     = 0;    // animation progress [0, 1]

    /* ---- Slider references ---- */
    const b3dSlider  = document.getElementById('b3d-slider');
    const v3dSlider  = document.getElementById('v3d-slider');
    const b3dLabel   = document.getElementById('b3d-val');
    const v3dLabel   = document.getElementById('v3d-val');

    b3dSlider.addEventListener('input', () => {
      b_y = parseFloat(b3dSlider.value);
      b3dLabel.textContent = b_y.toFixed(1);
      updateImpactLine();
      t = 0; // restart animation on parameter change
    });

    v3dSlider.addEventListener('input', () => {
      speedMult = parseFloat(v3dSlider.value);
      v3dLabel.textContent = speedMult.toFixed(1);
    });

    function updateImpactLine() {
      const pts = b_y > 0.05
        ? [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, b_y, 0)]
        : [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.001, 0)];
      impactGeo.setFromPoints(pts);
    }
    updateImpactLine();

    /* Update trajectory line y-position to match sphere2 height */
    function updateTrajectoryLine() {
      const midY = b_y / 2;
      trajectoryLine.position.y = 0;
    }

    /* ---- Animation loop ---- */
    let angle = 0;
    const START_X = 10.0;

    function animate() {
      requestAnimationFrame(animate);

      t += 0.004 * speedMult;
      if (t > 1.4) t = 0;

      /* Linear approach: both spheres move inward */
      const progress = Math.min(t, 1.0);
      sphere1.position.set(-START_X + progress * START_X * 2, 0,   0);
      sphere2.position.set( START_X - progress * START_X * 2, b_y, 0);

      /* Highlight collision moment */
      if (t > 0.9 && t < 1.1) {
        const proximity = 1 - Math.abs(t - 1.0) / 0.1;
        mat1.emissiveIntensity = 1.0 + proximity * 2.5;
        mat2.emissiveIntensity = 1.0 + proximity * 2.5;
        light1.intensity = 2.5 + proximity * 5;
        light2.intensity = 2.5 + proximity * 5;
      } else {
        mat1.emissiveIntensity = 1.0;
        mat2.emissiveIntensity = 1.0;
        light1.intensity = 2.5;
        light2.intensity = 2.5;
      }

      /* Auto-rotate camera */
      angle += 0.003;
      const R_cam = 22;
      camera.position.x = R_cam * Math.sin(angle);
      camera.position.z = R_cam * Math.cos(angle);
      camera.position.y = 7 + Math.sin(angle * 0.4) * 2;
      camera.lookAt(0, b_y * 0.35, 0);

      renderer.render(scene, camera);
    }

    animate();

    /* ---- Handle window resize ---- */
    window.addEventListener('resize', () => {
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW === 0 || newH === 0) return;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    });
  }
})();
