// ============================================================
// SOPH & TAL MUSIC STUDIO — script.js
// TAL16 drum machine + SOPH61 keyboard synth
// MIDI output ready for Ableton Live
// ============================================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const masterFXInput = audioCtx.createGain();
masterFXInput.gain.value = 1.0;
const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.7;
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
masterGain.connect(analyser);
analyser.connect(audioCtx.destination);

// ---- HPF / LPF ----
const masterHPF = audioCtx.createBiquadFilter();
masterHPF.type = 'highpass';
masterHPF.frequency.value = 20;
const masterLPF = audioCtx.createBiquadFilter();
masterLPF.type = 'lowpass';
masterLPF.frequency.value = 20000;

// ---- Flanger ----
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
flangeWet.gain.value = 0;
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

// ---- Phaser ----
const phaserInput = audioCtx.createGain();
const phaserStages = [];
for (let i = 0; i < 4; i++) {
  const ap = audioCtx.createBiquadFilter();
  ap.type = 'allpass'; ap.frequency.value = 800; phaserStages.push(ap);
}
for (let i = 0; i < phaserStages.length - 1; i++) phaserStages[i].connect(phaserStages[i+1]);
const phaserLFO = audioCtx.createOscillator();
phaserLFO.frequency.value = 0.3;
const phaserLFODepth = audioCtx.createGain();
phaserLFODepth.gain.value = 600;
phaserLFO.connect(phaserLFODepth);
phaserStages.forEach(ap => phaserLFODepth.connect(ap.frequency));
phaserLFO.start();
const phaserWet = audioCtx.createGain(); phaserWet.gain.value = 0;
const phaserDry = audioCtx.createGain(); phaserDry.gain.value = 1;
const phaserOutput = audioCtx.createGain();
phaserInput.connect(phaserStages[0]);
phaserInput.connect(phaserDry);
phaserStages[phaserStages.length-1].connect(phaserWet);
phaserWet.connect(phaserOutput);
phaserDry.connect(phaserOutput);

// ---- Chorus/Detune ----
const chorusInput = audioCtx.createGain();
const chorusDelay = audioCtx.createDelay(0.05);
chorusDelay.delayTime.value = 0.012;
const chorusLFO = audioCtx.createOscillator();
chorusLFO.frequency.value = 1.1;
const chorusLFODepth = audioCtx.createGain();
chorusLFODepth.gain.value = 0.004;
const chorusWet = audioCtx.createGain(); chorusWet.gain.value = 0;
const chorusDry = audioCtx.createGain(); chorusDry.gain.value = 1;
const chorusOutput = audioCtx.createGain();
chorusLFO.connect(chorusLFODepth);
chorusLFODepth.connect(chorusDelay.delayTime);
chorusLFO.start();
chorusInput.connect(chorusDelay);
chorusInput.connect(chorusDry);
chorusDelay.connect(chorusWet);
chorusWet.connect(chorusOutput);
chorusDry.connect(chorusOutput);

// ---- Wire FX chain ----
masterFXInput.connect(masterHPF);
masterHPF.connect(masterLPF);
masterLPF.connect(flangeInput);
flangeOutput.connect(phaserInput);
phaserOutput.connect(chorusInput);
chorusOutput.connect(masterGain);

// ---- Reverb ----
function createReverbImpulse(duration=2, decay=2) {
  const rate = audioCtx.sampleRate, length = rate * duration;
  const impulse = audioCtx.createBuffer(2, length, rate);
  for (let ch=0; ch<2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i=0; i<length; i++) data[i] = (Math.random()*2-1) * Math.pow(1-i/length, decay);
  }
  return impulse;
}
const reverbNode = audioCtx.createConvolver();
reverbNode.buffer = createReverbImpulse(2.2, 2.5);
const reverbWet = audioCtx.createGain(); reverbWet.gain.value = 0.25;
const reverbDry = audioCtx.createGain(); reverbDry.gain.value = 1.0;
reverbNode.connect(reverbWet);
reverbWet.connect(masterFXInput);
reverbDry.connect(masterFXInput);

// ---- Meter ----
const meterFill = document.getElementById('meterFill');
const meterData = new Uint8Array(analyser.frequencyBinCount);
function updateMeter() {
  analyser.getByteFrequencyData(meterData);
  let sum = 0;
  for (let i=0; i<meterData.length; i++) sum += meterData[i];
  meterFill.style.width = Math.min(100, (sum/meterData.length/90)*100) + '%';
  requestAnimationFrame(updateMeter);
}
updateMeter();

// ---- Signal line pulse ----
const signalLine = document.getElementById('signalLine');
let pulseTimeout = null;
function pulseSignalLine() {
  signalLine.classList.add('pulse');
  clearTimeout(pulseTimeout);
  pulseTimeout = setTimeout(() => signalLine.classList.remove('pulse'), 120);
}

// ---- FX controls ----
document.getElementById('hpfKnob').addEventListener('input', e => { masterHPF.frequency.value = parseFloat(e.target.value); });
document.getElementById('lpfKnob').addEventListener('input', e => { masterLPF.frequency.value = parseFloat(e.target.value); });
document.getElementById('flangeKnob').addEventListener('input', e => {
  const v = parseFloat(e.target.value);
  flangeWet.gain.value = v; flangeDry.gain.value = 1-v*0.5; flangeFeedback.gain.value = v*0.5;
});
document.getElementById('phaserKnob').addEventListener('input', e => {
  const v = parseFloat(e.target.value); phaserWet.gain.value = v; phaserDry.gain.value = 1-v*0.3;
});
document.getElementById('detuneKnob').addEventListener('input', e => {
  const v = parseFloat(e.target.value); chorusWet.gain.value = v; chorusDry.gain.value = 1; chorusLFODepth.gain.value = 0.002+v*0.006;
});
document.getElementById('masterVol').addEventListener('input', e => { masterGain.gain.value = parseFloat(e.target.value); });

// ---- MIDI ----
let midiOutputs = [], activeMidiOutput = null;
const midiDot = document.getElementById('midiDot');
const midiValue = document.getElementById('midiValue');
const midiOutSelect = document.getElementById('midiOutSelect');

if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then(midiAccess => {
    function refreshOutputs() {
      midiOutputs = Array.from(midiAccess.outputs.values());
      midiOutSelect.innerHTML = '';
      if (!midiOutputs.length) {
        midiOutSelect.innerHTML = '<option value="">No MIDI outputs found</option>';
        midiDot.classList.remove('connected'); midiValue.textContent = 'NONE'; activeMidiOutput = null; return;
      }
      midiOutputs.forEach((output, i) => {
        const opt = document.createElement('option'); opt.value = i; opt.textContent = output.name; midiOutSelect.appendChild(opt);
      });
      activeMidiOutput = midiOutputs[0]; midiDot.classList.add('connected'); midiValue.textContent = 'READY';
    }
    refreshOutputs(); midiAccess.onstatechange = refreshOutputs;
    midiOutSelect.addEventListener('change', e => { activeMidiOutput = midiOutputs[parseInt(e.target.value)] || null; });
  }).catch(() => { midiValue.textContent = 'DENIED'; });
} else { midiValue.textContent = 'UNSUPPORTED'; }

