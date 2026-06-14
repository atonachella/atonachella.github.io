// ============================================================
// STUDIO // DUAL WORKHORSE
// Shared Web Audio synth engine + TAL16 drum machine + SOPH61 keyboard
// MIDI output ready for Ableton Live routing
// ============================================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Master chain: everything -> masterFXInput -> [HPF -> LPF -> flange -> phaser -> chorus] -> masterGain -> analyser -> destination
const masterFXInput = audioCtx.createGain();
masterFXInput.gain.value = 1.0;

const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.7;

const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;

masterGain.connect(analyser);
analyser.connect(audioCtx.destination);

// ---- Master FX: High-pass / Low-pass filters ----
const masterHPF = audioCtx.createBiquadFilter();
masterHPF.type = 'highpass';
masterHPF.frequency.value = 20; // fully open by default

const masterLPF = audioCtx.createBiquadFilter();
masterLPF.type = 'lowpass';
masterLPF.frequency.value = 20000; // fully open by default

// ---- Master FX: Flanger (short modulated delay, fed back) ----
const flangeInput = audioCtx.createGain();
const flangeDelay = audioCtx.createDelay(0.05);
flangeDelay.delayTime.value = 0.003;
const flangeLFO = audioCtx.createOscillator();
flangeLFO.frequency.value = 0.25;
const flangeLFODepth = audioCtx.createGain();
flangeLFODepth.gain.value = 0.002;
const flangeFeedback = audioCtx.createGain();
flangeFeedback.gain.value = 0;
const flangeWet = audioCtx.createGain();
flangeWet.gain.value = 0; // off by default
const flangeDry = audioCtx.createGain();
flangeDry.gain.value = 1;
const flangeOutput = audioCtx.createGain();

flangeLFO.connect(flangeLFODepth);
flangeLFODepth.connect(flangeDelay.delayTime);
flangeLFO.start();

flangeInput.connect(flangeDelay);
flangeInput.connect(flangeDry);
flangeDelay.connect(flangeFeedback);
flangeFeedback.connect(flangeDelay);
flangeDelay.connect(flangeWet);
flangeWet.connect(flangeOutput);
flangeDry.connect(flangeOutput);

// ---- Master FX: Phaser (allpass filter chain modulated by LFO) ----
const phaserInput = audioCtx.createGain();
const phaserStages = [];
const NUM_PHASER_STAGES = 4;
for (let i = 0; i < NUM_PHASER_STAGES; i++) {
  const ap = audioCtx.createBiquadFilter();
  ap.type = 'allpass';
  ap.frequency.value = 800;
  phaserStages.push(ap);
}
for (let i = 0; i < phaserStages.length - 1; i++) {
  phaserStages[i].connect(phaserStages[i + 1]);
}
const phaserLFO = audioCtx.createOscillator();
phaserLFO.frequency.value = 0.3;
const phaserLFODepth = audioCtx.createGain();
phaserLFODepth.gain.value = 600;
phaserLFO.connect(phaserLFODepth);
phaserStages.forEach(ap => phaserLFODepth.connect(ap.frequency));
phaserLFO.start();

const phaserWet = audioCtx.createGain();
phaserWet.gain.value = 0; // off by default
const phaserDry = audioCtx.createGain();
phaserDry.gain.value = 1;
const phaserOutput = audioCtx.createGain();

phaserInput.connect(phaserStages[0]);
phaserInput.connect(phaserDry);
phaserStages[phaserStages.length - 1].connect(phaserWet);
phaserWet.connect(phaserOutput);
phaserDry.connect(phaserOutput);

// ---- Master FX: Chorus / Detune (modulated delay, wider sweep, dual voice) ----
const chorusInput = audioCtx.createGain();
const chorusDelay = audioCtx.createDelay(0.05);
chorusDelay.delayTime.value = 0.012;
const chorusLFO = audioCtx.createOscillator();
chorusLFO.frequency.value = 1.1;
const chorusLFODepth = audioCtx.createGain();
chorusLFODepth.gain.value = 0.004;
const chorusWet = audioCtx.createGain();
chorusWet.gain.value = 0; // off by default
const chorusDry = audioCtx.createGain();
chorusDry.gain.value = 1;
const chorusOutput = audioCtx.createGain();

chorusLFO.connect(chorusLFODepth);
chorusLFODepth.connect(chorusDelay.delayTime);
chorusLFO.start();

chorusInput.connect(chorusDelay);
chorusInput.connect(chorusDry);
chorusDelay.connect(chorusWet);
chorusWet.connect(chorusOutput);
chorusDry.connect(chorusOutput);

// ---- Wire the master FX chain in series ----
masterFXInput.connect(masterHPF);
masterHPF.connect(masterLPF);
masterLPF.connect(flangeInput);
flangeOutput.connect(phaserInput);
phaserOutput.connect(chorusInput);
chorusOutput.connect(masterGain);

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
reverbWet.connect(masterFXInput);
reverbDry.connect(masterFXInput);

// ============================================================
// METER
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
// SIGNAL LINE PULSE
// ============================================================
const signalLine = document.getElementById('signalLine');
let pulseTimeout = null;
function pulseSignalLine() {
  signalLine.classList.add('pulse');
  clearTimeout(pulseTimeout);
  pulseTimeout = setTimeout(() => signalLine.classList.remove('pulse'), 120);
}

// ============================================================
// MASTER FX CONTROLS - HPF / LPF / Flange / Phaser / Detune (chorus)
// ============================================================
document.getElementById('hpfKnob').addEventListener('input', (e) => {
  masterHPF.frequency.value = parseFloat(e.target.value);
});
document.getElementById('lpfKnob').addEventListener('input', (e) => {
  masterLPF.frequency.value = parseFloat(e.target.value);
});
document.getElementById('flangeKnob').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  flangeWet.gain.value = v;
  flangeDry.gain.value = 1 - v * 0.5;
  flangeFeedback.gain.value = v * 0.5;
});
document.getElementById('phaserKnob').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  phaserWet.gain.value = v;
  phaserDry.gain.value = 1 - v * 0.3;
});
document.getElementById('detuneKnob').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  chorusWet.gain.value = v;
  chorusDry.gain.value = 1;
  chorusLFODepth.gain.value = 0.002 + v * 0.006;
});

