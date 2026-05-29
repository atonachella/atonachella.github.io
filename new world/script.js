class AuraEngine {
    constructor() {
        this.canvas = document.getElementById('gl-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.position.set(0, 10, 50);
        
        // Environment: Vast, deep space lighting
        this.scene.background = new THREE.Color(0x020205);
        this.scene.add(new THREE.AmbientLight(0x112233, 2));

        // Create a floor that looks like a platform
        const platform = new THREE.Mesh(
            new THREE.BoxGeometry(200, 2, 200),
            new THREE.MeshPhongMaterial({ color: 0x0a0a0a, shininess: 100 })
        );
        platform.position.y = -1;
        this.scene.add(platform);

        // Procedural "Nebula" structure (Instanced)
        this.buildNebulaArchitecture();
        
        this.animate();
    }

    buildNebulaArchitecture() {
        // Here we build the 'Lush' elements
        for(let i = 0; i < 200; i++) {
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 40, 8),
                new THREE.MeshLambertMaterial({ color: 0x00f2ff, emissive: 0x001111 })
            );
            pillar.position.set((Math.random()-0.5)*500, 0, (Math.random()-0.5)*500);
            this.scene.add(pillar);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        // Dynamic camera drift
        this.camera.position.x += Math.sin(Date.now() * 0.0005) * 0.1;
        this.renderer.render(this.scene, this.camera);
    }
}

document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('loader').style.display = 'none';
    new AuraEngine();
});