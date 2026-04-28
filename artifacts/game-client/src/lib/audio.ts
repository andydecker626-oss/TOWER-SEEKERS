export type TrackId = "title" | "hub" | "battle";

// ── Frequency constants ──────────────────────────────────────────────────────
// Bass register
const A1=55, B1=61.74, C2=65.41, D2=73.42, E2=82.41, F2=87.31, G2=98, A2=110, B2=123.47;
const C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196, A3=220, Bb2=116.54, Bb3=233.08;
const F1=43.65, Bb1=58.27, E1=41.20;
// Melody register
const D4=293.66, E4=329.63, F4=349.23, G4=392, A4=440, Bb4=466.16, B4=493.88;
const C5=523.25, D5=587.33, E5=659.25, F5=698.46, G5=783.99, A5=880;

type Chord    = [number[], number];        // [freqs, beats]
type MNote    = [number,   number];        // [freq,  beats]
type PercChar = "K" | "S" | "H" | "_";    // kick / snare / hihat / rest

interface Track {
  bpm:          number;
  chords:       Chord[];
  melody:       MNote[];
  melodyType?:  OscillatorType; // default "sine"
  melodyVol?:   number;         // default 0.09
  chordCutoff?: number;         // lowpass cutoff Hz, default 900
  bassLine?:    MNote[];        // staccato bass, square wave
  perc?:        PercChar[];     // flat 16th-note percussion array
}

// ── Track definitions ────────────────────────────────────────────────────────

const TRACKS: Record<TrackId, Track> = {

  // ── Title: slow, majestic D minor ──
  title: {
    bpm: 68,
    chords: [
      [[D2, A2, D3, F3], 8],
      [[Bb1, F2, Bb2, D3], 8],
      [[F1, C2, F2, A2], 8],
      [[C2, G2, C3, E3], 8],
    ],
    melody: [
      [D5,2],[F5,1],[A5,1],[G5,2],[F5,2],
      [Bb4,2],[C5,1],[D5,1],[C5,2],[Bb4,2],
      [C5,2],[D5,1],[F5,1],[E5,2],[D5,2],
      [E5,2],[G5,1],[A5,1],[G5,2],[F5,2],
    ],
  },

  // ── Hub: upbeat, warm C major ──
  hub: {
    bpm: 96,
    chords: [
      [[C2, G2, C3, E3], 4],
      [[G2, D3, G3, B2], 4],
      [[A1, E2, A2, C3], 4],
      [[F2, C3, F3, A3], 4],
    ],
    melody: [
      [E5,0.5],[G5,0.5],[A5,1],[G5,0.5],[E5,0.5],[C5,1],
      [D5,0.5],[G5,0.5],[A5,1],[G5,0.5],[F5,0.5],[D5,1],
      [C5,0.5],[E5,0.5],[A5,1],[G5,0.5],[E5,0.5],[C5,1],
      [A4,0.5],[C5,0.5],[F5,1],[E5,0.5],[C5,0.5],[A4,1],
    ],
  },

  // ── Battle: Andalusian cadence, driving percussion ──
  // D minor descending: Dm → C → Bb → Am  (168 BPM, 8-beat loop)
  battle: {
    bpm: 168,
    chordCutoff: 1600,
    melodyType: "square",
    melodyVol: 0.045,
    chords: [
      [[D2, A2, D3, F3], 2],    // Dm
      [[C2, G2, C3, E3], 2],    // C
      [[Bb1, F2, Bb2, D3], 2],  // Bb
      [[A1, E2, A2, C3], 2],    // Am (V minor — dark, unresolved)
    ],
    // Driving 16th-note runs in D natural minor
    melody: [
      // Over Dm (2 beats)
      [D5,0.25],[F5,0.25],[A5,0.5],[G5,0.25],[F5,0.25],[E5,0.5],
      // Over C (2 beats)
      [G5,0.25],[E5,0.25],[C5,0.5],[A5,0.25],[G5,0.25],[E5,0.5],
      // Over Bb (2 beats)
      [F5,0.25],[D5,0.25],[Bb4,0.5],[F5,0.25],[G5,0.25],[F5,0.5],
      // Over Am (2 beats)
      [E5,0.25],[C5,0.25],[A4,0.5],[E5,0.25],[D5,0.25],[E5,0.5],
    ],
    // Staccato 8th-note bass ostinato (root + 5th alternation)
    bassLine: [
      [D3,0.5],[A2,0.5], [D3,0.5],[A2,0.5],  // Dm
      [C3,0.5],[G2,0.5], [C3,0.5],[G2,0.5],  // C
      [Bb2,0.5],[F2,0.5],[Bb2,0.5],[F2,0.5], // Bb
      [A2,0.5],[E2,0.5], [A2,0.5],[E2,0.5],  // Am
    ],
    // 8 beats × 4 sixteenth notes = 32 slots
    // Pattern: 4-on-the-floor kick, snare on 2 & 4, 8th-note hi-hats
    //     1    e    +    a      2    e    +    a      3    e    +    a      4    e    +    a
    perc: [
      "K", "_", "H", "_",   "S", "_", "H", "_",   "K", "_", "H", "_",   "S", "_", "H", "_",  // bar 1
      "K", "_", "H", "_",   "S", "_", "H", "_",   "K", "K", "H", "_",   "S", "H", "K", "H",  // bar 2 (fill)
    ],
  },
};