function sendMidiNote(note, velocity, channel=0, on=true) {
  if (!activeMidiOutput) return;
  activeMidiOutput.send([(on?0x90:0x80)|(channel&0x0f), note, Math.round(velocity*127)]);
}

// ============================================================
// TAL16 DRUM MACHINE
// ============================================================

const DRUM_LABELS = ['KICK','SNARE','CLAP','RIM','CH','OH','TOM 1','TOM 2','SHAKER','TAMB','COWBELL','CRASH','RIDE','SFX 1','SFX 2','SUB'];
const PAD_KEYS    = ['1','2','3','4','5','6','7','8','Q','W','E','R','T','Y','U','I'];
const DRUM_MIDI_BASE = 36;

// ---- Voice primitives ----
function synthKickV(o) {
  const{startFreq=180,endFreq=50,duration=0.4,type='sine',click=true,subLevel=0.5}=o, t=audioCtx.currentTime;
  const osc=audioCtx.createOscillator(), g=audioCtx.createGain();
  osc.type=type; osc.frequency.setValueAtTime(startFreq,t); osc.frequency.exponentialRampToValueAtTime(endFreq,t+0.09);
  g.gain.setValueAtTime(1,t); g.gain.exponentialRampToValueAtTime(0.001,t+duration);
  osc.connect(g); g.connect(masterFXInput); osc.start(t); osc.stop(t+duration);
  if(subLevel>0){const s=audioCtx.createOscillator(),sg=audioCtx.createGain();s.type='sine';s.frequency.setValueAtTime(endFreq*0.9,t);sg.gain.setValueAtTime(subLevel,t);sg.gain.exponentialRampToValueAtTime(0.001,t+duration*1.3);s.connect(sg);sg.connect(masterFXInput);s.start(t);s.stop(t+duration*1.3);}
  if(click){const n=audioCtx.createBufferSource(),buf=audioCtx.createBuffer(1,Math.floor(audioCtx.sampleRate*0.01),audioCtx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;n.buffer=buf;const cg=audioCtx.createGain();cg.gain.setValueAtTime(0.5,t);cg.gain.exponentialRampToValueAtTime(0.001,t+0.01);n.connect(cg);cg.connect(masterFXInput);n.start(t);}
}
function synthSnareV(o) {
  const{noiseDecay=0.18,noiseFreq=1800,toneFreq=180,toneDecay=0.1,toneLevel=0.4,noiseType='highpass'}=o,t=audioCtx.currentTime;
  const bsz=Math.floor(audioCtx.sampleRate*noiseDecay),buf=audioCtx.createBuffer(1,bsz,audioCtx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<bsz;i++)d[i]=Math.random()*2-1;
  const n=audioCtx.createBufferSource();n.buffer=buf;
  const f=audioCtx.createBiquadFilter();f.type=noiseType;f.frequency.value=noiseFreq;
  const g=audioCtx.createGain();g.gain.setValueAtTime(0.9,t);g.gain.exponentialRampToValueAtTime(0.001,t+noiseDecay);
  n.connect(f);f.connect(g);g.connect(masterFXInput);n.start(t);n.stop(t+noiseDecay);
  if(toneLevel>0){const o2=audioCtx.createOscillator(),g2=audioCtx.createGain();o2.type='triangle';o2.frequency.setValueAtTime(toneFreq,t);o2.frequency.exponentialRampToValueAtTime(toneFreq*0.6,t+toneDecay);g2.gain.setValueAtTime(toneLevel,t);g2.gain.exponentialRampToValueAtTime(0.001,t+toneDecay);o2.connect(g2);g2.connect(masterFXInput);o2.start(t);o2.stop(t+toneDecay);}
}
function synthClapV(o) {
  const{duration=0.12,filterFreq=1500,bursts=4,spacing=0.012,tailDecay=0.25}=o,t=audioCtx.currentTime;
  for(let b=0;b<bursts;b++){const bsz=Math.floor(audioCtx.sampleRate*duration),buf=audioCtx.createBuffer(1,bsz,audioCtx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<bsz;i++)d[i]=Math.random()*2-1;const n=audioCtx.createBufferSource();n.buffer=buf;const f=audioCtx.createBiquadFilter();f.type='bandpass';f.frequency.value=filterFreq;f.Q.value=1.5;const g=audioCtx.createGain(),st=t+b*spacing,dur=b===bursts-1?tailDecay:duration;g.gain.setValueAtTime(0.7,st);g.gain.exponentialRampToValueAtTime(0.001,st+dur);n.connect(f);f.connect(g);g.connect(masterFXInput);n.start(st);n.stop(st+dur);}
}
function synthHatV(o) {
  const{duration=0.06,hpfFreq=7000,level=0.35}=o,t=audioCtx.currentTime;
  const freqs=[320,540,800,1100,1450],mg=audioCtx.createGain();mg.gain.value=level;
  const hpf=audioCtx.createBiquadFilter();hpf.type='highpass';hpf.frequency.value=hpfFreq;
  const bpf=audioCtx.createBiquadFilter();bpf.type='bandpass';bpf.frequency.value=hpfFreq*1.4;
  mg.connect(hpf);hpf.connect(bpf);bpf.connect(masterFXInput);
  freqs.forEach(freq=>{const o2=audioCtx.createOscillator(),og=audioCtx.createGain();o2.type='square';o2.frequency.value=freq;og.gain.setValueAtTime(1,t);og.gain.exponentialRampToValueAtTime(0.001,t+duration);o2.connect(og);og.connect(mg);o2.start(t);o2.stop(t+duration);});
}
function synthTomV(o) {
  const{startFreq=200,endFreq=90,duration=0.35}=o,t=audioCtx.currentTime;
  const osc=audioCtx.createOscillator(),g=audioCtx.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(startFreq,t);osc.frequency.exponentialRampToValueAtTime(endFreq,t+duration*0.7);
  g.gain.setValueAtTime(0.9,t);g.gain.exponentialRampToValueAtTime(0.001,t+duration);
  osc.connect(g);g.connect(masterFXInput);osc.start(t);osc.stop(t+duration);
}
function synthShakerV(o) {
  const{duration=0.12,bpfFreq=6000,level=0.4}=o,t=audioCtx.currentTime;
  const bsz=Math.floor(audioCtx.sampleRate*duration),buf=audioCtx.createBuffer(1,bsz,audioCtx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<bsz;i++)d[i]=Math.random()*2-1;
  const n=audioCtx.createBufferSource();n.buffer=buf;
  const f=audioCtx.createBiquadFilter();f.type='bandpass';f.frequency.value=bpfFreq;f.Q.value=0.8;
  const g=audioCtx.createGain();g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(0.001,t+duration);
  n.connect(f);f.connect(g);g.connect(masterFXInput);n.start(t);n.stop(t+duration);
}
function synthTambourineV(o) {
  const{layers=3,duration=0.2,baseFreq=5000}=o,t=audioCtx.currentTime;
  for(let l=0;l<layers;l++){const bsz=Math.floor(audioCtx.sampleRate*duration),buf=audioCtx.createBuffer(1,bsz,audioCtx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<bsz;i++)d[i]=Math.random()*2-1;const n=audioCtx.createBufferSource();n.buffer=buf;const f=audioCtx.createBiquadFilter();f.type='bandpass';f.frequency.value=baseFreq+l*1800;f.Q.value=3;const g=audioCtx.createGain(),st=t+l*0.008;g.gain.setValueAtTime(0.35,st);g.gain.exponentialRampToValueAtTime(0.001,st+duration);n.connect(f);f.connect(g);g.connect(masterFXInput);n.start(st);n.stop(st+duration);}
}
function synthCowbellV(o) {
  const{freq1=800,freq2=540,duration=0.3}=o,t=audioCtx.currentTime;
  [freq1,freq2].forEach(freq=>{const osc=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter();osc.type='square';osc.frequency.value=freq;f.type='bandpass';f.frequency.value=freq;f.Q.value=2;g.gain.setValueAtTime(0.5,t);g.gain.exponentialRampToValueAtTime(0.001,t+duration);osc.connect(f);f.connect(g);g.connect(masterFXInput);osc.start(t);osc.stop(t+duration);});
}
function synthCymbalV(o) {
  const{duration=0.8,hpfFreq=5000,level=0.3,decayShape=1}=o,t=audioCtx.currentTime;
  const bsz=Math.floor(audioCtx.sampleRate*duration),buf=audioCtx.createBuffer(1,bsz,audioCtx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<bsz;i++)d[i]=Math.random()*2-1;
  const n=audioCtx.createBufferSource();n.buffer=buf;
  const hpf=audioCtx.createBiquadFilter();hpf.type='highpass';hpf.frequency.value=hpfFreq;
  const bpf=audioCtx.createBiquadFilter();bpf.type='bandpass';bpf.frequency.value=hpfFreq*1.2;
  const g=audioCtx.createGain();g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(0.0005,t+duration*decayShape);
  n.connect(hpf);hpf.connect(bpf);bpf.connect(g);g.connect(masterFXInput);n.start(t);n.stop(t+duration);
}
function synthSweepV(o) {
  const{fromFreq=400,toFreq=2000,duration=0.3,type='sine',level=0.5}=o,t=audioCtx.currentTime;
  const osc=audioCtx.createOscillator(),g=audioCtx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(fromFreq,t);osc.frequency.exponentialRampToValueAtTime(toFreq,t+duration);
  g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(0.001,t+duration);
  osc.connect(g);g.connect(masterFXInput);osc.start(t);osc.stop(t+duration);
}
function synthSubV(o) {
  const{freq=45,duration=0.6}=o,t=audioCtx.currentTime;
  const osc=audioCtx.createOscillator(),g=audioCtx.createGain();
  osc.type='sine';osc.frequency.value=freq;g.gain.setValueAtTime(0.9,t);g.gain.exponentialRampToValueAtTime(0.001,t+duration);
  osc.connect(g);g.connect(masterFXInput);osc.start(t);osc.stop(t+duration);
}

// ---- Kits ----
const KITS = {
  analog:    { name:'Analog',    voices:[()=>synthKickV({startFreq:150,endFreq:50,duration:0.45,type:'sine',subLevel:0.4}),()=>synthSnareV({noiseDecay:0.18,noiseFreq:1600,toneFreq:180,toneDecay:0.1,toneLevel:0.45}),()=>synthClapV({duration:0.1,filterFreq:1400,bursts:4,spacing:0.012,tailDecay:0.22}),()=>synthHatV({duration:0.04,hpfFreq:5500,level:0.3}),()=>synthHatV({duration:0.05,hpfFreq:8000,level:0.32}),()=>synthHatV({duration:0.35,hpfFreq:7000,level:0.28}),()=>synthTomV({startFreq:180,endFreq:100,duration:0.32}),()=>synthTomV({startFreq:240,endFreq:130,duration:0.28}),()=>synthShakerV({duration:0.1,bpfFreq:6000,level:0.35}),()=>synthTambourineV({layers:3,duration:0.18,baseFreq:5000}),()=>synthCowbellV({freq1:800,freq2:540,duration:0.28}),()=>synthCymbalV({duration:0.9,hpfFreq:5000,level:0.28,decayShape:1}),()=>synthCymbalV({duration:0.6,hpfFreq:6500,level:0.22,decayShape:0.7}),()=>synthSweepV({fromFreq:2000,toFreq:200,duration:0.3,type:'sine',level:0.4}),()=>synthSweepV({fromFreq:300,toFreq:1800,duration:0.25,type:'triangle',level:0.35}),()=>synthSubV({freq:45,duration:0.5})] },
  trap808:   { name:'808/Trap',  voices:[()=>synthKickV({startFreq:120,endFreq:40,duration:0.7,type:'sine',subLevel:0.8,click:true}),()=>synthSnareV({noiseDecay:0.22,noiseFreq:2200,toneFreq:200,toneDecay:0.08,toneLevel:0.3}),()=>synthClapV({duration:0.09,filterFreq:2000,bursts:5,spacing:0.01,tailDecay:0.28}),()=>synthHatV({duration:0.03,hpfFreq:7000,level:0.32}),()=>synthHatV({duration:0.04,hpfFreq:9000,level:0.34}),()=>synthHatV({duration:0.5,hpfFreq:8500,level:0.3}),()=>synthTomV({startFreq:150,endFreq:70,duration:0.4}),()=>synthTomV({startFreq:200,endFreq:95,duration:0.35}),()=>synthShakerV({duration:0.08,bpfFreq:7000,level:0.3}),()=>synthTambourineV({layers:3,duration:0.15,baseFreq:6000}),()=>synthCowbellV({freq1:900,freq2:600,duration:0.25}),()=>synthCymbalV({duration:1.1,hpfFreq:4500,level:0.3,decayShape:1.1}),()=>synthCymbalV({duration:0.7,hpfFreq:6000,level:0.24,decayShape:0.8}),()=>synthSweepV({fromFreq:3000,toFreq:150,duration:0.4,type:'sawtooth',level:0.45}),()=>synthSweepV({fromFreq:200,toFreq:2500,duration:0.3,type:'square',level:0.35}),()=>synthSubV({freq:38,duration:0.8})] },
  acoustic:  { name:'Acoustic',  voices:[()=>synthKickV({startFreq:170,endFreq:65,duration:0.4,type:'sine',subLevel:0.3,click:true}),()=>synthSnareV({noiseDecay:0.25,noiseFreq:1400,toneFreq:210,toneDecay:0.14,toneLevel:0.5}),()=>synthClapV({duration:0.13,filterFreq:1300,bursts:3,spacing:0.015,tailDecay:0.25}),()=>synthHatV({duration:0.05,hpfFreq:5000,level:0.3}),()=>synthHatV({duration:0.06,hpfFreq:6500,level:0.32}),()=>synthHatV({duration:0.4,hpfFreq:6000,level:0.28}),()=>synthTomV({startFreq:200,endFreq:110,duration:0.4}),()=>synthTomV({startFreq:260,endFreq:145,duration:0.35}),()=>synthShakerV({duration:0.14,bpfFreq:5500,level:0.38}),()=>synthTambourineV({layers:4,duration:0.22,baseFreq:4500}),()=>synthCowbellV({freq1:750,freq2:500,duration:0.3}),()=>synthCymbalV({duration:1.0,hpfFreq:4000,level:0.3,decayShape:1.2}),()=>synthCymbalV({duration:0.65,hpfFreq:5500,level:0.24,decayShape:0.85}),()=>synthSweepV({fromFreq:1500,toFreq:300,duration:0.35,type:'triangle',level:0.4}),()=>synthSweepV({fromFreq:400,toFreq:1600,duration:0.3,type:'sine',level:0.35}),()=>synthSubV({freq:50,duration:0.45})] },
  lofi:      { name:'Lo-Fi',     voices:[()=>synthKickV({startFreq:100,endFreq:45,duration:0.5,type:'triangle',subLevel:0.5,click:false}),()=>synthSnareV({noiseDecay:0.2,noiseFreq:1100,toneFreq:160,toneDecay:0.12,toneLevel:0.35,noiseType:'bandpass'}),()=>synthClapV({duration:0.14,filterFreq:1000,bursts:3,spacing:0.018,tailDecay:0.3}),()=>synthHatV({duration:0.05,hpfFreq:4000,level:0.22}),()=>synthHatV({duration:0.07,hpfFreq:5000,level:0.24}),()=>synthHatV({duration:0.45,hpfFreq:4500,level:0.2}),()=>synthTomV({startFreq:160,endFreq:85,duration:0.4}),()=>synthTomV({startFreq:210,endFreq:110,duration:0.35}),()=>synthShakerV({duration:0.15,bpfFreq:4000,level:0.3}),()=>synthTambourineV({layers:2,duration:0.2,baseFreq:3500}),()=>synthCowbellV({freq1:650,freq2:430,duration:0.3}),()=>synthCymbalV({duration:0.9,hpfFreq:3000,level:0.24,decayShape:1.3}),()=>synthCymbalV({duration:0.6,hpfFreq:4000,level:0.2,decayShape:0.9}),()=>synthSweepV({fromFreq:1200,toFreq:250,duration:0.4,type:'triangle',level:0.35}),()=>synthSweepV({fromFreq:250,toFreq:1000,duration:0.35,type:'sine',level:0.3}),()=>synthSubV({freq:42,duration:0.55})] },
  industrial:{ name:'Industrial',voices:[()=>synthKickV({startFreq:200,endFreq:55,duration:0.5,type:'square',subLevel:0.6,click:true}),()=>synthSnareV({noiseDecay:0.2,noiseFreq:2800,toneFreq:240,toneDecay:0.09,toneLevel:0.3,noiseType:'highpass'}),()=>synthClapV({duration:0.08,filterFreq:2400,bursts:5,spacing:0.009,tailDecay:0.25}),()=>synthHatV({duration:0.03,hpfFreq:9000,level:0.35}),()=>synthHatV({duration:0.04,hpfFreq:11000,level:0.36}),()=>synthHatV({duration:0.4,hpfFreq:10000,level:0.3}),()=>synthTomV({startFreq:220,endFreq:80,duration:0.35}),()=>synthTomV({startFreq:280,endFreq:110,duration:0.3}),()=>synthShakerV({duration:0.09,bpfFreq:8000,level:0.32}),()=>synthTambourineV({layers:4,duration:0.16,baseFreq:7000}),()=>synthCowbellV({freq1:1000,freq2:670,duration:0.22}),()=>synthCymbalV({duration:1.0,hpfFreq:6000,level:0.32,decayShape:1}),()=>synthCymbalV({duration:0.6,hpfFreq:7500,level:0.26,decayShape:0.75}),()=>synthSweepV({fromFreq:4000,toFreq:100,duration:0.35,type:'sawtooth',level:0.45}),()=>synthSweepV({fromFreq:150,toFreq:3500,duration:0.3,type:'square',level:0.4}),()=>synthSubV({freq:35,duration:0.7})] }
};

let currentKit = 'analog';

// ---- Pad grid ----
const padGrid = document.getElementById('padGrid');
const pads = [];

DRUM_LABELS.forEach((label, i) => {
  const pad = document.createElement('div');
  pad.className = 'pad'; pad.dataset.index = i;
  pad.innerHTML = `<span class="pad-key">${PAD_KEYS[i]}</span><span class="pad-led"></span><span class="pad-label">${label}</span>`;
  padGrid.appendChild(pad); pads.push(pad);
  pad.addEventListener('mousedown', () => triggerPad(i, 1.0));
});

function triggerPad(index, velocity=1.0) {
  KITS[currentKit].voices[index]();
  pads[index].classList.add('triggered');
  setTimeout(() => pads[index].classList.remove('triggered'), 100);
  pulseSignalLine();
  sendMidiNote(DRUM_MIDI_BASE+index, velocity, 9, true);
  setTimeout(() => sendMidiNote(DRUM_MIDI_BASE+index, velocity, 9, false), 60);
}

document.getElementById('kitSelect').addEventListener('change', e => { currentKit = e.target.value; });

window.addEventListener('keydown', e => {
  if (e.repeat) return;
  const key = e.key.toUpperCase();
  const idx = PAD_KEYS.indexOf(key);
  if (idx !== -1) {
    if (document.activeElement && (document.activeElement.tagName==='SELECT'||document.activeElement.tagName==='INPUT')) document.activeElement.blur();
    e.preventDefault(); triggerPad(idx, 1.0);
  }
});

// ============================================================
// SEQUENCER
// ============================================================

const BARS=4, STEPS_PER_BAR=16;
let pattern = Array.from({length:16}, () => Array.from({length:BARS}, () => Array(STEPS_PER_BAR).fill(false)));
let currentStepRowFocus=0, currentBar=0, loopLength=1;

const seqStepsEl = document.getElementById('seqSteps');
const seqSteps = [];

for (let i=0; i<STEPS_PER_BAR; i++) {
  const step = document.createElement('div');
  step.className = 'seq-step'; step.dataset.step = i;
  if (i%4===0) { step.classList.add('seq-beat'); const n=document.createElement('span'); n.className='seq-step-num'; n.textContent=i+1; step.appendChild(n); }
  seqStepsEl.appendChild(step); seqSteps.push(step);
  step.addEventListener('click', () => { pattern[currentStepRowFocus][currentBar][i]=!pattern[currentStepRowFocus][currentBar][i]; step.classList.toggle('on'); });
}

pads.forEach((pad, i) => { pad.addEventListener('click', () => { currentStepRowFocus=i; refreshActiveRowDisplay(); refreshStepStrip(); }); });

function refreshActiveRowDisplay() {
  pads.forEach((pad, i) => pad.classList.toggle('seq-focused', i===currentStepRowFocus));
  const nameEl = document.getElementById('activeRowName');
  if (nameEl) nameEl.textContent = DRUM_LABELS[currentStepRowFocus];
}

function refreshStepStrip() {
  seqSteps.forEach((step, i) => step.classList.toggle('on', pattern[currentStepRowFocus][currentBar][i]));
}

const loopBtns = document.querySelectorAll('.loop-btn');
const barPageWrap = document.getElementById('barPageWrap');

loopBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    loopLength = parseInt(btn.dataset.bars);
    loopBtns.forEach(b => b.classList.toggle('active', b===btn));
    if (currentBar >= loopLength) currentBar = 0;
    refreshBarPages(); refreshStepStrip();
    if (typeof refreshBassStrip === 'function') refreshBassStrip();
  });
});