// ============================================================
// MASTER VOLUME
// ============================================================
document.getElementById('masterVol').addEventListener('input', (e) => {
  masterGain.gain.value = parseFloat(e.target.value);
});

// ============================================================
// MIDI OUTPUT (Web MIDI API)
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
}

// ============================================================
// TAL16 DRUM MACHINE - 16 pads, 4x4 grid, synthesized kits
// ============================================================

const DRUM_LABELS = [
  'KICK', 'SNARE', 'CLAP', 'RIM',
  'CH', 'OH', 'TOM 1', 'TOM 2',
  'SHAKER', 'TAMB', 'COWBELL', 'CRASH',
  'RIDE', 'SFX 1', 'SFX 2', 'SUB'
];

const PAD_KEYS = ['1','2','3','4','5','6','7','8','Q','W','E','R','T','Y','U','I'];

const DRUM_MIDI_BASE = 36;

// ---------------------------------------------------------------
// SYNTH VOICE PRIMITIVES
// ---------------------------------------------------------------

// Punchy kick: pitched osc sweep + sub layer + click transient
function synthKickV(opts) {
  const { startFreq = 180, endFreq = 50, duration = 0.4, type = 'sine', click = true, subLevel = 0.5 } = opts;
  const t = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.09);
  gain.gain.setValueAtTime(1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(masterFXInput);
  osc.start(t);
  osc.stop(t + duration);

  if (subLevel > 0) {
    const sub = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(endFreq * 0.9, t);
    subGain.gain.setValueAtTime(subLevel, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + duration * 1.3);
    sub.connect(subGain);
    subGain.connect(masterFXInput);
    sub.start(t);
    sub.stop(t + duration * 1.3);
  }

  if (click) {
    const noise = audioCtx.createBufferSource();
    const bufferSize = Math.floor(audioCtx.sampleRate * 0.01);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const clickGain = audioCtx.createGain();
    clickGain.gain.setValueAtTime(0.5, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
    noise.connect(clickGain);
    clickGain.connect(masterFXInput);
    noise.start(t);
  }
}

// Snare: noise body + tonal "shell" tone layered
function synthSnareV(opts) {
  const { noiseDecay = 0.18, noiseFreq = 1800, toneFreq = 180, toneDecay = 0.1, toneLevel = 0.4, noiseType = 'highpass' } = opts;
  const t = audioCtx.currentTime;

  // Noise body
  const bufferSize = Math.floor(audioCtx.sampleRate * noiseDecay);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = noiseType;
  filter.frequency.value = noiseFreq;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.9, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseDecay);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(masterFXInput);
  noise.start(t);
  noise.stop(t + noiseDecay);

  // Tonal shell
  if (toneLevel > 0) {
    const osc = audioCtx.createOscillator();
    const toneGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(toneFreq, t);
    osc.frequency.exponentialRampToValueAtTime(toneFreq * 0.6, t + toneDecay);
    toneGain.gain.setValueAtTime(toneLevel, t);
    toneGain.gain.exponentialRampToValueAtTime(0.001, t + toneDecay);
    osc.connect(toneGain);
    toneGain.connect(masterFXInput);
    osc.start(t);
    osc.stop(t + toneDecay);
  }
}

