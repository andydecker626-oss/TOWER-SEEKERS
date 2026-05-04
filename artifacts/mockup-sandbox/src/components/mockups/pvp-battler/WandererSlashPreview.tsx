import { useEffect, useRef, useState } from "react";

const SHEET_URL = "https://e16e9f5e-ad4f-421a-bc52-eca91f08de8e-00-25ykq3ctis88f.worf.replit.dev/assets/units/wanderer-slash-sheet-v2.png";
const FRAME_W = 192;
const FRAME_H = 192;
const TOTAL_FRAMES = 12;
const SCALE = 2.5;

const FRAME_TIMINGS_MS = [
  80,   // 1  Idle
  80,   // 2  Idle hold
  60,   // 3  Anticipation
  60,   // 4  Anticipation coil
  50,   // 5  Dash start
  50,   // 6  Dash blur
  50,   // 7  Dash arrive
  60,   // 8  Slash strike
  120,  // 9  Hit pause (longer hold for impact feel)
  80,   // 10 Hit pause settle
  70,   // 11 Recovery
  80,   // 12 Return
];

const SLASH_ARC_FRAMES  = new Set([7, 8]);
const HIT_FLASH_FRAMES  = new Set([8, 9]);
const DASH_BLUR_FRAME   = 5;

const FRAME_LABELS = [
  "Idle", "Idle", "Anticipation", "Anticipation",
  "Dash", "Dash Blur", "Dash Arrive",
  "Slash", "Hit Pause", "Settle",
  "Recovery", "Return"
];

export function WandererSlashPreview() {
  const [frame, setFrame] = useState(0);
  const [showSlashArc, setShowSlashArc] = useState(false);
  const [showHitFlash, setShowHitFlash] = useState(false);
  const [dashBlur, setDashBlur] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(true);

  const w = FRAME_W * SCALE;
  const h = FRAME_H * SCALE;

  function scheduleFrame(idx: number) {
    if (!runningRef.current) return;
    timerRef.current = setTimeout(() => {
      if (!runningRef.current) return;
      const next = (idx + 1) % TOTAL_FRAMES;
      setFrame(next);
      setShowSlashArc(SLASH_ARC_FRAMES.has(next));
      setShowHitFlash(HIT_FLASH_FRAMES.has(next));
      setDashBlur(next === DASH_BLUR_FRAME);
      scheduleFrame(next);
    }, FRAME_TIMINGS_MS[idx] ?? 60);
  }

  useEffect(() => {
    runningRef.current = true;
    scheduleFrame(0);
    return () => {
      runningRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const bgX = -frame * FRAME_W;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0d0d1a 0%, #111827 50%, #0a0f1e 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "2rem",
      fontFamily: "monospace",
    }}>
      <div style={{ color: "rgba(100,180,255,0.6)", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
        Wanderer  ·  Slash Animation
      </div>

      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Ground shadow */}
        <div style={{
          position: "absolute",
          bottom: -8,
          left: "50%",
          transform: "translateX(-50%)",
          width: w * 0.55,
          height: 16,
          background: "rgba(0,0,0,0.4)",
          borderRadius: "50%",
          filter: "blur(6px)",
        }} />

        {/* Sprite */}
        <div style={{
          width: w,
          height: h,
          backgroundImage: `url('${SHEET_URL}')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${FRAME_W * TOTAL_FRAMES * SCALE}px ${h}px`,
          backgroundPosition: `${bgX * SCALE}px 0px`,
          imageRendering: "pixelated",
          position: "relative",
        }} />

        {/* Dash afterimage */}
        {dashBlur && (
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('${SHEET_URL}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${FRAME_W * TOTAL_FRAMES * SCALE}px ${h}px`,
            backgroundPosition: `${(DASH_BLUR_FRAME - 1) * -FRAME_W * SCALE}px 0px`,
            opacity: 0.35,
            filter: "blur(3px) brightness(1.5)",
            transform: "translateX(-18px)",
            imageRendering: "pixelated",
          }} />
        )}

        {/* Slash arc VFX */}
        {showSlashArc && (
          <div style={{
            position: "absolute",
            top: "8%",
            right: "-35%",
            width: Math.round(w * 0.9),
            height: Math.round(h * 0.9),
            background: "radial-gradient(ellipse 80% 30% at 40% 55%, rgba(80,220,255,0.55) 0%, transparent 70%)",
            borderRadius: "0 60% 60% 0 / 0 40% 40% 0",
            transform: "rotate(-30deg) scaleX(1.3)",
            animation: "slashArcIn 180ms ease-out forwards",
            pointerEvents: "none",
          }} />
        )}

        {/* Hit flash ring */}
        {showHitFlash && (
          <div style={{
            position: "absolute",
            top: "20%",
            right: "-18%",
            width: Math.round(w * 0.55),
            height: Math.round(h * 0.55),
            border: "3px solid rgba(120,230,255,0.85)",
            borderRadius: "50%",
            boxShadow: "0 0 18px 6px rgba(100,210,255,0.5)",
            animation: "hitFlashIn 120ms ease-out forwards",
            pointerEvents: "none",
          }} />
        )}
      </div>

      {/* Frame indicator */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {Array.from({ length: TOTAL_FRAMES }).map((_, i) => (
          <div key={i} style={{
            width: i === frame ? 22 : 8,
            height: 8,
            borderRadius: 4,
            background: i === frame
              ? (SLASH_ARC_FRAMES.has(i) ? "#40d0ff" : HIT_FLASH_FRAMES.has(i) ? "#80e8ff" : "#e0a030")
              : "rgba(255,255,255,0.12)",
            transition: "width 60ms, background 60ms",
          }} />
        ))}
      </div>

      {/* Frame label */}
      <div style={{ color: "rgba(180,210,255,0.5)", fontSize: "0.7rem", letterSpacing: "0.15em" }}>
        {FRAME_LABELS[frame]}
      </div>

      <style>{`
        @keyframes slashArcIn {
          0%   { opacity: 0; transform: rotate(-30deg) scaleX(0.4) scaleY(0.6); }
          35%  { opacity: 1; transform: rotate(-30deg) scaleX(1.4) scaleY(1.1); }
          100% { opacity: 0; transform: rotate(-30deg) scaleX(1.7) scaleY(0.8); }
        }
        @keyframes hitFlashIn {
          0%   { opacity: 0; transform: scale(0.3); }
          25%  { opacity: 1; transform: scale(1.25); }
          100% { opacity: 0; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}