function refreshBarPages() {
  barPageWrap.innerHTML = '';
  if (loopLength===1) { barPageWrap.classList.add('hidden'); return; }
  barPageWrap.classList.remove('hidden');
  const labels = ['A','B','C','D'];
  for (let b=0; b<loopLength; b++) {
    const btn = document.createElement('button');
    btn.className = 'bar-page-btn'+(b===currentBar?' active':'');
    btn.textContent = labels[b]; btn.dataset.bar = b;
    btn.addEventListener('click', () => { currentBar=b; refreshBarPages(); refreshStepStrip(); if(typeof refreshBassStrip==='function')refreshBassStrip(); });
    barPageWrap.appendChild(btn);
  }
}
refreshBarPages();

document.getElementById('copyBarBtn').addEventListener('click', () => {
  if (loopLength===1) return;
  const targetBar = (currentBar+1)%loopLength;
  for (let p=0; p<16; p++) pattern[p][targetBar] = pattern[p][currentBar].slice();
  currentBar = targetBar; refreshBarPages(); refreshStepStrip();
});

// ============================================================
// BASSLINE SEQUENCER
// ============================================================
let bassPattern = Array.from({length:BARS}, () => Array(STEPS_PER_BAR).fill(null));
let bassArmedStep = null;
const bassStepsEl = document.getElementById('bassSteps');
const bassSteps = [];
const BASS_NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function midiToShortName(midi) { return BASS_NOTE_NAMES[((midi%12)+12)%12]+(Math.floor(midi/12)-1); }