// Clap: multiple staggered noise bursts to simulate flam
function synthClapV(opts) {
  const { duration = 0.12, filterFreq = 1500, bursts = 4, spacing = 0.012, tailDecay = 0.25 } = opts;
  const t = audioCtx.currentTime;

  for (let b = 0; b < bursts; b++) {
    const bufferSize = Math.floor(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.5;
    const gain = audioCtx.createGain();
    const start = t + b * spacing;
    const dur = b === bursts - 1 ? tailDecay : duration;
    gain.gain.setValueAtTime(0.7, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterFXInput);
    noise.start(start);
    noise.stop(start + dur);
  }
}

// Hi-hat: metallic noise via multiple square oscillators through highpass
function synthHatV(opts) {
  const { duration = 0.06, hpfFreq = 7000, level = 0.35 } = opts;
  const t = audioCtx.currentTime;

  const fundamentals = [320, 540, 800, 1100, 1450];
  const merger = audioCtx.createGain();
  merger.gain.value = level;

  const hpf = audioCtx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = hpfFreq;

  const bpf = audioCtx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = hpfFreq * 1.4;

  merger.connect(hpf);
  hpf.connect(bpf);
  bpf.connect(masterFXInput);

  fundamentals.forEach(freq => {
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(1, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(oscGain);
    oscGain.connect(merger);
    osc.start(t);
    osc.stop(t + duration);
  });
}

// Tom: pitched sine sweep with resonant body
function synthTomV(opts) {
  const { startFreq = 200, endFreq = 90, duration = 0.35 } = opts;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration * 0.7);
  gain.gain.setValueAtTime(0.9, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(masterFXInput);
  osc.start(t);
  osc.stop(t + duration);
}

// Shaker: filtered noise with quick attack/decay, airy
function synthShakerV(opts) {
  const { duration = 0.12, bpfFreq = 6000, level = 0.4 } = opts;
  const t = audioCtx.currentTime;
  const bufferSize = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = bpfFreq;
  filter.Q.value = 0.8;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(level, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterFXInput);
  noise.start(t);
  noise.stop(t + duration);
}

// Tambourine: layered high-frequency noise bursts (jingly)
function synthTambourineV(opts) {
  const { layers = 3, duration = 0.2, baseFreq = 5000 } = opts;
  const t = audioCtx.currentTime;
  for (let l = 0; l < layers; l++) {
    const bufferSize = Math.floor(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = baseFreq + l * 1800;
    filter.Q.value = 3;
    const gain = audioCtx.createGain();
    const start = t + l * 0.008;
    gain.gain.setValueAtTime(0.35, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterFXInput);
    noise.start(start);
    noise.stop(start + duration);
  }
}

// Cowbell: two square oscillators, classic dissonant interval
function synthCowbellV(opts) {
  const { freq1 = 800, freq2 = 540, duration = 0.3 } = opts;
  const t = audioCtx.currentTime;
  [freq1, freq2].forEach(freq => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 2;
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterFXInput);
    osc.start(t);
    osc.stop(t + duration);
  });
}

// Cymbal (crash/ride): dense noise wash through resonant filters
function synthCymbalV(opts) {
  const { duration = 0.8, hpfFreq = 5000, level = 0.3, decayShape = 1 } = opts;
  const t = audioCtx.currentTime;
  const bufferSize = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const hpf = audioCtx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = hpfFreq;

  const bpf1 = audioCtx.createBiquadFilter();
  bpf1.type = 'bandpass';
  bpf1.frequency.value = hpfFreq * 1.2;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(level, t);
  gain.gain.exponentialRampToValueAtTime(0.0005, t + duration * decayShape);

  noise.connect(hpf);
  hpf.connect(bpf1);
  bpf1.connect(gain);
  gain.connect(masterFXInput);
  noise.start(t);
  noise.stop(t + duration);
}

// SFX sweep: pitch rising or falling sine/sawtooth
function synthSweepV(opts) {
  const { fromFreq = 400, toFreq = 2000, duration = 0.3, type = 'sine', level = 0.5 } = opts;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromFreq, t);
  osc.frequency.exponentialRampToValueAtTime(toFreq, t + duration);
  gain.gain.setValueAtTime(level, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(masterFXInput);
  osc.start(t);
  osc.stop(t + duration);
}

// Sub: pure low sine thump, long decay
function synthSubV(opts) {
  const { freq = 45, duration = 0.6 } = opts;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.9, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(masterFXInput);
  osc.start(t);
  osc.stop(t + duration);
}

// ---------------------------------------------------------------
// 5 PRESET KITS - each maps all 16 pads:
// KICK, SNARE, CLAP, RIM, CH, OH, TOM1, TOM2, SHAKER, TAMB, COWBELL, CRASH, RIDE, SFX1, SFX2, SUB
// ---------------------------------------------------------------

const KITS = {
  analog: {
    name: 'Analog',
    voices: [
      () => synthKickV({ startFreq: 150, endFreq: 50, duration: 0.45, type: 'sine', subLevel: 0.4 }),
      () => synthSnareV({ noiseDecay: 0.18, noiseFreq: 1600, toneFreq: 180, toneDecay: 0.1, toneLevel: 0.45 }),
      () => synthClapV({ duration: 0.1, filterFreq: 1400, bursts: 4, spacing: 0.012, tailDecay: 0.22 }),
      () => synthHatV({ duration: 0.04, hpfFreq: 5500, level: 0.3 }),
      () => synthHatV({ duration: 0.05, hpfFreq: 8000, level: 0.32 }),
      () => synthHatV({ duration: 0.35, hpfFreq: 7000, level: 0.28 }),
      () => synthTomV({ startFreq: 180, endFreq: 100, duration: 0.32 }),
      () => synthTomV({ startFreq: 240, endFreq: 130, duration: 0.28 }),
      () => synthShakerV({ duration: 0.1, bpfFreq: 6000, level: 0.35 }),
      () => synthTambourineV({ layers: 3, duration: 0.18, baseFreq: 5000 }),
      () => synthCowbellV({ freq1: 800, freq2: 540, duration: 0.28 }),
      () => synthCymbalV({ duration: 0.9, hpfFreq: 5000, level: 0.28, decayShape: 1 }),
      () => synthCymbalV({ duration: 0.6, hpfFreq: 6500, level: 0.22, decayShape: 0.7 }),
      () => synthSweepV({ fromFreq: 2000, toFreq: 200, duration: 0.3, type: 'sine', level: 0.4 }),
      () => synthSweepV({ fromFreq: 300, toFreq: 1800, duration: 0.25, type: 'triangle', level: 0.35 }),
      () => synthSubV({ freq: 45, duration: 0.5 })
    ]
  },

  trap808: {
    name: '808 / Trap',
    voices: [
      () => synthKickV({ startFreq: 120, endFreq: 40, duration: 0.7, type: 'sine', subLevel: 0.8, click: true }),
      () => synthSnareV({ noiseDecay: 0.22, noiseFreq: 2200, toneFreq: 200, toneDecay: 0.08, toneLevel: 0.3 }),
      () => synthClapV({ duration: 0.09, filterFreq: 2000, bursts: 5, spacing: 0.01, tailDecay: 0.28 }),
      () => synthHatV({ duration: 0.03, hpfFreq: 7000, level: 0.32 }),
      () => synthHatV({ duration: 0.04, hpfFreq: 9000, level: 0.34 }),
      () => synthHatV({ duration: 0.5, hpfFreq: 8500, level: 0.3 }),
      () => synthTomV({ startFreq: 150, endFreq: 70, duration: 0.4 }),
      () => synthTomV({ startFreq: 200, endFreq: 95, duration: 0.35 }),
      () => synthShakerV({ duration: 0.08, bpfFreq: 7000, level: 0.3 }),
      () => synthTambourineV({ layers: 3, duration: 0.15, baseFreq: 6000 }),
      () => synthCowbellV({ freq1: 900, freq2: 600, duration: 0.25 }),
      () => synthCymbalV({ duration: 1.1, hpfFreq: 4500, level: 0.3, decayShape: 1.1 }),
      () => synthCymbalV({ duration: 0.7, hpfFreq: 6000, level: 0.24, decayShape: 0.8 }),
      () => synthSweepV({ fromFreq: 3000, toFreq: 150, duration: 0.4, type: 'sawtooth', level: 0.45 }),
      () => synthSweepV({ fromFreq: 200, toFreq: 2500, duration: 0.3, type: 'square', level: 0.35 }),
      () => synthSubV({ freq: 38, duration: 0.8 })
    ]
  },

  acoustic: {
    name: 'Acoustic',
    voices: [
      () => synthKickV({ startFreq: 170, endFreq: 65, duration: 0.4, type: 'sine', subLevel: 0.3, click: true }),
      () => synthSnareV({ noiseDecay: 0.25, noiseFreq: 1400, toneFreq: 210, toneDecay: 0.14, toneLevel: 0.5 }),
      () => synthClapV({ duration: 0.13, filterFreq: 1300, bursts: 3, spacing: 0.015, tailDecay: 0.25 }),
      () => synthHatV({ duration: 0.05, hpfFreq: 5000, level: 0.3 }),
      () => synthHatV({ duration: 0.06, hpfFreq: 6500, level: 0.32 }),
      () => synthHatV({ duration: 0.4, hpfFreq: 6000, level: 0.28 }),
      () => synthTomV({ startFreq: 200, endFreq: 110, duration: 0.4 }),
      () => synthTomV({ startFreq: 260, endFreq: 145, duration: 0.35 }),
      () => synthShakerV({ duration: 0.14, bpfFreq: 5500, level: 0.38 }),
      () => synthTambourineV({ layers: 4, duration: 0.22, baseFreq: 4500 }),
      () => synthCowbellV({ freq1: 750, freq2: 500, duration: 0.3 }),
      () => synthCymbalV({ duration: 1.0, hpfFreq: 4000, level: 0.3, decayShape: 1.2 }),
      () => synthCymbalV({ duration: 0.65, hpfFreq: 5500, level: 0.24, decayShape: 0.85 }),
      () => synthSweepV({ fromFreq: 1500, toFreq: 300, duration: 0.35, type: 'triangle', level: 0.4 }),
      () => synthSweepV({ fromFreq: 400, toFreq: 1600, duration: 0.3, type: 'sine', level: 0.35 }),
      () => synthSubV({ freq: 50, duration: 0.45 })
    ]
  },

  lofi: {
    name: 'Lo-Fi',
    voices: [
      () => synthKickV({ startFreq: 100, endFreq: 45, duration: 0.5, type: 'triangle', subLevel: 0.5, click: false }),
      () => synthSnareV({ noiseDecay: 0.2, noiseFreq: 1100, toneFreq: 160, toneDecay: 0.12, toneLevel: 0.35, noiseType: 'bandpass' }),
      () => synthClapV({ duration: 0.14, filterFreq: 1000, bursts: 3, spacing: 0.018, tailDecay: 0.3 }),
      () => synthHatV({ duration: 0.05, hpfFreq: 4000, level: 0.22 }),
      () => synthHatV({ duration: 0.07, hpfFreq: 5000, level: 0.24 }),
      () => synthHatV({ duration: 0.45, hpfFreq: 4500, level: 0.2 }),
      () => synthTomV({ startFreq: 160, endFreq: 85, duration: 0.4 }),
      () => synthTomV({ startFreq: 210, endFreq: 110, duration: 0.35 }),
      () => synthShakerV({ duration: 0.15, bpfFreq: 4000, level: 0.3 }),
      () => synthTambourineV({ layers: 2, duration: 0.2, baseFreq: 3500 }),
      () => synthCowbellV({ freq1: 650, freq2: 430, duration: 0.3 }),
      () => synthCymbalV({ duration: 0.9, hpfFreq: 3000, level: 0.24, decayShape: 1.3 }),
      () => synthCymbalV({ duration: 0.6, hpfFreq: 4000, level: 0.2, decayShape: 0.9 }),
      () => synthSweepV({ fromFreq: 1200, toFreq: 250, duration: 0.4, type: 'triangle', level: 0.35 }),
      () => synthSweepV({ fromFreq: 250, toFreq: 1000, duration: 0.35, type: 'sine', level: 0.3 }),
      () => synthSubV({ freq: 42, duration: 0.55 })
    ]
  },

  industrial: {
    name: 'Industrial',
    voices: [
      () => synthKickV({ startFreq: 200, endFreq: 55, duration: 0.5, type: 'square', subLevel: 0.6, click: true }),
      () => synthSnareV({ noiseDecay: 0.2, noiseFreq: 2800, toneFreq: 240, toneDecay: 0.09, toneLevel: 0.3, noiseType: 'highpass' }),
      () => synthClapV({ duration: 0.08, filterFreq: 2400, bursts: 5, spacing: 0.009, tailDecay: 0.25 }),
      () => synthHatV({ duration: 0.03, hpfFreq: 9000, level: 0.35 }),
      () => synthHatV({ duration: 0.04, hpfFreq: 11000, level: 0.36 }),
      () => synthHatV({ duration: 0.4, hpfFreq: 10000, level: 0.3 }),
      () => synthTomV({ startFreq: 220, endFreq: 80, duration: 0.35 }),
      () => synthTomV({ startFreq: 280, endFreq: 110, duration: 0.3 }),
      () => synthShakerV({ duration: 0.09, bpfFreq: 8000, level: 0.32 }),
      () => synthTambourineV({ layers: 4, duration: 0.16, baseFreq: 7000 }),
      () => synthCowbellV({ freq1: 1000, freq2: 670, duration: 0.22 }),
      () => synthCymbalV({ duration: 1.0, hpfFreq: 6000, level: 0.32, decayShape: 1 }),
      () => synthCymbalV({ duration: 0.6, hpfFreq: 7500, level: 0.26, decayShape: 0.75 }),
      () => synthSweepV({ fromFreq: 4000, toFreq: 100, duration: 0.35, type: 'sawtooth', level: 0.45 }),
      () => synthSweepV({ fromFreq: 150, toFreq: 3500, duration: 0.3, type: 'square', level: 0.4 }),
      () => synthSubV({ freq: 35, duration: 0.7 })
    ]
  }
};

let currentKit = 'analog';

// --- Build pad grid (4x4) ---
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
  sendMidiNote(DRUM_MIDI_BASE + index, velocity, 9, true);
  setTimeout(() => sendMidiNote(DRUM_MIDI_BASE + index, velocity, 9, false), 60);
}

