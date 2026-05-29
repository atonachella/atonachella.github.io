const canvas = document.getElementById('virusCanvas');
const ctx = canvas.getContext('2d');

// Establish display size variables
let width = window.innerWidth;
let height = window.innerHeight;

canvas.width = width;
canvas.height = height;

// Handle window stretching or resizing dynamically
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    
    // Recalculate column layout if display changes
    columns = Math.floor(width / fontSize);
    drops.length = 0;
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }
});

// Binary strings, error codes, and hex data for the virus theme
const virusData = [
    "0", "1", "01", "SYSTEM_FAILURE", "ERR_0x004F", 
    "CRITICAL", "CORRUPT", "10", "LOAD_FAIL", "ACCESS_DENIED"
];

const fontSize = 14;
let columns = Math.floor(width / fontSize);
const drops = [];

// Initialize data streams at the top row
for (let x = 0; x < columns; x++) {
    drops[x] = 1;
}

// Main rendering engine
function renderVirusStream() {
    // Transparent black background trail creates the fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = 'bold ' + fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        // Pull random text elements from our virus array
        const text = virusData[Math.floor(Math.random() * virusData.length)];

        // Design: Predominantly Crimson Red streams with Stark White glitch highlights
        if (Math.random() > 0.98) {
            ctx.fillStyle = '#ffffff'; // White flash highlight
        } else {
            ctx.fillStyle = '#ff0000'; // Pure crimson data line
        }

        // Draw character to screen
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset the drop back to the top once it hits the edge
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

// Standard, stable frame timer loop (approx 30fps)
setInterval(renderVirusStream, 33);

// ==========================================
// NATIVE SCREEN SAVER DISMISS CONTROLS
// ==========================================
let safetyDelay = true;

// Allow the system to register mouse movement without an instant close glitch
setTimeout(() => {
    safetyDelay = false;
}, 1000);

function terminateScreensaver() {
    if (!safetyDelay) {
        window.close();
    }
}

// Track mouse activity and keyboard keys to cleanly quit
window.addEventListener('mousemove', terminateScreensaver);
window.addEventListener('keydown', terminateScreensaver);
window.addEventListener('click', terminateScreensaver);