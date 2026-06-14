// ============================================================
// STUDIO // DUAL WORKHORSE
// Shared Web Audio synth engine + 16-pad drum machine + 61-key synth
// MIDI output ready for Ableton Live routing
// ============================================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Master chain: everything -> masterGain -> meter analyser -> destination
const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.7;

const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;

masterGain.connect(analyser);
analyser.connect(audioCtx.destination);

// ---- Simple convolver reverb (impulse generated, no sample files) ----
function createReverbImpulse(duration = 2, decay = 2) {
  const rate = audioCtx.sampleRate;
  const length = rate * duration;
  const impulse = audioCtx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

const reverbNode = audioCtx.createConvolver();
reverbNode.buffer = createReverbImpulse(2.2, 2.5);

const reverbWet = audioCtx.createGain();
reverbWet.gain.value = 0.25;
const reverbDry = audioCtx.createGain();
reverbDry.gain.value = 1.0;

reverbNode.connect(reverbWet);
reverbWet.connect(masterGain);
reverbDry.connect(masterGain);

// ============================================================
// METER (visual feedback off the master bus)
// ============================================================
const meterFill = document.getElementById('meterFill');
const meterData = new Uint8Array(analyser.frequencyBinCount);

function updateMeter() {
  analyser.getByteFrequencyData(meterData);
  let sum = 0;
  for (let i = 0; i < meterData.length; i++) sum += meterData[i];
  const avg = sum / meterData.length;
  meterFill.style.width = Math.min(100, (avg / 90) * 100) + '%';
  requestAnimationFrame(updateMeter);
}
updateMeter();

// ============================================================
// SIGNAL LINE PULSE (visual link between the two modules)
// ============================================================
const signalLine = document.getElementById('signalLine');
let pulseTimeout = null;
function pulseSignalLine() {
  signalLine.classList.add('pulse');
  clearTimeout(pulseTimeout);
  pulseTimeout = setTimeout(() => signalLine.classList.remove('pulse'), 120);
}

// ============================================================
// MASTER VOLUME
// ============================================================
document.getElementById('masterVol').addEventListener('input', (e) => {
  masterGain.gain.value = parseFloat(e.target.value);
});

// ============================================================
// MIDI OUTPUT (Web MIDI API) - for Ableton Live routing
// ============================================================
let midiOutputs = [];
let activeMidiOutput = null;

const midiDot = document.getElementById('midiDot');
const midiValue = document.getElementById('midiValue');
const midiOutSelect = document.getElementById('midiOutSelect');

if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then(midiAccess => {
    function refreshOutputs() {
      midiOutputs = Array.from(midiAccess.outputs.values());
      midiOutSelect.innerHTML = '';
      if (midiOutputs.length === 0) {
        midiOutSelect.innerHTML = '<option value="">No MIDI outputs found</option>';
        midiDot.classList.remove('connected');
        midiValue.textContent = 'NONE';
        activeMidiOutput = null;
        return;
      }
      midiOutputs.forEach((output, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = output.name;
        midiOutSelect.appendChild(opt);
      });
      activeMidiOutput = midiOutputs[0];
      midiDot.classList.add('connected');
      midiValue.textContent = 'READY';
    }
    refreshOutputs();
    midiAccess.onstatechange = refreshOutputs;

    midiOutSelect.addEventListener('change', (e) => {
      activeMidiOutput = midiOutputs[parseInt(e.target.value)] || null;
    });
  }).catch(() => {
    midiValue.textContent = 'DENIED';
  });
} else {
  midiValue.textContent = 'UNSUPPORTED';
}

function sendMidiNote(note, velocity, channel = 0, on = true) {
  if (!activeMidiOutput) return;
  const status = (on ? 0x90 : 0x80) | (channel & 0x0f);
  activeMidiOutput.send([status, note, Math.round(velocity * 127)]);
  if (on) {
    pulseSignalLine();
  }
}

// ============================================================
// DRUM MACHINE - 16 pads, sample-free synthesized kits
// ============================================================

