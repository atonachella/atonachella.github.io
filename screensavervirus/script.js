// Phase Management Engine
const p1 = document.getElementById('phase1-panic');
const p2 = document.getElementById('phase2-ransom');
const p3 = document.getElementById('phase3-loop');

// ==========================================
// PHASE 1: THE PANIC LOG SPILL
// ==========================================
const logElement = document.getElementById('terminal-log');
const logLines = [
    "LOG: Initializing Root Access...",
    "WARNING: Unauthorized modification detected in kernel space.",
    "ERROR: Security token breached.",
    "SYS_CORRUPT: Mapped sector 0x004F9B corrupted.",
    "TRASHING: C://Windows/System32/drivers/etc/hosts ... DELETED",
    "TRASHING: User Profile Documents ... INJECTING PAYLOAD",
    "CRITICAL: Cryptographic algorithm initiated (RSA-4096).",
    "ENCRYPTING: Local Disk (C:) [=======================] 100%",
    "ENCRYPTING: Network Share (Z:) [====================] 100%",
    "SYSTEM STATUS: TERMINATED.",
    "BROADCASTING PAYLOAD TO SECONDARY MONITOR..."
];

let lineIndex = 0;
function printLog() {
    if (lineIndex < logLines.length) {
        logElement.innerHTML += logLines[lineIndex] + "<br>";
        lineIndex++;
        setTimeout(printLog, 250); // Speed of terminal dump
    } else {
        // Shift to Phase 2 after a short pause
        setTimeout(transitionToPhase2, 1500);
    }
}
printLog();

// ==========================================
// PHASE 2: THE RANSOM DEMAND TIMER
// ==========================================
function transitionToPhase2() {
    p1.classList.remove('active');
    p2.classList.add('active');
    
    // Fake Countdown Clock
    let totalSeconds = 3600;
    const countdownEl = document.getElementById('countdown');
    
    const interval = setInterval(() => {
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        countdownEl.innerText = `${minutes}:${seconds}`;
        totalSeconds--;
        
        if (totalSeconds < 3585) { // Run Phase 2 for roughly 15 seconds, then lock into screensaver loop
            clearInterval(interval);
            transitionToPhase3();
        }
    }, 1000);
}

// ==========================================
// PHASE 3: DUAL-SCREEN SCREENSAVER ENGINE
// ==========================================
const canvasLeft = document.getElementById('canvasLeft');
const canvasRight = document.getElementById('canvasRight');
const ctxL = canvasLeft.getContext('2d');
const ctxR = canvasRight.getContext('2d');

let w, h;
const fontSize = 14;
let dropsLeft = [];
let dropsRight = [];

const hexVirusData = ["0", "1", "ERR", "SYS_FAIL", "0x88FF", "FATAL", "VOID", "ACCESS_DENIED", "CORRUPT"];

function initScreensaverLayout() {
    // Cut the browser window directly in half across the dual screens
    w = window.innerWidth / 2;
    h = window.innerHeight;
    
    canvasLeft.width = w;
    canvasLeft.height = h;
    canvasRight.width = w;
    canvasRight.height = h;
    
    let columns = Math.floor(w / fontSize);
    
    for (let x = 0; x < columns; x++) {
        dropsLeft[x] = Math.random() * -50;
        dropsRight[x] = Math.random() * -50;
    }
}

function drawMonitorStreams(ctx, drops) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'; // Trail fade rate
    ctx.fillRect(0, 0, w, h);
    
    ctx.font = 'bold ' + fontSize + 'px monospace';
    
    for (let i = 0; i < drops.length; i++) {
        const text = hexVirusData[Math.floor(Math.random() * hexVirusData.length)];
        
        // High contrast Red with sudden White glitches
        ctx.fillStyle = Math.random() > 0.98 ? '#ffffff' : '#ff0000';
        
        ctx.fillText(text, i * fontSize * 2.2, drops[i] * fontSize);
        
        if (drops[i] * fontSize > h && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i] += 0.9; // Fluid motion speed down screen
    }
}

function runScreensaverLoop() {
    drawMonitorStreams(ctxL, dropsLeft);
    drawMonitorStreams(ctxR, dropsRight);
}

function transitionToPhase3() {
    p2.classList.remove('active');
    p3.classList.add('active');
    initScreensaverLayout();
    window.addEventListener('resize', initScreensaverLayout);
    setInterval(runScreensaverLoop, 30);
}

// ==========================================
// NATIVE DISMISS SIGNALS
// ==========================================
let lockPeriod = true;
setTimeout(() => { lockPeriod = false; }, 2000); // Prevent accidental mouse click triggers on initial launch

function quitApp() {
    if (!lockPeriod) { window.close(); }
}

window.addEventListener('mousemove', quitApp);
window.addEventListener('keydown', quitApp);
window.addEventListener('click', quitApp);