document.getElementById('kitSelect').addEventListener('change', (e) => {
  currentKit = e.target.value;
});

// Computer keyboard -> pads (1234 QWER ASDF ZXCV)
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const key = e.key.toUpperCase();
  const idx = PAD_KEYS.indexOf(key);
  if (idx !== -1) {
    // Prevent browser default (e.g. <select> jumping to an option matching this letter)
    if (document.activeElement && (document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'INPUT')) {
      document.activeElement.blur();
    }
    e.preventDefault();
    triggerPad(idx, 1.0);
  }
});

// ============================================================
// SEQUENCER - 16 step pattern grid, up to 4 bars per pad (64 steps total)
// ============================================================

const BARS = 4;
const STEPS_PER_BAR = 16;

// pattern[padIndex][bar][step] -> boolean
let pattern = Array.from({ length: 16 }, () =>
  Array.from({ length: BARS }, () => Array(STEPS_PER_BAR).fill(false))
);

let currentStepRowFocus = 0;
let currentBar = 0;
let loopLength = 1; // 1, 2, or 4 bars

const seqStepsEl = document.getElementById('seqSteps');
const seqSteps = [];

for (let i = 0; i < STEPS_PER_BAR; i++) {
  const step = document.createElement('div');
  step.className = 'seq-step';
  step.dataset.step = i;

  // Beat markers: number steps 1, 5, 9, 13 (1-indexed) and add hash class every 4
  if (i % 4 === 0) {
    step.classList.add('seq-beat');
    const num = document.createElement('span');
    num.className = 'seq-step-num';
    num.textContent = (i + 1);
    step.appendChild(num);
  }

  seqStepsEl.appendChild(step);
  seqSteps.push(step);

  step.addEventListener('click', () => {
    pattern[currentStepRowFocus][currentBar][i] = !pattern[currentStepRowFocus][currentBar][i];
    step.classList.toggle('on');
  });
}