const DRUM_LABELS = [
  'KICK', 'SNARE', 'CLAP', 'RIM',
  'CH', 'OH', 'TOM L', 'TOM H',
  'PERC1', 'PERC2', 'COWBELL', 'SHAKER',
  'FX1', 'FX2', 'CRASH', 'RIDE'
];

const PAD_KEYS = ['1','2','3','4','Q','W','E','R','A','S','D','F','Z','X','C','V'];

// MIDI note numbers for drum pads (GM-ish drum map starting at 36)
const DRUM_MIDI_BASE = 36;

// Kit definitions: each pad maps to a synth voice generator
const KITS = {
  analog: {
    name: 'Analog',
    voices: [
      () => synthKick(60, 0.5, 'sine'),
      () => synthNoiseHit(0.2, 1800, 'snare'),
      () => synthNoiseHit(0.1, 2200, 'clap', 3),
      () => synthClick(1500, 0.04),
      () => synthNoiseHit(0.04, 8000, 'hat'),
      () => synthNoiseHit(0.18, 7000, 'hat'),
      () => synthTone(140, 0.3, 'triangle'),
      () => synthTone(220, 0.25, 'triangle'),
      () => synthClick(900, 0.06),
      () => synthClick(2500, 0.05),
      () => synthTone(800, 0.12, 'square'),
      () => synthNoiseHit(0.08, 5000, 'hat'),
      () => synthSweep(2000, 200, 0.3),
      () => synthSweep(400, 1800, 0.25),
      () => synthNoiseHit(0.6, 6000, 'hat'),
      () => synthNoiseHit(0.35, 9000, 'hat')
    ]
  },
  electro: {
    name: 'Electro',
    voices: [
      () => synthKick(50, 0.6, 'square'),
      () => synthNoiseHit(0.15, 2600, 'snare'),
      () => synthNoiseHit(0.08, 3000, 'clap', 4),
      () => synthClick(2000, 0.03),
      () => synthNoiseHit(0.03, 9000, 'hat'),
      () => synthNoiseHit(0.14, 8500, 'hat'),
      () => synthTone(110, 0.25, 'sawtooth'),
      () => synthTone(180, 0.22, 'sawtooth'),
      () => synthClick(1200, 0.05),
      () => synthClick(3000, 0.04),
      () => synthTone(1000, 0.1, 'square'),
      () => synthNoiseHit(0.06, 6000, 'hat'),
      () => synthSweep(3000, 100, 0.35),
      () => synthSweep(200, 2500, 0.3),
      () => synthNoiseHit(0.5, 7000, 'hat'),
      () => synthNoiseHit(0.3, 10000, 'hat')
    ]
  },
  acoustic: {
    name: 'Acoustic',
    voices: [
      () => synthKick(70, 0.45, 'sine'),
      () => synthNoiseHit(0.25, 1500, 'snare'),
      () => synthNoiseHit(0.12, 1900, 'clap', 3),
      () => synthClick(1000, 0.05),
      () => synthNoiseHit(0.05, 6500, 'hat'),
      () => synthNoiseHit(0.22, 6000, 'hat'),
      () => synthTone(160, 0.35, 'triangle'),
      () => synthTone(240, 0.3, 'triangle'),
      () => synthClick(700, 0.07),
      () => synthClick(2000, 0.06),
      () => synthTone(700, 0.14, 'triangle'),
      () => synthNoiseHit(0.1, 4500, 'hat'),
      () => synthSweep(1500, 300, 0.28),
      () => synthSweep(500, 1400, 0.22),
      () => synthNoiseHit(0.7, 5500, 'hat'),
      () => synthNoiseHit(0.4, 8000, 'hat')
    ]
  }
};

let currentKit = 'analog';

// --- Synth voice generators (all sample-free) ---

function synthKick(freq, duration, type) {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq * 4, t);
  osc.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
  gain.gain.setValueAtTime(1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + duration);
}

function synthNoiseHit(duration, filterFreq, kind, bursts = 1) {
  const t = audioCtx.currentTime;
  for (let b = 0; b < bursts; b++) {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = kind === 'hat' ? 'highpass' : 'bandpass';
    filter.frequency.value = filterFreq;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.9, t + b * 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + b * 0.015 + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(t + b * 0.015);
    noise.stop(t + b * 0.015 + duration);
  }
}

