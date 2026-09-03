/**
 * Particules ambiantes Visit Béjaïa (Three.js)
 * Soft floating dots — navy / gold
 */
(function initAmbient3D() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof THREE === 'undefined') return;

    const canvas = document.getElementById('canvas-3d');
    if (!canvas) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const count = isMobile ? 48 : 90;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 28;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 48;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 32;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
        speeds[i] = 0.15 + Math.random() * 0.45;
        phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        size: isMobile ? 0.28 : 0.38,
        color: 0xf0a820,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Second layer — cooler navy sparkles
    const geo2 = geometry.clone();
    const mat2 = new THREE.PointsMaterial({
        size: isMobile ? 0.18 : 0.24,
        color: 0x7eb6ff,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    const points2 = new THREE.Points(geo2, mat2);
    scene.add(points2);

    function resize() {
        const parent = canvas.parentElement || document.body;
        const w = parent.clientWidth || window.innerWidth;
        const h = parent.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    let running = true;
    let t0 = performance.now();

    document.addEventListener('visibilitychange', () => {
        running = document.visibilityState === 'visible';
        if (running) t0 = performance.now();
    });

    function tick(now) {
        requestAnimationFrame(tick);
        if (!running) return;

        const t = (now - t0) * 0.001;
        const pos = geometry.attributes.position.array;

        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            pos[ix + 1] += Math.sin(t * speeds[i] + phases[i]) * 0.012;
            pos[ix] += Math.cos(t * speeds[i] * 0.7 + phases[i]) * 0.008;
            if (pos[ix + 1] > 16) pos[ix + 1] = -16;
            if (pos[ix + 1] < -16) pos[ix + 1] = 16;
        }
        geometry.attributes.position.needsUpdate = true;

        points.rotation.y = t * 0.04;
        points2.rotation.y = -t * 0.03;
        points2.rotation.x = Math.sin(t * 0.2) * 0.08;

        material.opacity = 0.55 + Math.sin(t * 1.2) * 0.15;
        mat2.opacity = 0.35 + Math.cos(t * 0.9) * 0.12;

        renderer.render(scene, camera);
    }

    requestAnimationFrame(tick);
})();