// Click a pad to select it as the active sequencer row (visual highlight)
pads.forEach((pad, i) => {
  pad.addEventListener('click', () => {
    currentStepRowFocus = i;
    refreshActiveRowDisplay();
    refreshStepStrip();
  });
});

function refreshActiveRowDisplay() {
  pads.forEach((pad, i) => {
    pad.classList.toggle('seq-focused', i === currentStepRowFocus);
  });
  const nameEl = document.getElementById('activeRowName');
  if (nameEl) nameEl.textContent = DRUM_LABELS[currentStepRowFocus];
}

function refreshStepStrip() {
  seqSteps.forEach((step, i) => {
    step.classList.toggle('on', pattern[currentStepRowFocus][currentBar][i]);
  });
}

// --- Loop length toggle (1 / 2 / 4 bars) ---
const loopBtns = document.querySelectorAll('.loop-btn');
const barPageWrap = document.getElementById('barPageWrap');

loopBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    loopLength = parseInt(btn.dataset.bars);
    loopBtns.forEach(b => b.classList.toggle('active', b === btn));
    if (currentBar >= loopLength) currentBar = 0;
    refreshBarPages();
    refreshStepStrip();
  });
});

function refreshBarPages() {
  barPageWrap.innerHTML = '';
  if (loopLength === 1) {
    barPageWrap.classList.add('hidden');
    return;
  }
  barPageWrap.classList.remove('hidden');
  const labels = ['A', 'B', 'C', 'D'];
  for (let b = 0; b < loopLength; b++) {
    const btn = document.createElement('button');
    btn.className = 'bar-page-btn' + (b === currentBar ? ' active' : '');
    btn.textContent = labels[b];
    btn.dataset.bar = b;
    btn.addEventListener('click', () => {
      currentBar = b;
      refreshBarPages();
      refreshStepStrip();
    });
    barPageWrap.appendChild(btn);
  }
}
refreshBarPages();

// --- Copy: one tap, copies current bar -> next bar in the active loop (wraps) ---
document.getElementById('copyBarBtn').addEventListener('click', () => {
  if (loopLength === 1) return; // nothing to copy to
  const targetBar = (currentBar + 1) % loopLength;
  for (let p = 0; p < 16; p++) {
    pattern[p][targetBar] = pattern[p][currentBar].slice();
  }
  currentBar = targetBar;
  refreshBarPages();
  refreshStepStrip();
});

// --- Transport: Play / Pause / Stop ---
let isPlaying = false;
let isPaused = false;
let currentStep = 0;
let nextStepTime = 0;
let schedulerTimer = null;

const transportPlayBtn = document.getElementById('playBtn');
const transportPauseBtn = document.getElementById('pauseBtn');
const transportStopBtn = document.getElementById('stopBtn');
const bpmValue = document.getElementById('bpmValue');
let bpm = 96;

document.getElementById('bpmUp').addEventListener('click', () => {
  bpm = Math.min(240, bpm + 1);
  bpmValue.textContent = bpm;
});
document.getElementById('bpmDown').addEventListener('click', () => {
  bpm = Math.max(40, bpm - 1);
  bpmValue.textContent = bpm;
});

transportPlayBtn.addEventListener('click', () => {
  if (!isPlaying) {
    if (isPaused) {
      resumeSequencer();
    } else {
      startSequencer();
    }
  }
});

transportPauseBtn.addEventListener('click', () => {
  if (isPlaying) pauseSequencer();
});

transportStopBtn.addEventListener('click', () => {
  stopSequencer();
});

// Spacebar: toggle play/pause
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' && e.key !== ' ') return;
  // Don't hijack space if user is typing in a select/input/button
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'SELECT' || tag === 'INPUT' || tag === 'BUTTON') {
    document.activeElement.blur();
  }
  e.preventDefault();

  if (isPlaying) {
    pauseSequencer();
  } else if (isPaused) {
    resumeSequencer();
  } else {
    startSequencer();
  }
});

function startSequencer() {
  isPlaying = true;
  isPaused = false;
  transportPlayBtn.classList.add('active');
  transportPauseBtn.classList.remove('active');
  currentStep = 0;
  nextStepTime = audioCtx.currentTime;
  schedulerTimer = setInterval(schedulerTick, 25);
}

function pauseSequencer() {
  isPlaying = false;
  isPaused = true;
  transportPlayBtn.classList.remove('active');
  transportPauseBtn.classList.add('active');
  clearInterval(schedulerTimer);
}

function resumeSequencer() {
  isPlaying = true;
  isPaused = false;
  transportPlayBtn.classList.add('active');
  transportPauseBtn.classList.remove('active');
  nextStepTime = audioCtx.currentTime;
  schedulerTimer = setInterval(schedulerTick, 25);
}

