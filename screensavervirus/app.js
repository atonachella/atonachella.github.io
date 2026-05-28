// Configuration & Target Elements
const logDump = document.getElementById('log-dump');
const threatOverlay = document.getElementById('threat-overlay');
const canvas = document.getElementById('matrix-rain');
const ctx = canvas.getContext('2d');

// Establish initial canvas boundaries based on container size
canvas.width = canvas.parentElement.offsetWidth;
canvas.height = canvas.parentElement.offsetHeight;

// Cyber Threat Diagnostic Log Library
const pseudoCodeLines = [
    "SUDO EXT_KILL_SIG --FORCE",
    "Targeting block registry allocations...",
    "Wiping volume shadow copies... SUCCESS.",
    "Bypassing hardware access tokens...",
    "Extracting localized cookies & active keychain databases...",
    "Syncing master manifest to secure offsite repository...",
    "Injecting rootkit layer into NVRAM storage...",
    "CRITICAL WARNING: Motherboard temperature spiking...",
    "Corrupting boot sector sectors 0 through 1024...",
    "Disabling local administrative interrupt mechanisms...",
    "Broadcasting target signature metadata globally...",
    "Hooking into local cloud syncing daemons...",
    "Harvesting localized credit_card_vault.db tokens...",
    "Initializing payload distribution array..."
];

let lineCount = 0;
const maxIntroLines = 90; // Adjust how long the scrolling chaos lasts

// Phase 1: Rapid Fire System Logs
function runTerminalIntro() {
    const logInterval = setInterval(() => {
        if (lineCount < maxIntroLines) {
            const randomLine = pseudoCodeLines[Math.floor(Math.random() * pseudoCodeLines.length)];
            const timestamp = new Date().toISOString().slice(11, 19);
            const row = document.createElement('div');
            
            // Randomly inject high-alert lines
            if (Math.random() > 0.78) {
                row.className = 'alert-text';
                row.innerHTML = `[${timestamp}] [CRIT_ERR] !! ${randomLine}`;
            } else {
                row.innerHTML = `[${timestamp}] [SYS_INFO] ${randomLine}`;
            }
            
            logDump.appendChild(row);
            logDump.scrollTop = logDump.scrollHeight;
            lineCount++;
        } else {
            clearInterval(logInterval);
            triggerPhaseTwo();
        }
    }, 35); // Lower number = faster text delivery
}

// Phase 2: Lock Down Display Overlay
function triggerPhaseTwo() {
    threatOverlay.classList.remove('hidden');
    startMatrixLoop();
}

// Phase 3: Looping Matrix Rain Cascade (Red & White Theme)
const matrixChars = "01011001010101110XF902A7EBCFERRORALERT";
const fontSize = 16;
let columns = canvas.width / fontSize;
let rainDrops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < rainDrops.length; i++) {
        const char = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
        
        // Predominantly red trails, punctuated by sharp white highlights
        ctx.fillStyle = Math.random() > 0.88 ? '#ffffff' : '#ff0000';
        ctx.fillText(char, i * fontSize, rainDrops[i] * fontSize);

        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            rainDrops[i] = 0;
        }
        rainDrops[i]++;
    }
}

function startMatrixLoop() {
    setInterval(drawMatrix, 33);
}

// Fail-safe Kill Switch (Esc Key)
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.body.innerHTML = "<div style='color: #00ff00; font-family: monospace; padding: 40px; font-size: 24px;'>[SAFE_MODE] Simulation aborted successfully.</div>";
    }
});

// Window resize handler to maintain canvas aspect ratios
window.addEventListener('resize', () => {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    columns = canvas.width / fontSize;
    rainDrops = Array(Math.floor(columns)).fill(1);
});

// Fire up the screen on window execution
runTerminalIntro();