for (let i=0; i<STEPS_PER_BAR; i++) {
  const step = document.createElement('div');
  step.className = 'bass-step'; step.dataset.step = i;
  if (i%4===0) step.classList.add('bass-beat');
  step.innerHTML = '<span class="bass-step-note"></span>';
  bassStepsEl.appendChild(step); bassSteps.push(step);
  step.addEventListener('click', () => {
    const existing = bassPattern[currentBar][i];
    if (existing!==null) { bassPattern[currentBar][i]=null; bassArmedStep=null; refreshBassStrip(); }
    else if (bassArmedStep===i) { bassArmedStep=null; refreshBassStrip(); }
    else { bassArmedStep=i; refreshBassStrip(); }
  });
}

function refreshBassStrip() {
  bassSteps.forEach((step, i) => {
    const note=bassPattern[currentBar][i], noteSpan=step.querySelector('.bass-step-note');
    step.classList.toggle('on', note!==null);
    step.classList.toggle('armed', bassArmedStep===i);
    noteSpan.textContent = note!==null ? midiToShortName(note) : '';
  });
  const hint = document.getElementById('bassSeqHint');
  if (hint) hint.textContent = bassArmedStep!==null ? `Step ${bassArmedStep+1} armed — tap a key to set its note` : 'Tap a step, then tap a key to set its note';
}

