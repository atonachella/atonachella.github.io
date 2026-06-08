/* ═══════════════════════════════════════════════════════════════════
   ABYSS PROTOCOL — portal.js
   Darker. Faster. Sinister. Something is in here with you.
   Three.js r128 — same structure as VOID TRANSIT, fully independent
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   0. GLOBAL STATE
────────────────────────────────────────────────────────────── */
const STATE = {
  phase:         'DESCENT',
  phaseTimer:    0,
  phaseDuration: 0,
  speed:         0.028,
  targetSpeed:   0.028,
  turbulence:    0.2,
  targetTurb:    0.2,
  time:          0,
  frameCount:    0,
  horrorLevel:   0,
  pursuitLevel:  0,
  entityVisible: false,
  sectorIndex:   0,
  depth:         0,
  pressure:      0,
  dilation:      1.0,
  lastMessage:   0,
};

const VOID_SECTORS = [
  'ABYSSAL-ZERO','RUIN-CORE-Ω','FLESH-GATE-7','NULL-SPINE',
  'SECTOR-CONDEMNED','DEAD-LIGHT-9','ENTITY-RIFT','HORROR-TRENCH',
  'SCREAM-LAYER-X','OBLIVION-6','BREACH-POINT','THE-BETWEEN',
];

/* ──────────────────────────────────────────────────────────────
   1. RENDERER
────────────────────────────────────────────────────────────── */
const canvas   = document.getElementById('portal-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x010002, 1);
renderer.toneMapping         = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.4;

const scene = new THREE.Scene();
scene.fog   = new THREE.FogExp2(0x010002, 0.028);

const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 600);
camera.position.set(0, 0, 0);

/* ──────────────────────────────────────────────────────────────
   2. UTILITIES
────────────────────────────────────────────────────────────── */
const lerp        = (a, b, t) => a + (b - a) * t;
const clamp       = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand        = (lo, hi) => lo + Math.random() * (hi - lo);
const randInt     = (lo, hi) => Math.floor(rand(lo, hi + 1));
const PI2         = Math.PI * 2;

/* ──────────────────────────────────────────────────────────────
   3. MAIN TUNNEL SHADER — Flesh/Bone/Blood aesthetic
────────────────────────────────────────────────────────────── */
const tunnelVert = `
  varying vec2 vUv;
  varying vec3 vPos;
  varying float vDepth;
  void main() {
    vUv   = uv;
    vPos  = position;
    vDepth = -position.z / 60.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`;

