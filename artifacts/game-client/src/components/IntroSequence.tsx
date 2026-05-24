import { useState, useEffect, useRef, useCallback } from "react";
import { audioManager } from "@/lib/audio";
import { markIntroSeen } from "@/lib/introState";

/* ── Phase machine ───────────────────────────────────────────────────────── */
type Phase = "studio" | "title";

export default function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [phase,         setPhase        ] = useState<Phase>("studio");
  const [screenOpacity, setScreenOpacity] = useState(1);

  const transitioning = useRef(false);

  /* ── Cross-fade helper: screen goes black, content swaps, comes back ─── */
  const crossFade = useCallback((cb: () => void, durationMs = 500) => {
    if (transitioning.current) return;
    transitioning.current = true;
    setScreenOpacity(0);
    setTimeout(() => {
      cb();
      setScreenOpacity(1);
      setTimeout(() => { transitioning.current = false; }, durationMs);
    }, durationMs);
  }, []);

  /* ── Ramp Hearthstone Tavern track via audioManager ─────────────────── */
  function rampAudio(target: number, stepSize = 0.025, intervalMs = 80) {
    audioManager.play("hub");
    audioManager.setFileVolume(0);
    let v = 0;
    const id = setInterval(() => {
      v = Math.min(target, v + stepSize);
      audioManager.setFileVolume(v);
      if (v >= target) clearInterval(id);
    }, intervalMs);
  }

  /* ── 1. Studio splash: animation ends → crossfade to title + music ───── */
  const handleStudioEnd = useCallback(() => {
    crossFade(() => {
      setPhase("title");
      rampAudio(0.16);
    }, 500);
  }, [crossFade]);

  /* ── 2. Title: any key or click → complete ───────────────────────────── */
  const handleEnter = useCallback(() => {
    if (phase !== "title" || transitioning.current) return;
    markIntroSeen();
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

      {/* ── PHASE 1: ALTA Studios splash ─────────────────────────────── */}
      {phase === "studio" && (
        <div style={S.fill}>
          <div
            className="studio-wordmark"
            onAnimationEnd={handleStudioEnd}
          >
            ALTA Studios
          </div>
        </div>
      )}

      {/* ── PHASE 2: Title splash ────────────────────────────────────── */}
      {phase === "title" && (
        <div style={S.titleRoot} onClick={handleEnter}>
          <img src="/assets/seekers-panorama.png" alt="Tower Seekers" style={S.splashImg} />
          <div style={S.vignette} />
          <div style={S.titleCenter}>
            <div style={S.titleWordmark}>TOWER SEEKERS</div>
            <div style={S.titleTagline}>
              Thanks for helping us playtest! You&rsquo;re officially one of the first.
            </div>
          </div>
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
    objectPosition: "center center",
    display:        "block",
  } as React.CSSProperties,

  titleCenter: {
    position:       "absolute",
    inset:           0,
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "flex-start",
    gap:             14,
    paddingTop:      "13vh",
  } as React.CSSProperties,

  titleWordmark: {
    fontFamily:    "'Cinzel Decorative', 'Cinzel', Georgia, serif",
    fontWeight:     700,
    fontSize:      "clamp(28px, 5.5vw, 72px)",
    letterSpacing: "0.18em",
    color:         "#fff",
    textShadow:    "0 2px 40px rgba(0,0,0,0.95), 0 0 80px rgba(0,0,0,0.7)",
    lineHeight:     1,
  } as React.CSSProperties,

  titleTagline: {
    fontFamily:    "'Cinzel', Georgia, serif",
    fontWeight:     400,
    fontSize:      "clamp(9px, 1.05vw, 13px)",
    letterSpacing: "0.1em",
    color:         "rgba(255,248,220,0.78)",
    textShadow:    "0 1px 12px rgba(0,0,0,0.95)",
    textAlign:     "center",
  } as React.CSSProperties,

  vignette: {
    position:       "absolute",
    inset:           0,
    background:
      "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 35%, rgba(0,0,0,0.35) 100%), " +
      "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 20%, transparent 55%, rgba(0,0,0,0.75) 100%)",
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
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cinzel+Decorative:wght@700&family=Orbitron:wght@300;400&display=swap');

  /* ALTA Studios wordmark: 0.8s fade-in, 4s hold, 0.8s fade-out = 5.6s */
  .studio-wordmark {
    font-family: 'Orbitron', 'Futura', sans-serif;
    font-weight: 300;
    font-size: clamp(22px, 4vw, 52px);
    letter-spacing: 0.38em;
    text-transform: uppercase;
    color: #fff;
    opacity: 0;
    animation: studioFade 5.6s ease forwards;
  }

  @keyframes studioFade {
    0%     { opacity: 0; }
    14.3%  { opacity: 1; }
    85.7%  { opacity: 1; }
    100%   { opacity: 0; }
  }

  .intro-blink {
    animation: introBlink 1.4s ease-in-out infinite;
  }
  @keyframes introBlink {
    0%, 100% { opacity: 0.95; }
    50%       { opacity: 0.08; }
  }
`;
