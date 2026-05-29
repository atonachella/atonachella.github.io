// --- Core Engine Architecture ---
class SynthesisEngine {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x020508, 0.005);
        
        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.setup();
    }

    setup() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        this.camera.position.set(0, 20, 100);
        this.addLighting();
        this.generateEnvironment();
        this.render();
    }

    addLighting() {
        const ambient = new THREE.AmbientLight(0x0a1a2a, 2);
        this.scene.add(ambient);
        
        const directional = new THREE.DirectionalLight(0x00f2ff, 1);
        directional.position.set(0, 100, 0);
        this.scene.add(directional);
    }

    generateEnvironment() {
        // High-density floor with texture-like detail
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(5000, 5000),
            new THREE.MeshStandardMaterial({ color: 0x05080c, metalness: 0.9, roughness: 0.1 })
        );
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        // Building "The City" (Instanced Rendering for scale)
        const geometry = new THREE.BoxGeometry(2, 50, 2);
        const material = new THREE.MeshStandardMaterial({ color: 0x0a0f18 });
        
        for(let i = 0; i < 1000; i++) {
            const pillar = new THREE.Mesh(geometry, material);
            pillar.position.set((Math.random()-0.5)*2000, 25, (Math.random()-0.5)*2000);
            this.scene.add(pillar);
        }
    }

    render() {
        requestAnimationFrame(() => this.render());
        this.camera.position.z -= 0.8; // Faster cinematic speed
        this.renderer.render(this.scene, this.camera);
    }
}

document.getElementById('engage-btn').addEventListener('click', () => {
    document.getElementById('init-layer').style.opacity = 0;
    setTimeout(() => {
        document.getElementById('init-layer').remove();
        new SynthesisEngine();
    }, 1000);
});