function stopSequencer() {
  isPlaying = false;
  isPaused = false;
  transportPlayBtn.classList.remove('active');
  transportPauseBtn.classList.remove('active');
  clearInterval(schedulerTimer);
  currentStep = 0;
  currentBar = 0;
  refreshBarPages();
  refreshStepStrip();
  seqSteps.forEach(s => s.classList.remove('playhead'));
}

function schedulerTick() {
  const stepDuration = (60 / bpm) / 4;
  while (nextStepTime < audioCtx.currentTime + 0.1) {
    playStep(currentStep, nextStepTime);
    nextStepTime += stepDuration;
    currentStep = (currentStep + 1) % (loopLength * STEPS_PER_BAR);
  }
}

function playStep(globalStep, time) {
  const bar = Math.floor(globalStep / STEPS_PER_BAR) % loopLength;
  const step = globalStep % STEPS_PER_BAR;
  const delay = Math.max(0, (time - audioCtx.currentTime) * 1000);
  setTimeout(() => {
    // Auto-page the step strip to follow playback
    if (bar !== currentBar) {
      currentBar = bar;
      refreshBarPages();
      refreshStepStrip();
    }
    seqSteps.forEach(s => s.classList.remove('playhead'));
    seqSteps[step].classList.add('playhead');

    for (let padIndex = 0; padIndex < 16; padIndex++) {
      if (pattern[padIndex][bar][step]) {
        triggerPad(padIndex, 0.9);
      }
    }
  }, delay);
}

// --- Clear / Save / Load pattern ---
document.getElementById('clearPatternBtn').addEventListener('click', () => {
  pattern = Array.from({ length: 16 }, () =>
    Array.from({ length: BARS }, () => Array(STEPS_PER_BAR).fill(false))
  );
  refreshStepStrip();
});

const STORAGE_KEY = 'studio_drum_patterns';

document.getElementById('savePatternBtn').addEventListener('click', () => {
  const name = prompt('Pattern name:');
  if (!name) return;
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  saved[name] = { pattern, kit: currentKit, bpm: bpm };
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
  bpm = data.bpm || 96;
  bpmValue.textContent = bpm;
  refreshStepStrip();
});

refreshPatternList();

// ============================================================
// SOPH61 KEYBOARD - 61 keys, browser-native polyphonic synth
// ============================================================

const KEYBOARD_START_MIDI = 36; // C2
const KEYBOARD_KEY_COUNT = 61;  // C2 to C7

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const BLACK_KEY_OFFSETS = [1, 3, 6, 8, 10];

// Synth key mapping - 2x8 layout to mirror the drum pad grid, touch + keyboard friendly
// Bottom row Z X C V B N M , = 8 white keys, one full octave C through C (next octave)
// Top row    S   F G   J L   = 5 black keys (C# D# F# G# A#), positioned above their gaps
// A D H K are intentionally unused (no black key exists between E-F or B-C)
const COMPUTER_KEY_MAP = {
  // White keys (bottom row): C D E F G A B C
  'z': 0, 'x': 2, 'c': 4, 'v': 5, 'b': 7, 'n': 9, 'm': 11, ',': 12,
  // Black keys (top row): C# D# F# G# A#
  's': 1, 'f': 3, 'g': 6, 'j': 8, 'l': 10
};

let octaveShift = 0;
const activeOscillators = {};

const keyboardEl = document.getElementById('keyboard');
const keyEls = {};

const WHITE_KEY_WIDTH = 27;

