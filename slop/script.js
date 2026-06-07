/**
 * DIMENSIONAL PORTAL ENGINE
 * Procedural WebGL Environment shifting between Utopia and Dystopia
 */

// Add this immediately after your class declaration or at the top of the file
function enterFullscreen() {
    const el = document.documentElement; // Targets the whole page
    if (el.requestFullscreen) {
        el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) { // Safari/Chrome
        el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) { // IE11
        el.msRequestFullscreen();
    }
}

// Trigger this as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // 1. Enter Fullscreen
    enterFullscreen();
    
    // 2. Initialize your engine
    window.engine = new DimensionalEngine();
});

class DimensionalEngine {
    constructor() {
        // Core Setup
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        
        // Dynamic Fog (Color changes based on dimension)
        this.scene.fog = new THREE.FogExp2(0x0a141e, 0.002);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
        this.camera.position.set(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance cap
        this.container.appendChild(this.renderer.domElement);

        // Engine State
        this.clock = new THREE.Clock();
        this.time = 0;
        this.state = 'UTOPIA'; // 'UTOPIA' or 'DYSTOPIA'
        this.phaseTimer = 0;
        this.phaseDuration = 20; // Seconds before shifting dimensions
        this.baseSpeed = 5;
        this.currentSpeed = 5;

        // Visual Groups
        this.wormholeGroup = new THREE.Group();
        this.utopiaGroup = new THREE.Group();
        this.dystopiaGroup = new THREE.Group();
        
        this.scene.add(this.wormholeGroup);
        this.scene.add(this.utopiaGroup);
        this.scene.add(this.dystopiaGroup);

        // UI Elements
        this.ui = {
            body: document.body,
            title: document.getElementById('system-title'),
            statusText: document.getElementById('status-text'),
            envFlora: document.getElementById('env-flora'),
            envRad: document.getElementById('env-rad'),
            speed: document.getElementById('speed-readout'),
            glitch: document.getElementById('glitch-overlay'),
            coords: {
                x: document.getElementById('coord-x'),
                y: document.getElementById('coord-y'),
                z: document.getElementById('coord-z')
            }
        };

        // Initialize Systems
        this.buildWormhole();
        this.buildUtopia();
        this.buildDystopia();
        
        // Start state
        this.dystopiaGroup.visible = false;
        
        this.bindEvents();
        this.animate();
    }

    /**
     * Builds the procedural infinite tube structure
     */
    buildWormhole() {
        // Create a complex, winding path using a CatmullRomCurve3
        const points = [];
        for (let i = 0; i < 100; i++) {
            const z = -(i * 50);
            const x = Math.sin(i * 0.2) * 50 + Math.cos(i * 0.1) * 20;
            const y = Math.cos(i * 0.2) * 50 + Math.sin(i * 0.1) * 20;
            points.push(new THREE.Vector3(x, y, z));
        }
        this.tubePath = new THREE.CatmullRomCurve3(points);
        this.tubePath.closed = false;

        const geometry = new THREE.TubeGeometry(this.tubePath, 200, 30, 16, false);
        
        // Custom Wireframe/Grid material that we can color shift
        this.tubeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: true,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });

        this.tubeMesh = new THREE.Mesh(geometry, this.tubeMaterial);
        this.wormholeGroup.add(this.tubeMesh);
    }

    /**
     * Builds the lush, peaceful, flourishing environment (Particles & Lights)
     */
    buildUtopia() {
        const particleCount = 15000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const color1 = new THREE.Color(0x00f0ff); // Cyan
        const color2 = new THREE.Color(0x00ffaa); // Spring Green

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Generate along the tube volume
            const z = -Math.random() * 4000;
            const radius = 10 + Math.random() * 40;
            const angle = Math.random() * Math.PI * 2;
            
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = Math.sin(angle) * radius;
            positions[i3 + 2] = z;

            const mixed = color1.clone().lerp(color2, Math.random());
            colors[i3] = mixed.r;
            colors[i3 + 1] = mixed.g;
            colors[i3 + 2] = mixed.b;

            sizes[i] = Math.random() * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        this.utopiaParticles = new THREE.Points(
            geometry,
            new THREE.PointsMaterial({
                size: 1.5,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            })
        );
        this.utopiaGroup.add(this.utopiaParticles);
    }

    /**
     * Builds the chaotic, dystopian wreckage (Instanced Meshes for high performance)
     */
    buildDystopia() {
        const wreckageCount = 800;
        // Base jagged geometry
        const baseGeometry = new THREE.TetrahedronGeometry(5, 1);
        
        this.dystopiaMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            emissive: 0xff003c,
            emissiveIntensity: 0.2,
            flatShading: true,
            wireframe: true
        });

        // Use InstancedMesh to render hundreds of complex objects efficiently
        this.wreckageMesh = new THREE.InstancedMesh(baseGeometry, this.dystopiaMaterial, wreckageCount);
        
        const dummy = new THREE.Object3D();
        this.wreckageData = []; // Store custom physics data for each piece

        for (let i = 0; i < wreckageCount; i++) {
            const z = -Math.random() * 4000;
            const radius = 5 + Math.random() * 30;
            const angle = Math.random() * Math.PI * 2;
            
            dummy.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                z
            );
            
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            dummy.scale.setScalar(Math.random() * 2 + 0.5);
            dummy.updateMatrix();
            
            this.wreckageMesh.setMatrixAt(i, dummy.matrix);

            // Store rotation speeds and drift vectors
            this.wreckageData.push({
                rx: (Math.random() - 0.5) * 0.05,
                ry: (Math.random() - 0.5) * 0.05,
                drift: (Math.random() - 0.5) * 2
            });
        }

        this.dystopiaGroup.add(this.wreckageMesh);

        // Add harsh lighting for dystopia
        const light = new THREE.PointLight(0xff003c, 2, 500);
        this.dystopiaGroup.add(light);
    }

    /**
     * Logic for shifting between visual states and updating UI
     */
    shiftDimension() {
        if (this.state === 'UTOPIA') {
            // Shift to Cyberpunk / Dystopia
            this.state = 'DYSTOPIA';
            this.ui.body.classList.add('cyberpunk-mode');
            this.ui.title.innerText = "SYS // BREACH";
            this.ui.statusText.innerText = "CRITICAL";
            this.ui.envFlora.innerText = "0%";
            this.ui.envRad.innerText = "850.4 mSv";
            this.ui.glitch.classList.remove('hidden');
            
            // Alter Scene Graphics
            this.scene.fog.color.setHex(0x140505);
            this.tubeMaterial.color.setHex(0xff003c);
            this.currentSpeed = this.baseSpeed * 2.5; // Speed up through wreckage
            
            this.dystopiaGroup.visible = true;
            this.utopiaGroup.visible = false;

        } else {
            // Shift back to Utopia / Lush
            this.state = 'UTOPIA';
            this.ui.body.classList.remove('cyberpunk-mode');
            this.ui.title.innerText = "AURA // LUSH_SYNC";
            this.ui.statusText.innerText = "HARMONIC";
            this.ui.envFlora.innerText = "100%";
            this.ui.envRad.innerText = "0.02 mSv";
            this.ui.glitch.classList.add('hidden');

            // Alter Scene Graphics
            this.scene.fog.color.setHex(0x0a141e);
            this.tubeMaterial.color.setHex(0x00f0ff);
            this.currentSpeed = this.baseSpeed;
            
            this.dystopiaGroup.visible = false;
            this.utopiaGroup.visible = true;
        }
    }

    /**
     * Main Render Loop Updates
     */
    update(delta) {
        this.time += delta;
        this.phaseTimer += delta;

        // Check for dimensional shift
        if (this.phaseTimer > this.phaseDuration) {
            this.phaseTimer = 0;
            this.shiftDimension();
        }

        // 1. Move camera down the wormhole path
        // We calculate a parameter 't' along the curve based on time
        const loopTime = 10000 / this.currentSpeed; 
        const t = (this.time % loopTime) / loopTime;
        const lookAtT = ((this.time + 100) % loopTime) / loopTime;

        // Get position and target from the curve
        const pos = this.tubePath.getPointAt(t);
        const lookAt = this.tubePath.getPointAt(lookAtT);

        // Add camera shake during dystopia
        let shakeX = 0, shakeY = 0;
        if (this.state === 'DYSTOPIA') {
            shakeX = (Math.random() - 0.5) * 2;
            shakeY = (Math.random() - 0.5) * 2;
        }

        this.camera.position.set(pos.x + shakeX, pos.y + shakeY, pos.z);
        this.camera.lookAt(lookAt);

        // 2. Animate Utopia Particles (Swirling galaxy effect)
        if (this.utopiaGroup.visible) {
            const positions = this.utopiaParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                // Gentle rotation around the Z axis
                const x = positions[i];
                const y = positions[i+1];
                positions[i] = x * Math.cos(0.001) - y * Math.sin(0.001);
                positions[i+1] = x * Math.sin(0.001) + y * Math.cos(0.001);
                
                // Move particles forward to loop
                positions[i+2] += this.currentSpeed * 0.5;
                if (positions[i+2] > this.camera.position.z + 100) {
                    positions[i+2] -= 4000;
                }
            }
            this.utopiaParticles.geometry.attributes.position.needsUpdate = true;
        }

        // 3. Animate Dystopia Wreckage (Instanced Mesh physics)
        if (this.dystopiaGroup.visible) {
            const dummy = new THREE.Object3D();
            const matrix = new THREE.Matrix4();
            
            for (let i = 0; i < this.wreckageData.length; i++) {
                this.wreckageMesh.getMatrixAt(i, matrix);
                matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

                // Apply rotation
                dummy.rotation.x += this.wreckageData[i].rx;
                dummy.rotation.y += this.wreckageData[i].ry;
                
                // Move forward towards camera
                dummy.position.z += this.currentSpeed;

                // Loop geometry back to the end of the tunnel
                if (dummy.position.z > this.camera.position.z + 50) {
                    dummy.position.z -= 4000;
                }

                dummy.updateMatrix();
                this.wreckageMesh.setMatrixAt(i, dummy.matrix);
            }
            this.wreckageMesh.instanceMatrix.needsUpdate = true;
            
            // Pulse emissive material
            this.dystopiaMaterial.emissiveIntensity = 0.2 + Math.abs(Math.sin(this.time * 5)) * 0.5;
        }

        // 4. Update UI Elements
        this.ui.speed.innerText = `WARP ${(this.currentSpeed / this.baseSpeed).toFixed(1)}`;
        this.ui.coords.x.innerText = pos.x.toFixed(2);
        this.ui.coords.y.innerText = pos.y.toFixed(2);
        this.ui.coords.z.innerText = Math.abs(pos.z).toFixed(0);
    }

    // REPLACE your current bindEvents method with this:
bindEvents() {
    window.addEventListener('resize', () => {
        // 1. Get the latest available dimensions from the window
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 2. Update the Camera Aspect Ratio so the 3D scene doesn't stretch
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // 3. Force the Renderer to match the window exactly
        this.renderer.setSize(width, height);
        
        // 4. (Optional) Adjust pixel ratio for high-DPI screens
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Trigger it once immediately on boot to ensure it fills the screen
    window.dispatchEvent(new Event('resize'));
}

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const delta = this.clock.getDelta();
        this.update(delta);
        this.renderer.render(this.scene, this.camera);
    }
}

// Force the screensaver to close on any user input
function closeScreensaver() {
    window.close();
}

window.addEventListener('mousemove', closeScreensaver);
window.addEventListener('keydown', closeScreensaver);
window.addEventListener('mousedown', closeScreensaver);

// Boot Sequence
document.addEventListener('DOMContentLoaded', () => {
    window.engine = new DimensionalEngine();
});