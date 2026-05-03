export type SynthTrackId = "title" | "hub" | "battle";
export type TrackId = SynthTrackId | "skyforge";

// ── Frequency constants ──────────────────────────────────────────────────────
const A1=55, B1=61.74, C2=65.41, D2=73.42, E2=82.41, F2=87.31, G2=98, A2=110, B2=123.47;
const C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196, A3=220, Bb2=116.54, Bb3=233.08;
const F1=43.65, Bb1=58.27, E1=41.20;
const D4=293.66, E4=329.63, F4=349.23, G4=392, A4=440, Bb4=466.16, B4=493.88;
const C5=523.25, D5=587.33, E5=659.25, F5=698.46, G5=783.99, A5=880;

type Chord    = [number[], number];
type MNote    = [number,   number];
type PercChar = "K" | "S" | "H" | "_";

interface Track {
  bpm:          number;
  chords:       Chord[];
  melody:       MNote[];
  melodyType?:  OscillatorType;
  melodyVol?:   number;
  chordCutoff?: number;
  bassLine?:    MNote[];
  perc?:        PercChar[];
}

const TRACKS: Record<SynthTrackId, Track> = {
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
  battle: {
    bpm: 168,
    chordCutoff: 1600,
    melodyType: "square",
    melodyVol: 0.045,
    chords: [
      [[D2, A2, D3, F3], 2],
      [[C2, G2, C3, E3], 2],
      [[Bb1, F2, Bb2, D3], 2],
      [[A1, E2, A2, C3], 2],
    ],
    melody: [
      [D5,0.25],[F5,0.25],[A5,0.5],[G5,0.25],[F5,0.25],[E5,0.5],
      [G5,0.25],[E5,0.25],[C5,0.5],[A5,0.25],[G5,0.25],[E5,0.5],
      [F5,0.25],[D5,0.25],[Bb4,0.5],[F5,0.25],[G5,0.25],[F5,0.5],
      [E5,0.25],[C5,0.25],[A4,0.5],[E5,0.25],[D5,0.25],[E5,0.5],
    ],
    bassLine: [
      [D3,0.5],[A2,0.5], [D3,0.5],[A2,0.5],
      [C3,0.5],[G2,0.5], [C3,0.5],[G2,0.5],
      [Bb2,0.5],[F2,0.5],[Bb2,0.5],[F2,0.5],
      [A2,0.5],[E2,0.5], [A2,0.5],[E2,0.5],
    ],
    perc: [
      "K", "_", "H", "_",   "S", "_", "H", "_",   "K", "_", "H", "_",   "S", "_", "H", "_",
      "K", "_", "H", "_",   "S", "_", "H", "_",   "K", "K", "H", "_",   "S", "H", "K", "H",
    ],
  },
};

// File-backed tracks (MP3 served from /assets/)
const FILE_TRACK_GAIN = 0.25; // MP3 tracks play at 25% of master volume (75% quieter)

const FILE_TRACKS: Partial<Record<TrackId, string>> = {
  skyforge: "/assets/skyforge-siege.mp3",
  hub: "/assets/hearthstone-tavern.mp3",
};

// Battle playlist — random rotation during all battle phases
export const BATTLE_PLAYLIST: { src: string; title: string }[] = [
  { src: "/assets/battle/crystal-fang-rock.mp3", title: "Crystal Fang (Rock)" },
  { src: "/assets/battle/war-tent-oath.mp3",     title: "War Tent Oath"       },
  { src: "/assets/battle/banner-at-dawn.mp3",    title: "Banner at Dawn"      },
  { src: "/assets/battle/crystal-fang.mp3",       title: "Crystal Fang"        },
];

// ── AudioManager ─────────────────────────────────────────────────────────────

class AudioManager {
  private ctx:          AudioContext | null = null;
  private masterGain:   GainNode | null = null;
  private oscs:         OscillatorNode[]        = [];
  private bufSrcs:      AudioBufferSourceNode[] = [];
  private loopTimer:    ReturnType<typeof setTimeout> | null = null;
  private currentTrack: TrackId | null = null;
  private audioEl:      HTMLAudioElement | null = null;
  private _volume      = 0.33;
  private _musicVolume = 1.0;
  private _sfxVolume   = 1.0;
  private _muted       = false;

  private _sfxEnabled = true;

  // ── Battle playlist ───────────────────────────────────────────────────────
  private _inBattlePlaylist  = false;
  private _battlePlaylist:  { src: string; title: string }[] = [];
  private _battleIdx         = 0;
  private _onTrackChangeCb:  ((title: string) => void) | null = null;
  private _battleEndedHandler: (() => void) | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  get volume()      { return this._volume; }
  get musicVolume() { return this._musicVolume; }
  get sfxVolume()   { return this._sfxVolume; }
  get muted()       { return this._muted; }
  get isBattlePlaylistActive(): boolean { return this._inBattlePlaylist; }
  get currentBattleTitle(): string {
    return this._battlePlaylist[this._battleIdx]?.title ?? "";
  }

