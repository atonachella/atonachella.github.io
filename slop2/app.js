/**
 * Monolithic 3D Graphics & Engine Software Pipeline
 * Pre-patched for Full-Screen Screensaver Execution
 */

// --- ENGINE CONFIGURATION & CONSTANTS ---
const CONFIG = {
    PARTICLE_COUNT: 1400,
    TUNNEL_RINGS: 70,
    RING_SEGMENTS: 16,
    FOV: 250,
    Z_CLIP: 1.2,
    MAX_DEPTH: 40,
    CYCLE_DURATION: 1800 // Frame counts per environmental state sequence
};

const STATES = {
    CYBERPUNK_DECAY: 0,
    WORMHOLE_CHAOS: 1,
    UTOPIAN_LUSH: 2,
    GALACTIC_THRIVING: 3
};

// --- CORE MATHEMATICAL UTILITIES ---
class Vector3D {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x, y, z) {
        this.x = x; this.y = y; this.z = z;
    }
}

class ColorRGBA {
    constructor(r, g, b, a = 1) {
        this.r = r; this.g = g; this.b = b; this.a = a;
    }
    toString() {
        return `rgba(${Math.floor(this.r)},${Math.floor(this.g)},${Math.floor(this.b)},${this.a})`;
    }
}

function lerpColor(c1, c2, t) {
    return new ColorRGBA(
        c1.r + (c2.r - c1.r) * t,
        c1.g + (c2.g - c1.g) * t,
        c1.b + (c2.b - c1.b) * t,
        c1.a + (c2.a - c1.a) * t
    );
}

// --- ENGINE STATE TRACKER ---
class EngineState {
    constructor() {
        this.currentMode = STATES.CYBERPUNK_DECAY;
        this.progress = 0;
        this.globalTime = 0;
        this.velocity = 0.08;
        this.targetVelocity = 0.08;
        this.chaosFactor = 0.1;
        this.cameraPos = new Vector3D(0, 0, 0);
        this.cameraRot = new Vector3D(0, 0, 0);
        this.palette = {
            primary: new ColorRGBA(255, 0, 85),
            secondary: new ColorRGBA(0, 240, 255),
            accent: new ColorRGBA(20, 20, 35),
            bg: new ColorRGBA(5, 2, 12)
        };
    }

    update() {
        this.globalTime++;
        this.progress++;

        if (this.progress >= CONFIG.CYCLE_DURATION) {
            this.progress = 0;
            this.currentMode = (this.currentMode + 1) % 4;
        }

        let t = this.progress / CONFIG.CYCLE_DURATION;
        switch (this.currentMode) {
            case STATES.CYBERPUNK_DECAY:
                this.targetVelocity = 0.06 + Math.sin(this.globalTime * 0.01) * 0.02;
                this.chaosFactor = 0.25;
                this.morphPalette(
                    new ColorRGBA(240, 0, 70), 
                    new ColorRGBA(0, 180, 220), 
                    new ColorRGBA(15, 10, 20),
                    t
                );
                break;
            case STATES.WORMHOLE_CHAOS:
                this.targetVelocity = 0.22 + Math.cos(this.globalTime * 0.05) * 0.05;
                this.chaosFactor = 0.95;
                this.morphPalette(
                    new ColorRGBA(255, 100, 0), 
                    new ColorRGBA(160, 0, 255), 
                    new ColorRGBA(5, 0, 15),
                    t
                );
                break;
            case STATES.UTOPIAN_LUSH:
                this.targetVelocity = 0.04;
                this.chaosFactor = 0.02;
                this.morphPalette(
                    new ColorRGBA(0, 255, 150), 
                    new ColorRGBA(200, 255, 0), 
                    new ColorRGBA(5, 15, 10),
                    t
                );
                break;
            case STATES.GALACTIC_THRIVING:
                this.targetVelocity = 0.09;
                this.chaosFactor = 0.15;
                this.morphPalette(
                    new ColorRGBA(0, 100, 255), 
                    new ColorRGBA(255, 200, 255), 
                    new ColorRGBA(2, 2, 8),
                    t
                );
                break;
        }

        this.velocity += (this.targetVelocity - this.velocity) * 0.03;
        this.cameraPos.z += this.velocity;
    }

    morphPalette(pTarget, sTarget, bgTarget, t) {
        this.palette.primary = lerpColor(this.palette.primary, pTarget, 0.02);
        this.palette.secondary = lerpColor(this.palette.secondary, sTarget, 0.02);
        this.palette.bg = lerpColor(this.palette.bg, bgTarget, 0.02);
    }