// ── AudioManager ─────────────────────────────────────────────────────────────

class AudioManager {
  private ctx:          AudioContext | null = null;
  private masterGain:   GainNode | null = null;
  private oscs:         OscillatorNode[]        = [];
  private bufSrcs:      AudioBufferSourceNode[] = [];
  private loopTimer:    ReturnType<typeof setTimeout> | null = null;
  private currentTrack: TrackId | null = null;
  private _volume = 0.33;
  private _muted  = false;

  // ── Context ──────────────────────────────────────────────────────────────

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  get volume() { return this._volume; }
  get muted()  { return this._muted; }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this._muted) this.masterGain.gain.value = this._volume;
    if (typeof localStorage !== "undefined") localStorage.setItem("ts_volume", String(this._volume));
  }

  setMuted(m: boolean) {
    this._muted = m;
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : this._volume;
    if (typeof localStorage !== "undefined") localStorage.setItem("ts_muted", String(m));
  }

  loadSettings() {
    if (typeof localStorage === "undefined") return;
    const v = parseFloat(localStorage.getItem("ts_volume") ?? "0.33");
    const m = localStorage.getItem("ts_muted") === "true";
    this._volume = isNaN(v) ? 0.33 : v;
    this._muted  = m;
    if (this.masterGain) this.masterGain.gain.value = this._muted ? 0 : this._volume;
  }

  play(trackId: TrackId) {
    if (trackId === this.currentTrack) return;
    this._stop();
    this.currentTrack = trackId;
    const ctx = this.getCtx();
    const resume = () => this._schedule(ctx, trackId, ctx.currentTime);
    if (ctx.state === "suspended") ctx.resume().then(resume);
    else resume();
  }

  stop() {
    this._stop();
    this.currentTrack = null;
  }

  // ── Internal: stop all nodes ──────────────────────────────────────────────

  private _stop() {
    if (this.loopTimer) { clearTimeout(this.loopTimer); this.loopTimer = null; }
    this.oscs.forEach(o => { try { o.stop(0); } catch {} });
    this.bufSrcs.forEach(b => { try { b.stop(0); } catch {} });
    this.oscs    = [];
    this.bufSrcs = [];
  }

  // ── Internal: schedule one loop ──────────────────────────────────────────

  private _schedule(ctx: AudioContext, trackId: TrackId, startTime: number) {
    if (this.currentTrack !== trackId) return;
    const track = TRACKS[trackId];
    const beat  = 60 / track.bpm;
    let t  = startTime;
    let mt = startTime;

    // 1. Chord pads (sawtooth → lowpass → gain envelope)
    const cutoff = track.chordCutoff ?? 900;
    for (const [freqs, beats] of track.chords) {
      const dur = beats * beat;
      this._chord(ctx, freqs, t, dur, cutoff);
      t += dur;
    }

    // 2. Melody lead
    const melType = track.melodyType ?? "sine";
    const melVol  = track.melodyVol  ?? 0.09;
    for (const [freq, beats] of track.melody) {
      const dur = beats * beat;
      this._note(ctx, freq, mt, dur, melType, melVol);
      mt += dur;
    }

    // 3. Bass ostinato (square wave, staccato)
    if (track.bassLine) {
      let bt = startTime;
      for (const [freq, beats] of track.bassLine) {
        const dur = beats * beat;
        this._bass(ctx, freq, bt, dur);
        bt += dur;
      }
    }

    // 4. Percussion
    if (track.perc) {
      const sixteenth = beat / 4;
      track.perc.forEach((p, i) => {
        const pt = startTime + i * sixteenth;
        if      (p === "K") this._kick(ctx, pt);
        else if (p === "S") this._snare(ctx, pt);
        else if (p === "H") this._hihat(ctx, pt);
      });
    }

    // Schedule next loop just before this one ends
    const loopMs = (t - startTime) * 1000 - 80;
    this.loopTimer = setTimeout(() => {
      this.oscs    = [];
      this.bufSrcs = [];
      if (this.currentTrack === trackId) this._schedule(ctx, trackId, ctx.currentTime);
    }, Math.max(200, loopMs));
  }

  // ── Chord pad ────────────────────────────────────────────────────────────

  private _chord(ctx: AudioContext, freqs: number[], start: number, dur: number, cutoff: number) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    filter.Q.value = 0.7;

    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, start);
    gn.gain.linearRampToValueAtTime(0.052, start + Math.min(0.35, dur * 0.1));
    gn.gain.linearRampToValueAtTime(0.038, start + dur * 0.72);
    gn.gain.linearRampToValueAtTime(0, start + dur);
    filter.connect(gn);
    gn.connect(this.masterGain!);

    for (const freq of freqs) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = freq;
      o.connect(filter);
      o.start(start); o.stop(start + dur);
      this.oscs.push(o);
    }
  }

  // ── Melody lead ──────────────────────────────────────────────────────────

  private _note(ctx: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, start);
    gn.gain.linearRampToValueAtTime(vol, start + 0.025);
    gn.gain.linearRampToValueAtTime(vol * 0.65, start + dur * 0.65);
    gn.gain.linearRampToValueAtTime(0, start + dur * 0.95);
    gn.connect(this.masterGain!);

    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(gn);
    o.start(start); o.stop(start + dur);
    this.oscs.push(o);
  }

  // ── Staccato bass ────────────────────────────────────────────────────────

  private _bass(ctx: AudioContext, freq: number, start: number, dur: number) {
    const staccDur = dur * 0.65; // staccato: cut note short
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, start);
    gn.gain.linearRampToValueAtTime(0.07, start + 0.012);
    gn.gain.setValueAtTime(0.06, start + staccDur * 0.5);
    gn.gain.linearRampToValueAtTime(0, start + staccDur);
    gn.connect(this.masterGain!);

    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = freq;
    o.connect(gn);
    o.start(start); o.stop(start + staccDur);
    this.oscs.push(o);
  }

  // ── Percussion ───────────────────────────────────────────────────────────

  private _noise(ctx: AudioContext, durationSec: number): AudioBufferSourceNode {
    const len = Math.ceil(ctx.sampleRate * durationSec);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    this.bufSrcs.push(src);
    return src;
  }

  private _kick(ctx: AudioContext, start: number) {
    const dur = 0.18;
    // Pitched sine: 80 Hz → 28 Hz punch
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.55, start);
    gn.gain.exponentialRampToValueAtTime(0.001, start + dur);
    gn.connect(this.masterGain!);

    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(80, start);
    o.frequency.exponentialRampToValueAtTime(28, start + 0.07);
    o.connect(gn);
    o.start(start); o.stop(start + dur);
    this.oscs.push(o);

    // Click transient
    const clickGn = ctx.createGain();
    clickGn.gain.setValueAtTime(0.3, start);
    clickGn.gain.exponentialRampToValueAtTime(0.001, start + 0.02);
    clickGn.connect(this.masterGain!);
    const noise = this._noise(ctx, 0.02);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 180;
    noise.connect(filter);
    filter.connect(clickGn);
    noise.start(start); noise.stop(start + 0.02);
  }

  private _snare(ctx: AudioContext, start: number) {
    const dur = 0.14;
    // Noise body
    const noise = this._noise(ctx, dur);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1100;
    filter.Q.value = 0.9;

    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.28, start);
    gn.gain.exponentialRampToValueAtTime(0.001, start + dur);
    gn.connect(this.masterGain!);

    noise.connect(filter);
    filter.connect(gn);
    noise.start(start); noise.stop(start + dur);

    // Crack tone
    const crackGn = ctx.createGain();
    crackGn.gain.setValueAtTime(0.12, start);
    crackGn.gain.exponentialRampToValueAtTime(0.001, start + 0.06);
    crackGn.connect(this.masterGain!);
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = 220;
    o.connect(crackGn);
    o.start(start); o.stop(start + 0.06);
    this.oscs.push(o);
  }

  private _hihat(ctx: AudioContext, start: number) {
    const dur = 0.055;
    const noise = this._noise(ctx, dur);
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 9000;

    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.14, start);
    gn.gain.exponentialRampToValueAtTime(0.001, start + dur);
    gn.connect(this.masterGain!);

    noise.connect(filter);
    filter.connect(gn);
    noise.start(start); noise.stop(start + dur);
  }
}

export const audioManager = new AudioManager();