  onTrackChange(cb: ((title: string) => void) | null) {
    this._onTrackChangeCb = cb;
  }

  playBattlePlaylist() {
    if (this._inBattlePlaylist && this.audioEl && !this.audioEl.paused) return;
    this._stopSynth();
    this.currentTrack = null;
    this._inBattlePlaylist = true;
    // Fisher-Yates shuffle
    const list = [...BATTLE_PLAYLIST];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    this._battlePlaylist = list;
    this._battleIdx = 0;
    if (!this.audioEl) this.audioEl = new Audio();
    this._removeBattleEndedHandler();
    this.audioEl.loop = false;
    this._battleEndedHandler = () => {
      if (!this._inBattlePlaylist) return;
      this._battleIdx = (this._battleIdx + 1) % this._battlePlaylist.length;
      this._loadBattleTrack(this._battleIdx);
    };
    this.audioEl.addEventListener("ended", this._battleEndedHandler);
    this._loadBattleTrack(0);
  }

  nextBattleTrack() {
    if (!this._inBattlePlaylist || !this._battlePlaylist.length) return;
    this._battleIdx = (this._battleIdx + 1) % this._battlePlaylist.length;
    this._loadBattleTrack(this._battleIdx);
  }

  private _removeBattleEndedHandler() {
    if (this._battleEndedHandler && this.audioEl) {
      this.audioEl.removeEventListener("ended", this._battleEndedHandler);
      this._battleEndedHandler = null;
    }
  }

  private _loadBattleTrack(idx: number) {
    const track = this._battlePlaylist[idx];
    if (!track || !this.audioEl) return;
    this.audioEl.src = track.src;
    this.audioEl.load();
    this.audioEl.loop = false;
    this.audioEl.volume = this._effectiveMusicVol();
    this.audioEl.play().catch(() => {});
    if (this._onTrackChangeCb) this._onTrackChangeCb(track.title);
  }

