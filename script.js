/* ==========================================================
   NOVA-8 — script.js
   Single consolidated file for the whole project.

   Sections:
     1. AUDIO ENGINE — Web Audio synthesis for all 8 voices
     2. SEQUENCER     — step grid, transport, loop length (placeholder)
     3. MIDI I/O       — Web MIDI in/out (placeholder)
     4. UI WIRING      — connects DOM elements to the above
   ========================================================== */


/* ==========================================================
   1. AUDIO ENGINE
   All 8 drum voices are fully synthesized (no sample files).
   Two source types get reused across voices:
     - oscillator "tone" hits (kick, snare body, rim, tom)
     - filtered-noise "noise" hits (snare, clap, hats, crash)
   Every hit is just: source -> (optional filter) -> gain envelope -> master
   ========================================================== */

const AudioEngine = (() => {

  let ctx = null;
  let masterGain = null;
  let noiseBuffer = null;

  // Must run after a user gesture (browsers block audio until then) —
  // trigger() calls this itself, so callers don't need to think about it.
  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(ctx.destination);
    noiseBuffer = buildNoiseBuffer();
  }

  // Web Audio has no built-in noise source, so we build one:
  // a buffer filled with random samples, played back like a sample.
  function buildNoiseBuffer() {
    const length = ctx.sampleRate * 2; // 2s is enough for even the longest tail (crash)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function noiseSource() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    return src;
  }

  // Percussive envelope: snap up to peak, decay back down.
  // Exponential ramps read as more "natural" than linear for drum hits,
  // but exponentialRampToValueAtTime can't target 0 exactly, so we ramp
  // to a tiny non-zero floor instead.
  function applyEnvelope(gainNode, startTime, peak, decayTime) {
    const FLOOR = 0.0001;
    gainNode.gain.cancelScheduledValues(startTime);
    gainNode.gain.setValueAtTime(FLOOR, startTime);
    gainNode.gain.exponentialRampToValueAtTime(peak, startTime + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(FLOOR, startTime + decayTime);
  }

  /* ---------------- Individual voices ---------------- */

  function playKick(time) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.15);
    applyEnvelope(gain, time, 1.0, 0.28);
    osc.connect(gain).connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  function playSnare(time) {
    // noise body
    const noise = noiseSource();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1800;
    const noiseGain = ctx.createGain();
    applyEnvelope(noiseGain, time, 0.9, 0.16);
    noise.connect(noiseFilter).connect(noiseGain).connect(masterGain);
    noise.start(time);
    noise.stop(time + 0.2);

    // tonal thump underneath
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 190;
    const oscGain = ctx.createGain();
    applyEnvelope(oscGain, time, 0.5, 0.1);
    osc.connect(oscGain).connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  function playClap(time) {
    // three quick noise bursts = the "flam" of a clap
    const burstOffsets = [0, 0.012, 0.024];
    burstOffsets.forEach((offset) => {
      const t = time + offset;
      const noise = noiseSource();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      const gain = ctx.createGain();
      applyEnvelope(gain, t, 0.6, 0.03);
      noise.connect(filter).connect(gain).connect(masterGain);
      noise.start(t);
      noise.stop(t + 0.04);
    });
    // longer tail after the bursts
    const tailStart = time + 0.036;
    const tailNoise = noiseSource();
    const tailFilter = ctx.createBiquadFilter();
    tailFilter.type = 'bandpass';
    tailFilter.frequency.value = 1200;
    const tailGain = ctx.createGain();
    applyEnvelope(tailGain, tailStart, 0.5, 0.15);
    tailNoise.connect(tailFilter).connect(tailGain).connect(masterGain);
    tailNoise.start(tailStart);
    tailNoise.stop(tailStart + 0.16);
  }

  function playRim(time) {
    const osc1 = ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.value = 400;
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 520;
    const gain = ctx.createGain();
    applyEnvelope(gain, time, 0.4, 0.05);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(masterGain);
    osc1.start(time); osc1.stop(time + 0.06);
    osc2.start(time); osc2.stop(time + 0.06);
  }

  function playClosedHat(time) {
    const noise = noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    applyEnvelope(gain, time, 0.5, 0.05);
    noise.connect(filter).connect(gain).connect(masterGain);
    noise.start(time);
    noise.stop(time + 0.06);
  }

  function playOpenHat(time) {
    const noise = noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    applyEnvelope(gain, time, 0.5, 0.3);
    noise.connect(filter).connect(gain).connect(masterGain);
    noise.start(time);
    noise.stop(time + 0.32);
  }

  function playTom(time) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.18);
    applyEnvelope(gain, time, 0.9, 0.24);
    osc.connect(gain).connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.26);
  }

  function playCrash(time) {
    const noise = noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    const gain = ctx.createGain();
    applyEnvelope(gain, time, 0.45, 1.4);
    noise.connect(filter).connect(gain).connect(masterGain);
    noise.start(time);
    noise.stop(time + 1.5);
  }

  const voiceMap = {
    kick: playKick,
    snare: playSnare,
    clap: playClap,
    rim: playRim,
    closedhat: playClosedHat,
    openhat: playOpenHat,
    tom: playTom,
    crash: playCrash,
  };

  // Public entry point. `time` lets the future sequencer schedule hits
  // precisely in advance; omit it to play immediately (used by pad clicks).
  function trigger(voiceName, time) {
    init();
    const playFn = voiceMap[voiceName];
    if (!playFn) return;
    playFn(time !== undefined ? time : ctx.currentTime);
  }

  function getContext() {
    init();
    return ctx;
  }

  return { init, trigger, getContext };
})();