function assignBassNote(midiNote) {
  if (bassArmedStep===null) return false;
  bassPattern[currentBar][bassArmedStep]=midiNote; bassArmedStep=null; refreshBassStrip(); return true;
}

document.getElementById('bassClearBtn').addEventListener('click', () => {
  bassPattern = Array.from({length:BARS}, () => Array(STEPS_PER_BAR).fill(null));
  bassArmedStep=null; refreshBassStrip();
});

// ============================================================
// DEMO BEAT — upgraded trap/boom-bap hybrid that actually slaps
// Kick: syncopated 808 feel. Snare + clap layered. 16th hat grid.
// Open hats on offbeats. Sub doubles kick. Tom fills end of bar.
// Bass: melodic root line in C, hits G and Bb for movement.
// ============================================================
function loadDemoBeat() {
  pattern = Array.from({length:16}, () => Array.from({length:BARS}, () => Array(STEPS_PER_BAR).fill(false)));
  bassPattern = Array.from({length:BARS}, () => Array(STEPS_PER_BAR).fill(null));

  const KICK=0, SNARE=1, CLAP=2, HAT=4, OH=5, TOM1=6, TOM2=7, SHAKER=8, SUB=15;
  const B=0;

  // KICK: syncopated — hits 0, 3, 8, 11 (not straight 4-on-the-floor)
  [0,3,8,11].forEach(s => { pattern[KICK][B][s]=true; });

  // SUB: shadows the kick for low-end weight
  [0,3,8,11].forEach(s => { pattern[SUB][B][s]=true; });

  // SNARE: backbeat 4+12, ghost note at 14 for bounce
  [4,12,14].forEach(s => { pattern[SNARE][B][s]=true; });

  // CLAP: layered on snare for crack and punch
  [4,12].forEach(s => { pattern[CLAP][B][s]=true; });

  // CLOSED HAT: tight 16th grid, gaps on beat downbeats where kick hits
  [1,2,3,5,6,7,9,10,11,13,14,15].forEach(s => { pattern[HAT][B][s]=true; });

  // OPEN HAT: sits on the 8th note offbeats — gives it swing air
  [2,10].forEach(s => { pattern[OH][B][s]=true; });

  // SHAKER: driving 8th-note feel under everything
  [0,2,4,6,8,10,12,14].forEach(s => { pattern[SHAKER][B][s]=true; });

  // TOM FILLS: punchy build at the end of the bar
  [13].forEach(s => { pattern[TOM1][B][s]=true; });
  [15].forEach(s => { pattern[TOM2][B][s]=true; });

  // BASS LINE: follows kick root, melodic movement with G2 and Bb2
  // C2=36, G2=43, Bb2=46, F2=41
  bassPattern[B][0]  = 36;   // C2 — kick 1
  bassPattern[B][2]  = 36;   // C2 — sustain
  bassPattern[B][3]  = 43;   // G2 — syncopated kick
  bassPattern[B][6]  = 46;   // Bb2 — color, creates tension
  bassPattern[B][8]  = 36;   // C2 — kick 3 root
  bassPattern[B][10] = 41;   // F2 — movement before last kick
  bassPattern[B][11] = 43;   // G2 — syncopated kick resolution
  bassPattern[B][14] = 36;   // C2 — ghost snare anchor

  loopLength=1;
  loopBtns.forEach(b => b.classList.toggle('active', b.dataset.bars==='1'));
  currentBar=0; currentStepRowFocus=KICK;
  refreshBarPages(); refreshActiveRowDisplay(); refreshStepStrip(); refreshBassStrip();
}