const tunnelFrag = `
  precision highp float;
  varying vec2  vUv;
  varying vec3  vPos;
  varying float vDepth;

  uniform float uTime;
  uniform float uSpeed;
  uniform float uTurb;
  uniform float uHorror;
  uniform float uPursuit;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;

  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  float fbm(vec2 p){
    float v=0.0,a=0.5;
    for(int i=0;i<6;i++){v+=a*noise(p);p*=2.05;a*=0.48;}
    return v;
  }

  // Vein/crack pattern
  float veins(vec2 uv, float t){
    float v = 0.0;
    for(int i=0; i<4; i++){
      float fi = float(i);
      vec2 shifted = uv * (2.0 + fi) + vec2(sin(t*0.1+fi), cos(t*0.13+fi*1.3));
      v += (1.0 - abs(noise(shifted)*2.0-1.0)) * (1.0/(fi+1.0));
    }
    return v * 0.5;
  }

  void main(){
    float t   = uTime * uSpeed * 0.5;
    float ang = atan(vPos.y, vPos.x);
    float r   = length(vPos.xy);

    // Spiral scroll
    vec2 suv = vec2(ang/6.2831853 + 0.5, vUv.y - t);

    // Faster inner rotation
    float swirl = ang * 0.5 + r * 8.0 - uTime * uSpeed * 2.5;

    // Vein/crack network on walls
    float veinPat = veins(suv * 5.0, uTime * 0.3);
    veinPat = pow(veinPat, 2.5);

    // FBM base texture — organic, wet look
    float n1 = fbm(suv * 4.0 + uTime * 0.08);
    float n2 = fbm(suv * 9.0 - uTime * 0.12 + n1);
    float n3 = fbm(suv * 18.0 + uTime * 0.06);

    // Rings — tighter, faster, more aggressive
    float ring  = abs(sin((vUv.y * 60.0 - uTime * uSpeed * 35.0) * 3.14159));
    float ringG = pow(ring, 18.0);
    float ringB = pow(ring, 5.0) * 0.3;

    // Spiral glow lines
    float spiralLine = pow(abs(sin(swirl * 4.0)), 20.0);

    // Rim
    float rimD = abs(r - 1.0);
    float rim  = 1.0 - smoothstep(0.0, 0.12, rimD);
    float oRim = 1.0 - smoothstep(0.0, 0.04, rimD);

    // Base color: blood-black, deep red
    vec3 col = mix(uColorA, uColorB, n1);
    col      = mix(col, uColorC, n2 * 0.6);

    // Vein glow — sickly green or deep red depending on horror
    vec3 veinColor = mix(vec3(0.5,0.0,0.0), vec3(0.1,0.8,0.0), uHorror * 0.3);
    col += veinColor * veinPat * 1.2;

    // Pursuit pulse — everything reddens and brightens when chased
    col = mix(col, vec3(0.9, 0.02, 0.02), uPursuit * (1.0 - n1) * 0.6);

    // High-frequency noise flicker — makes it feel alive and wet
    col *= (0.85 + n3 * 0.3);

    // Ring flash
    col += uColorA * ringB;
    col += vec3(0.9, 0.8, 0.8) * ringG * 0.7;

    // Spiral lines — bone white veins
    col += vec3(0.85,0.8,0.7) * spiralLine * 0.4;

    // Rim bleed
    col += uColorA * rim * 1.0;
    col += vec3(1.0,0.95,0.9) * oRim * 0.6;

    // Depth darkening
    float dFade = smoothstep(0.0,0.35,vUv.y) * smoothstep(1.0,0.65,vUv.y);
    col *= (0.3 + 0.7 * dFade);

    // Flicker — heartbeat of the abyss
    col *= (1.0 + sin(uTime * 11.0 + vPos.y * 7.0) * uTurb * 0.12);

    // Horror darkening — as horror climbs the void closes in
    col *= (1.0 - uHorror * 0.35);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function makeTunnel() {
  const geo = new THREE.CylinderGeometry(3.0, 3.0, 120, 80, 220, true);
  geo.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI * 0.5));
  const mat = new THREE.ShaderMaterial({
    vertexShader:   tunnelVert,
    fragmentShader: tunnelFrag,
    side:           THREE.BackSide,
    uniforms: {
      uTime:    { value: 0 },
      uSpeed:   { value: 1.8 },
      uTurb:    { value: 0.2 },
      uHorror:  { value: 0 },
      uPursuit: { value: 0 },
      uColorA:  { value: new THREE.Color(0x8b0000) },
      uColorB:  { value: new THREE.Color(0x1a0002) },
      uColorC:  { value: new THREE.Color(0x050000) },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = -60;
  scene.add(mesh);
  return { mesh, mat };
}
const tunnel = makeTunnel();

/* ──────────────────────────────────────────────────────────────
   4. SECONDARY TUNNEL — inner darker layer for depth
────────────────────────────────────────────────────────────── */
const innerTunnelFrag = `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vPos;
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3  uColor;

  float hash(vec2 p){ return fract(sin(dot(p,vec2(13.7,57.3)))*9301.0); }
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }

  void main(){
    float ang = atan(vPos.y, vPos.x);
    vec2 suv  = vec2(ang/6.2831853 + 0.5, vUv.y - uTime*uSpeed*0.7);
    float n   = noise(suv * 8.0 + uTime * 0.05);
    float ring= abs(sin((vUv.y*80.0 - uTime*uSpeed*50.0)*3.14159));
    float rg  = pow(ring, 30.0);
    float r   = length(vPos.xy);
    float rim = 1.0 - smoothstep(0.0,0.08, abs(r-1.0));

    vec3 col  = uColor * (n * 0.5 + rg * 0.8 + rim * 0.6);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function makeInnerTunnel() {
  const geo = new THREE.CylinderGeometry(1.4, 1.4, 120, 48, 120, true);
  geo.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI * 0.5));
  const mat = new THREE.ShaderMaterial({
    vertexShader:   tunnelVert,
    fragmentShader: innerTunnelFrag,
    side:           THREE.BackSide,
    uniforms: {
      uTime:  { value: 0 },
      uSpeed: { value: 2.2 },
      uColor: { value: new THREE.Color(0x330008) },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = -60;
  scene.add(mesh);
  return { mesh, mat };
}
const innerTunnel = makeInnerTunnel();

/* ──────────────────────────────────────────────────────────────
   5. PORTAL RINGS — aggressive, bone-white, bloodstained
────────────────────────────────────────────────────────────── */
const rings = [];

for (let i = 0; i < 35; i++) {
  const z    = -i * 3.8;
  // Alternate bone / blood / acid rings
  const type = i % 4;
  const col  = type === 0 ? new THREE.Color(0x8b0000) :
               type === 1 ? new THREE.Color(0xcc0011) :
               type === 2 ? new THREE.Color(0x1a0004) :
                            new THREE.Color(0x39ff14);
  const thick = type === 3 ? 0.025 : rand(0.03, 0.07);
  const geo  = new THREE.TorusGeometry(rand(1.6, 2.4), thick, 12, 100);
  const mat  = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = z;
  mesh.userData   = { baseRot: Math.random() * PI2, rotSpeed: rand(0.008, 0.04) * (Math.random()<0.5?1:-1), isAcid: type===3 };
  scene.add(mesh);
  rings.push(mesh);
}

/* ──────────────────────────────────────────────────────────────
   6. ENTITY SILHOUETTE — the thing following you
────────────────────────────────────────────────────────────── */
const entityVert = `
  varying vec2 vUv;
  void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
`;
const entityFrag = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uPulse;

  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }

  void main(){
    vec2 uv  = vUv - 0.5;
    float r  = length(uv);
    float a  = atan(uv.y, uv.x);

    // Amorphous silhouette — not quite round
    float silh = 0.28 + noise(vec2(a*3.0, uTime*0.2))*0.08 + sin(a*7.0+uTime)*0.02;
    float body = 1.0 - smoothstep(silh - 0.04, silh + 0.02, r);

    // Eyes — two bright points
    float eye1 = 1.0 - smoothstep(0.0, 0.04, length(uv - vec2(0.1, 0.06)));
    float eye2 = 1.0 - smoothstep(0.0, 0.04, length(uv - vec2(-0.1, 0.06)));

    // Aura / distortion halo
    float halo = (1.0 - smoothstep(silh, silh+0.15, r)) * (1.0 - body);
    halo *= (noise(vec2(a*5.0, uTime*0.5)) * 0.5 + 0.2);

    // Pulsing glow
    float pulse = 0.7 + 0.3*sin(uTime*uPulse);

    vec3 bodyCol = vec3(0.0,0.0,0.0) * body;
    vec3 eyeCol  = vec3(0.9,0.0,0.0) * (eye1+eye2) * 3.0 * pulse;
    vec3 haloCol = vec3(0.5,0.0,0.0) * halo * uIntensity;

    vec3 col = bodyCol + eyeCol + haloCol;
    float alpha = body * 0.95 + halo * 0.6 + (eye1+eye2) * uIntensity;

    gl_FragColor = vec4(col, alpha * uIntensity);
  }
`;

function makeEntity() {
  const geo = new THREE.PlaneGeometry(8, 8);
  const mat = new THREE.ShaderMaterial({
    vertexShader: entityVert, fragmentShader: entityFrag,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: {
      uTime:      { value: 0 },
      uIntensity: { value: 0 },
      uPulse:     { value: 3.0 },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 0, -45);
  scene.add(mesh);
  return { mesh, mat };
}
const entity = makeEntity();

/* ──────────────────────────────────────────────────────────────
   7. WORMHOLE / RIFT SHADER — tears in the tunnel
────────────────────────────────────────────────────────────── */
const riftFrag = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3  uColor;

  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
  }
  float fbm(vec2 p){
    float v=0.,a=0.5;
    for(int i=0;i<5;i++){v+=a*noise(p);p*=2.1;a*=0.48;}
    return v;
  }

  void main(){
    vec2 uv  = vUv - 0.5;
    float r  = length(uv);
    float a  = atan(uv.y, uv.x);

    // Jagged tear — not a clean circle
    float tear = fbm(vec2(a*2.0, uTime*0.3)) * 0.15;
    float rift = 1.0 - smoothstep(0.18+tear, 0.24+tear, r);

    // Inner void — absolute black
    float innerVoid = 1.0 - smoothstep(0.0, 0.16, r);

    // Crackling edge
    float edge = 1.0 - smoothstep(0.20+tear, 0.32+tear, r);
    edge *= (1.0 - rift);
    float edgeNoise = noise(vec2(a*8.0, uTime*2.0));
    edge *= edgeNoise * 2.5;

    // Outer corona
    float corona = (1.0 - smoothstep(0.3, 0.5, r)) * (r > 0.3 ? 1.0 : 0.0);
    corona *= fbm(vec2(a*4.0 + uTime*0.5, r*3.0));

    // Spiral pull
    float spiral = a + r * 15.0 - uTime * 6.0;
    float pull   = pow(abs(sin(spiral * 0.5)) * (1.0-r/0.5), 4.0) * 0.4;
    pull = clamp(pull, 0.0, 1.0) * (1.0-smoothstep(0.0,0.5,r));

    vec3 col = uColor * (edge * 3.0 + corona * 1.2 + pull * 2.0);
    col     += vec3(0.6, 0.0, 0.0) * edge * edgeNoise;
    float alpha = (rift - innerVoid) * 0.6 + edge * 0.9 + corona * 0.4 + pull * 0.5;
    alpha *= uIntensity;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

function makeRift(pos, color) {
  const geo = new THREE.PlaneGeometry(14, 14);
  const mat = new THREE.ShaderMaterial({
    vertexShader: entityVert, fragmentShader: riftFrag,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: {
      uTime:      { value: 0 },
      uIntensity: { value: 0 },
      uColor:     { value: new THREE.Color(color) },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  mesh.userData = { baseIntensity: 0, timeOffset: Math.random() * 10 };
  scene.add(mesh);
  return { mesh, mat };
}

const rifts = [
  makeRift(new THREE.Vector3(0, 0, -30), 0x8b0000),
  makeRift(new THREE.Vector3(0, 0, -55), 0xcc0011),
  makeRift(new THREE.Vector3(0, 0, -80), 0x39ff14),
];

/* ──────────────────────────────────────────────────────────────
   8. PARTICLE SYSTEMS
────────────────────────────────────────────────────────────── */

/* ── 8a. Blood/ash streaming particles ── */
function makeStreamParticles(count = 5000) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const sz  = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * PI2;
    const r   = rand(0.05, 2.85);
    pos[i*3]   = Math.cos(ang) * r;
    pos[i*3+1] = Math.sin(ang) * r;
    pos[i*3+2] = rand(-120, 2);
    // Mostly reds, occasional acid green
    const isAcid = Math.random() < 0.04;
    const c = isAcid
      ? new THREE.Color().setHSL(0.33, 1.0, rand(0.4, 0.6))
      : new THREE.Color().setHSL(rand(0.0, 0.06), rand(0.7, 1.0), rand(0.2, 0.55));
    col[i*3]   = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    sz[i] = rand(1.2, 4.5);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sz, 1));
  const mat = new THREE.PointsMaterial({ size:3, vertexColors:true, transparent:true, opacity:0.9, sizeAttenuation:true, blending:THREE.AdditiveBlending, depthWrite:false });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
}
const streamPts = makeStreamParticles();

/* ── 8b. Bone/ash debris field ── */
function makeAshParticles(count = 1200) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = rand(-6, 6);
    pos[i*3+1] = rand(-6, 6);
    pos[i*3+2] = rand(-110, 2);
    const g = rand(0.3, 0.6);
    col[i*3]   = g; col[i*3+1] = g * 0.9; col[i*3+2] = g * 0.85;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size:1.8, vertexColors:true, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
}
const ashPts = makeAshParticles();

/* ── 8c. Far void stars — extremely dim, mostly dead ── */
function makeVoidStars(count = 4000) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const th = Math.random() * PI2;
    const ph = Math.acos(2*Math.random()-1);
    const r  = rand(100, 450);
    pos[i*3]   = r*Math.sin(ph)*Math.cos(th);
    pos[i*3+1] = r*Math.sin(ph)*Math.sin(th);
    pos[i*3+2] = r*Math.cos(ph) - 200;
    const isDead = Math.random() < 0.6;
    const c = isDead
      ? new THREE.Color().setHSL(0, 0, rand(0.05, 0.18)) // dead grey-red
      : new THREE.Color().setHSL(rand(0.0, 0.08), 0.7, rand(0.4, 0.7));
    col[i*3]   = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size:1.0, vertexColors:true, transparent:true, opacity:0.35, blending:THREE.AdditiveBlending, depthWrite:false });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
}
const voidStars = makeVoidStars();

/* ── 8d. Shard/splinter particles (burst on rift events) ── */
const shardPool = [];

function spawnShards(count = 80, origin) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const vel = [];
  for (let i = 0; i < count; i++) {
    pos[i*3]   = origin.x + rand(-0.2, 0.2);
    pos[i*3+1] = origin.y + rand(-0.2, 0.2);
    pos[i*3+2] = origin.z;
    const isAcid = Math.random() < 0.2;
    if (isAcid) { col[i*3]=0.22; col[i*3+1]=1.0; col[i*3+2]=0.08; }
    else         { col[i*3]=rand(0.5,1.0); col[i*3+1]=0.02; col[i*3+2]=0.02; }
    vel.push(new THREE.Vector3(rand(-0.08,0.08), rand(-0.08,0.08), rand(0.04,0.18)));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size:2.5, vertexColors:true, transparent:true, opacity:1.0, blending:THREE.AdditiveBlending, depthWrite:false });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  shardPool.push({ pts, vel, life:1.0 });
  return pts;
}

/* ──────────────────────────────────────────────────────────────
   9. DEBRIS MESHES — more grotesque, asymmetric
────────────────────────────────────────────────────────────── */
const debrisMeshes = [];

function buildDebrisField() {
  // Sharp fractured geometry — tetrahedra, broken slabs
  const bloodMat = new THREE.MeshBasicMaterial({ color: 0x4a0000, wireframe: true, transparent: true, opacity: 0 });
  const boneMat  = new THREE.MeshBasicMaterial({ color: 0xc8b89a, wireframe: true, transparent: true, opacity: 0 });
  const acidMat  = new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true, transparent: true, opacity: 0 });

  for (let i = 0; i < 55; i++) {
    const t    = Math.floor(Math.random() * 4);
    let geo;
    if (t === 0)      geo = new THREE.TetrahedronGeometry(rand(0.15, 0.7), 0);
    else if (t === 1) geo = new THREE.OctahedronGeometry(rand(0.1, 0.5), 0);
    else if (t === 2) geo = new THREE.BoxGeometry(rand(0.05,0.3), rand(0.3,2.0), rand(0.05,0.15));
    else              geo = new THREE.ConeGeometry(rand(0.05,0.25), rand(0.4,1.8), randInt(3,5));

    const matType = Math.random();
    const mat = matType < 0.5 ? bloodMat.clone() :
                matType < 0.85 ? boneMat.clone()  : acidMat.clone();
    const mesh = new THREE.Mesh(geo, mat);

    const ang = Math.random() * PI2;
    const r   = rand(2.0, 5.5);
    mesh.position.set(Math.cos(ang)*r, Math.sin(ang)*r, rand(-100, -2));
    mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    mesh.userData = {
      spinX: rand(-0.015, 0.015), spinY: rand(-0.015, 0.015), spinZ: rand(-0.02, 0.02),
      driftY: rand(-0.003, 0.003), driftX: rand(-0.002, 0.002),
    };
    scene.add(mesh);
    debrisMeshes.push(mesh);
  }
}
buildDebrisField();

/* ──────────────────────────────────────────────────────────────
   10. TENDRILS — sinuous limb-like structures reaching through the tunnel
────────────────────────────────────────────────────────────── */
const tendrilVert = `
  attribute float aProgress;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3  uStart;
  uniform vec3  uEnd;
  varying float vProg;
  varying float vDist;

  void main(){
    vProg = aProgress;
    float wave = sin(aProgress * 12.0 - uTime * 4.0) * 0.18 * uIntensity;
    float wave2= cos(aProgress * 8.0  + uTime * 3.0) * 0.10 * uIntensity;
    vec3 pos   = mix(uStart, uEnd, aProgress);
    pos.x     += wave;
    pos.y     += wave2;
    vDist      = length(pos.xy);
    gl_Position= projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (1.0-aProgress) * 6.0 * uIntensity + 1.0;
  }
`;
const tendrilFrag = `
  precision mediump float;
  varying float vProg;
  varying float vDist;
  uniform float uIntensity;
  void main(){
    float fade = (1.0-vProg) * uIntensity;
    vec3 col = mix(vec3(0.6,0.0,0.0), vec3(0.05,0.0,0.0), vProg);
    gl_FragColor = vec4(col, fade * 0.8);
  }
`;

const tendrils = [];
function makeTendril(startAngle) {
  const count = 120;
  const prog  = new Float32Array(count);
  for (let i = 0; i < count; i++) prog[i] = i / (count - 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',  new THREE.BufferAttribute(new Float32Array(count*3), 3));
  geo.setAttribute('aProgress', new THREE.BufferAttribute(prog, 1));

  const r = rand(2.5, 3.0);
  const startX = Math.cos(startAngle) * r;
  const startY = Math.sin(startAngle) * r;
  const mat = new THREE.ShaderMaterial({
    vertexShader: tendrilVert, fragmentShader: tendrilFrag,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: {
      uTime:      { value: 0 },
      uIntensity: { value: 0 },
      uStart:     { value: new THREE.Vector3(startX, startY, 0) },
      uEnd:       { value: new THREE.Vector3(startX*0.2, startY*0.2, -28) },
    },
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  tendrils.push({ pts, mat, angle: startAngle });
  return pts;
}

for (let i = 0; i < 8; i++) {
  makeTendril((i / 8) * PI2);
}

/* ──────────────────────────────────────────────────────────────
   11. NEBULA / VOID CLOUDS — darker, poisonous
────────────────────────────────────────────────────────────── */
const cloudVert = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const cloudFrag = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime; uniform float uOp; uniform vec3 uCol;
  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
  float fbm(vec2 p){ float v=0.,a=0.5; for(int i=0;i<4;i++){v+=a*noise(p);p*=2.1;a*=0.5;} return v; }
  void main(){
    vec2 uv=vUv-0.5; float r=length(uv);
    float n =fbm(uv*2.5+uTime*0.02); float n2=fbm(uv*6.0-uTime*0.04+n);
    float cloud=n2*(1.-smoothstep(0.,0.55,r));
    vec3 col=uCol*cloud*1.6; col+=uCol*0.4*(1.-smoothstep(0.,0.22,r));
    gl_FragColor=vec4(col, cloud*uOp*0.65);
  }
`;

const voidClouds = [];
const cloudDefs = [
  { x: 12,  y: 8,   z: -180, col: 0x3d0000, sz: 70 },
  { x: -18, y: 4,   z: -220, col: 0x110004, sz: 55 },
  { x: 6,   y: -12, z: -160, col: 0x001a00, sz: 50 },
  { x: -8,  y: 18,  z: -260, col: 0x1a0000, sz: 80 },
  { x: 22,  y: -6,  z: -200, col: 0x000d1a, sz: 60 },
];

cloudDefs.forEach(d => {
  const geo = new THREE.PlaneGeometry(d.sz, d.sz);
  const mat = new THREE.ShaderMaterial({
    vertexShader: cloudVert, fragmentShader: cloudFrag,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime:{value:0}, uOp:{value:0.0}, uCol:{value:new THREE.Color(d.col)} },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(d.x, d.y, d.z);
  mesh.rotation.z = Math.random() * PI2;
  scene.add(mesh);
  voidClouds.push({ mesh, mat });
});

/* ──────────────────────────────────────────────────────────────
   12. LIGHTING — sick red wash, occasional acid flash
────────────────────────────────────────────────────────────── */
const ambient  = new THREE.AmbientLight(0x0a0002, 1.2);
scene.add(ambient);

const redLight = new THREE.PointLight(0x8b0000, 4.0, 20);
redLight.position.set(0, 0, -4);
scene.add(redLight);

const coreLight = new THREE.PointLight(0x330000, 2.5, 15);
coreLight.position.set(0, 0, -12);
scene.add(coreLight);

const acidLight = new THREE.PointLight(0x39ff14, 0.0, 18);
acidLight.position.set(0, 0, -8);
scene.add(acidLight);

const entityLight = new THREE.PointLight(0xff0000, 0.0, 25);
entityLight.position.set(0, 0, -45);
scene.add(entityLight);

/* ──────────────────────────────────────────────────────────────
   13. PHASE SYSTEM — sinister phases
────────────────────────────────────────────────────────────── */
const PHASES_CFG = {
  DESCENT: {
    speed:0.028, turb:0.18, horror:0.1, pursuit:0,
    tunnelA:new THREE.Color(0x8b0000), tunnelB:new THREE.Color(0x1a0002), tunnelC:new THREE.Color(0x050000),
    debrisOp:0.45, ashOp:0.3, starsOp:0.15, cloudOp:0.4, riftIntensity:0.08, entityOp:0,
    fogDensity:0.025, fogColor:0x010002, duration:[6,14],
  },
  ABYSS: {
    speed:0.018, turb:0.08, horror:0.45, pursuit:0.1,
    tunnelA:new THREE.Color(0x3d0000), tunnelB:new THREE.Color(0x0d0002), tunnelC:new THREE.Color(0x020000),
    debrisOp:0.6, ashOp:0.5, starsOp:0.08, cloudOp:0.8, riftIntensity:0.25, entityOp:0.15,
    fogDensity:0.04, fogColor:0x010001, duration:[8,18],
  },
  RUPTURE: {
    speed:0.055, turb:0.85, horror:0.8, pursuit:0.6,
    tunnelA:new THREE.Color(0xcc0011), tunnelB:new THREE.Color(0x550000), tunnelC:new THREE.Color(0x1a0002),
    debrisOp:0.95, ashOp:0.7, starsOp:0.05, cloudOp:0.3, riftIntensity:0.9, entityOp:0.4,
    fogDensity:0.035, fogColor:0x0d0001, duration:[4,8],
  },
  ENTITY: {
    speed:0.022, turb:0.3, horror:0.7, pursuit:0.95,
    tunnelA:new THREE.Color(0x6b0000), tunnelB:new THREE.Color(0x1a0004), tunnelC:new THREE.Color(0x080001),
    debrisOp:0.5, ashOp:0.4, starsOp:0.04, cloudOp:0.5, riftIntensity:0.5, entityOp:0.9,
    fogDensity:0.030, fogColor:0x060000, duration:[5,10],
  },
  DEAD_CALM: {
    speed:0.010, turb:0.03, horror:0.2, pursuit:0,
    tunnelA:new THREE.Color(0x2a0000), tunnelB:new THREE.Color(0x0a0001), tunnelC:new THREE.Color(0x020000),
    debrisOp:0.25, ashOp:0.6, starsOp:0.3, cloudOp:0.6, riftIntensity:0.05, entityOp:0,
    fogDensity:0.015, fogColor:0x010002, duration:[10,22],
  },
  ACID_FLOOD: {
    speed:0.038, turb:0.55, horror:0.5, pursuit:0.3,
    tunnelA:new THREE.Color(0x1a4400), tunnelB:new THREE.Color(0x003300), tunnelC:new THREE.Color(0x001100),
    debrisOp:0.7, ashOp:0.3, starsOp:0.1, cloudOp:0.4, riftIntensity:0.6, entityOp:0.2,
    fogDensity:0.032, fogColor:0x000d00, duration:[4,9],
  },
  VOID_COLLAPSE: {
    speed:0.065, turb:1.0, horror:1.0, pursuit:0.85,
    tunnelA:new THREE.Color(0xff0022), tunnelB:new THREE.Color(0x660000), tunnelC:new THREE.Color(0x220000),
    debrisOp:1.0, ashOp:1.0, starsOp:0.02, cloudOp:0.2, riftIntensity:1.0, entityOp:0.7,
    fogDensity:0.045, fogColor:0x0d0000, duration:[3,6],
  },
};

let curCfg = { ...PHASES_CFG.DESCENT };
let tgtCfg = { ...PHASES_CFG.DESCENT };

// Copy color objects so they don't share references
Object.keys(PHASES_CFG).forEach(k => {
  PHASES_CFG[k].tunnelA = PHASES_CFG[k].tunnelA.clone();
  PHASES_CFG[k].tunnelB = PHASES_CFG[k].tunnelB.clone();
  PHASES_CFG[k].tunnelC = PHASES_CFG[k].tunnelC.clone();
});
curCfg.tunnelA = PHASES_CFG.DESCENT.tunnelA.clone();
curCfg.tunnelB = PHASES_CFG.DESCENT.tunnelB.clone();
curCfg.tunnelC = PHASES_CFG.DESCENT.tunnelC.clone();

function lerpcfg(cur, tgt, t) {
  ['speed','turb','horror','pursuit','debrisOp','ashOp','starsOp','cloudOp','riftIntensity','entityOp','fogDensity'].forEach(k => {
    cur[k] = lerp(cur[k], tgt[k], t);
  });
  cur.tunnelA.lerp(tgt.tunnelA, t*2);
  cur.tunnelB.lerp(tgt.tunnelB, t*2);
  cur.tunnelC.lerp(tgt.tunnelC, t*2);
  scene.fog.color.lerp(new THREE.Color(tgt.fogColor), t);
}

function triggerPhase() {
  const keys = Object.keys(PHASES_CFG);
  let next   = STATE.phase;
  while (next === STATE.phase) next = keys[Math.floor(Math.random() * keys.length)];
  STATE.phase        = next;
  tgtCfg             = { ...PHASES_CFG[next] };
  tgtCfg.tunnelA     = PHASES_CFG[next].tunnelA.clone();
  tgtCfg.tunnelB     = PHASES_CFG[next].tunnelB.clone();
  tgtCfg.tunnelC     = PHASES_CFG[next].tunnelC.clone();
  STATE.phaseDuration = rand(...PHASES_CFG[next].duration);
  STATE.phaseTimer    = 0;
  updateHUD(next);
  flashEvent(next);
  showMessage(next);
  applyBodyClass(next);

  // Rift burst event
  if (next === 'RUPTURE' || next === 'VOID_COLLAPSE' || next === 'ACID_FLOOD') {
    spawnShards(100, new THREE.Vector3(rand(-1,1), rand(-1,1), -20));
  }
}

/* ──────────────────────────────────────────────────────────────
   14. HUD LOGIC
────────────────────────────────────────────────────────────── */
const hudThreat    = document.getElementById('hud-threat');
const hudDepth     = document.getElementById('hud-depth');
const hudIntegrity = document.getElementById('hud-integrity');
const hudEntity    = document.getElementById('hud-entity');
const hudVector    = document.getElementById('hud-vector');
const hudSignal    = document.getElementById('hud-signal');
const hudDilation  = document.getElementById('hud-dilation');
const hudPressure  = document.getElementById('hud-pressure');
const hudFlash     = document.getElementById('event-flash');
const reticleLbl   = document.getElementById('reticle-label');
const msgCards     = document.getElementById('message-cards');

const SIGNALS = {
  DESCENT:      ['CORRIDOR HOLDING', 'GOING DEEPER', 'SIGNAL NOMINAL'],
  ABYSS:        ['...DO YOU SEE IT', 'SIGNAL DEGRADED', 'SOMETHING MOVED', 'NOT ALONE'],
  RUPTURE:      ['⚠ BREACH ⚠', 'HULL INTEGRITY FAILING', 'GET DEEPER NOW'],
  ENTITY:       ['IT SEES YOU', 'DO NOT STOP', 'EYES IN THE DARK', '...IT FOLLOWS'],
  DEAD_CALM:    ['ALL QUIET', 'TOO QUIET', 'LISTENING...', 'HEARTBEAT DETECTED'],
  ACID_FLOOD:   ['CONTAINMENT LOSS', 'TOXINS RISING', 'CAUSTIC IMMERSION'],
  VOID_COLLAPSE:['☠ TERMINAL ☠', 'SYSTEM CRITICAL', 'ABANDON ALL — '],
};

const ENTITIES = {
  DESCENT:'UNCLASSIFIED', ABYSS:'CLASS-IV SHADOW', RUPTURE:'CLASS-VII RUPTURE',
  ENTITY:'APEX PREDATOR', DEAD_CALM:'DORMANT', ACID_FLOOD:'CORRUPTOR',
  VOID_COLLAPSE:'OMEGA THREAT',
};

const VECTORS = {
  DESCENT:'DESCENDING', ABYSS:'PLUMMETING', RUPTURE:'UNCONTROLLED',
  ENTITY:'BEING PURSUED', DEAD_CALM:'ADRIFT', ACID_FLOOD:'DISSOLVING',
  VOID_COLLAPSE:'COLLAPSING',
};

const THREATS = {
  DESCENT:'ELEVATED', ABYSS:'HIGH', RUPTURE:'CRITICAL',
  ENTITY:'EXTREME', DEAD_CALM:'LOW', ACID_FLOOD:'SEVERE',
  VOID_COLLAPSE:'TERMINAL',
};

const MSGS = {
  ABYSS:        ['Something stirs in the darkness below.','The walls breathe.','It was watching long before you arrived.'],
  RUPTURE:      ['The fabric of this place is tearing.','Run.','There is no way back now.'],
  ENTITY:       ['It has your scent now.','Do not look behind you.','Every exit is a mouth.'],
  DEAD_CALM:    ['The silence here has weight.','Something died here a long time ago. Recently, again.','Hold still.'],
  ACID_FLOOD:   ['The air turns green. Lungs burn.','They poisoned the corridor.','Corrosion: total.'],
  VOID_COLLAPSE:['THIS IS THE END OF THE PASSAGE.','Nothing returns from here.','⬛'],
};

function updateHUD(phase) {
  hudThreat.textContent  = THREATS[phase]   || 'UNKNOWN';
  hudEntity.textContent  = ENTITIES[phase]  || 'UNKNOWN';
  hudVector.textContent  = VECTORS[phase]   || 'UNKNOWN';
  const sigs = SIGNALS[phase] || SIGNALS.DESCENT;
  hudSignal.textContent  = sigs[Math.floor(Math.random()*sigs.length)];
  reticleLbl.textContent = phase === 'ENTITY' ? 'LOCKED' : phase === 'DEAD_CALM' ? 'PASSIVE' : 'ACQUIRING';
}

function updateHUDContinuous(dt) {
  STATE.depth    += STATE.speed * 80 * dt;
  STATE.pressure  = Math.min(999.99, STATE.depth * 0.008);
  STATE.dilation  = 1.0 + curCfg.horror * 0.8 + curCfg.pursuit * 1.2;
  hudDepth.textContent   = STATE.depth.toFixed(1) + ' km';
  hudDilation.textContent = STATE.dilation.toFixed(3) + '×';
  hudPressure.textContent = STATE.pressure.toFixed(2) + ' atm';
  const integ = clamp(1 - curCfg.horror * 0.7 - curCfg.turb * 0.3, 0, 1);
  hudIntegrity.style.width = (integ * 100) + '%';
  hudIntegrity.style.background = integ > 0.5
    ? 'linear-gradient(90deg,#8b0000,#cc0011)'
    : integ > 0.2
    ? 'linear-gradient(90deg,#cc5500,#ff0000)'
    : 'linear-gradient(90deg,#39ff14,#ffff00)'; // critical: goes acid-green
  hudIntegrity.classList.toggle('critical', integ < 0.2);
}

function flashEvent(phase) {
  const cls = (phase === 'RUPTURE'||phase === 'VOID_COLLAPSE') ? 'flash-blood' :
              (phase === 'ACID_FLOOD')                          ? 'flash-acid'  : 'flash-blood';
  hudFlash.className = `event-flash ${cls} active`;
  setTimeout(()=>hudFlash.classList.remove('active'), 200);
  // Double-flash on collapse
  if (phase === 'VOID_COLLAPSE') {
    setTimeout(()=>{hudFlash.classList.add('active');},250);
    setTimeout(()=>{hudFlash.classList.remove('active');},400);
  }
}

function showMessage(phase) {
  const msgs = MSGS[phase];
  if (!msgs) return;
  const now  = Date.now();
  if (now - STATE.lastMessage < 3500) return;
  STATE.lastMessage = now;
  msgCards.innerHTML = '';
  const txt  = msgs[Math.floor(Math.random()*msgs.length)];
  const card = document.createElement('div');
  const cls  = (phase==='ENTITY'||phase==='RUPTURE'||phase==='VOID_COLLAPSE') ? 'sinister' :
               (phase==='ACID_FLOOD') ? 'acid-msg' : 'void-msg';
  card.className = `msg-card ${cls}`;
  card.textContent = txt;
  msgCards.appendChild(card);
  requestAnimationFrame(()=>card.classList.add('visible'));
  setTimeout(()=>{card.classList.remove('visible');setTimeout(()=>card.remove(),600);}, 4000);
}

function applyBodyClass(phase) {
  document.body.classList.remove('phase-abyss','phase-rupture','phase-entity');
  if (phase==='ABYSS'||phase==='DEAD_CALM')    document.body.classList.add('phase-abyss');
  if (phase==='RUPTURE'||phase==='VOID_COLLAPSE') document.body.classList.add('phase-rupture');
  if (phase==='ENTITY')                         document.body.classList.add('phase-entity');
}

/* Boot error ticker */
const bootErrors = [
  '> CONTAINMENT_STATUS: FAILED','> ENTITY_LOCK: NULL','> DEPTH_SENSOR: OVERFLOW',
  '> HULL_INTEGRITY: 12%','> ESCAPE_ROUTE: NOT FOUND','> WARNING: DO NOT PROCEED',
];
let errorIdx = 0;
const errEl  = document.getElementById('boot-errors');
function tickBootError() {
  if (!errEl || errorIdx >= bootErrors.length) return;
  errEl.textContent += bootErrors[errorIdx++] + '\n';
  if (errorIdx < bootErrors.length) setTimeout(tickBootError, 280);
}
setTimeout(tickBootError, 400);

/* ──────────────────────────────────────────────────────────────
   15. CURSOR
────────────────────────────────────────────────────────────── */
document.addEventListener('mousemove', e => {
  document.documentElement.style.setProperty('--cursor-x', e.clientX + 'px');
  document.documentElement.style.setProperty('--cursor-y', e.clientY + 'px');
});

/* ──────────────────────────────────────────────────────────────
   16. CAMERA MOTION — more erratic, jolting
────────────────────────────────────────────────────────────── */
const cam = { x:0, y:0, rX:0, rY:0, rZ:0, tx:0, ty:0, trX:0, trY:0, trZ:0 };

function updateCamera(dt) {
  const t    = STATE.time;
  const turb = curCfg.turb;
  const purs = curCfg.pursuit;

  cam.tx = Math.sin(t*0.09)*0.25 + Math.sin(t*0.17)*0.1;
  cam.ty = Math.cos(t*0.11)*0.2  + Math.cos(t*0.19)*0.08;

  // Pursuit shaking — gets worse as entity closes in
  if (purs > 0.2) {
    cam.tx += (Math.random()-0.5) * purs * 0.4;
    cam.ty += (Math.random()-0.5) * purs * 0.4;
  }

  // Rupture full shake
  if (turb > 0.6) {
    cam.tx += (Math.random()-0.5) * turb * 0.7;
    cam.ty += (Math.random()-0.5) * turb * 0.7;
  }

  cam.trZ = Math.sin(t*0.07)*0.06 + (purs > 0.5 ? Math.sin(t*3.0)*0.08 : 0);
  cam.trX = Math.sin(t*0.13)*0.025;
  cam.trY = Math.cos(t*0.10)*0.025;

  const f = turb > 0.5 ? 0.2 : purs > 0.5 ? 0.14 : 0.045;
  cam.x  = lerp(cam.x,  cam.tx,  f);
  cam.y  = lerp(cam.y,  cam.ty,  f);
  cam.rX = lerp(cam.rX, cam.trX, 0.04);
  cam.rY = lerp(cam.rY, cam.trY, 0.04);
  cam.rZ = lerp(cam.rZ, cam.trZ, 0.06);

  camera.position.set(cam.x, cam.y, 0);
  camera.rotation.set(cam.rX, cam.rY, cam.rZ);
}

/* ──────────────────────────────────────────────────────────────
   17. RESIZE
────────────────────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ──────────────────────────────────────────────────────────────
   18. MAIN LOOP
────────────────────────────────────────────────────────────── */
let lastT = 0;

function animate(ts) {
  requestAnimationFrame(animate);
  const dt    = Math.min((ts - lastT) / 1000, 0.05);
  lastT       = ts;
  STATE.time += dt;
  STATE.frameCount++;
  STATE.phaseTimer += dt;

  // Phase change
  if (STATE.phaseTimer >= STATE.phaseDuration) triggerPhase();

  // Config lerp
  lerpcfg(curCfg, tgtCfg, 0.007 * 60 * dt);
  STATE.speed     = lerp(STATE.speed,    curCfg.speed, 0.04);
  STATE.turbulence= lerp(STATE.turbulence,curCfg.turb, 0.04);
  scene.fog.density = lerp(scene.fog.density, tgtCfg.fogDensity, 0.02);

  const t = STATE.time;
  const spd = STATE.speed;

  // ── Tunnel ──
  tunnel.mat.uniforms.uTime.value    = t;
  tunnel.mat.uniforms.uSpeed.value   = spd * 55;
  tunnel.mat.uniforms.uTurb.value    = curCfg.turb;
  tunnel.mat.uniforms.uHorror.value  = curCfg.horror;
  tunnel.mat.uniforms.uPursuit.value = curCfg.pursuit;
  tunnel.mat.uniforms.uColorA.value.copy(curCfg.tunnelA);
  tunnel.mat.uniforms.uColorB.value.copy(curCfg.tunnelB);
  tunnel.mat.uniforms.uColorC.value.copy(curCfg.tunnelC);
  tunnel.mesh.position.z = -60 + ((t * spd * 8) % 3.8);

  // ── Inner tunnel ──
  innerTunnel.mat.uniforms.uTime.value  = t;
  innerTunnel.mat.uniforms.uSpeed.value = spd * 70;
  innerTunnel.mat.uniforms.uColor.value.lerp(
    curCfg.tunnelA.clone().multiplyScalar(0.4), 0.02
  );
  innerTunnel.mesh.position.z = tunnel.mesh.position.z;

  // ── Rings ──
  rings.forEach((ring, i) => {
    ring.position.z += spd * 65 * dt;
    if (ring.position.z > 5) ring.position.z -= 35 * rings.length / 35;
    ring.rotation.z += ring.userData.rotSpeed * dt * 60;
    ring.rotation.x  = Math.sin(t*0.3 + i*0.4) * curCfg.turb * 0.3;
    // Warp squeeze on rupture
    if (curCfg.turb > 0.5) {
      const sq = 1 + Math.sin(t*8 + i)*0.12;
      ring.scale.set(sq, 1/sq, 1);
    } else {
      ring.scale.set(1,1,1);
    }
    const acid = ring.userData.isAcid;
    const tgtCol = acid
      ? new THREE.Color(0x39ff14)
      : new THREE.Color().setHSL(lerp(0, 0.06, curCfg.horror), 0.9, lerp(0.1, 0.4, curCfg.pursuit));
    ring.material.color.lerp(tgtCol, 0.02);
    const dOp = clamp(1 - Math.abs(ring.position.z) / 120, 0, 1);
    ring.material.opacity = dOp * (acid ? 0.6 : 0.7 + curCfg.horror*0.3);
  });

  // ── Stream particles ──
  const sPos = streamPts.geometry.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    sPos.array[i*3+2] += spd * 70 * dt;
    if (sPos.array[i*3+2] > 3) {
      const a = Math.random()*PI2, r = rand(0.05,2.85);
      sPos.array[i*3]   = Math.cos(a)*r;
      sPos.array[i*3+1] = Math.sin(a)*r;
      sPos.array[i*3+2] = -120;
    }
    if (curCfg.turb > 0.2 && Math.random() < 0.015) {
      sPos.array[i*3]   += (Math.random()-0.5)*curCfg.turb*0.1;
      sPos.array[i*3+1] += (Math.random()-0.5)*curCfg.turb*0.1;
    }
  }
  sPos.needsUpdate = true;
  streamPts.material.opacity = 0.7 + curCfg.horror*0.2;

  // ── Ash ──
  const aPos = ashPts.geometry.attributes.position;
  for (let i = 0; i < aPos.count; i++) {
    aPos.array[i*3+2] += (spd * 55 + rand(0,0.01)) * dt;
    if (aPos.array[i*3+2] > 3) {
      aPos.array[i*3]   = rand(-6,6);
      aPos.array[i*3+1] = rand(-6,6);
      aPos.array[i*3+2] = -110;
    }
  }
  aPos.needsUpdate = true;
  ashPts.material.opacity = lerp(ashPts.material.opacity, curCfg.ashOp, 0.03);

  // ── Void stars ──
  voidStars.rotation.y = t * 0.001;
  voidStars.material.opacity = lerp(voidStars.material.opacity, curCfg.starsOp, 0.02);

  // ── Debris meshes ──
  debrisMeshes.forEach(mesh => {
    mesh.material.opacity = lerp(mesh.material.opacity, curCfg.debrisOp * 0.75, 0.04);
    mesh.rotation.x += mesh.userData.spinX * dt * 60;
    mesh.rotation.y += mesh.userData.spinY * dt * 60;
    mesh.rotation.z += mesh.userData.spinZ * dt * 60;
    mesh.position.z  += spd * 55 * dt;
    mesh.position.y  += mesh.userData.driftY;
    mesh.position.x  += mesh.userData.driftX;
    if (mesh.position.z > 6) mesh.position.z -= 106;
  });

  // ── Rifts ──
  rifts.forEach((rift, i) => {
    rift.mat.uniforms.uTime.value = t + rift.mesh.userData.timeOffset;
    const baseZ = [-30, -55, -80][i];
    rift.mesh.position.z += spd * 40 * dt;
    if (rift.mesh.position.z > 5) rift.mesh.position.z = baseZ;
    const tgtI = curCfg.riftIntensity * (0.7 + Math.sin(t*0.5+i)*0.3);
    rift.mat.uniforms.uIntensity.value = lerp(rift.mat.uniforms.uIntensity.value, tgtI, 0.04);
    rift.mesh.rotation.z += 0.003 * dt * 60;
  });

  // ── Entity ──
  entity.mat.uniforms.uTime.value = t;
  entity.mat.uniforms.uIntensity.value = lerp(
    entity.mat.uniforms.uIntensity.value, curCfg.entityOp, 0.03
  );
  // Entity drifts menacingly
  entity.mesh.position.x = Math.sin(t*0.25)*0.5 * curCfg.pursuit;
  entity.mesh.position.y = Math.cos(t*0.2)*0.4  * curCfg.pursuit;
  // Slowly approaches during ENTITY phase
  if (curCfg.pursuit > 0.7) {
    entity.mesh.position.z = lerp(entity.mesh.position.z, -30, 0.002);
  } else {
    entity.mesh.position.z = lerp(entity.mesh.position.z, -45, 0.002);
  }

  // ── Tendrils ──
  tendrils.forEach(({pts, mat}, i) => {
    mat.uniforms.uTime.value = t;
    const tgtI = curCfg.entityOp * 0.6 + curCfg.horror * 0.25;
    mat.uniforms.uIntensity.value = lerp(mat.uniforms.uIntensity.value, tgtI, 0.03);
  });

  // ── Void clouds ──
  voidClouds.forEach(({mesh, mat}) => {
    mat.uniforms.uTime.value = t;
    mat.uniforms.uOp.value   = lerp(mat.uniforms.uOp.value, curCfg.cloudOp, 0.02);
    mesh.position.z += spd * 18 * dt;
    mesh.rotation.z += 0.0001 * dt * 60;
    if (mesh.position.z > 10) mesh.position.z -= 280;
  });

  // ── Shards ──
  for (let i = shardPool.length - 1; i >= 0; i--) {
    const s = shardPool[i];
    s.life -= dt * 1.4;
    if (s.life <= 0) { scene.remove(s.pts); shardPool.splice(i,1); continue; }
    const pos = s.pts.geometry.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      pos.array[j*3]   += s.vel[j].x * dt * 60;
      pos.array[j*3+1] += s.vel[j].y * dt * 60;
      pos.array[j*3+2] += s.vel[j].z * dt * 60;
      s.vel[j].z += 0.002; // drag / continue forward
    }
    pos.needsUpdate = true;
    s.pts.material.opacity = s.life * 0.9;
  }

  // ── Lights ──
  redLight.intensity  = 3.5 + Math.sin(t*4.7)*0.8 + curCfg.horror*2.5;
  coreLight.intensity = 2.0 + curCfg.pursuit*1.5;
  acidLight.intensity = lerp(acidLight.intensity, curCfg.horror*1.2 + (STATE.phase==='ACID_FLOOD'?3.0:0), 0.04);
  entityLight.intensity = lerp(entityLight.intensity, curCfg.entityOp*3.5, 0.04);
  entityLight.position.z = entity.mesh.position.z;

  // Flicker in rupture
  if (curCfg.turb > 0.6 && Math.random() < 0.08) {
    redLight.intensity  += (Math.random()-0.5)*5;
    coreLight.intensity += (Math.random()-0.5)*3;
  }

  // ── Camera ──
  updateCamera(dt);

  // ── HUD continuous ──
  if (STATE.frameCount % 3 === 0) updateHUDContinuous(dt);

  renderer.render(scene, camera);
}

