import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

const canvas = document.getElementById('liquid-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const fragmentShader = `
uniform float u_time;
uniform vec2 u_res;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
    // Create liquid motion with layered sine waves
    float d = length(uv) - 0.25;
    vec3 col = vec3(0.01, 0.02, 0.05); // Deep ambient dark
    
    // The "Fluid" Sphere
    float s = sin(uv.x * 8.0 + u_time) * 0.02;
    if(d + s < 0.0) {
        col = vec3(0.1, 0.4, 0.8) * (1.0 - length(uv) * 2.0);
        col += 0.2 * vec3(0.5, 0.8, 1.0); // Refraction highlight
    }
    gl_FragColor = vec4(col, 1.0);
}`;

const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
    uniforms: { u_time: { value: 0 }, u_res: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) } },
    fragmentShader
});
scene.add(new THREE.Mesh(geometry, material));

function animate(t) {
    material.uniforms.u_time.value = t * 0.002;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.u_res.value.set(window.innerWidth, window.innerHeight);
});
renderer.setSize(window.innerWidth, window.innerHeight);
animate(0);