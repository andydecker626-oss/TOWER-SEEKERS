import { useState, useEffect, useRef, useCallback } from "react";
import { audioManager } from "@/lib/audio";

const INTRO_KEY = "ts_intro_v2";

export function shouldShowIntro(): boolean {
  return !sessionStorage.getItem(INTRO_KEY);
}

/* ── Phase machine ───────────────────────────────────────────────────────── */
type Phase = "video" | "copyright" | "title";

export default function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [phase,        setPhase       ] = useState<Phase>("video");
  const [screenOpacity, setScreenOpacity] = useState(1);
  const [videoBlocked,  setVideoBlocked ] = useState(false);

  const videoRef       = useRef<HTMLVideoElement>(null);
  const transitioning  = useRef(false);

  /* ── Cross-fade helper: screen goes black, content swaps, comes back ─── */
  const crossFade = useCallback((cb: () => void, durationMs = 500) => {
    if (transitioning.current) return;
    transitioning.current = true;
    setScreenOpacity(0);
    setTimeout(() => {
      cb();
      setScreenOpacity(1);
      // release lock after fade-in finishes
      setTimeout(() => { transitioning.current = false; }, durationMs);
    }, durationMs);
  }, []);

  /* ── Ramp skyforge via audioManager (shared singleton, survives unmount) */
  function rampAudio(target: number, stepSize = 0.025, intervalMs = 80) {
    audioManager.play("skyforge");
    audioManager.setFileVolume(0);
    let v = 0;
    const id = setInterval(() => {
      v = Math.min(target, v + stepSize);
      audioManager.setFileVolume(v);
      if (v >= target) clearInterval(id);
    }, intervalMs);
  }

  /* ── 1. Video phase: try to autoplay on mount ─────────────────────────── */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || phase !== "video") return;
    vid.volume = 0.2;
    vid.play().catch(() => setVideoBlocked(true));
  // only run once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advanceFromVideo = useCallback(() => {
    crossFade(() => setPhase("copyright"));
  }, [crossFade]);

  /* ── 2. Copyright: auto-advance after 3.5 s ──────────────────────────── */
  useEffect(() => {
    if (phase !== "copyright") return;
    const t = setTimeout(() => {
      crossFade(() => {
        setPhase("title");
        rampAudio(0.16);
      }, 600);
    }, 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, crossFade]);

  /* ── 3. Title: any key or click → complete ───────────────────────────── */
  const handleEnter = useCallback(() => {
    if (phase !== "title" || transitioning.current) return;
    sessionStorage.setItem(INTRO_KEY, "1");
    crossFade(() => onComplete(), 600);
  }, [phase, crossFade, onComplete]);

  useEffect(() => {
    if (phase !== "title") return;
    const h = () => handleEnter();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase, handleEnter]);

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ ...S.root, opacity: screenOpacity }}>
      <style>{CSS}</style>

      {/* ── PHASE 1: Altaris logo video ─────────────────────────────── */}
      {phase === "video" && (
        <div style={S.fill}>
          <video
            ref={videoRef}
            src="/assets/altaris-intro.mp4"
            playsInline
            style={S.video}
            onEnded={advanceFromVideo}
          />

          {/* Blocked-by-browser fallback */}
          {videoBlocked && (
            <div style={S.blockedOverlay} onClick={() => {
              videoRef.current?.play().then(() => setVideoBlocked(false)).catch(() => {});
            }}>
              <div style={S.blockedBox}>
                <div style={S.playIcon}>▶</div>
                <div style={S.playLabel}>Click to Begin</div>
              </div>
            </div>
          )}

          {/* Skip hint */}
          <div className="intro-skip" onClick={advanceFromVideo}>SKIP ›</div>
        </div>
      )}

      {/* ── PHASE 2: Copyright ──────────────────────────────────────── */}
      {phase === "copyright" && (
        <div style={S.copyrightRoot}>
          <div style={S.copyrightInner}>
            <img src="/assets/altaris-logo.png" alt="Altaris" style={S.crLogo} />

            <div style={S.crDivider} />

            <p style={S.crMain}>© 2026 Altaris Entertainment, Inc. All Rights Reserved.</p>
            <p style={S.crLine}>Tower Seekers™ is a trademark of Altaris Entertainment, Inc.</p>
            <p style={S.crLine}>
              All characters, names, places, and events depicted herein are fictitious.<br />
              Any resemblance to actual persons, living or dead, is purely coincidental.
            </p>

            <div style={{ ...S.crDivider, marginTop: 24 }} />

            <p style={{ ...S.crLine, opacity: 0.28, marginTop: 10 }}>
              This software product includes audio and visual content subject to copyright protection.
            </p>
          </div>
        </div>
      )}

      {/* ── PHASE 3: Title splash ────────────────────────────────────── */}
      {phase === "title" && (
        <div style={S.titleRoot} onClick={handleEnter}>
          <img src="/assets/title-splash.png" alt="Tower Seekers" style={S.splashImg} />
          <div style={S.vignette} />
          <div style={S.titleBottom}>
            <div className="intro-blink" style={S.pressText}>
              PRESS ANY KEY TO ENTER
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Inline styles ───────────────────────────────────────────────────────── */
const S = {
  root: {
    position:   "fixed",
    inset:       0,
    zIndex:      9999,
    background: "#000",
    overflow:   "hidden",
    transition: "opacity 0.55s ease",
  } as React.CSSProperties,

  fill: {
    position:        "absolute",
    inset:            0,
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    background:      "#000",
  } as React.CSSProperties,

  video: {
    width:       "100%",
    height:      "100%",
    objectFit:   "contain",
    background:  "#000",
    display:     "block",
  } as React.CSSProperties,

  blockedOverlay: {
    position:        "absolute",
    inset:            0,
    background:      "rgba(0,0,0,0.72)",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    cursor:          "pointer",
  } as React.CSSProperties,

  blockedBox: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    gap:             14,
  } as React.CSSProperties,

  playIcon: {
    fontFamily: "sans-serif",
    fontSize:    52,
    color:       "rgba(240,192,64,0.85)",
    lineHeight:   1,
  } as React.CSSProperties,

  playLabel: {
    fontFamily:    "'Cinzel', Georgia, serif",
    fontSize:       13,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color:         "rgba(240,192,64,0.65)",
  } as React.CSSProperties,

  /* Copyright ── */
  copyrightRoot: {
    position:        "absolute",
    inset:            0,
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    background:      "#000",
  } as React.CSSProperties,

  copyrightInner: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    gap:             8,
    maxWidth:        540,
    padding:        "0 32px",
    textAlign:      "center",
  } as React.CSSProperties,

  crLogo: {
    height:       56,
    objectFit:    "contain",
    opacity:       0.7,
    marginBottom: 12,
    filter:       "brightness(0.85) saturate(0.5)",
  } as React.CSSProperties,

  crDivider: {
    width:      220,
    height:       1,
    background: "linear-gradient(90deg, transparent, rgba(240,192,64,0.2), transparent)",
    margin:     "4px 0",
  } as React.CSSProperties,

  crMain: {
    fontFamily:    "'Cinzel', Georgia, serif",
    fontSize:       12,
    letterSpacing: "0.07em",
    color:         "rgba(220,200,160,0.65)",
    margin:         0,
    lineHeight:     1.7,
  } as React.CSSProperties,

  crLine: {
    fontFamily:    "'Cinzel', Georgia, serif",
    fontSize:       10,
    letterSpacing: "0.05em",
    color:         "rgba(180,160,120,0.38)",
    margin:         0,
    lineHeight:     1.75,
  } as React.CSSProperties,

  /* Title splash ── */
  titleRoot: {
    position:   "absolute",
    inset:       0,
    cursor:     "pointer",
    userSelect: "none",
  } as React.CSSProperties,

  splashImg: {
    position:       "absolute",
    inset:           0,
    width:          "100%",
    height:         "100%",
    objectFit:      "cover",
    objectPosition: "center",
    display:        "block",
  } as React.CSSProperties,

  vignette: {
    position:       "absolute",
    inset:           0,
    background:
      "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 35%, rgba(0,0,0,0.45) 100%), " +
      "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 20%, transparent 60%, rgba(0,0,0,0.8) 100%)",
    pointerEvents:  "none",
  } as React.CSSProperties,

  titleBottom: {
    position:       "absolute",
    bottom:          0,
    left:            0,
    right:           0,
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    paddingBottom:   40,
  } as React.CSSProperties,

  pressText: {
    fontFamily:    "'Cinzel', Georgia, serif",
    fontSize:      "clamp(11px, 1.35vw, 16px)",
    letterSpacing: "0.34em",
    textTransform: "uppercase",
    color:         "rgba(255,248,220,0.92)",
    textShadow:    "0 2px 20px rgba(0,0,0,0.95), 0 0 36px rgba(240,192,64,0.25)",
  } as React.CSSProperties,
} as const;

/* ── Keyframe CSS ────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');

  .intro-blink {
    animation: introBlink 1.4s ease-in-out infinite;
  }
  @keyframes introBlink {
    0%, 100% { opacity: 0.95; }
    50%       { opacity: 0.08; }
  }

  .intro-skip {
    position: absolute;
    bottom: 20px;
    right: 26px;
    font-family: 'Cinzel', Georgia, serif;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    cursor: pointer;
    user-select: none;
    transition: color 0.2s;
  }
  .intro-skip:hover { color: rgba(255,255,255,0.55); }
`;