function midiToFreq(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// ---------------------------------------------------------------
// KEYBOARD SYNTH PRESETS
// Each preset defines oscillator types/detune, filter, and gain shaping.
// noteOn/noteOff read from this based on the active preset.
// ---------------------------------------------------------------
const SYNTH_PRESETS = {
  classic: {
    name: 'Classic',
    oscType: 'sawtooth',
    detune: 0.005,      // ratio offset for osc2
    filterType: 'lowpass',
    filterFreq: 12000,
    filterQ: 0.7,
    gainLevel: 0.5
  },
  bass: {
    name: 'Bass',
    oscType: 'sawtooth',
    detune: 0.01,
    filterType: 'lowpass',
    filterFreq: 900,
    filterQ: 1.2,
    gainLevel: 0.7,
    octaveOffset: -1
  },
  lead: {
    name: 'Lead',
    oscType: 'square',
    detune: 0.015,
    filterType: 'lowpass',
    filterFreq: 6000,
    filterQ: 2,
    gainLevel: 0.45
  },
  bell: {
    name: 'Bell',
    oscType: 'sine',
    detune: 0.003,
    extraPartial: true,   // adds a high inharmonic partial for bell character
    filterType: 'highpass',
    filterFreq: 200,
    filterQ: 0.5,
    gainLevel: 0.4
  },
  drone: {
    name: 'Drone / Pad',
    oscType: 'triangle',
    detune: 0.02,
    filterType: 'lowpass',
    filterFreq: 2200,
    filterQ: 0.4,
    gainLevel: 0.4,
    slowAttack: true
  },
  pluck: {
    name: 'Pluck',
    oscType: 'triangle',
    detune: 0.008,
    filterType: 'lowpass',
    filterFreq: 4000,
    filterQ: 3,
    gainLevel: 0.5,
    fastDecay: true
  },
  supersaw: {
    name: 'Supersaw',
    oscType: 'sawtooth',
    detune: 0.018,          // wide unison spread across osc/osc2
    extraPartial: true,      // 3rd sawtooth-ish voice for thickness
    partialRatio: 1.012,     // near-unison ratio, not inharmonic (overridden below)
    filterType: 'lowpass',
    filterFreq: 9000,
    filterQ: 1.5,
    gainLevel: 0.4
  },
  acid: {
    name: 'Acid Bass',
    oscType: 'square',
    detune: 0.004,
    filterType: 'lowpass',
    filterFreq: 700,
    filterQ: 9,              // high resonance, classic 303 squelch
    gainLevel: 0.6,
    octaveOffset: -1,
    fastDecay: true
  },
  ep: {
    name: 'Warm EP',
    oscType: 'sine',
    detune: 0.006,
    extraPartial: true,
    partialRatio: 2.01,      // near-octave partial, bell/EP shimmer
    filterType: 'lowpass',
    filterFreq: 3500,
    filterQ: 0.6,
    gainLevel: 0.45,
    slowAttack: false
  },
  growl: {
    name: 'Growl Bass',
    oscType: 'sawtooth',
    detune: 0.05,           // hard detune for growl beating
    filterType: 'lowpass',
    filterFreq: 450,
    filterQ: 4,
    gainLevel: 0.65,
    octaveOffset: -1
  },
  glasspluck: {
    name: 'Glass Pluck',
    oscType: 'triangle',
    detune: 0.01,
    extraPartial: true,
    partialRatio: 3.0,       // bright high partial, glassy/marimba character
    filterType: 'highpass',
    filterFreq: 300,
    filterQ: 1,
    gainLevel: 0.45,
    fastDecay: true
  }
};

let currentPreset = 'classic';

// ---- Mod wheel (vibrato) + pitch bend ----
let modWheelValue = 0;      // 0-1
let pitchBendCents = 0;     // -200 to +200 cents

const vibratoLFO = audioCtx.createOscillator();
vibratoLFO.frequency.value = 5.5;
vibratoLFO.start();
const vibratoDepth = audioCtx.createGain();
vibratoDepth.gain.value = 0; // scaled by mod wheel, in cents
vibratoLFO.connect(vibratoDepth);

function applyPitchModToVoice(voice) {
  // Vibrato (mod wheel) — connect LFO depth to detune
  vibratoDepth.connect(voice.osc.detune);
  vibratoDepth.connect(voice.osc2.detune);
  if (voice.osc3) vibratoDepth.connect(voice.osc3.detune);
  // Pitch bend — static detune offset
  voice.osc.detune.value += pitchBendCents;
  voice.osc2.detune.value += pitchBendCents;
  if (voice.osc3) voice.osc3.detune.value += pitchBendCents;
}

function updateAllVoicesPitchBend() {
  Object.values(activeOscillators).forEach(voice => {
    if (!voice || !voice.osc) return;
    const t = audioCtx.currentTime;
    voice.osc.detune.setTargetAtTime(pitchBendCents, t, 0.01);
    voice.osc2.detune.setTargetAtTime(pitchBendCents, t, 0.01);
    if (voice.osc3) voice.osc3.detune.setTargetAtTime(pitchBendCents, t, 0.01);
  });
}

// ============================================================
// MOD WHEEL + PITCH BEND WHEEL (MPK261-style)
// ============================================================
function sendMidiCC(cc, value) {
  if (!activeMidiOutput) return;
  activeMidiOutput.send([0xB0, cc, value]);
}

function sendMidiPitchBend(value14bit) {
  if (!activeMidiOutput) return;
  const lsb = value14bit & 0x7F;
  const msb = (value14bit >> 7) & 0x7F;
  activeMidiOutput.send([0xE0, lsb, msb]);
}

const modWheelEl = document.getElementById('modWheel');
const pitchWheelEl = document.getElementById('pitchWheel');

modWheelEl.addEventListener('input', (e) => {
  modWheelValue = parseFloat(e.target.value) / 127;
  vibratoDepth.gain.value = modWheelValue * 35; // up to ~35 cents vibrato depth
  sendMidiCC(1, Math.round(modWheelValue * 127));
});

pitchWheelEl.addEventListener('input', (e) => {
  const raw = parseFloat(e.target.value); // -100 to 100
  pitchBendCents = (raw / 100) * 200; // up to +/- 200 cents (2 semitones)
  updateAllVoicesPitchBend();
  const midiVal = Math.round(((raw / 100) + 1) * 0.5 * 16383); // 0-16383, center 8192
  sendMidiPitchBend(midiVal);
});

function springBackPitchWheel() {
  pitchWheelEl.value = 0;
  pitchBendCents = 0;
  updateAllVoicesPitchBend();
  sendMidiPitchBend(8192);
}
pitchWheelEl.addEventListener('mouseup', springBackPitchWheel);
pitchWheelEl.addEventListener('touchend', springBackPitchWheel);
pitchWheelEl.addEventListener('mouseleave', (e) => {
  if (e.buttons === 1) springBackPitchWheel();
});

function noteOn(midiNote, velocity = 0.9) {
  if (activeOscillators[midiNote]) return;

  const preset = SYNTH_PRESETS[currentPreset];
  const octaveOffset = preset.octaveOffset || 0;
  const freq = midiToFreq(midiNote + (octaveOffset * 12));
  const attack = parseFloat(document.getElementById('attackKnob').value);
  const effectiveAttack = preset.slowAttack ? Math.max(attack, 0.4) : Math.max(attack, 0.001);

  const osc = audioCtx.createOscillator();
  osc.type = preset.oscType;
  osc.frequency.value = freq;

  const osc2 = audioCtx.createOscillator();
  osc2.type = preset.oscType;
  osc2.frequency.value = freq * (1 + preset.detune);

  // Tone-shaping filter — base frequency shifted by the CUTOFF knob (-1 to 1)
  const cutoffKnob = parseFloat(document.getElementById('cutoffKnob').value);
  const cutoffMultiplier = Math.pow(4, cutoffKnob); // -1 -> /4, 0 -> x1, +1 -> x4
  const filter = audioCtx.createBiquadFilter();
  filter.type = preset.filterType;
  filter.frequency.value = Math.max(20, Math.min(20000, preset.filterFreq * cutoffMultiplier));
  filter.Q.value = preset.filterQ;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(
    Math.max(velocity, 0.0001) * preset.gainLevel,
    audioCtx.currentTime + effectiveAttack
  );

  osc.connect(filter);
  osc2.connect(filter);

  // Optional extra partial — bell-style inharmonic overtone OR a 3rd unison voice for supersaw-type presets
  let osc3 = null;
  if (preset.extraPartial) {
    osc3 = audioCtx.createOscillator();
    osc3.type = preset.partialOscType || (preset.oscType === 'sawtooth' ? 'sawtooth' : 'sine');
    const ratio = preset.partialRatio || 2.76;
    osc3.frequency.value = freq * ratio;
    const partialGain = audioCtx.createGain();
    partialGain.gain.setValueAtTime(0, audioCtx.currentTime);
    partialGain.gain.linearRampToValueAtTime(
      Math.max(velocity, 0.0001) * preset.gainLevel * 0.35,
      audioCtx.currentTime + effectiveAttack
    );
    osc3.connect(partialGain);
    partialGain.connect(filter);
    osc3.start();
    activeOscillators[midiNote] = activeOscillators[midiNote] || {};
  }

  filter.connect(gain);
  gain.connect(reverbDry);
  gain.connect(reverbNode);

  osc.start();
  osc2.start();

  // If a fast-decay preset (pluck), start decaying gain immediately after attack
  if (preset.fastDecay) {
    const decayTime = audioCtx.currentTime + effectiveAttack + 0.25;
    gain.gain.setTargetAtTime(0.0001, decayTime, 0.15);
  }

  activeOscillators[midiNote] = { osc, osc2, osc3, filter, gain };
  applyPitchModToVoice(activeOscillators[midiNote]);

  const keyEl = keyEls[midiNote];
  if (keyEl) keyEl.classList.add('active');

  pulseSignalLine();
  sendMidiNote(midiNote, velocity, 0, true);
}

function noteOff(midiNote) {
  const voice = activeOscillators[midiNote];
  if (!voice) return;

  const release = parseFloat(document.getElementById('releaseKnob').value);
  const t = audioCtx.currentTime;
  const safeRelease = Math.max(release, 0.02);

  voice.gain.gain.cancelScheduledValues(t);
  voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), t);
  voice.gain.gain.exponentialRampToValueAtTime(0.0001, t + safeRelease);

  voice.osc.stop(t + safeRelease + 0.05);
  voice.osc2.stop(t + safeRelease + 0.05);
  if (voice.osc3) voice.osc3.stop(t + safeRelease + 0.05);

  delete activeOscillators[midiNote];

  const keyEl = keyEls[midiNote];
  if (keyEl) keyEl.classList.remove('active');

  sendMidiNote(midiNote, 0, 0, false);
}

