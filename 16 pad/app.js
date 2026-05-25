// Map pads to standard MIDI Note numbers (Starting at C1 / Note 36 for standard drum racks)
// Also maps to common QWERTY keys for quick computer keyboard play
const padMapping = [
    { note: 48, key: '1', label: 'C3' }, { note: 49, key: '2', label: 'C#3' }, { note: 50, key: '3', label: 'D3' }, { note: 51, key: '4', label: 'D#3' },
    { note: 44, key: 'q', label: 'G#2' }, { note: 45, key: 'w', label: 'A2' },  { note: 46, key: 'e', label: 'A#2' }, { note: 47, key: 'r', label: 'B2' },
    { note: 40, key: 'a', label: 'E2' },  { note: 41, key: 's', label: 'F2' },  { note: 42, key: 'd', label: 'F#2' }, { note: 43, key: 'f', label: 'G2' },
    { note: 36, key: 'z', label: 'C1' },  { note: 37, key: 'x', label: 'C#1' }, { note: 38, key: 'c', label: 'D1' },  { note: 39, key: 'v', label: 'D#1' }
];

let audioCtx = null;
let midiOutput = null;

// Initialize Interface
const grid = document.getElementById('pad-grid');
const padElements = {};

padMapping.forEach((config, index) => {
    const pad = document.createElement('button');
    pad.classList.add('pad');
    pad.innerHTML = `<span class="pad-note">${config.label}</span><span class="pad-key">${config.key.toUpperCase()}</span>`;
    
    // Mouse/Touch triggers
    pad.addEventListener('mousedown', () => triggerPad(config.note, 127));
    
    grid.appendChild(pad);
    padElements[config.note] = pad; // Store reference for animation
});

// Initialize Web Audio on first user interaction (Browser security requirement)
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Setup MIDI connectivity
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
} else {
    console.warn("Web MIDI API not supported in this browser.");
}

function onMIDISuccess(midiAccess) {
    const outputs = Array.from(midiAccess.outputs.values());
    if (outputs.length > 0) {
        // Grab the first available virtual or hardware MIDI output port
        midiOutput = outputs[0];
        const statusDiv = document.getElementById('midi-status');
        statusDiv.textContent = `MIDI Out: ${midiOutput.name}`;
        statusDiv.classList.add('connected');
    }
}

function onMIDIFailure() {
    document.getElementById('midi-status').textContent = "MIDI Init Failed";
}

// Core Trigger Engine
function triggerPad(note, velocity = 127) {
    initAudio();
    
    // 1. Visual Feedback
    const pad = padElements[note];
    if (pad) {
        pad.classList.add('active');
        setTimeout(() => pad.classList.remove('active'), 100);
    }

    // 2. Internal Sound Engine (Simple Synth oscillator for instant audio)
    if (audioCtx) {
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        
        // Calculate frequency from MIDI note formula: f = 440 * 2^((d-69)/12)
        osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
        osc.type = 'triangle'; // Smooth, bassy drum-like tone
        
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15); // Fast decay
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    }

    // 3. MIDI Out Pipeline (Sends data to external routing / DAWs)
    if (midiOutput) {
        const noteOn = [0x90, note, velocity];  // 0x90 = Note On, Channel 1
        const noteOff = [0x80, note, 0];         // 0x80 = Note Off, Channel 1
        
        midiOutput.send(noteOn);
        // Send Note Off shortly after so Ableton registers the release
        midiOutput.send(noteOff, window.performance.now() + 100); 
    }
}

// Map Computer QWERTY keyboard to Drum Machine
window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const target = padMapping.find(p => p.key === e.key.toLowerCase());
    if (target) triggerPad(target.note, 127);
});