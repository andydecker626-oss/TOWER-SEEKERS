export type TrackId = "title" | "hub" | "battle";

// Hz constants
const n = (f: number) => f;
// Bass
const A1=55, B1=61.74, C2=65.41, D2=73.42, E2=82.41, F2=87.31, G2=98, A2=110, B2=123.47;
const C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196, A3=220, Bb2=116.54, Bb3=233.08;
const F1=43.65, Bb1=58.27, E1=41.20;
// Melody
const D4=293.66, E4=329.63, F4=349.23, G4=392, A4=440, Bb4=466.16, B4=493.88;
const C5=523.25, D5=587.33, E5=659.25, F5=698.46, G5=783.99, A5=880;

type Chord = [number[], number]; // [freqs, beats]
type MNote = [number, number];   // [freq, beats]

interface Track {
  bpm: number;
  chords: Chord[];
  melody: MNote[];
}

const TRACKS: Record<TrackId, Track> = {
  title: {
    bpm: 68,
    chords: [
      [[D2, A2, D3, F3], 8],   // Dm
      [[Bb1, F2, Bb2, D3], 8], // Bb
      [[F1, C2, F2, A2], 8],   // F
      [[C2, G2, C3, E3], 8],   // C
    ],
    melody: [
      // Over Dm (8 beats)
      [D5,2],[F5,1],[A5,1],[G5,2],[F5,2],
      // Over Bb (8 beats)
      [Bb4,2],[C5,1],[D5,1],[C5,2],[Bb4,2],
      // Over F (8 beats)
      [C5,2],[D5,1],[F5,1],[E5,2],[D5,2],
      // Over C (8 beats)
      [E5,2],[G5,1],[A5,1],[G5,2],[F5,2],
    ],
  },
  hub: {
    bpm: 96,
    chords: [
      [[C2, G2, C3, E3], 4],  // C
      [[G2, D3, G3, B2], 4],  // G
      [[A1, E2, A2, C3], 4],  // Am
      [[F2, C3, F3, A3], 4],  // F
    ],
    melody: [
      // Over C (4 beats)
      [E5,0.5],[G5,0.5],[A5,1],[G5,0.5],[E5,0.5],[C5,1],
      // Over G (4 beats)
      [D5,0.5],[G5,0.5],[A5,1],[G5,0.5],[F5,0.5],[D5,1],
      // Over Am (4 beats)
      [C5,0.5],[E5,0.5],[A5,1],[G5,0.5],[E5,0.5],[C5,1],
      // Over F (4 beats)
      [A4,0.5],[C5,0.5],[F5,1],[E5,0.5],[C5,0.5],[A4,1],
    ],
  },
  battle: {
    bpm: 138,
    chords: [
      [[A1, E2, A2, C3], 2],   // Am
      [[G2, D3, G3, B2], 2],   // G
      [[F2, C3, F3, A3], 2],   // F
      [[E2, B2, E3, G3], 2],   // Em
    ],
    melody: [
      // Over Am (2 beats)
      [A4,0.25],[C5,0.25],[E5,0.5],[A5,0.5],[G5,0.5],
      // Over G (2 beats)
      [G4,0.25],[B4,0.25],[D5,0.5],[G5,0.5],[F5,0.5],
      // Over F (2 beats)
      [F4,0.25],[A4,0.25],[C5,0.5],[F5,0.5],[E5,0.5],
      // Over Em (2 beats)
      [E4,0.25],[G4,0.25],[B4,0.5],[E5,0.5],[D5,0.5],
    ],
  },
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscs: OscillatorNode[] = [];
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private currentTrack: TrackId | null = null;
  private _volume = 0.33;
  private _muted = false;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  get volume() { return this._volume; }
  get muted() { return this._muted; }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this._muted) this.masterGain.gain.value = this._volume;
    if (typeof localStorage !== 'undefined') localStorage.setItem("ts_volume", String(this._volume));
  }

  setMuted(m: boolean) {
    this._muted = m;
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : this._volume;
    if (typeof localStorage !== 'undefined') localStorage.setItem("ts_muted", String(m));
  }

  loadSettings() {
    if (typeof localStorage === 'undefined') return;
    const v = parseFloat(localStorage.getItem("ts_volume") ?? "0.33");
    const m = localStorage.getItem("ts_muted") === "true";
    this._volume = isNaN(v) ? 0.33 : v;
    this._muted = m;
    if (this.masterGain) {
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
    }
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

  private _stop() {
    if (this.loopTimer) { clearTimeout(this.loopTimer); this.loopTimer = null; }
    this.oscs.forEach(o => { try { o.stop(0); } catch {} });
    this.oscs = [];
  }

  private _schedule(ctx: AudioContext, trackId: TrackId, startTime: number) {
    if (this.currentTrack !== trackId) return;
    const track = TRACKS[trackId];
    const beat = 60 / track.bpm;
    let t = startTime;

    // Chord pads (sawtooth + lowpass = warm strings)
    for (const [freqs, beats] of track.chords) {
      const dur = beats * beat;
      this._chord(ctx, freqs, t, dur);
      t += dur;
    }

    // Melody (sine = soft flute)
    let mt = startTime;
    for (const [freq, beats] of track.melody) {
      const dur = beats * beat;
      this._note(ctx, freq, mt, dur, "sine", 0.09);
      mt += dur;
    }

    const loopMs = (t - startTime) * 1000 - 80;
    this.loopTimer = setTimeout(() => {
      this.oscs = [];
      if (this.currentTrack === trackId) this._schedule(ctx, trackId, ctx.currentTime);
    }, Math.max(200, loopMs));
  }

  private _chord(ctx: AudioContext, freqs: number[], start: number, dur: number) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.8;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, start);
    gn.gain.linearRampToValueAtTime(0.055, start + Math.min(0.4, dur * 0.12));
    gn.gain.linearRampToValueAtTime(0.042, start + dur * 0.75);
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

  private _note(ctx: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0, start);
    gn.gain.linearRampToValueAtTime(vol, start + 0.03);
    gn.gain.linearRampToValueAtTime(vol * 0.7, start + dur * 0.7);
    gn.gain.linearRampToValueAtTime(0, start + dur * 0.97);
    gn.connect(this.masterGain!);
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(gn);
    o.start(start); o.stop(start + dur);
    this.oscs.push(o);
  }
}

export const audioManager = new AudioManager();
