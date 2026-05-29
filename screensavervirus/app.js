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
    "Initializing payload distribution array...",
    "OVERRIDING DISPLAY BUS MANIFEST...",
    "MEM_DUMP: 0x000F82A 0x00A73C2 0xFFE9102",
    "DELETING BACKUP SHADOW VOLUMES...",
    "DISABLING WINDOWS DEFENDER / CORE AUDIO..."
];

let lineCount = 0;
const maxIntroLines = 90; // How long the high-speed scroll lasts
let currentPhase = 1;

// Floating box positioning variables for Phase 3
let floatX = 100;
let floatY = 100;
let floatDX = 3;
let floatDY = 2;
const boxWidth = 550;
let boxHeight = 400; // Will update dynamically once phase 3 triggers

// Phase 1: Rapid Fire System Logs
function runTerminalIntro() {
    const logInterval = setInterval(() => {
        if (lineCount < maxIntroLines) {
            const randomLine = pseudoCodeLines[Math.floor(Math.random() * pseudoCodeLines.length)];
            const timestamp = new Date().toISOString().slice(11, 19);
            const row = document.createElement('div');
            
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
    }, 35);
}

// Phase 2: Full-Screen Lock Down Display Overlay
function triggerPhaseTwo() {
    currentPhase = 2;
    threatOverlay.classList.remove('hidden');
    
    // Hold the full-screen stun card static for 6 seconds, then kick into chaotic motion
    setTimeout(() => {
        triggerPhaseThree();
    }, 6000); 
}

// Phase 3: Unleash Continuous Motion Screensaver Loop
function triggerPhaseThree() {
    currentPhase = 3;
    
    // Transform the full-screen overlay into a drifting container window
    threatOverlay.classList.add('floating-mode');
    boxHeight = threatOverlay.offsetHeight;

    // 1. Kickstart the Matrix Rain cascade on the portrait monitor
    startMatrixLoop();

    // 2. Keep the technical text printing infinitely on the landscape monitor
    startInfiniteTerminalLoop();

    // 3. Begin the physics loop to bounce the demand window across both monitors
    requestAnimationFrame(bounceOverlayLoop);
}

// Infinite Terminal Printer Loop (Phase 3 continuous movement)
function startInfiniteTerminalLoop() {
    setInterval(() => {
        const randomLine = pseudoCodeLines[Math.floor(Math.random() * pseudoCodeLines.length)];
        const timestamp = new Date().toISOString().slice(11, 19);
        const row = document.createElement('div');
        
        row.className = Math.random() > 0.5 ? 'alert-text' : '';
        row.innerHTML = `[${timestamp}] [SYS_HAZARD] >> ${randomLine}`;
        
        logDump.appendChild(row);
        
        // Trim elements so the DOM doesn't get bloated and lag out over hours
        if (logDump.children.length > 40) {
            logDump.removeChild(logDump.firstChild);
        }
        logDump.scrollTop = logDump.scrollHeight;
    }, 150);
}

// Full Screen Bouncing Window Physics (Phase 3)
function bounceOverlayLoop() {
    if (currentPhase !== 3) return;

    floatX += floatDX;
    floatY += floatDY;

    // Detect wall collisions and invert vectors
    if (floatX <= 0 || floatX + boxWidth >= window.innerWidth) {
        floatDX = -floatDX;
    }
    if (floatY <= 0 || floatY + boxHeight >= window.innerHeight) {
        floatDY = -floatDY;
    }

    // Apply positioning coordinates
    threatOverlay.style.left = floatX + 'px';
    threatOverlay.style.top = floatY + 'px';

    requestAnimationFrame(bounceOverlayLoop);
}

// Looping Matrix Rain Cascade (Red & White Theme)
const matrixChars = "01011001010101110XF902A7EBCFERRORALERTSYSTEMCOREWIPE";
const fontSize = 16;
let columns = canvas.width / fontSize;
let rainDrops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < rainDrops.length; i++) {
        const char = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
        
        ctx.fillStyle = Math.random() > 0.90 ? '#ffffff' : '#ff0000';
        ctx.fillText(char, i * fontSize, rainDrops[i] * fontSize);

        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            rainDrops[i] = 0;
        }
        rainDrops[i]++;
    }
}

function startMatrixLoop() {
    setInterval(drawMatrix, 30);
}

// Fail-safe Kill Switch (Esc Key)
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        currentPhase = 0;
        document.body.innerHTML = "<div style='color: #00ff00; font-family: monospace; padding: 40px; font-size: 24px;'>[SAFE_MODE] Simulation aborted successfully.</div>";
    }
});

// Window resize handler to calculate layout constraints
window.addEventListener('resize', () => {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    columns = canvas.width / fontSize;
    rainDrops = Array(Math.floor(columns)).fill(1);
    if (currentPhase === 3) {
        boxHeight = threatOverlay.offsetHeight;
    }
});

// This forces DecSoft HTML Compiler to maximize full screen on startup
if (typeof dhc !== 'undefined') {
    // Tells the compiler window to maximize immediately
    dhc.command('maximize', ''); 
}
Step 2: Kill the Scrollbars (CSS)

// Close the screensaver on any mouse movement or keypress
window.addEventListener('mousemove', () => window.close());
window.addEventListener('keydown', () => window.close());

// Execute simulator
runTerminalIntro();