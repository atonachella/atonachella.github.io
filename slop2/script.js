/**
 * 3D PORTAL SCREENSAVER - DIMENSIONAL ENGINE (THREE.JS)
 * Architectural Flow: Moves continuously forward through a complex procedural geometry.
 * State Machine: Transitions smoothly between dystopian wireframe wreckage and utopian astral galaxies.
 */

class DimensionalEngine {
    constructor() {
        this.container = document.getElementById('canvas-container');
        
        // System Parameters & Sizing
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.aspectRatio = this.width / this.height;

        // Visual Pipeline Configuration
        this.maxTunnelRings = 60;
        this.tunnelZSpacing = 4.0;
        this.maxDebrisCount = 180;
        this.starCount = 3500;
        
        // Narrative Phase Trackers
        this.currentThemeState = 0; // 0 = Dystopian Wreckage, 1 = Utopian Galaxy
        this.interpolationValue = 0.0;
        this.elapsedFrames = 0;
        this.forwardSpeed = 0.04;

        // Target HUD Elements
        this.hudSector = document.getElementById('hud-sector');
        this.hudSpeed = document.getElementById('hud-speed');

        // Fire Engine Modules
        this.initThree();
        this.initInputListeners();
        this.buildInfiniteTunnel();
        this.buildDystopianWreckage();
        this.buildUtopianGalaxy();
        this.registerGlobalEvents();
        
        // Execute primary render sequence
        this.animate();
    }

