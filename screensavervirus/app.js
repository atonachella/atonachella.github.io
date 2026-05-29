const canvas = document.getElementById('virusCanvas');
const ctx = canvas.getContext('2d');

// Match canvas size to the monitor display
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Digital virus binary and hexadecimal characters
const virusChars = '01X_SYSTEM_FAILURE_ERR_0x004F_CRITICAL_CORRUPT_10'.split('');
const fontSize = 14;
let columns = canvas.width / fontSize;

const drops = [];
for (let x = 0; x < columns; x++) {
    drops[x] = 1;
}

function drawVirus() {
    // Translucent black fade layer
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold ' + fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const text = virusChars[Math.floor(Math.random() * virusChars.length)];

        // Core visual theme: Crimson Red streams with Stark White glitch highlights
        if (Math.random() > 0.98) {
            ctx.fillStyle = '#ffffff'; // White flash/glitch character
        } else {
            ctx.fillStyle = '#ff0000'; // Dark crimson virus data
        }

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset stream to top randomly after hitting bottom
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

// Render loop running smoothly
setInterval(drawVirus, 33);

// ==========================================
// NATIVE WINDOWS EXIT CONTROLS
// ==========================================
let systemBooting = true;

function closeScreensaver() {
    window.close();
}

// Intercept user inputs to close the program instantly when active
window.addEventListener('mousemove', () => {
    if (systemBooting) {
        systemBooting = false; // Prevents mouse jitter crash on launch
        return;
    }
    closeScreensaver();
});
window.addEventListener('keydown', closeScreensaver);
window.addEventListener('click', closeScreensaver);