const demoBtn = document.getElementById('demoBeatBtn');
if (demoBtn) demoBtn.addEventListener('click', loadDemoBeat);

function playBassStep(midiNote, time) {
  const delay=Math.max(0,(time-audioCtx.currentTime)*1000);
  const stepMs=((60/bpm)/4)*1000;
  setTimeout(()=>{noteOn(midiNote,0.85);setTimeout(()=>noteOff(midiNote),Math.max(60,stepMs*0.9));},delay);
}

refreshBassStrip();

// ---- Transport ----
let isPlaying=false, isPaused=false, currentStep=0, nextStepTime=0, schedulerTimer=null;
const transportPlayBtn=document.getElementById('playBtn'), transportPauseBtn=document.getElementById('pauseBtn'), transportStopBtn=document.getElementById('stopBtn');
const bpmValue=document.getElementById('bpmValue');
let bpm=96;

document.getElementById('bpmUp').addEventListener('click',   ()=>{ bpm=Math.min(240,bpm+1); bpmValue.textContent=bpm; });
document.getElementById('bpmDown').addEventListener('click', ()=>{ bpm=Math.max(40,bpm-1);  bpmValue.textContent=bpm; });

transportPlayBtn.addEventListener('click',  ()=>{ if(!isPlaying){ isPaused?resumeSequencer():startSequencer(); } });
transportPauseBtn.addEventListener('click', ()=>{ if(isPlaying) pauseSequencer(); });
transportStopBtn.addEventListener('click',  ()=>{ stopSequencer(); });

window.addEventListener('keydown', e=>{
  if(e.code!=='Space'&&e.key!==' ') return;
  const tag=document.activeElement&&document.activeElement.tagName;
  if(tag==='SELECT'||tag==='INPUT'||tag==='BUTTON') document.activeElement.blur();
  e.preventDefault();
  if(isPlaying) pauseSequencer(); else if(isPaused) resumeSequencer(); else startSequencer();
});

function startSequencer()  { isPlaying=true;  isPaused=false; transportPlayBtn.classList.add('active');    transportPauseBtn.classList.remove('active'); currentStep=0; nextStepTime=audioCtx.currentTime; schedulerTimer=setInterval(schedulerTick,25); }
function pauseSequencer()  { isPlaying=false;  isPaused=true;  transportPlayBtn.classList.remove('active'); transportPauseBtn.classList.add('active');    clearInterval(schedulerTimer); }
function resumeSequencer() { isPlaying=true;   isPaused=false; transportPlayBtn.classList.add('active');    transportPauseBtn.classList.remove('active'); nextStepTime=audioCtx.currentTime; schedulerTimer=setInterval(schedulerTick,25); }
function stopSequencer()   { isPlaying=false;  isPaused=false; transportPlayBtn.classList.remove('active'); transportPauseBtn.classList.remove('active'); clearInterval(schedulerTimer); currentStep=0; currentBar=0; refreshBarPages(); refreshStepStrip(); refreshBassStrip(); seqSteps.forEach(s=>s.classList.remove('playhead')); bassSteps.forEach(s=>s.classList.remove('playhead')); }

function schedulerTick() {
  const stepDuration=(60/bpm)/4;
  while(nextStepTime<audioCtx.currentTime+0.1) { playStep(currentStep,nextStepTime); nextStepTime+=stepDuration; currentStep=(currentStep+1)%(loopLength*STEPS_PER_BAR); }
}

function playStep(globalStep, time) {
  const bar=Math.floor(globalStep/STEPS_PER_BAR)%loopLength, step=globalStep%STEPS_PER_BAR;
  const delay=Math.max(0,(time-audioCtx.currentTime)*1000);
  const bassNote=bassPattern[bar][step];
  if(bassNote!==null) playBassStep(bassNote,time);
  setTimeout(()=>{
    if(bar!==currentBar){currentBar=bar;refreshBarPages();refreshStepStrip();refreshBassStrip();}
    seqSteps.forEach(s=>s.classList.remove('playhead')); seqSteps[step].classList.add('playhead');
    bassSteps.forEach(s=>s.classList.remove('playhead')); bassSteps[step].classList.add('playhead');
    for(let p=0;p<16;p++){if(pattern[p][bar][step])triggerPad(p,0.9);}
  },delay);
}

document.getElementById('clearPatternBtn').addEventListener('click', ()=>{
  pattern=Array.from({length:16},()=>Array.from({length:BARS},()=>Array(STEPS_PER_BAR).fill(false))); refreshStepStrip();
});

const STORAGE_KEY='studio_drum_patterns';
document.getElementById('savePatternBtn').addEventListener('click', ()=>{
  const name=prompt('Pattern name:'); if(!name) return;
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
  saved[name]={pattern,kit:currentKit,bpm};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(saved)); refreshPatternList();
});

const loadPatternSelect=document.getElementById('loadPatternSelect');
function refreshPatternList() {
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
  loadPatternSelect.innerHTML='<option value="">LOAD PATTERN...</option>';
  Object.keys(saved).forEach(name=>{ const opt=document.createElement('option');opt.value=name;opt.textContent=name;loadPatternSelect.appendChild(opt); });
}
loadPatternSelect.addEventListener('change', e=>{
  const name=e.target.value; if(!name) return;
  const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')[name]; if(!data) return;
  pattern=data.pattern; currentKit=data.kit||'analog'; document.getElementById('kitSelect').value=currentKit;
  bpm=data.bpm||96; bpmValue.textContent=bpm; refreshStepStrip();
});
refreshPatternList();

// ============================================================
// SOPH61 KEYBOARD
// ============================================================
const KEYBOARD_START_MIDI=36, KEYBOARD_KEY_COUNT=61;
const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const BLACK_KEY_OFFSETS=[1,3,6,8,10];
const COMPUTER_KEY_MAP={'z':0,'x':2,'c':4,'v':5,'b':7,'n':9,'m':11,',':12,'s':1,'f':3,'g':6,'j':8,'l':10};
let octaveShift=0;
const activeOscillators={}, keyboardEl=document.getElementById('keyboard'), keyEls={};
const WHITE_KEY_WIDTH=27;
function midiToFreq(n){return 440*Math.pow(2,(n-69)/12);}

