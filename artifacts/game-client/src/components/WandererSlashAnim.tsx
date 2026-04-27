import { useEffect, useRef, useState } from "react";

const FRAME_W = 96;
const FRAME_H = 96;
const TOTAL_FRAMES = 12;

const FRAME_TIMINGS_MS = [
  50,   // 1  Idle
  50,   // 2  Lean
  50,   // 3  Set
  50,   // 4  Start Dash
  50,   // 5  Dash Blur
  50,   // 6  Arrive
  50,   // 7  Slash  ← slash arc appears
  120,  // 8  Hit Pause (extended for impact feel)
  50,   // 9  Enemy Recoil
  50,   // 10 Enemy Settle
  50,   // 11 Recover
  80,   // 12 Return
];

const SLASH_ARC_FRAME = 6;   // 0-indexed frame 7
const HIT_FLASH_FRAME = 7;   // 0-indexed frame 8
const DASH_BLUR_FRAME = 4;   // 0-indexed frame 5

interface Props {
  mode?: "loop" | "once";
  onComplete?: () => void;
  scale?: number;
}

export default function WandererSlashAnim({ mode = "loop", onComplete, scale = 2 }: Props) {
  const [frame, setFrame] = useState(0);
  const [showSlashArc, setShowSlashArc] = useState(false);
  const [showHitFlash, setShowHitFlash] = useState(false);
  const [dashBlur, setDashBlur] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(true);

  const w = FRAME_W * scale;
  const h = FRAME_H * scale;

  function scheduleFrame(idx: number) {
    if (!runningRef.current) return;
    const delay = FRAME_TIMINGS_MS[idx] ?? 50;

    timerRef.current = setTimeout(() => {
      if (!runningRef.current) return;
      const next = (idx + 1) % TOTAL_FRAMES;

      setFrame(next);
      setShowSlashArc(next === SLASH_ARC_FRAME);
      setShowHitFlash(next === HIT_FLASH_FRAME);
      setDashBlur(next === DASH_BLUR_FRAME);

      if (next === 0 && mode === "once") {
        onComplete?.();
        return;
      }
      scheduleFrame(next);
    }, delay);
  }

  useEffect(() => {
    runningRef.current = true;
    setFrame(0);
    setShowSlashArc(false);
    setShowHitFlash(false);
    setDashBlur(false);
    scheduleFrame(0);
    return () => {
      runningRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mode]);

  const bgX = -frame * FRAME_W;

  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        display: "inline-block",
        imageRendering: "pixelated",
      }}
    >
      <style>{`
        @keyframes slashArcIn {
          0%   { opacity: 0; transform: scale(0.6) translateX(-20px); }
          40%  { opacity: 1; transform: scale(1.1) translateX(0); }
          100% { opacity: 0; transform: scale(1.3) translateX(10px); }
        }
        @keyframes hitFlashIn {
          0%   { opacity: 0; transform: scale(0.4); }
          20%  { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(0.9); }
        }
        @keyframes dashBlurPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      {/* Sprite sheet */}
      <div
        style={{
          width: w,
          height: h,
          backgroundImage: "url('/assets/units/anim/slash-sheet.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: `${FRAME_W * TOTAL_FRAMES * scale}px ${h}px`,
          backgroundPosition: `${bgX * scale}px 0px`,
          imageRendering: "pixelated",
        }}
      />

      {/* Dash afterimage overlay */}
      {dashBlur && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/assets/units/anim/slash-sheet.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: `${FRAME_W * TOTAL_FRAMES * scale}px ${h}px`,
            backgroundPosition: `${(DASH_BLUR_FRAME - 1) * -FRAME_W * scale}px 0px`,
            opacity: 0.35,
            filter: "blur(2px) brightness(1.4)",
            transform: "translateX(-12px)",
            animation: "dashBlurPulse 0.05s linear",
            imageRendering: "pixelated",
          }}
        />
      )}

      {/* Slash arc VFX */}
      {showSlashArc && (
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "-30%",
            width: Math.round(w * 0.85),
            height: Math.round(h * 0.85),
            backgroundImage: "url('/assets/units/anim/vfx-slash-arc-sm.png')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            imageRendering: "pixelated",
            animation: `slashArcIn ${FRAME_TIMINGS_MS[SLASH_ARC_FRAME]}ms ease-out forwards`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Hit flash VFX */}
      {showHitFlash && (
        <div
          style={{
            position: "absolute",
            top: "15%",
            right: "-10%",
            width: Math.round(w * 0.6),
            height: Math.round(h * 0.6),
            backgroundImage: "url('/assets/units/anim/vfx-hit-flash-sm.png')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            imageRendering: "pixelated",
            animation: `hitFlashIn ${FRAME_TIMINGS_MS[HIT_FLASH_FRAME]}ms ease-out forwards`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Screen-flash on hit */}
      {showHitFlash && (
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: 4,
            background: "rgba(255,220,100,0.25)",
            animation: `hitFlashIn ${FRAME_TIMINGS_MS[HIT_FLASH_FRAME]}ms ease-out forwards`,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
