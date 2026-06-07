const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

const vs = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;
const fs = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.y, u_res.x);
    float d = length(uv);
    // Liquid Sphere math
    float n = sin(d * 10.0 - u_time * 2.0) * 0.05;
    vec3 col = vec3(0.05, 0.15, 0.2) * (1.0 - smoothstep(0.2, 0.4 + n, d));
    col += vec3(0.1, 0.3, 0.5) * exp(-d * 3.0);
    gl_FragColor = vec4(col, 1.0);
}`;

// Boilerplate GL initialization (abbreviated for cleanliness)
function createShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s); return s;
}
const prog = gl.createProgram();
gl.attachShader(prog, createShader(gl, gl.VERTEX_SHADER, vs));
gl.attachShader(prog, createShader(gl, gl.FRAGMENT_SHADER, fs));
gl.linkProgram(prog); gl.useProgram(prog);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
const pLoc = gl.getAttribLocation(prog, "p");
gl.enableVertexAttribArray(pLoc); gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

function render(t) {
    gl.uniform1f(gl.getUniformLocation(prog, "u_time"), t * 0.001);
    gl.uniform2f(gl.getUniformLocation(prog, "u_res"), canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
}
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
render(0);