const SYNTH_PRESETS={
  classic:   {name:'Classic',   oscType:'sawtooth',detune:0.005,filterType:'lowpass',filterFreq:12000,filterQ:0.7,gainLevel:0.5},
  bass:      {name:'Bass',      oscType:'sawtooth',detune:0.01,filterType:'lowpass',filterFreq:900,filterQ:1.2,gainLevel:0.7,octaveOffset:-1},
  lead:      {name:'Lead',      oscType:'square',detune:0.015,filterType:'lowpass',filterFreq:6000,filterQ:2,gainLevel:0.45},
  bell:      {name:'Bell',      oscType:'sine',detune:0.003,extraPartial:true,filterType:'highpass',filterFreq:200,filterQ:0.5,gainLevel:0.4},
  drone:     {name:'Drone/Pad', oscType:'triangle',detune:0.02,filterType:'lowpass',filterFreq:2200,filterQ:0.4,gainLevel:0.4,slowAttack:true},
  pluck:     {name:'Pluck',     oscType:'triangle',detune:0.008,filterType:'lowpass',filterFreq:4000,filterQ:3,gainLevel:0.5,fastDecay:true},
  supersaw:  {name:'Supersaw',  oscType:'sawtooth',detune:0.018,extraPartial:true,partialRatio:1.012,filterType:'lowpass',filterFreq:9000,filterQ:1.5,gainLevel:0.4},
  acid:      {name:'Acid Bass', oscType:'square',detune:0.004,filterType:'lowpass',filterFreq:700,filterQ:9,gainLevel:0.6,octaveOffset:-1,fastDecay:true},
  ep:        {name:'Warm EP',   oscType:'sine',detune:0.006,extraPartial:true,partialRatio:2.01,filterType:'lowpass',filterFreq:3500,filterQ:0.6,gainLevel:0.45},
  growl:     {name:'Growl Bass',oscType:'sawtooth',detune:0.05,filterType:'lowpass',filterFreq:450,filterQ:4,gainLevel:0.65,octaveOffset:-1},
  glasspluck:{name:'Glass Pluck',oscType:'triangle',detune:0.01,extraPartial:true,partialRatio:3.0,filterType:'highpass',filterFreq:300,filterQ:1,gainLevel:0.45,fastDecay:true}
};
let currentPreset='classic';

// Mod wheel + pitch bend
let modWheelValue=0, pitchBendCents=0;
const vibratoLFO=audioCtx.createOscillator(); vibratoLFO.frequency.value=5.5; vibratoLFO.start();
const vibratoDepth=audioCtx.createGain(); vibratoDepth.gain.value=0; vibratoLFO.connect(vibratoDepth);

function applyPitchModToVoice(voice) {
  vibratoDepth.connect(voice.osc.detune); vibratoDepth.connect(voice.osc2.detune);
  if(voice.osc3) vibratoDepth.connect(voice.osc3.detune);
  voice.osc.detune.value+=pitchBendCents; voice.osc2.detune.value+=pitchBendCents;
  if(voice.osc3) voice.osc3.detune.value+=pitchBendCents;
}
function updateAllVoicesPitchBend() {
  Object.values(activeOscillators).forEach(voice=>{
    if(!voice||!voice.osc) return;
    const t=audioCtx.currentTime;
    voice.osc.detune.setTargetAtTime(pitchBendCents,t,0.01);
    voice.osc2.detune.setTargetAtTime(pitchBendCents,t,0.01);
    if(voice.osc3) voice.osc3.detune.setTargetAtTime(pitchBendCents,t,0.01);
  });
}
function sendMidiCC(cc,value){if(!activeMidiOutput)return;activeMidiOutput.send([0xB0,cc,value]);}
function sendMidiPitchBend(v){if(!activeMidiOutput)return;activeMidiOutput.send([0xE0,v&0x7F,(v>>7)&0x7F]);}

const modWheelEl=document.getElementById('modWheel'), pitchWheelEl=document.getElementById('pitchWheel');
modWheelEl.addEventListener('input',e=>{modWheelValue=parseFloat(e.target.value)/127;vibratoDepth.gain.value=modWheelValue*35;sendMidiCC(1,Math.round(modWheelValue*127));});
pitchWheelEl.addEventListener('input',e=>{const raw=parseFloat(e.target.value);pitchBendCents=(raw/100)*200;updateAllVoicesPitchBend();sendMidiPitchBend(Math.round(((raw/100)+1)*0.5*16383));});
function springBackPitchWheel(){pitchWheelEl.value=0;pitchBendCents=0;updateAllVoicesPitchBend();sendMidiPitchBend(8192);}
pitchWheelEl.addEventListener('mouseup',springBackPitchWheel);
pitchWheelEl.addEventListener('touchend',springBackPitchWheel);
pitchWheelEl.addEventListener('mouseleave',e=>{if(e.buttons===1)springBackPitchWheel();});

function noteOn(midiNote, velocity=0.9) {
  if(activeOscillators[midiNote]) return;
  const preset=SYNTH_PRESETS[currentPreset], octaveOffset=preset.octaveOffset||0;
  const freq=midiToFreq(midiNote+(octaveOffset*12));
  const attack=parseFloat(document.getElementById('attackKnob').value);
  const effectiveAttack=preset.slowAttack?Math.max(attack,0.4):Math.max(attack,0.001);
  const osc=audioCtx.createOscillator(), osc2=audioCtx.createOscillator();
  osc.type=preset.oscType; osc.frequency.value=freq;
  osc2.type=preset.oscType; osc2.frequency.value=freq*(1+preset.detune);
  const cutoffKnob=parseFloat(document.getElementById('cutoffKnob').value);
  const cutoffMult=Math.pow(4,cutoffKnob);
  const filter=audioCtx.createBiquadFilter();
  filter.type=preset.filterType;
  filter.frequency.value=Math.max(20,Math.min(20000,preset.filterFreq*cutoffMult));
  filter.Q.value=preset.filterQ;
  const gain=audioCtx.createGain();
  gain.gain.setValueAtTime(0,audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(Math.max(velocity,0.0001)*preset.gainLevel,audioCtx.currentTime+effectiveAttack);
  osc.connect(filter); osc2.connect(filter);
  let osc3=null;
  if(preset.extraPartial){
    osc3=audioCtx.createOscillator();
    osc3.type=preset.partialOscType||(preset.oscType==='sawtooth'?'sawtooth':'sine');
    osc3.frequency.value=freq*(preset.partialRatio||2.76);
    const pg=audioCtx.createGain();
    pg.gain.setValueAtTime(0,audioCtx.currentTime);
    pg.gain.linearRampToValueAtTime(Math.max(velocity,0.0001)*preset.gainLevel*0.35,audioCtx.currentTime+effectiveAttack);
    osc3.connect(pg); pg.connect(filter); osc3.start();
  }
  filter.connect(gain); gain.connect(reverbDry); gain.connect(reverbNode);
  osc.start(); osc2.start();
  if(preset.fastDecay){const dt=audioCtx.currentTime+effectiveAttack+0.25;gain.gain.setTargetAtTime(0.0001,dt,0.15);}
  activeOscillators[midiNote]={osc,osc2,osc3,filter,gain};
  applyPitchModToVoice(activeOscillators[midiNote]);
  const keyEl=keyEls[midiNote]; if(keyEl) keyEl.classList.add('active');
  pulseSignalLine(); sendMidiNote(midiNote,velocity,0,true);
}

function noteOff(midiNote) {
  const voice=activeOscillators[midiNote]; if(!voice) return;
  const release=parseFloat(document.getElementById('releaseKnob').value);
  const t=audioCtx.currentTime, r=Math.max(release,0.02);
  voice.gain.gain.cancelScheduledValues(t);
  voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value,0.0001),t);
  voice.gain.gain.exponentialRampToValueAtTime(0.0001,t+r);
  voice.osc.stop(t+r+0.05); voice.osc2.stop(t+r+0.05);
  if(voice.osc3) voice.osc3.stop(t+r+0.05);
  delete activeOscillators[midiNote];
  const keyEl=keyEls[midiNote]; if(keyEl) keyEl.classList.remove('active');
  sendMidiNote(midiNote,0,0,false);
}

