import * as THREE from 'three';

export let scene, renderer, clock;

export function initScene() {
    // ---------- Scene ----------
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 50, 150);

    // ---------- Renderer ----------
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // ---------- إضافة Canvas ----------
    const container = document.getElementById('game-container');
    if (container) {
        container.appendChild(renderer.domElement);
    } else {
        document.body.appendChild(renderer.domElement);
    }

    // ---------- Clock ----------
    clock = new THREE.Clock();

    // ---------- Events ----------
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    console.log('✅ Scene initialized');

    return { scene, renderer, clock };
}

function onResize() {
    if (!renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}