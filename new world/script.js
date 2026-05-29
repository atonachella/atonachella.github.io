import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

class ObservationDeck {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('main-canvas'), antialias: true });
        this.clock = new THREE.Clock();
        
        this.setup();
        this.createEnvironment();
        this.addEventListeners();
    }

    setup() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.camera.position.set(0, 5, 20);
        
        this.scene.fog = new THREE.FogExp2(0x020205, 0.012);
        const ambient = new THREE.AmbientLight(0x223344, 2);
        this.scene.add(ambient);
    }

    createEnvironment() {
        // Floor with reflective aesthetic
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(1000, 1000),
            new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.9, roughness: 0.1 })
        );
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        // Procedural "Lush" modules
        for(let i = 0; i < 60; i++) {
            this.addModule( (Math.random()-0.5)*100, -i * 20 );
        }
    }

    addModule(x, z) {
        const group = new THREE.Group();
        // High-tech planter geometry
        const base = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({color: 0x111111}));
        group.add(base);
        
        // Complex procedural foliage
        for(let j = 0; j < 8; j++) {
            const leaf = new THREE.Mesh(
                new THREE.TetrahedronGeometry(1.2),
                new THREE.MeshStandardMaterial({color: 0x00ff88, emissive: 0x004422})
            );
            leaf.position.set(Math.sin(j)*2, 1 + j*0.5, Math.cos(j)*2);
            group.add(leaf);
        }
        group.position.set(x, 1, z);
        this.scene.add(group);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const t = this.clock.getElapsedTime();
        
        // Cinematic camera drift
        this.camera.position.z -= 0.15;
        if(this.camera.position.z < -800) this.camera.position.z = 20;
        
        this.renderer.render(this.scene, this.camera);
    }
}

document.getElementById('engage-btn').addEventListener('click', () => {
    document.getElementById('loading-overlay').style.opacity = 0;
    const app = new ObservationDeck();
    app.animate();
});