    getStageString() {
        switch(this.currentMode) {
            case STATES.CYBERPUNK_DECAY: return "DYSTOPIAN_RECON";
            case STATES.WORMHOLE_CHAOS: return "WORMHOLE_WARP_CRITICAL";
            case STATES.UTOPIAN_LUSH: return "BIO_UTOPIA_INTEGRATION";
            case STATES.GALACTIC_THRIVING: return "GALACTIC_CORE_THRIVING";
        }
    }
}

const engine = new EngineState();

// --- VECTOR TRANSFORMS & 3D PROJECTION SYSTEM ---
class RenderPipeline {
    static transformAndProject(vertex, cameraPos, cameraRot, width, height) {
        let x = vertex.x - cameraPos.x;
        let y = vertex.y - cameraPos.y;
        let z = vertex.z - cameraPos.z;

        if (cameraRot.z !== 0) {
            let cosZ = Math.cos(cameraRot.z), sinZ = Math.sin(cameraRot.z);
            let nx = x * cosZ - y * sinZ;
            let ny = x * sinZ + y * cosZ;
            x = nx; y = ny;
        }
        if (cameraRot.x !== 0) {
            let cosX = Math.cos(cameraRot.x), sinX = Math.sin(cameraRot.x);
            let ny = y * cosX - z * sinX;
            let nz = y * sinX + z * cosX;
            y = ny; z = nz;
        }
        if (cameraRot.y !== 0) {
            let cosY = Math.cos(cameraRot.y), sinY = Math.sin(cameraRot.y);
            let nx = x * cosY + z * sinY;
            let nz = -x * sinY + z * cosY;
            x = nx; z = nz;
        }

        if (z < CONFIG.Z_CLIP) return null;

        let scale = CONFIG.FOV / z;
        let screenX = (width / 2) + x * scale;
        let screenY = (height / 2) + y * scale;

        return { x: screenX, y: screenY, depth: z, size: scale };
    }
}

// --- PROCEDURAL 3D PRIMITIVES ---
class Starfield {
    constructor() {
        this.stars = [];
        for(let i = 0; i < 300; i++) {
            this.stars.push(new Vector3D(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60,
                Math.random() * CONFIG.MAX_DEPTH
            ));
        }
    }

    update(zSpeed) {
        for(let star of this.stars) {
            star.z -= zSpeed * 0.2;
            if(star.z <= CONFIG.Z_CLIP) {
                star.z = CONFIG.MAX_DEPTH;
                star.x = (Math.random() - 0.5) * 60;
                star.y = (Math.random() - 0.5) * 60;
            }
        }
    }

    collectRenderables(renderList, w, h) {
        for(let star of this.stars) {
            let p = RenderPipeline.transformAndProject(star, new Vector3D(0,0,0), engine.cameraRot, w, h);
            if(!p) continue;
            
            renderList.push({
                depth: p.depth,
                render: (ctx) => {
                    let alpha = 1.0 - (p.depth / CONFIG.MAX_DEPTH);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.fillRect(p.x, p.y, Math.max(1, p.size * 0.015), Math.max(1, p.size * 0.015));
                }
            });
        }
    }
}

class FloatingWreckage {
    constructor() {
        this.meshPoints = [];
        this.pos = new Vector3D();
        this.rot = new Vector3D();
        this.rotSpeed = new Vector3D();
        this.activeType = 'dystopian';
        this.reset(10);
    }

    reset(zTarget) {
        this.pos.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, zTarget);
        this.rot.set(Math.random() * 5, Math.random() * 5, Math.random() * 5);
        this.rotSpeed.set(Math.random() * 0.02, Math.random() * 0.02, Math.random() * 0.03);
        
