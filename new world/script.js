class DeckEngine {
    constructor() {
        this.container = document.getElementById('canvas-root');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 5000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.container, antialias: true, alpha: true });
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.camera.position.set(0, 5, 25);
        
        // Atmosphere & Lighting
        this.scene.fog = new THREE.FogExp2(0x020508, 0.008);
        const hemi = new THREE.HemisphereLight(0x0a1a2a, 0x050505, 1);
        this.scene.add(hemi);
        
        this.buildArchitecture();
        this.animate();
    }

    buildArchitecture() {
        // Floor Structure - Metallic tiles
        const floorGeo = new THREE.PlaneGeometry(100, 1000, 50, 50);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x0a0e14, metalness: 0.8, roughness: 0.1, side: THREE.DoubleSide 
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        // Structural Support Beams (The "Futuristic" aspect)
        for(let i = 0; i < 20; i++) {
            const beam = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 20, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 1 })
            );
            beam.position.set(10, 10, -i * 50);
            this.scene.add(beam);
        }

        // Add Emissive "Data Strips"
        for(let i = 0; i < 40; i++) {
            const strip = new THREE.Mesh(
                new THREE.PlaneGeometry(1, 10),
                new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.5 })
            );
            strip.position.set(-10, 5, -i * 25);
            this.scene.add(strip);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.camera.position.z -= 0.25;
        if (this.camera.position.z < -900) this.camera.position.z = 25;
        this.renderer.render(this.scene, this.camera);
    }
}

document.getElementById('initialize-btn').addEventListener('click', (e) => {
    document.getElementById('loader-ui').style.opacity = 0;
    setTimeout(() => {
        document.getElementById('loader-ui').remove();
        document.getElementById('hud-layer').classList.add('active');
        new DeckEngine();
    }, 1000);
});