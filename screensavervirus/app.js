const canvas = document.getElementById('virusCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;

canvas.width = width;
canvas.height = height;

// Comprehensive data arrays to build out full layout complexity
const virusMatrixData = [
    "0", "1", "01", "10", "SYSTEM_FAILURE", "ERR_0x004F", "CRITICAL_ERROR", 
    "CORRUPT", "LOAD_FAIL", "ACCESS_DENIED", "TROJAN_INFECTED", "KILL_PROCESS",
    "0x002A8B", "WIPING_DRIVE...", "MALWARE_DETECTED", "ROOTKIT_ACTIVE",
    "666", "DANGER", "OVERRIDE", "BREACH", "01101001", "11001110", "FATAL"
];

const fontSize = 12;
let columns = Math.floor(width / fontSize);
const drops = [];

// Map the matrix streams row-by-row across monitor screen width
for (let x = 0; x < columns; x++) {
    drops[x] = Math.random() * -100; // Random staggered start heights
}

function runVirusEngine() {
    // Continuous dark wash coat creates the slow trailing digital data effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = 'bold ' + fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        // Grab values cleanly out of the data set
        const textStr = virusMatrixData[Math.floor(Math.random() * virusMatrixData.length)];

        // Core visual coloring logic
        if (Math.random() > 0.98) {
            ctx.fillStyle = '#ffffff'; // Stark white flashing data point
        } else if (Math.random() > 0.85) {
            ctx.fillStyle = '#8b0000'; // Dark crimson background data stream
        } else {
            ctx.fillStyle = '#ff0000'; // Hot binary red stream line
        }

        // Draw data row positions
        ctx.fillText(textStr, i * fontSize * 2.5, drops[i] * fontSize);

        // Reset positions smoothly once data flows off base screen
        if (drops[i] * fontSize > height && Math.random() > 0.98) {
            drops[i] = 0;
        }
        drops[i] += 0.85; // Rate of fall velocity
    }
}

// Track and update scale dimensions seamlessly if window limits change
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    columns = Math.floor(width / fontSize);
    drops.length = 0;
    for (let x = 0; x < columns; x++) {
        drops[x] = Math.random() * -100;
    }
});

// Run loop at a high performance constant frame clip
setInterval(runVirusEngine, 25);

// ==========================================
// NATIVE SCREEN SAVER DISMISS CONTROLS
// ==========================================
let startupGracePeriod = true;

// Prevent instant dismiss on startup caused by initial hardware click or jitter
setTimeout(() => {
    startupGracePeriod = false;
}, 1200);

function handleExitSignal() {
    if (!startupGracePeriod) {
        window.close();
    }
}

// Bind native UI activities to exit handlers
window.addEventListener('mousemove', handleExitSignal);
window.addEventListener('keydown', handleExitSignal);
window.addEventListener('click', handleExitSignal);