/* ==========================================================
   2. SEQUENCER
   Pattern data + step grid (Step 1) plus, now, a real
   transport clock: play/stop, tempo, a moving playhead,
   and a pre-loaded demo beat.

   Timing approach: browsers can't be trusted to fire
   setInterval/setTimeout exactly on time, so we use the
   standard Web Audio "lookahead scheduler" pattern — every
   25ms we check the audio clock and schedule any notes that
   fall within the next 100ms directly on the AudioContext's
   sample-accurate clock. The playhead square lights up in
   sync via a setTimeout matched to each note's scheduled time.
   ========================================================== */

const Sequencer = (() => {

  const VOICES = ['kick', 'snare', 'clap', 'rim', 'closedhat', 'openhat', 'tom', 'crash'];
  const MAX_STEPS = 64; // 4 bars x 16 steps — the largest loop length we support

  const patterns = {};
  VOICES.forEach((voice) => {
    patterns[voice] = new Array(MAX_STEPS).fill(false);
  });

  let currentVoice = 'kick';
  let bars = 1; // 1, 2, or 4 — set via the transport's bar-length switch
  let playheadStep = -1; // -1 = not playing / nothing lit

  let stepLaneEl = null;
  let editingVoiceLabelEl = null;

  /* ---------------- Setup ---------------- */

  function init() {
    stepLaneEl = document.getElementById('stepLane');
    editingVoiceLabelEl = document.getElementById('editingVoice');
    loadDemoPattern();
    renderStepLane();
  }

  // A simple built-in beat so the machine demonstrates itself
  // the moment it loads, before the user programs anything.
  function loadDemoPattern() {
    patterns.kick[0] = true;
    patterns.kick[6] = true;
    patterns.kick[10] = true;
    patterns.snare[4] = true;
    patterns.snare[12] = true;
    for (let i = 0; i < 16; i += 2) {
      patterns.closedhat[i] = true;
    }
  }

  /* ---------------- Grid state + rendering ---------------- */

  function stepsCount() {
    return bars * 16;
  }

  // Called when a pad is clicked — switches which voice's
  // pattern the shared step lane is displaying/editing.
  function selectVoice(voice) {
    if (!patterns[voice]) return;
    currentVoice = voice;
    if (editingVoiceLabelEl) editingVoiceLabelEl.textContent = voice.toUpperCase();
    renderStepLane();
  }

  // Called when the 1/2/4 bar segmented switch changes.
  function setBars(newBars) {
    bars = newBars;
    renderStepLane();
  }

  function toggleStep(index) {
    patterns[currentVoice][index] = !patterns[currentVoice][index];
    renderStepLane();
  }

  // Wipes every voice's pattern back to blank — a fresh start,
  // whether that's the built-in demo beat or the user's own edits.
  function clearAll() {
    VOICES.forEach((voice) => {
      patterns[voice].fill(false);
    });
    renderStepLane();
  }

  function renderStepLane() {
    if (!stepLaneEl) return;
    stepLaneEl.innerHTML = '';
    const count = stepsCount();
    for (let i = 0; i < count; i++) {
      const stepBtn = document.createElement('button');
      stepBtn.type = 'button';
      stepBtn.className = 'step';
      if (i % 4 === 0) stepBtn.classList.add('beat-marker');
      if (patterns[currentVoice][i]) stepBtn.classList.add('active');
      if (i === playheadStep) stepBtn.classList.add('playhead');
      stepBtn.setAttribute('aria-label', `${currentVoice} step ${i + 1}`);
      stepBtn.addEventListener('click', () => toggleStep(i));
      stepLaneEl.appendChild(stepBtn);
    }
  }

  /* ---------------- Transport clock ---------------- */

  let isPlaying = false;
  let tempo = 96; // BPM
  let currentStep = 0; // global step counter, independent of which voice is displayed
  let nextNoteTime = 0.0;
  let timerID = null;

  const SCHEDULE_AHEAD_TIME = 0.1; // seconds — how far ahead we schedule audio
  const LOOKAHEAD = 25; // ms — how often the scheduler wakes up to check

  function stepDurationSeconds() {
    return (60 / tempo) / 4; // one 16th note
  }

  function scheduleStep(stepNumber, time) {
    VOICES.forEach((voice) => {
      if (patterns[voice][stepNumber % stepsCount()]) {
        AudioEngine.trigger(voice, time);
      }
    });
    scheduleVisualUpdate(stepNumber % stepsCount(), time);
  }

  // Keeps the playhead square lit in sync with when the audio
  // actually sounds, not when it was scheduled.
  function scheduleVisualUpdate(stepNumber, time) {
    const ctx = AudioEngine.getContext();
    const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
    setTimeout(() => {
      playheadStep = stepNumber;
      renderStepLane();
    }, delayMs);
  }

  function advanceStep() {
    nextNoteTime += stepDurationSeconds();
    currentStep = (currentStep + 1) % stepsCount();
  }

  function schedulerLoop() {
    const ctx = AudioEngine.getContext();
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_TIME) {
      scheduleStep(currentStep, nextNoteTime);
      advanceStep();
    }
    timerID = setTimeout(schedulerLoop, LOOKAHEAD);
  }

  function play() {
    if (isPlaying) return;
    isPlaying = true;
    const ctx = AudioEngine.getContext();
    currentStep = 0;
    nextNoteTime = ctx.currentTime + 0.05;
    schedulerLoop();
  }

  function stop() {
    isPlaying = false;
    clearTimeout(timerID);
    playheadStep = -1;
    renderStepLane();
  }

  function setTempo(bpm) {
    tempo = bpm;
  }

  return { init, selectVoice, setBars, play, stop, setTempo, clearAll };
})();


