class SynthesisEngine {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 8000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Atmosphere: Deep blue-black fog for scale
        this.scene.fog = new THREE.FogExp2(0x020508, 0.002);
        this.camera.position.set(0, 15, 80);
        
        this.addLightGrid();
        this.buildVastArchitecture();
        this.animate();
    }

    addLightGrid() {
        // Complex lighting stack
        const ambient = new THREE.AmbientLight(0x0a1626, 2);
        this.scene.add(ambient);
        
        const spot = new THREE.SpotLight(0x00f2ff, 5);
        spot.position.set(0, 100, 50);
        this.scene.add(spot);
    }

    buildVastArchitecture() {
        // High-Density Floor with reflectivity
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(8000, 8000),
            new THREE.MeshPhysicalMaterial({ color: 0x050a10, metalness: 0.95, roughness: 0.05 })
        );
        floor.rotation.x = -Math.PI/2;
        this.scene.add(floor);

        // Building the "Spire" array for visual density
        for(let i = 0; i < 600; i++) {
            const h = 50 + Math.random() * 200;
            const spire = new THREE.Mesh(
                new THREE.BoxGeometry(2, h, 2),
                new THREE.MeshStandardMaterial({ color: 0x0a1018, metalness: 0.5 })
            );
            spire.position.set((Math.random()-0.5)*2000, h/2, -i * 60);
            this.scene.add(spire);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        // Dynamic Drift
        this.camera.position.z -= 1.2;
        if(this.camera.position.z < -2000) this.camera.position.z = 80;
        
        this.renderer.render(this.scene, this.camera);
    }
}

document.getElementById('engage-btn').addEventListener('click', (e) => {
    e.target.innerText = "SYNTHESIZING...";
    setTimeout(() => {
        document.getElementById('init-modal').style.opacity = 0;
        setTimeout(() => { document.getElementById('init-modal').remove(); new SynthesisEngine(); }, 1000);
    }, 500);
});