function synthClick(freq, duration) {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + duration);
}

function synthTone(freq, duration, type) {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.7, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + duration);
}

function synthSweep(fromFreq, toFreq, duration) {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(fromFreq, t);
  osc.frequency.exponentialRampToValueAtTime(toFreq, t + duration);
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + duration);
}

// --- Build pad grid ---
const padGrid = document.getElementById('padGrid');
const pads = [];

DRUM_LABELS.forEach((label, i) => {
  const pad = document.createElement('div');
  pad.className = 'pad';
  pad.dataset.index = i;
  pad.innerHTML = `
    <span class="pad-key">${PAD_KEYS[i]}</span>
    <span class="pad-led"></span>
    <span class="pad-label">${label}</span>
  `;
  padGrid.appendChild(pad);
  pads.push(pad);

  pad.addEventListener('mousedown', () => triggerPad(i, 1.0));
});

function triggerPad(index, velocity = 1.0) {
  const kit = KITS[currentKit];
  kit.voices[index]();
  pads[index].classList.add('triggered');
  setTimeout(() => pads[index].classList.remove('triggered'), 100);
  pulseSignalLine();
  // MIDI out: drum notes on channel 10 (index 9)
  sendMidiNote(DRUM_MIDI_BASE + index, velocity, 9, true);
  setTimeout(() => sendMidiNote(DRUM_MIDI_BASE + index, velocity, 9, false), 60);
}

// Kit selector
document.getElementById('kitSelect').addEventListener('change', (e) => {
  currentKit = e.target.value;
});

// Computer keyboard -> pads
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const key = e.key.toUpperCase();
  const idx = PAD_KEYS.indexOf(key);
  if (idx !== -1) {
    triggerPad(idx, 1.0);
  }
});

// ============================================================
// SEQUENCER - 16 step pattern grid (per-pad row not needed for
// the basic scaffold; this is a single-row 16-step pattern that
// triggers the currently selected pad row pattern set)
// ============================================================

// Pattern data: 16 pads x 16 steps
let pattern = Array.from({ length: 16 }, () => Array(16).fill(false));
let currentStepRowFocus = 0; // which pad's row is shown in the step strip

const seqStepsEl = document.getElementById('seqSteps');
const seqSteps = [];

for (let i = 0; i < 16; i++) {
  const step = document.createElement('div');
  step.className = 'seq-step';
  step.dataset.step = i;
  seqStepsEl.appendChild(step);
  seqSteps.push(step);

  step.addEventListener('click', () => {
    pattern[currentStepRowFocus][i] = !pattern[currentStepRowFocus][i];
    step.classList.toggle('on');
  });
}

// Clicking a pad focuses its row in the step strip (basic scaffold UX)
pads.forEach((pad, i) => {
  pad.addEventListener('dblclick', () => {
    currentStepRowFocus = i;
    refreshStepStrip();
  });
});

function refreshStepStrip() {
  seqSteps.forEach((step, i) => {
    step.classList.toggle('on', pattern[currentStepRowFocus][i]);
  });
}

// --- Transport / sequencer playback ---
let isPlaying = false;
let currentStep = 0;
let nextStepTime = 0;
let schedulerTimer = null;

const transportBtn = document.getElementById('transportBtn');
const bpmInput = document.getElementById('bpmInput');

transportBtn.addEventListener('click', () => {
  if (isPlaying) {
    stopSequencer();
  } else {
    startSequencer();
  }
});

function startSequencer() {
  isPlaying = true;
  transportBtn.classList.add('active');
  transportBtn.querySelector('.transport-text').textContent = 'STOP';
  currentStep = 0;
  nextStepTime = audioCtx.currentTime;
  schedulerTimer = setInterval(schedulerTick, 25);
}

function stopSequencer() {
  isPlaying = false;
  transportBtn.classList.remove('active');
  transportBtn.querySelector('.transport-text').textContent = 'RUN';
  clearInterval(schedulerTimer);
  seqSteps.forEach(s => s.classList.remove('playhead'));
}