        this.meshPoints = [];
        if (engine.currentMode === STATES.CYBERPUNK_DECAY || engine.currentMode === STATES.WORMHOLE_CHAOS) {
            this.activeType = 'dystopian';
            let maxPoints = 5 + Math.floor(Math.random() * 5);
            for(let i=0; i<maxPoints; i++) {
                this.meshPoints.push(new Vector3D(
                    (Math.random() - 0.5) * 2.5,
                    (Math.random() - 0.5) * 2.5,
                    (Math.random() - 0.5) * 2.5
                ));
            }
        } else {
            this.activeType = 'utopian';
            let segments = 6;
            for(let i=0; i<segments; i++) {
                let angle = (i / segments) * Math.PI * 2;
                this.meshPoints.push(new Vector3D(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, 0));
                this.meshPoints.push(new Vector3D(0, Math.cos(angle) * 1.2, Math.sin(angle) * 1.2));
            }
        }
    }

    update(zSpeed) {
        this.pos.z -= zSpeed;
        this.rot.x += this.rotSpeed.x;
        this.rot.y += this.rotSpeed.y;
        this.rot.z += this.rotSpeed.z;

        if (this.pos.z <= CONFIG.Z_CLIP) {
            this.reset(CONFIG.MAX_DEPTH);
        }
    }

    collectRenderables(renderList, w, h) {
        let transformedMesh = [];
        let cx = Math.cos(this.rot.x), sx = Math.sin(this.rot.x);
        let cy = Math.cos(this.rot.y), sy = Math.sin(this.rot.y);
        let cz = Math.cos(this.rot.z), sz = Math.sin(this.rot.z);

        for (let pt of this.meshPoints) {
            let x = pt.x, y = pt.y, z = pt.z;
            let y1 = y * cx - z * sx; let z1 = y * sx + z * cx;
            let x2 = x * cy + z1 * sy; let z2 = -x * sy + z1 * cy;
            let x3 = x2 * cz - y1 * sz; let y3 = x2 * sz + y1 * cz;

            let worldV = new Vector3D(x3 + this.pos.x, y3 + this.pos.y, z2 + this.pos.z);
            let projected = RenderPipeline.transformAndProject(worldV, new Vector3D(0,0,0), engine.cameraRot, w, h);
            if (projected) transformedMesh.push(projected);
        }

        if (transformedMesh.length < 2) return;

        let avgDepth = 0;
        for (let p of transformedMesh) avgDepth += p.depth;
        avgDepth /= transformedMesh.length;

        renderList.push({
            depth: avgDepth,
            render: (ctx) => {
                let alpha = Math.min(1.0, 1.5 - (avgDepth / CONFIG.MAX_DEPTH));
                ctx.beginPath();
                ctx.strokeStyle = this.activeType === 'dystopian' ? 
                    `rgba(${engine.palette.primary.r}, ${engine.palette.primary.g}, ${engine.palette.primary.b}, ${alpha * 0.4})` :
                    `rgba(${engine.palette.secondary.r}, ${engine.palette.secondary.g}, ${engine.palette.secondary.b}, ${alpha * 0.6})`;
                
                ctx.lineWidth = Math.max(1, 15 / avgDepth);

                ctx.moveTo(transformedMesh[0].x, transformedMesh[0].y);
                for (let i = 1; i < transformedMesh.length; i++) {
                    ctx.lineTo(transformedMesh[i].x, transformedMesh[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                if(this.activeType === 'utopian') {
                    ctx.fillStyle = `rgba(${engine.palette.primary.r}, ${engine.palette.primary.g}, ${engine.palette.primary.b}, ${alpha * 0.15})`;
                    ctx.fill();
                }
            }
        });
    }
}

class SpiralTunnel {
    constructor() {
        this.rings = [];
        for(let i=0; i<CONFIG.TUNNEL_RINGS; i++) {
            this.rings.push({
                zOffset: (i / CONFIG.TUNNEL_RINGS) * CONFIG.MAX_DEPTH,
                seed: Math.random() * 100
            });
        }
    }

    collectRenderables(renderList, w, h) {
        let time = engine.globalTime * 0.015;
        
        for (let i = 0; i < this.rings.length; i++) {
            let ring = this.rings[i];
            let worldZ = ((ring.zOffset - engine.cameraPos.z) % CONFIG.MAX_DEPTH);
            if (worldZ < 0) worldZ += CONFIG.MAX_DEPTH;

            if (worldZ <= CONFIG.Z_CLIP) continue;

            let spiralRadius = 4.5 + Math.sin(worldZ * 0.12 + time) * 1.5;
            let centerX = Math.sin(worldZ * 0.08 + time * 1.2) * 3.5;
            let centerY = Math.cos(worldZ * 0.06 + time * 0.8) * 3.5;

            if (engine.currentMode === STATES.WORMHOLE_CHAOS) {
                centerX += Math.sin(worldZ * 0.4 + time * 5) * 2.0;
                centerY += Math.cos(worldZ * 0.5 + time * 4) * 2.0;
                spiralRadius *= (1.0 + Math.sin(worldZ * 0.3) * 0.25);
            }

            let ringPoints = [];
            let isSkippedRing = (i % 3 === 0);

            for (let j = 0; j < CONFIG.RING_SEGMENTS; j++) {
                let angle = (j / CONFIG.RING_SEGMENTS) * Math.PI * 2;
                
                let localRad = spiralRadius;
                if (engine.currentMode === STATES.CYBERPUNK_DECAY && j % 4 === 0) {
                    localRad -= 0.6;
                }

                let vx = centerX + Math.cos(angle) * localRad;
                let vy = centerY + Math.sin(angle) * localRad;

                let p = RenderPipeline.transformAndProject(new Vector3D(vx, vy, worldZ), new Vector3D(0,0,0), engine.cameraRot, w, h);
                if (p) ringPoints.push(p);
            }

            if (ringPoints.length < 3) continue;

            renderList.push({
                depth: worldZ,
                render: (ctx) => {
                    let fade = Math.min(1.0, 1.0 - (worldZ / CONFIG.MAX_DEPTH));
                    if (worldZ < 6) fade *= (worldZ / 6);

                    ctx.beginPath();
                    ctx.lineWidth = Math.max(1, 35 / worldZ);
                    
                    if (engine.currentMode === STATES.WORMHOLE_CHAOS) {
                        ctx.strokeStyle = `rgba(${engine.palette.primary.r}, ${engine.palette.primary.g}, ${engine.palette.primary.b}, ${fade * 0.8})`;
                    } else if (engine.currentMode === STATES.UTOPIAN_LUSH) {
                        ctx.strokeStyle = `rgba(${engine.palette.secondary.r}, ${engine.palette.secondary.g}, ${engine.palette.secondary.b}, ${fade * 0.5})`;
                    } else {
                        ctx.strokeStyle = `rgba(${engine.palette.secondary.r}, ${engine.palette.secondary.g}, ${engine.palette.secondary.b}, ${fade * 0.35})`;
                    }

                    ctx.moveTo(ringPoints[0].x, ringPoints[0].y);
                    for (let p of ringPoints) ctx.lineTo(p.x, p.y);
                    ctx.lineTo(ringPoints[0].x, ringPoints[0].y);
                    ctx.stroke();

                    if (!isSkippedRing && worldZ < 25) {
                        ctx.fillStyle = `rgba(${engine.palette.primary.r}, ${engine.palette.primary.g}, ${engine.palette.primary.b}, ${fade * 0.04})`;
                        ctx.fill();
                    }
                }
            });
        }
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        for(let i=0; i<CONFIG.PARTICLE_COUNT; i++) {
            this.particles.push({
                pos: new Vector3D((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, Math.random() * CONFIG.MAX_DEPTH),
                speedMod: 0.5 + Math.random() * 0.5,
                seed: Math.random() * Math.PI,
                size: 1 + Math.random() * 3
            });
        }
    }

    update(zSpeed) {
        let mode = engine.currentMode;
        for (let p of this.particles) {
            if (mode === STATES.WORMHOLE_CHAOS) {
                p.pos.z -= zSpeed * 2.5 * p.speedMod;
                p.pos.x += Math.sin(p.pos.z * 0.2 + engine.globalTime * 0.05) * 0.1;
            } else if (mode === STATES.UTOPIAN_LUSH) {
                p.pos.z -= zSpeed * 0.7 * p.speedMod;
                p.pos.x += Math.cos(engine.globalTime * 0.01 + p.seed) * 0.02;
                p.pos.y += Math.sin(engine.globalTime * 0.01 + p.seed) * 0.02;
            } else {
                p.pos.z -= zSpeed * p.speedMod;
            }

            if (p.pos.z <= CONFIG.Z_CLIP) {
                p.pos.z = CONFIG.MAX_DEPTH;
                p.pos.x = (Math.random() - 0.5) * 18;
                p.pos.y = (Math.random() - 0.5) * 18;
            }
        }
    }

    collectRenderables(renderList, w, h) {
        for (let p of this.particles) {
            let projected = RenderPipeline.transformAndProject(p.pos, new Vector3D(0,0,0), engine.cameraRot, w, h);
            if (!projected) continue;

            renderList.push({
                depth: p.pos.z,
                render: (ctx) => {
                    let fade = Math.min(1.0, 1.0 - (p.pos.z / CONFIG.MAX_DEPTH));
                    let pSize = Math.max(1, (p.size * projected.size) * 0.02);
                    
                    if (engine.currentMode === STATES.CYBERPUNK_DECAY) {
                        ctx.fillStyle = p.speedMod > 0.8 ? 
                            `rgba(${engine.palette.primary.r}, ${engine.palette.primary.g}, ${engine.palette.primary.b}, ${fade})` : 
                            `rgba(255, 255, 255, ${fade * 0.6})`;
                    } else if (engine.currentMode === STATES.UTOPIAN_LUSH) {
                        ctx.fillStyle = `rgba(${engine.palette.primary.r}, ${Math.floor(engine.palette.primary.g * p.speedMod)}, ${engine.palette.secondary.b}, ${fade * 0.9})`;
                    } else {
                        ctx.fillStyle = `rgba(${engine.palette.secondary.r}, ${engine.palette.secondary.g}, ${engine.palette.secondary.b}, ${fade})`;
                    }

                    ctx.fillRect(projected.x - pSize/2, projected.y - pSize/2, pSize, pSize);
                }
            });
        }
    }
}

// --- MASTER GRAPHICS CORE ENGINE (SCREENSAVER READY) ---
class MasterGraphicsEngine {
    constructor() {
        this.canvas = document.getElementById("engineCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.starfield = new Starfield();
        this.tunnel = new SpiralTunnel();
        this.particles = new ParticleSystem();
        this.wreckagePieces = [];

        for(let i=0; i<12; i++) {
            let w = new FloatingWreckage();
            w.reset(5 + (i * 3));
            this.wreckagePieces.push(w);
        }

        this.resizeCanvas();
        window.addEventListener("resize", () => this.resizeCanvas());
        
        this.hudState = document.getElementById("hud-state");
        this.hudVelocity = document.getElementById("hud-velocity");
        this.hudCoords = document.getElementById("hud-coords");
        this.hudTimer = document.getElementById("hud-timer");

        // --- FIXED INTEGRATED SCREENSAVER INTERRUPTS ---
        this.initialMouseX = null;
        this.initialMouseY = null;
        this.mouseThreshold = 15; 

        window.addEventListener("mousemove", (e) => {
            if (this.initialMouseX === null || this.initialMouseY === null) {
                this.initialMouseX = e.clientX;
                this.initialMouseY = e.clientY;
                return;
            }
            let deltaX = Math.abs(e.clientX - this.initialMouseX);
            let deltaY = Math.abs(e.clientY - this.initialMouseY);
            
            if (deltaX > this.mouseThreshold || deltaY > this.mouseThreshold) {
                window.close(); 
            }
        });

        window.addEventListener("keydown", () => {
            window.close();
        });
        
        window.addEventListener("mousedown", () => {
            window.close();
        });
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    updatePhysics() {
        engine.update();
        
        let time = engine.globalTime;
        if (engine.currentMode === STATES.WORMHOLE_CHAOS) {
            engine.cameraRot.z = Math.sin(time * 0.02) * 0.6;
            engine.cameraRot.x = Math.sin(time * 0.01) * 0.15;
            engine.cameraRot.y = Math.cos(time * 0.015) * 0.15;
            if (Math.random() < 0.12) document.body.classList.add("glitching");
        } else if (engine.currentMode === STATES.CYBERPUNK_DECAY) {
            engine.cameraRot.z = time * 0.002;
            engine.cameraRot.x = Math.sin(time * 0.005) * 0.05;
            engine.cameraRot.y = 0;
            document.body.classList.remove("glitching");
        } else {
            engine.cameraRot.z *= 0.95;
            engine.cameraRot.x *= 0.95;
            engine.cameraRot.y *= 0.95;
            document.body.classList.remove("glitching");
        }

        this.starfield.update(engine.velocity);
        this.particles.update(engine.velocity);
        for(let w of this.wreckagePieces) w.update(engine.velocity);

        this.updateHUDDisplay();
    }

    updateHUDDisplay() {
        if (engine.globalTime % 6 !== 0) return; 
        this.hudState.textContent = engine.getStateString();
        this.hudVelocity.textContent = `${(engine.velocity * 4200).toFixed(2)} KM/S`;
        this.hudCoords.textContent = `X:${(Math.sin(engine.globalTime*0.01)*100).toFixed(0)} Y