    /**
     * Initializes core WebGL rendering framework via Three.js
     */
    initThree() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000103, 0.022);

        // Perspective Camera layout designed for extreme structural scaling
        this.camera = new THREE.PerspectiveCamera(75, this.aspectRatio, 0.1, 1000);
        this.camera.position.set(0, 0, 15);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Ambient and directional layout for technical surface lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        this.pointLight = new THREE.PointLight(0x00f0ff, 2, 100);
        this.pointLight.position.set(0, 0, 10);
        this.scene.add(this.pointLight);

        this.clock = new THREE.Clock();
    }

    /**
     * Natively sets up an ironclad, threshold-guarded input execution engine.
     * Keeps high-polling devices from false-triggering, but terminates instantly on deliberate intent.
     */
    initInputListeners() {
        this.baselineX = null;
        this.baselineY = null;
        this.exitThreshold = 12; // Complete immune buffer block against micro-vibrations

        this.onMouseMove = (event) => {
            const currentX = event.clientX;
            const currentY = event.clientY;

            if (this.baselineX === null || this.baselineY === null) {
                this.baselineX = currentX;
                this.baselineY = currentY;
                return;
            }

            const driftX = Math.abs(currentX - this.baselineX);
            const driftY = Math.abs(currentY - this.baselineY);

            // Break thread only if tracking displacement values pierce threshold window
            if (driftX > this.exitThreshold || driftY > this.exitThreshold) {
                this.executeApplicationExit();
            }
        };

        this.onHardwareInterrupt = () => {
            this.executeApplicationExit();
        };

        // Attach global events securely using passive handlers to preserve core framerates
        window.addEventListener('mousemove', this.onMouseMove, { passive: true });
        window.addEventListener('keydown', this.onHardwareInterrupt, { passive: true });
        window.addEventListener('mousedown', this.onHardwareInterrupt, { passive: true });
    }

    /**
     * Safe termination sequence to step out of screensaver modes cleanly.
     */
    executeApplicationExit() {
        console.log("System interrupt registered. Dismantling Three.js pipelines...");
        
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('keydown', this.onHardwareInterrupt);
        window.removeEventListener('mousedown', this.onHardwareInterrupt);

        // Break application wrapping contexts directly
        if (typeof window.close === 'function') {
            window.close();
        }

        setTimeout(() => {
            window.location.href = "about:blank";
        }, 30);
    }

    /**
     * Builds the repeating physical architecture for the forward moving travel tunnel.
     */
    buildInfiniteTunnel() {
        this.tunnelGroup = new THREE.Group();
        this.ringsArray = [];

        // Geometries for multi-faceted geometric ring cuts
        const ringGeometry = new THREE.TorusGeometry(8, 0.08, 8, 24);

        for (let i = 0; i < this.maxTunnelRings; i++) {
            // High-tech material profiles using cyan emissive properties
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                wireframe: true,
                transparent: true,
                opacity: 0.4
            });

            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            
            // Stagger position down the Z-depth field sequentially
            const initialZ = -i * this.tunnelZSpacing;
            ringMesh.position.set(0, 0, initialZ);
            
            // Incremental spiraling rotation transform mapping
            ringMesh.rotation.z = i * 0.08;

            this.tunnelGroup.add(ringMesh);
            this.ringsArray.push({
                mesh: ringMesh,
                baseZ: initialZ
            });
        }

        this.scene.add(this.tunnelGroup);
    }

    /**
     * Generates floating, multi-faceted dystopian debris shrapnel fields
     */
    buildDystopianWreckage() {
        this.debrisGroup = new THREE.Group();
        this.debrisArray = [];

        // Jagged architectural forms
        const boxGeom = new THREE.BoxGeometry(1, 1, 1);
        const icoGeom = new THREE.IcosahedronGeometry(1, 0);

        for (let i = 0; i < this.maxDebrisCount; i++) {
            const isBox = Math.random() > 0.5;
            const targetGeom = isBox ? boxGeom : icoGeom;

            const debrisMaterial = new THREE.MeshStandardMaterial({
                color: Math.random() > 0.3 ? 0xff1e3c : 0x00f0ff, // Deep Dark Crimson vs Vivid Cyan
                wireframe: true,
                roughness: 0.9,
                metalness: 0.2,
                transparent: true,
                opacity: 0.6
            });

            const mesh = new THREE.Mesh(targetGeom, debrisMaterial);
            
            // Random distribution vectors around the outer limits of the tunnel structure
            const angle = Math.random() * Math.PI * 2;
            const radius = 9.0 + Math.random() * 6.0;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = -(Math.random() * (this.maxTunnelRings * this.tunnelZSpacing));

            mesh.position.set(x, y, z);
            
            // Unique tumble vectors
            const scaleMultiplier = 0.4 + Math.random() * 1.2;
            mesh.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
            
            const rotationSpeedX = (Math.random() - 0.5) * 0.03;
            const rotationSpeedY = (Math.random() - 0.5) * 0.03;

            this.debrisGroup.add(mesh);
            this.debrisArray.push({
                mesh: mesh,
                rotX: rotationSpeedX,
                rotY: rotationSpeedY,
                radius: radius,
                angle: angle
            });
        }

        this.scene.add(this.debrisGroup);
    }

    /**
     * Assembles a performance-optimized volumetric point cloud buffer for the utopian star galaxies.
     */
    buildUtopianGalaxy() {
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(this.starCount * 3);
        const starColors = new Float32Array(this.starCount * 3);

        const cyanColor = new THREE.Color(0x00ffc8); // Mint Utopian Cyan
        const purpleColor = new THREE.Color(0x9632ff); // Astral Deep Purple
        const whiteColor = new THREE.Color(0xffffffff);

        for (let i = 0; i < this.starCount; i++) {
            // Spiral distribution configurations
            const angle = Math.random() * Math.PI * 2;
            const radialSpread = 1.5 + Math.random() * 25.0;
            
            const x = Math.cos(angle) * radialSpread;
            const y = Math.sin(angle) * radialSpread;
            const z = -(Math.random() * 300.0);

            starPositions[i * 3] = x;
            starPositions[i * 3 + 1] = y;
            starPositions[i * 3 + 2] = z;

            // Interpolate color values across galaxy arrays procedurally
            let pickedColor = whiteColor;
            const diceRoll = Math.random();
            if (diceRoll > 0.6) pickedColor = cyanColor;
            else if (diceRoll > 0.3) pickedColor = purpleColor;

            starColors[i * 3] = pickedColor.r;
            starColors[i * 3 + 1] = pickedColor.g;
            starColors[i * 3 + 2] = pickedColor.b;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        // Use standard round texture generation using particle math to keep layout external CDN free
        const starMaterial = new THREE.PointsMaterial({
            size: 0.22,
            vertexColors: true,
            transparent: true,
            opacity: 0.0, // Instantiates hidden; blended in systematically during phase transitions
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.galaxyPoints = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.galaxyPoints);
    }

    /**
     * Direct linear interpolation controller for transition values
     */
    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    /**
     * Master State Matrix Scheduler loop
     */
    processPhaseTransition() {
        this.elapsedFrames++;

        // Switch objective profiles cyclical timelines (~15 seconds)
        if (this.elapsedFrames % 900 === 0) {
            this.currentThemeState = this.currentThemeState === 0 ? 1 : 0;
        }

        // Lock interpolation transitions smoothly
        const shiftRate = 0.004;
        this.interpolationValue = this.lerp(this.interpolationValue, this.currentThemeState, shiftRate);

        // Update active rendering parameters across groups based on active configurations
        if (this.interpolationValue < 0.3) {
            this.hudSector.innerText = "RECKONING_VOID // SEC_01";
            this.hudSector.style.color = "#ff1e3c";
            this.forwardSpeed = this.lerp(this.forwardSpeed, 0.04, 0.01);
            this.hudSpeed.innerText = `MACH ${(12.4 + Math.sin(this.elapsedFrames * 0.02) * 0.2).toFixed(1)}`;
        } else if (this.interpolationValue > 0.7) {
            this.hudSector.innerText = "TRANSCENDENT_GALAXY // SEC_02";
            this.hudSector.style.color = "#00ffc8";
            this.forwardSpeed = this.lerp(this.forwardSpeed, 0.12, 0.01); // Visibly accelerate through galaxies
            this.hudSpeed.innerText = `MACH ${(24.8 + Math.sin(this.elapsedFrames * 0.04) * 0.5).toFixed(1)}`;
        } else {
            this.hudSector.innerText = "SHIFTING_QUANTUM_BRIDGE...";
            this.hudSector.style.color = "#9632ff";
        }

        // Morph material attributes directly across the WebGL contexts
        this.galaxyPoints.material.opacity = this.interpolationValue;
        
        // Dynamically alter ring attributes based on theme blends
        this.ringsArray.forEach((ring, idx) => {
            if (this.currentThemeState === 1) {
                ring.mesh.material.color.setHex(0x9632ff); // Shift rings to purple during galaxy phase
                ring.mesh.material.opacity = this.lerp(0.4, 0.15, this.interpolationValue);
            } else {
                ring.mesh.material.color.setHex(0x00f0ff); // Restore core high tech cyan
                ring.mesh.material.opacity = this.lerp(0.4, 0.5, 1 - this.interpolationValue);
            }
        });

        // Dim down wreckage groups dynamically as galaxy systems bloom
        this.debrisGroup.position.z += this.forwardSpeed * 20;
        if (this.debrisGroup.position.z > (this.maxTunnelRings * this.tunnelZSpacing)) {
            this.debrisGroup.position.z = 0; // Seamlessly loop block arrays back to horizons
        }
    }

    /**
     * Primary Animation Frame Pipeline Loop Engine
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const absoluteTime = this.clock.getElapsedTime();

        // 1. Process environmental transforms
        this.processPhaseTransition();

        // 2. Drive the Camera or objects infinitely down the Z axis
        this.ringsArray.forEach((ring) => {
            // Move ring towards camera perspective plane
            ring.mesh.position.z += this.forwardSpeed * 60 * delta;

            // When passing camera view limits, reset immediately to deep horizon
            const limitThreshold = 15.0;
            if (ring.mesh.position.z > limitThreshold) {
                const furthestZ = -((this.maxTunnelRings - 1) * this.tunnelZSpacing);
                ring.mesh.position.z = furthestZ;
            }

            // Continuous architectural rotation matrix updates
            ring.mesh.rotation.z += 0.003;
        });

        // 3. Update debris tracking tumble matrix routines
        this.debrisArray.forEach((item) => {
            item.mesh.rotation.x += item.rotX;
            item.mesh.rotation.y += item.rotY;
            
            // Slowly rotate entire debris fields around outer paths
            if (this.interpolationValue < 0.5) {
                item.angle += 0.001;
                item.mesh.position.x = Math.cos(item.angle) * item.radius;
                item.mesh.position.y = Math.sin(item.angle) * item.radius;
            }
        });

        // 4. Vortex spiral updates on galaxy cloud sets
        if (this.interpolationValue > 0.05) {
            this.galaxyPoints.rotation.z = absoluteTime * 0.015;
        }

        // Synchronize lights properties
        this.pointLight.position.z = Math.sin(absoluteTime) * 5;

        // Render Frame Output Context
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * System event registers
     */
    registerGlobalEvents() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.aspectRatio = this.width / this.height;

            this.camera.aspect = this.aspectRatio;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.width, this.height);
        });
    }
}

// Instantiate engine context instantly on thread distribution loading
window.addEventListener('DOMContentLoaded', () => {
    const coreEngine = new DimensionalEngine();
});