function schedulerTick() {
  const bpm = parseFloat(bpmInput.value) || 96;
  const stepDuration = (60 / bpm) / 4; // 16th notes

  while (nextStepTime < audioCtx.currentTime + 0.1) {
    playStep(currentStep, nextStepTime);
    nextStepTime += stepDuration;
    currentStep = (currentStep + 1) % 16;
  }
}

function playStep(step, time) {
  // Visual playhead (offset to actual time via small timeout)
  const delay = Math.max(0, (time - audioCtx.currentTime) * 1000);
  setTimeout(() => {
    seqSteps.forEach(s => s.classList.remove('playhead'));
    seqSteps[step].classList.add('playhead');

    // Trigger all pads with this step active
    for (let padIndex = 0; padIndex < 16; padIndex++) {
      if (pattern[padIndex][step]) {
        triggerPad(padIndex, 0.9);
      }
    }
  }, delay);
}

// --- Clear / Save / Load pattern ---
document.getElementById('clearPatternBtn').addEventListener('click', () => {
  pattern = Array.from({ length: 16 }, () => Array(16).fill(false));
  refreshStepStrip();
});

const STORAGE_KEY = 'studio_drum_patterns';

document.getElementById('savePatternBtn').addEventListener('click', () => {
  const name = prompt('Pattern name:');
  if (!name) return;
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  saved[name] = { pattern, kit: currentKit, bpm: bpmInput.value };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  refreshPatternList();
});

const loadPatternSelect = document.getElementById('loadPatternSelect');

function refreshPatternList() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  loadPatternSelect.innerHTML = '<option value="">LOAD PATTERN...</option>';
  Object.keys(saved).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    loadPatternSelect.appendChild(opt);
  });
}

loadPatternSelect.addEventListener('change', (e) => {
  const name = e.target.value;
  if (!name) return;
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const data = saved[name];
  if (!data) return;
  pattern = data.pattern;
  currentKit = data.kit || 'analog';
  document.getElementById('kitSelect').value = currentKit;
  bpmInput.value = data.bpm || 96;
  refreshStepStrip();
});

refreshPatternList();

// ============================================================
// KEYBOARD - 61 keys, browser-native polyphonic synth
// ============================================================

// 61 keys = C1 to C6 (5 octaves + 1 note), MIDI notes 24-85... 
// we'll generate starting from MIDI note 36 (C2) for 61 keys -> C2 to C7
const KEYBOARD_START_MIDI = 36; // C2
const KEYBOARD_KEY_COUNT = 61;

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const BLACK_KEY_OFFSETS = [1, 3, 6, 8, 10]; // semitone offsets within octave that are black keys

// Computer key mapping (one octave, shifts with octave control)
const COMPUTER_KEY_MAP = {
  'a': 0, 'w': 1, 's': 2, 'e': 3, 'd': 4, 'f': 5, 't': 6,
  'g': 7, 'y': 8, 'h': 9, 'u': 10, 'j': 11, 'k': 12,
  'o': 13, 'l': 14, 'p': 15, ';': 16
};

let octaveShift = 0; // shifts base octave for computer-key input
const activeOscillators = {}; // midiNote -> {osc, gain}

const keyboardEl = document.getElementById('keyboard');
const keyEls = {}; // midiNote -> element

// Build 61-key layout
let whiteKeyIndex = 0;
const WHITE_KEY_WIDTH = 30;

for (let i = 0; i < KEYBOARD_KEY_COUNT; i++) {
  const midiNote = KEYBOARD_START_MIDI + i;
  const noteInOctave = midiNote % 12;
  const isBlack = BLACK_KEY_OFFSETS.includes(noteInOctave);
  const noteName = NOTE_NAMES[noteInOctave];
  const octave = Math.floor(midiNote / 12) - 1;

  const keyEl = document.createElement('div');
  keyEl.dataset.midi = midiNote;
  keyEl.innerHTML = `<span class="key-label">${noteName}${octave}</span>`;

  if (isBlack) {
    keyEl.className = 'key black';
    // position black key over the gap before the next white key
    keyEl.style.left = (whiteKeyIndex * WHITE_KEY_WIDTH - 9) + 'px';
    keyboardEl.appendChild(keyEl);
  } else {
    keyEl.className = 'key white';
    keyboardEl.appendChild(keyEl);
    whiteKeyIndex++;
  }

  keyEls[midiNote] = keyEl;

  // Mouse interaction
  keyEl.addEventListener('mousedown', () => noteOn(midiNote, 0.9));
  keyEl.addEventListener('mouseup', () => noteOff(midiNote));
  keyEl.addEventListener('mouseleave', () => noteOff(midiNote));
}