/* ==========================================================
   3. MIDI I/O
   Placeholder for a later session: Web MIDI API setup,
   Note On/Off out per step trigger, and Clock/transport sync.
   ========================================================== */

const MidiIO = (() => {
  // to be built in a later session
  return {};
})();


/* ==========================================================
   4. UI WIRING
   This session: pads play sound + pads select which voice
   the (future) sequencer will edit.
   Sequencer step logic, tempo/loop controls, and MIDI status
   are wired in later sessions.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  Sequencer.init();

  const pads = document.querySelectorAll('.pad');
  const editingVoiceLabel = document.getElementById('editingVoice');

  pads.forEach((pad) => {
    pad.addEventListener('click', () => {
      const voice = pad.dataset.voice;

      // Play the sound immediately
      AudioEngine.trigger(voice);

      // Momentary "triggered" flash
      pad.classList.add('triggered');
      setTimeout(() => pad.classList.remove('triggered'), 120);

      // Persistent "selected" state — this pad is now the one
      // the shared sequencer below will edit
      pads.forEach((p) => p.classList.remove('selected'));
      pad.classList.add('selected');
      if (editingVoiceLabel) {
        editingVoiceLabel.textContent = voice.toUpperCase();
      }

      // Tell the sequencer to show/edit this voice's pattern
      Sequencer.selectVoice(voice);
    });
  });

  const segButtons = document.querySelectorAll('.seg-btn');
  segButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      segButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      Sequencer.setBars(parseInt(btn.dataset.bars, 10));
    });
  });

  const playBtn = document.getElementById('playBtn');
  const stopBtn = document.getElementById('stopBtn');

  playBtn.addEventListener('click', () => {
    Sequencer.play();
    playBtn.setAttribute('aria-pressed', 'true');
  });

  stopBtn.addEventListener('click', () => {
    Sequencer.stop();
    playBtn.setAttribute('aria-pressed', 'false');
  });

  const tempoRange = document.getElementById('tempoRange');
  const tempoValueEl = document.getElementById('tempoValue');

  tempoRange.addEventListener('input', () => {
    const bpm = parseInt(tempoRange.value, 10);
    Sequencer.setTempo(bpm);
    // Rebuild the readout, keeping the "BPM" sub-label that already lives inside it
    tempoValueEl.innerHTML = `${String(bpm).padStart(3, '0')}<span class="unit-sub">BPM</span>`;
  });

  const clearBtn = document.getElementById('clearBtn');
  clearBtn.addEventListener('click', () => {
    Sequencer.clearAll();
  });

});