/**
 * 3D PORTAL SCREENSAVER - DIMENSIONAL ENGINE (THREE.JS)
 * Fully integrated with native compiler execution hooks and startup jitter filters.
 */

// Track the absolute launch time to prevent Windows startup events from triggering an instant crash
const ENGINE_LAUNCH_TIMESTAMP = Date.now();

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

        // Core System Initializations
        this.initThree();
        this.initInputListeners();
        this.buildInfiniteTunnel();
        this.buildDystopianWreckage();
        this.buildUtopianGalaxy();
        this.registerGlobalEvents();
        
        // Kick off primary render loop
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

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        this.pointLight = new THREE.PointLight(0x00f0ff, 2, 100);
        this.pointLight.position.set(0, 0, 10);
        this.scene.add(this.pointLight);

        this.clock = new THREE.Clock();
    }

    /**
     * Ironclad input listener engine with threshold guarding to prevent phantom exits.
     */
    initInputListeners() {
        this.exitThreshold = 2; // Strict pixel movement threshold

        this.onMouseMove = (event) => {
            // GRACE PERIOD: Ignore all mouse polling for the first 1.5 seconds to bypass Windows launch glitches
            if (Date.now() - ENGINE_LAUNCH_TIMESTAMP < 1500) {
                return;
            }

            // Track actual physical pixel displacement vectors
            const deltaX = Math.abs(event.movementX || 0);
            const deltaY = Math.abs(event.movementY || 0);

            // Break thread only if tracking displacement values pierce threshold window
            if (deltaX > this.exitThreshold || deltaY > this.exitThreshold) {
                console.log(`Deliberate mouse movement detected (X: ${deltaX}, Y: ${deltaY}). Executing shutdown.`);
                this.executeApplicationExit();
            }
        };

        this.onHardwareInterrupt = () => {
            if (Date.now() - ENGINE_LAUNCH_TIMESTAMP < 1500) return;
            this.executeApplicationExit();
        };

        // Attach global events securely using passive handlers to preserve core framerates
        window.addEventListener('mousemove', this.onMouseMove, { passive: true });
        window.addEventListener('keydown', this.onHardwareInterrupt, { passive: true });
        window.addEventListener('mousedown', this.onHardwareInterrupt, { passive: true });
    }

    /**
     * Hard-terminates the application container by directly targeting the compiler shell namespaces.
     */
    executeApplicationExit() {
        console.log("SHUTDOWN INITIATED: Cleaning WebGL contexts and unbinding listeners...");
        
        // Strip listeners instantly to halt any recursive execution loops
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('keydown', this.onHardwareInterrupt);
        window.removeEventListener('mousedown', this.onHardwareInterrupt);

        // TARGET 1: DecSoft HTML Compiler Proprietary Namespace Hook
        if (typeof dhc !== 'undefined' && dhc.app && typeof dhc.app.close === 'function') {
            try {
                dhc.app.close();
                return; 
            } catch(e) {
                console.error("Native dhc.app.close() failed: ", e);
            }
        }

        // TARGET 2: Generic Global App Framework Callbacks
        if (typeof App !== 'undefined' && typeof App.close === 'function') {
            try { App.close(); return; } catch(e) {}
        }
        if (typeof App !== 'undefined' && typeof App.Close === 'function') {
            try { App.Close(); return; } catch(e) {}
        }

        // TARGET 3: Legacy IE/Wrapper Windows Object Extensions
        try { window.external.Close(); return; } catch(e) {}
        try { window.external.close(); return; } catch(e) {}

        // TARGET 4: Standard Browser DOM window close (Fallback for DevTools live testing)
        try {
            window.close();
        } catch(e) {
            console.warn("Standard window.close() blocked by browser security restrictions.");
        }
    }

    /**
     * Builds the repeating physical architecture for the forward moving travel tunnel.
     */
    buildInfiniteTunnel() {
        this.tunnelGroup = new THREE.Group();
        this.ringsArray = [];

        const ringGeometry = new THREE.TorusGeometry(8, 0.08, 8, 24);

        for (let i = 0; i < this.maxTunnelRings; i++) {
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                wireframe: true,
                transparent: true,
                opacity: 0.4
            });

            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        }