/* ──────────────────────────────────────────────────────────────
   19. INIT
────────────────────────────────────────────────────────────── */
function init() {
  STATE.phase        = 'DESCENT';
  STATE.phaseDuration = rand(8, 14);
  updateHUD('DESCENT');

  const loader = document.getElementById('loader');
  const hud    = document.getElementById('hud');

  lastT = performance.now();
  animate(lastT);

  setTimeout(() => {
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.style.display = 'none';
      hud.classList.remove('hud-hidden');
      hud.classList.add('hud-visible');
    }, 700);
  }, 2800);
}
init();

/* ──────────────────────────────────────────────────────────────
   20. KEYBOARD SHORTCUTS
────────────────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'f')  triggerPhase();
  if (k === ' ')  { const h=document.getElementById('hud'); h.classList.toggle('hud-hidden'); h.classList.toggle('hud-visible'); }
  if (k === 'r')  { STATE.phase='RUPTURE';    tgtCfg={...PHASES_CFG.RUPTURE};    tgtCfg.tunnelA=PHASES_CFG.RUPTURE.tunnelA.clone();    tgtCfg.tunnelB=PHASES_CFG.RUPTURE.tunnelB.clone();    tgtCfg.tunnelC=PHASES_CFG.RUPTURE.tunnelC.clone();    STATE.phaseDuration=6; STATE.phaseTimer=0; updateHUD('RUPTURE');    flashEvent('RUPTURE');    applyBodyClass('RUPTURE');    spawnShards(120,new THREE.Vector3(0,0,-20)); }
  if (k === 'e')  { STATE.phase='ENTITY';     tgtCfg={...PHASES_CFG.ENTITY};     tgtCfg.tunnelA=PHASES_CFG.ENTITY.tunnelA.clone();     tgtCfg.tunnelB=PHASES_CFG.ENTITY.tunnelB.clone();     tgtCfg.tunnelC=PHASES_CFG.ENTITY.tunnelC.clone();     STATE.phaseDuration=8; STATE.phaseTimer=0; updateHUD('ENTITY');     flashEvent('ENTITY');     applyBodyClass('ENTITY'); }
  if (k === 'v')  { STATE.phase='VOID_COLLAPSE';tgtCfg={...PHASES_CFG.VOID_COLLAPSE};tgtCfg.tunnelA=PHASES_CFG.VOID_COLLAPSE.tunnelA.clone();tgtCfg.tunnelB=PHASES_CFG.VOID_COLLAPSE.tunnelB.clone();tgtCfg.tunnelC=PHASES_CFG.VOID_COLLAPSE.tunnelC.clone();STATE.phaseDuration=5; STATE.phaseTimer=0; updateHUD('VOID_COLLAPSE'); flashEvent('VOID_COLLAPSE'); applyBodyClass('VOID_COLLAPSE'); spawnShards(150,new THREE.Vector3(0,0,-15)); }
  if (k === 'a')  { STATE.phase='ACID_FLOOD'; tgtCfg={...PHASES_CFG.ACID_FLOOD}; tgtCfg.tunnelA=PHASES_CFG.ACID_FLOOD.tunnelA.clone(); tgtCfg.tunnelB=PHASES_CFG.ACID_FLOOD.tunnelB.clone(); tgtCfg.tunnelC=PHASES_CFG.ACID_FLOOD.tunnelC.clone(); STATE.phaseDuration=7; STATE.phaseTimer=0; updateHUD('ACID_FLOOD');  flashEvent('ACID_FLOOD');  applyBodyClass('ACID_FLOOD'); }
});

document.addEventListener('click', () => triggerPhase());