  private _effectiveMusicVol() {
    return this._muted ? 0 : this._volume * this._musicVolume * FILE_TRACK_GAIN;
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this._muted) this.masterGain.gain.value = this._volume;
    if (this.audioEl) this.audioEl.volume = this._effectiveMusicVol();
    if (typeof localStorage !== "undefined") localStorage.setItem("ts_volume", String(this._volume));
  }

  setMusicVolume(v: number) {
    this._musicVolume = Math.max(0, Math.min(1, v));
    if (this.audioEl) this.audioEl.volume = this._effectiveMusicVol();
    if (typeof localStorage !== "undefined") localStorage.setItem("ts_music_vol", String(this._musicVolume));
  }

  setSfxVolume(v: number) {
    this._sfxVolume = Math.max(0, Math.min(1, v));
    if (typeof localStorage !== "undefined") localStorage.setItem("ts_sfx_vol", String(this._sfxVolume));
  }

  setMuted(m: boolean) {
    this._muted = m;
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : this._volume;
    if (this.audioEl) this.audioEl.volume = this._effectiveMusicVol();
    if (typeof localStorage !== "undefined") localStorage.setItem("ts_muted", String(m));
  }

  setSfxEnabled(e: boolean) {
    this._sfxEnabled = e;
    if (typeof localStorage !== "undefined") localStorage.setItem("ts_sfx_enabled", String(e));
  }

  /** Short JRPG-style menu blip. Respects master mute and SFX settings. */
  playClick() {
    if (this._muted || !this._sfxEnabled || this._sfxVolume <= 0) return;
    const ctx = this.getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const vol = this._volume * this._sfxVolume * 0.28;
    if (vol <= 0) return;

    const gn = ctx.createGain();
    gn.gain.setValueAtTime(vol, ctx.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055);
    gn.connect(ctx.destination);

    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(1100, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.045);
    o.connect(gn);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.06);
  }

  loadSettings() {
    if (typeof localStorage === "undefined") return;
    const v   = parseFloat(localStorage.getItem("ts_volume")    ?? "0.33");
    const mv  = parseFloat(localStorage.getItem("ts_music_vol") ?? "1.0");
    const sv  = parseFloat(localStorage.getItem("ts_sfx_vol")   ?? "1.0");
    const m   = localStorage.getItem("ts_muted") === "true";
    const sfxE = localStorage.getItem("ts_sfx_enabled") !== "false";
    this._volume      = isNaN(v)  ? 0.33 : v;
    this._musicVolume = isNaN(mv) ? 1.0  : mv;
    this._sfxVolume   = isNaN(sv) ? 1.0  : sv;
    this._muted       = m;
    this._sfxEnabled  = sfxE;
    if (this.masterGain) this.masterGain.gain.value = this._muted ? 0 : this._volume;
    if (this.audioEl) this.audioEl.volume = this._effectiveMusicVol();
  }

  play(trackId: TrackId) {
    if (trackId === this.currentTrack && !this._inBattlePlaylist) return;
    // Stop battle playlist if switching to a named track
    if (this._inBattlePlaylist) {
      this._inBattlePlaylist = false;
      this._removeBattleEndedHandler();
      if (this.audioEl) { this.audioEl.pause(); this.audioEl.currentTime = 0; this.audioEl.loop = true; }
    }
    this._stopSynth();
    // If switching away from a file track, pause it
    if (this.audioEl && !FILE_TRACKS[trackId]) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    this.currentTrack = trackId;

    const fileSrc = FILE_TRACKS[trackId];
    if (fileSrc) {
      this._playFile(fileSrc);
      return;
    }

    const ctx = this.getCtx();
    const resume = () => this._schedule(ctx, trackId as SynthTrackId, ctx.currentTime);
    if (ctx.state === "suspended") ctx.resume().then(resume);
    else resume();
  }

  stop() {
    this._inBattlePlaylist = false;
    this._removeBattleEndedHandler();
    this._stopSynth();
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    this.currentTrack = null;
  }

  /**
   * Set the raw HTMLAudioElement volume directly, bypassing the master-volume
   * × FILE_TRACK_GAIN scaling.  Used by IntroSequence for its fade-in ramp so
   * the Settings slider value is not disturbed.
   */
  setFileVolume(vol: number) {
    if (this.audioEl) this.audioEl.volume = Math.max(0, Math.min(1, vol));
  }

  /** True if a file-backed track is currently loaded and not paused. */
  get isFilePlaying(): boolean {
    return !!(this.audioEl && !this.audioEl.paused);
  }

  private _playFile(src: string) {
    this._removeBattleEndedHandler();
    if (!this.audioEl) {
      this.audioEl = new Audio();
    }
    this.audioEl.loop = true;
    // Only reload if src changed
    const currentSrc = this.audioEl.getAttribute("src") ?? "";
    if (!currentSrc.endsWith(src) && this.audioEl.src !== src) {
      this.audioEl.src = src;
      this.audioEl.load();
    }
    this.audioEl.volume = this._effectiveMusicVol();
    this.audioEl.play().catch(() => {});
  }

  private _stopSynth() {
    if (this.loopTimer) { clearTimeout(this.loopTimer); this.loopTimer = null; }
    this.oscs.forEach(o => { try { o.stop(0); } catch {} });
    this.bufSrcs.forEach(b => { try { b.stop(0); } catch {} });
    this.oscs    = [];
    this.bufSrcs = [];
  }

  private _schedule(ctx: AudioContext, trackId: SynthTrackId, startTime: number) {
    if (this.currentTrack !== trackId) return;
    const track = TRACKS[trackId];
    const beat  = 60 / track.bpm;
    let t  = startTime;
    let mt = startTime;

    const cutoff = track.chordCutoff ?? 900;
    for (const [freqs, beats] of track.chords) {
      const dur = beats * beat;
      this._chord(ctx, freqs, t, dur, cutoff);
      t += dur;
    }

    const melType = track.melodyType ?? "sine";
    const melVol  = track.melodyVol  ?? 0.09;
    for (const [freq, beats] of track.melody) {
      const dur = beats * beat;
      this._note(ctx, freq, mt, dur, melType, melVol);
      mt += dur;
    }

    if (track.bassLine) {
      let bt = startTime;
      for (const [freq, beats] of track.bassLine) {
        const dur = beats * beat;
        this._bass(ctx, freq, bt, dur);
        bt += dur;
      }
    }

    if (track.perc) {
      const sixteenth = beat / 4;
      track.perc.forEach((p, i) => {
        const pt = startTime + i * sixteenth;
        if      (p === "K") this._kick(ctx, pt);
        else if (p === "S") this._snare(ctx, pt);
        else if (p === "H") this._hihat(ctx, pt);
      });
    }

    const loopMs = (t - startTime) * 1000 - 80;
    this.loopTimer = setTimeout(() => {
      this.oscs    = [];
      this.bufSrcs = [];
      if (this.currentTrack === trackId) this._schedule(ctx, trackId, ctx.currentTime);
    }, Math.max(200, loopMs));
  }

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

  private _bass(ctx: AudioContext, freq: number, start: number, dur: number) {
    const staccDur = dur * 0.65;
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