// Build / rebuild the 61-key layout (called on init and octave shift)
function buildKeyboard() {
  // Release any currently sounding notes
  Object.keys(activeOscillators).forEach(note => noteOff(parseInt(note)));

  keyboardEl.innerHTML = '';
  for (const k in keyEls) delete keyEls[k];

  let whiteKeyIndex = 0;
  const startMidi = KEYBOARD_START_MIDI + (octaveShift * 12);

  for (let i = 0; i < KEYBOARD_KEY_COUNT; i++) {
    const midiNote = startMidi + i;
    const noteInOctave = ((midiNote % 12) + 12) % 12;
    const isBlack = BLACK_KEY_OFFSETS.includes(noteInOctave);
    const noteName = NOTE_NAMES[noteInOctave];
    const octaveNum = Math.floor(midiNote / 12) - 1;

    const keyEl = document.createElement('div');
    keyEl.dataset.midi = midiNote;
    keyEl.innerHTML = `<span class="key-label">${noteName}${octaveNum}</span>`;

    if (isBlack) {
      keyEl.className = 'key black';
      keyEl.style.left = (whiteKeyIndex * WHITE_KEY_WIDTH - 8) + 'px';
      keyboardEl.appendChild(keyEl);
    } else {
      keyEl.className = 'key white';
      keyboardEl.appendChild(keyEl);
      whiteKeyIndex++;
    }

    keyEls[midiNote] = keyEl;

    keyEl.addEventListener('mousedown', () => noteOn(midiNote, 0.9));
    keyEl.addEventListener('mouseup', () => noteOff(midiNote));
    keyEl.addEventListener('mouseleave', () => noteOff(midiNote));
  }

  keyboardEl.style.width = (whiteKeyIndex * WHITE_KEY_WIDTH) + 'px';
}

buildKeyboard();

// Reverb wet amount
document.getElementById('reverbKnob').addEventListener('input', (e) => {
  reverbWet.gain.value = parseFloat(e.target.value);
});

// Synth preset selector
document.getElementById('presetSelect').addEventListener('change', (e) => {
  currentPreset = e.target.value;
});

// Octave shift
const octDisplay = document.getElementById('octDisplay');

document.getElementById('octUp').addEventListener('click', () => {
  if (octaveShift < 2) {
    octaveShift++;
    octDisplay.textContent = 4 + octaveShift;
    buildKeyboard();
  }
});
document.getElementById('octDown').addEventListener('click', () => {
  if (octaveShift > -2) {
    octaveShift--;
    octDisplay.textContent = 4 + octaveShift;
    buildKeyboard();
  }
});

// Computer keyboard -> synth notes (H J K L ; ' / Y U I O P)
const heldComputerKeys = new Set();

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (heldComputerKeys.has(key)) return;

  if (COMPUTER_KEY_MAP.hasOwnProperty(key)) {
    // Prevent browser default (e.g. <select> jumping to an option matching this letter)
    if (document.activeElement && (document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'INPUT')) {
      document.activeElement.blur();
    }
    e.preventDefault();
    heldComputerKeys.add(key);
    const baseMidi = 60 + (octaveShift * 12); // C4 reference
    const midiNote = baseMidi + COMPUTER_KEY_MAP[key];
    noteOn(midiNote, 0.9);
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (COMPUTER_KEY_MAP.hasOwnProperty(key)) {
    heldComputerKeys.delete(key);
    const baseMidi = 60 + (octaveShift * 12);
    const midiNote = baseMidi + COMPUTER_KEY_MAP[key];
    noteOff(midiNote);
  }
});

// ============================================================
// VIEW TOGGLE - Drums / Keys / Both
// ============================================================
const drumModule = document.getElementById('drumModule');
const keysModule = document.getElementById('keysModule');
const signalDivider = document.getElementById('signalDivider');
const toggleBtns = document.querySelectorAll('.toggle-btn');

toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    toggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const view = btn.dataset.view;
    if (view === 'drums') {
      drumModule.classList.remove('hidden');
      keysModule.classList.add('hidden');
      signalDivider.classList.add('hidden');
    } else if (view === 'keys') {
      drumModule.classList.add('hidden');
      keysModule.classList.remove('hidden');
      signalDivider.classList.add('hidden');
    } else {
      drumModule.classList.remove('hidden');
      keysModule.classList.remove('hidden');
      signalDivider.classList.remove('hidden');
    }
  });
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