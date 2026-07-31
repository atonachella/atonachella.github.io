# NOVA-8 — Digital Rhythm Processor

**Live Demo:** [https://atonachella.github.io/nextchapter8pad/](https://atonachella.github.io/nextchapter8pad/)

A browser-based emulation of a classic 8-pad drum machine, built entirely in HTML, CSS, and JavaScript, with no external audio samples or frameworks.

---

## Problem Solved

Physical MIDI controller hardware takes up desk space, becomes obsolete, and eventually breaks or stops being supported. A software-based drum machine removes the dependency on a specific physical device entirely.

## Value Provided

Because it's software, it can be updated indefinitely — there's no hardware to become obsolete. It also runs across any platform with a modern web browser, rather than being tied to one device or operating system.

## Features

- 8 drum voice pads (Kick, Snare, Clap, Rim, Closed Hat, Open Hat, Tom, Crash)
- 16-step sequencer, shared across all 8 voices (select a pad, program its pattern)
- Selectable pattern length: 1, 2, or 4 bars
- Built-in demo beat loaded on startup, so functionality is demonstrated immediately
- Clear function to reset patterns and start programming from scratch
- Real-time tempo control
- MIDI in/out *(in progress — see below)*

## Tech Used

- **HTML / CSS / JavaScript** — no frameworks, no build step
- **Web Audio API** — all 8 drum voices are fully synthesized in code (oscillators + filtered noise + gain envelopes); no sample files
- **Web MIDI API** — in-progress MIDI in/out layer (see mapping below)

## MIDI Mapping *(planned / in progress)*

NOVA-8's MIDI implementation follows the General MIDI drum note convention, so it can talk to standard DAWs and hardware without a custom mapping step.

| Pad | MIDI Note | Note Name |
|---|---|---|
| Kick | 36 | C1 |
| Rim | 37 | C#1 |
| Snare | 38 | D1 |
| Clap | 39 | D#1 |
| Closed Hat | 42 | F#1 |
| Tom | 45 | A1 |
| Open Hat | 46 | A#1 |
| Crash | 49 | C#2 |

**MIDI Out:** sends a Note On/Off message whenever a step fires, using the mapping above, plus MIDI Clock/transport sync messages so an external DAW or device can lock its tempo to NOVA-8's sequencer.

**MIDI In:** (planned) NOVA-8 will accept incoming Note On messages on the same note numbers to trigger its pads from an external controller, and will follow incoming MIDI Clock to sync its own tempo to an external source.

## How to Run

**Version 1.0** runs entirely in the browser — no installation required. Open `index.html` (or visit the live demo link above) in a modern browser (Chrome or Edge recommended for full Web MIDI API support).

Future versions may include a `.vst` plugin format for use directly inside a DAW.

## AI Tools Used

Claude Sonnet 5 (Anthropic) was used as a development collaborator throughout this project — architecture planning, code generation, and iterative review.