function buildKeyboard() {
  Object.keys(activeOscillators).forEach(n=>noteOff(parseInt(n)));
  keyboardEl.innerHTML=''; for(const k in keyEls) delete keyEls[k];
  let whiteIdx=0;
  const startMidi=KEYBOARD_START_MIDI+(octaveShift*12);
  for(let i=0;i<KEYBOARD_KEY_COUNT;i++){
    const midiNote=startMidi+i, noteInOctave=((midiNote%12)+12)%12;
    const isBlack=BLACK_KEY_OFFSETS.includes(noteInOctave);
    const noteName=NOTE_NAMES[noteInOctave], octaveNum=Math.floor(midiNote/12)-1;
    const keyEl=document.createElement('div');
    keyEl.dataset.midi=midiNote;
    keyEl.innerHTML=`<span class="key-label">${noteName}${octaveNum}</span>`;
    keyEl.className=isBlack?'key black':'key white';
    if(isBlack){keyEl.style.left=(whiteIdx*WHITE_KEY_WIDTH-10)+'px';keyboardEl.appendChild(keyEl);}
    else{keyboardEl.appendChild(keyEl);whiteIdx++;}
    keyEls[midiNote]=keyEl;
    keyEl.addEventListener('mousedown',()=>{if(typeof assignBassNote==='function')assignBassNote(midiNote);noteOn(midiNote,0.9);});
    keyEl.addEventListener('mouseup',()=>noteOff(midiNote));
    keyEl.addEventListener('mouseleave',()=>noteOff(midiNote));
  }
  keyboardEl.style.width=(whiteIdx*WHITE_KEY_WIDTH)+'px';
}
buildKeyboard();

document.getElementById('reverbKnob').addEventListener('input', e=>{reverbWet.gain.value=parseFloat(e.target.value);});
document.getElementById('presetSelect').addEventListener('change', e=>{currentPreset=e.target.value;});

const octDisplay=document.getElementById('octDisplay');
document.getElementById('octUp').addEventListener('click',   ()=>{if(octaveShift<2){octaveShift++;octDisplay.textContent=4+octaveShift;buildKeyboard();}});
document.getElementById('octDown').addEventListener('click', ()=>{if(octaveShift>-2){octaveShift--;octDisplay.textContent=4+octaveShift;buildKeyboard();}});

const heldComputerKeys=new Set();
window.addEventListener('keydown', e=>{
  const key=e.key.toLowerCase(); if(heldComputerKeys.has(key)) return;
  if(COMPUTER_KEY_MAP.hasOwnProperty(key)){
    if(document.activeElement&&(document.activeElement.tagName==='SELECT'||document.activeElement.tagName==='INPUT'))document.activeElement.blur();
    e.preventDefault(); heldComputerKeys.add(key);
    const baseMidi=60+(octaveShift*12), midiNote=baseMidi+COMPUTER_KEY_MAP[key];
    if(typeof assignBassNote==='function')assignBassNote(midiNote); noteOn(midiNote,0.9);
  }
});
window.addEventListener('keyup', e=>{
  const key=e.key.toLowerCase();
  if(COMPUTER_KEY_MAP.hasOwnProperty(key)){
    heldComputerKeys.delete(key);
    const midiNote=60+(octaveShift*12)+COMPUTER_KEY_MAP[key]; noteOff(midiNote);
  }
});

// ---- View toggle ----
const drumModule=document.getElementById('drumModule'), keysModule=document.getElementById('keysModule'), signalDivider=document.getElementById('signalDivider');
const toggleBtns=document.querySelectorAll('.toggle-btn');
toggleBtns.forEach(btn=>{
  btn.addEventListener('click',()=>{
    toggleBtns.forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    const view=btn.dataset.view;
    if(view==='drums'){drumModule.classList.remove('hidden');keysModule.classList.add('hidden');signalDivider.classList.add('hidden');}
    else if(view==='keys'){drumModule.classList.add('hidden');keysModule.classList.remove('hidden');signalDivider.classList.add('hidden');}
    else{drumModule.classList.remove('hidden');keysModule.classList.remove('hidden');signalDivider.classList.remove('hidden');}
  });
});

// ---- Mode toggle (SOLO / 2-PLAYER) ----
const modeBtns=document.querySelectorAll('.mode-btn');
const rackEl=document.querySelector('.rack');
modeBtns.forEach(btn=>{
  btn.addEventListener('click',()=>{
    modeBtns.forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    const mode=btn.dataset.mode;
    if(mode==='duo'){
      rackEl.classList.add('duo-mode');
      drumModule.classList.remove('hidden'); keysModule.classList.remove('hidden'); signalDivider.classList.remove('hidden');
    } else {
      rackEl.classList.remove('duo-mode');
      toggleBtns.forEach(b=>b.classList.toggle('active',b.dataset.view==='both'));
      drumModule.classList.remove('hidden'); keysModule.classList.remove('hidden'); signalDivider.classList.remove('hidden');
    }
  });
});

// ---- Welcome splash ----
const welcomeEl=document.getElementById('welcome');
const welcomeEnterBtn=document.getElementById('welcomeEnter');
function dismissWelcome(){welcomeEl.classList.add('dismissed');if(audioCtx.state==='suspended')audioCtx.resume();}
welcomeEnterBtn.addEventListener('click',dismissWelcome);

// ---- Resume audio on first interaction ----
function resumeAudio(){if(audioCtx.state==='suspended')audioCtx.resume();}
document.body.addEventListener('mousedown',resumeAudio,{once:true});
document.body.addEventListener('keydown',resumeAudio,{once:true});