keyboardEl.style.width = (whiteKeyIndex * WHITE_KEY_WIDTH) + 'px';

// --- Synth voice for keyboard ---
function midiToFreq(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function noteOn(midiNote, velocity = 0.9) {
  if (activeOscillators[midiNote]) return; // already sounding

  const freq = midiToFreq(midiNote);
  const wave = document.getElementById('waveSelect').value;
  const attack = parseFloat(document.getElementById('attackKnob').value);

  const osc = audioCtx.createOscillator();
  osc.type = wave;
  osc.frequency.value = freq;

  // Slight detuned second oscillator for richness
  const osc2 = audioCtx.createOscillator();
  osc2.type = wave;
  osc2.frequency.value = freq * 1.005;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(velocity * 0.5, audioCtx.currentTime + attack);

  osc.connect(gain);
  osc2.connect(gain);

  // Split to dry/reverb buses
  gain.connect(reverbDry);
  gain.connect(reverbNode);

  osc.start();
  osc2.start();

  activeOscillators[midiNote] = { osc, osc2, gain };

  // Visual
  const keyEl = keyEls[midiNote];
  if (keyEl) keyEl.classList.add('active');

  pulseSignalLine();

  // MIDI out: keyboard on channel 1 (index 0)
  sendMidiNote(midiNote, velocity, 0, true);
}

function noteOff(midiNote) {
  const voice = activeOscillators[midiNote];
  if (!voice) return;

  const release = parseFloat(document.getElementById('releaseKnob').value);
  const t = audioCtx.currentTime;

  voice.gain.gain.cancelScheduledValues(t);
  voice.gain.gain.setValueAtTime(voice.gain.gain.value, t);
  voice.gain.gain.exponentialRampToValueAtTime(0.0001, t + release);

  voice.osc.stop(t + release + 0.05);
  voice.osc2.stop(t + release + 0.05);

  delete activeOscillators[midiNote];

  const keyEl = keyEls[midiNote];
  if (keyEl) keyEl.classList.remove('active');

  sendMidiNote(midiNote, 0, 0, false);
}

// Reverb wet amount control
document.getElementById('reverbKnob').addEventListener('input', (e) => {
  reverbWet.gain.value = parseFloat(e.target.value);
});

// Octave shift controls
const octDisplay = document.getElementById('octDisplay');
document.getElementById('octUp').addEventListener('click', () => {
  if (octaveShift < 2) {
    octaveShift++;
    octDisplay.textContent = 4 + octaveShift;
  }
});
document.getElementById('octDown').addEventListener('click', () => {
  if (octaveShift > -2) {
    octaveShift--;
    octDisplay.textContent = 4 + octaveShift;
  }
});

// Computer keyboard -> synth notes
const heldComputerKeys = new Set();

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (heldComputerKeys.has(key)) return;

  if (COMPUTER_KEY_MAP.hasOwnProperty(key)) {
    heldComputerKeys.add(key);
    const baseOctaveMidi = 60 + (octaveShift * 12); // C4 = 60 as reference
    const midiNote = baseOctaveMidi + COMPUTER_KEY_MAP[key];
    noteOn(midiNote, 0.9);
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (COMPUTER_KEY_MAP.hasOwnProperty(key)) {
    heldComputerKeys.delete(key);
    const baseOctaveMidi = 60 + (octaveShift * 12);
    const midiNote = baseOctaveMidi + COMPUTER_KEY_MAP[key];
    noteOff(midiNote);
  }
});

// ============================================================
// Resume audio context on first interaction (browser policy)
// ============================================================
function resumeAudio() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
document.body.addEventListener('mousedown', resumeAudio, { once: true });
document.body.addEventListener('keydown', resumeAudio, { once: true });