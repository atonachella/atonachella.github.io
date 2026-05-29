class GrandSynthesis {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('deck-canvas'), antialias: true });
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 0.1, 5000);
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.scene.fog = new THREE.FogExp2(0x020508, 0.003); // Cinematic depth

        this.camera.position.set(0, 15, 60);
        
        // Lighting: High-contrast futuristic lighting
        const ambient = new THREE.AmbientLight(0x1a2e4c, 1.5);
        this.scene.add(ambient);
        
        // Build the environment
        this.buildDeck();
        this.animate();
    }

    buildDeck() {
        // Floor: High-reflectivity metallic
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(2000, 2000),
            new THREE.MeshStandardMaterial({ color: 0x0a0c10, metalness: 0.9, roughness: 0.1 })
        );
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        // Architecture: Procedural support pillars
        for(let i=0; i<300; i++) {
            const size = 1 + Math.random() * 5;
            const beam = new THREE.Mesh(
                new THREE.BoxGeometry(size, 100, size),
                new THREE.MeshStandardMaterial({ color: 0x0f1620, metalness: 0.8 })
            );
            beam.position.set((Math.random()-0.5)*1000, 0, -i * 50);
            this.scene.add(beam);
        }

        // Foliage: "Lush" clusters
        for(let i=0; i<500; i++) {
            const leaf = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.8),
                new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x004422 })
            );
            leaf.position.set((Math.random()-0.5)*300, 2, (Math.random()-0.5)*1000);
            this.scene.add(leaf);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.camera.position.z -= 0.5; // Constant forward drift
        if(this.camera.position.z < -1000) this.camera.position.z = 60;
        this.renderer.render(this.scene, this.camera);
    }
}

document.getElementById('start-engine').addEventListener('click', () => {
    document.getElementById('loader').remove();
    new GrandSynthesis();
});