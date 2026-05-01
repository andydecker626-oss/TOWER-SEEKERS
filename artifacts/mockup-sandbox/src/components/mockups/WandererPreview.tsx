import { useState, useEffect, useRef, useCallback } from "react";

// Derive image URL relative to the app's base path; guard against missing trailing slash
const _base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const SHEET_URL = `${_base}/images/wanderer-sprite.png`;

// Sprite sheet: 1536×1024px, single horizontal row of 12 frames
// Each frame: 128×1024px  (FRAME_W = 1536/12 = 128, FRAME_H = 1024)
const SHEET_W = 1536;
const SHEET_H = 1024;
const FRAME_W = 128;
const FRAME_H = 1024;
const COLS = 12;
const TOTAL_FRAMES = 12;

// Crop the frame to the art band: character head starts ~row 280, feet at ~row 560.
// Allow 50px above head for attack disc effects that fly up from body level.
// CROP_Y: first visible row of art (0-indexed from frame top)
// CROP_H: height of the art window
const CROP_Y = 230;                   // ~50px above where the character head begins
const CROP_H = 380;                   // rows 230–610: captures idle poses + attack disc

// 2 leftmost frames are idle; remaining 10 are attack
const IDLE_FRAMES = [0, 1];
const ATTACK_FRAMES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const IDLE_FPS = 4;
const ATTACK_FPS = 10;

// Display scale: sized so the unit looks like an in-game game unit
const DISPLAY_SCALE = 0.65;
const DISPLAY_W = Math.round(FRAME_W * DISPLAY_SCALE);   // ~83px
const DISPLAY_H = Math.round(CROP_H * DISPLAY_SCALE);    // ~247px — cropped height
// Full sheet dimensions at display scale (used for backgroundSize)
const SHEET_DS_W = Math.round(SHEET_W * DISPLAY_SCALE); // 998px
const SHEET_DS_H = Math.round(SHEET_H * DISPLAY_SCALE); // 666px
// Y offset to shift the background up so we see the art band, not blank top
const CROP_DS_Y = Math.round(CROP_Y * DISPLAY_SCALE);   // ~150px

// Thumbnail strip: 16px wide, proportional to art band
const THUMB_W = 16;
const THUMB_SCALE = THUMB_W / FRAME_W;                   // 0.125
const THUMB_H = Math.round(CROP_H * THUMB_SCALE);        // ~48px
const THUMB_SHEET_W = Math.round(SHEET_W * THUMB_SCALE); // 192px
const THUMB_SHEET_H = Math.round(SHEET_H * THUMB_SCALE); // 128px
const THUMB_CROP_Y = Math.round(CROP_Y * THUMB_SCALE);   // ~29px

export function WandererPreview() {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);

  const frameRef = useRef(0);
  const attackRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (attackRef.current) {
      const nextIdx = frameRef.current + 1;
      if (nextIdx >= ATTACK_FRAMES.length) {
        attackRef.current = false;
        setIsAttacking(false);
        frameRef.current = 0;
        setFrameIndex(IDLE_FRAMES[0]);
        timerRef.current = setTimeout(tick, 1000 / IDLE_FPS);
      } else {
        frameRef.current = nextIdx;
        setFrameIndex(ATTACK_FRAMES[nextIdx]);
        timerRef.current = setTimeout(tick, 1000 / ATTACK_FPS);
      }
    } else {
      const nextIdx = (frameRef.current + 1) % IDLE_FRAMES.length;
      frameRef.current = nextIdx;
      setFrameIndex(IDLE_FRAMES[nextIdx]);
      timerRef.current = setTimeout(tick, 1000 / IDLE_FPS);
    }
  }, []);

  useEffect(() => {
    frameRef.current = 0;
    setFrameIndex(IDLE_FRAMES[0]);
    timerRef.current = setTimeout(tick, 1000 / IDLE_FPS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [tick]);

  function handleAttack() {
    if (attackRef.current) return;
    attackRef.current = true;
    setIsAttacking(true);
    frameRef.current = 0;
    setFrameIndex(ATTACK_FRAMES[0]);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(tick, 1000 / ATTACK_FPS);
  }

  // Background-position: move horizontally for frame column, and vertically to
  // skip CROP_Y blank pixels at the top of each 1024px frame.
  function bgPos(frameIdx: number): string {
    const bpX = -(frameIdx * DISPLAY_W);
    const bpY = -CROP_DS_Y;
    return `${bpX}px ${bpY}px`;
  }

  function thumbBgPos(frameIdx: number): string {
    const bpX = -(frameIdx * THUMB_W);
    const bpY = -THUMB_CROP_Y;
    return `${bpX}px ${bpY}px`;
  }

  return (
    <div style={S.shell}>
      <style>{css}</style>

      <div style={S.bgGlow} />
      <div style={S.bgFloor} />

      <div style={S.inner}>
        <div style={S.header}>
          <span style={S.badge}>Sprite Preview</span>
          <h1 style={S.title}>Wanderer</h1>
          <p style={S.subtitle}>Dark-robed energy mage · Battle stance</p>
        </div>

        <div style={{ ...S.stage, minHeight: DISPLAY_H + 40 }}>
          <div style={S.pillarL} />
          <div style={S.pillarR} />
          <div style={S.groundGlow} />

          <div style={S.spriteWrap}>
            <div style={S.shadow} />
            <div
              className={isAttacking ? "sprite-attack" : "sprite-idle"}
              style={{
                width: DISPLAY_W,
                height: DISPLAY_H,
                backgroundImage: `url(${SHEET_URL})`,
                backgroundSize: `${SHEET_DS_W}px ${SHEET_DS_H}px`,
                backgroundPosition: bgPos(frameIndex),
                backgroundRepeat: "no-repeat",
                imageRendering: "pixelated",
                overflow: "hidden",
                position: "relative",
                zIndex: 2,
                filter: isAttacking
                  ? "drop-shadow(0 0 20px rgba(80,160,255,0.9)) drop-shadow(0 0 8px rgba(140,200,255,1))"
                  : "drop-shadow(0 0 10px rgba(100,140,255,0.4)) drop-shadow(1px 0 0 rgba(0,0,0,0.9)) drop-shadow(-1px 0 0 rgba(0,0,0,0.9))",
                transition: "filter 0.15s ease",
              }}
            />
            {isAttacking && <div className="energy-ring" style={S.energyRing} />}
          </div>

          <div style={S.groundLine} />
        </div>

        <div style={S.controlRow}>
          <div style={S.statPill}>
            <span style={S.pillLabel}>Mode</span>
            <span style={S.pillValue}>{isAttacking ? "⚡ Attack" : "◈ Idle"}</span>
          </div>
          <div style={S.btnGroup}>
            <button style={S.idleBtn} disabled>◈ Idle</button>
            <button
              style={{
                ...S.attackBtn,
                opacity: isAttacking ? 0.5 : 1,
                cursor: isAttacking ? "not-allowed" : "pointer",
              }}
              onClick={handleAttack}
              disabled={isAttacking}
            >
              ⚡ Attack
            </button>
          </div>
          <div style={S.statPill}>
            <span style={S.pillLabel}>Frame</span>
            <span style={S.pillValue}>{frameIndex + 1} / {TOTAL_FRAMES}</span>
          </div>
        </div>

        <div style={S.strip}>
          {Array.from({ length: TOTAL_FRAMES }, (_, i) => {
            const isIdle = IDLE_FRAMES.includes(i);
            const isActive = i === frameIndex;
            return (
              <div
                key={i}
                style={{
                  ...S.thumb,
                  width: THUMB_W,
                  height: THUMB_H,
                  outline: isActive
                    ? "2px solid rgba(120,200,255,0.9)"
                    : isIdle
                    ? "1px solid rgba(80,160,255,0.35)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: isActive
                    ? "rgba(80,160,255,0.18)"
                    : "rgba(255,255,255,0.03)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: THUMB_W,
                    height: THUMB_H,
                    backgroundImage: `url(${SHEET_URL})`,
                    backgroundSize: `${THUMB_SHEET_W}px ${THUMB_SHEET_H}px`,
                    backgroundPosition: thumbBgPos(i),
                    backgroundRepeat: "no-repeat",
                    imageRendering: "pixelated",
                    overflow: "hidden",
                  }}
                />
                <span style={S.thumbNum}>{i + 1}</span>
                {isIdle && <span style={S.idleTag}>idle</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  shell: {
    position: "relative",
    width: "100%",
    minHeight: "100vh",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(180deg, #040610 0%, #07091c 40%, #0c0b1e 70%, #060412 100%)",
    color: "#f0eaf8",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  bgGlow: {
    position: "absolute",
    left: "50%",
    top: "45%",
    transform: "translate(-50%, -50%)",
    width: 500,
    height: 320,
    borderRadius: "50%",
    background:
      "radial-gradient(ellipse at 50% 50%, rgba(60,100,255,0.11) 0%, rgba(100,60,200,0.07) 45%, transparent 75%)",
    filter: "blur(12px)",
    pointerEvents: "none",
  },
  bgFloor: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "35%",
    background:
      "linear-gradient(180deg, transparent 0%, rgba(12,8,30,0.75) 55%, rgba(5,3,14,0.98) 100%)",
    borderTop: "1px solid rgba(100,80,200,0.06)",
    pointerEvents: "none",
  },
  inner: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    width: "100%",
    maxWidth: 720,
    padding: "20px 20px",
  },
  header: {
    textAlign: "center",
    lineHeight: 1,
  },
  badge: {
    display: "inline-block",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(130,165,255,0.7)",
    background: "rgba(80,100,255,0.09)",
    border: "1px solid rgba(80,120,255,0.18)",
    borderRadius: 4,
    padding: "2px 9px",
    marginBottom: 6,
  },
  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    fontFamily: "Cinzel, Georgia, serif",
    color: "#f0eaf8",
    textShadow: "0 0 36px rgba(100,140,255,0.28), 0 6px 20px rgba(0,0,0,0.5)",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 10,
    color: "rgba(190,180,220,0.5)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  stage: {
    position: "relative",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  pillarL: {
    position: "absolute",
    left: "10%",
    top: "5%",
    bottom: 0,
    width: 4,
    background:
      "linear-gradient(180deg, transparent, rgba(70,50,150,0.2), rgba(70,50,150,0.12))",
    borderRadius: 2,
  },
  pillarR: {
    position: "absolute",
    right: "10%",
    top: "5%",
    bottom: 0,
    width: 4,
    background:
      "linear-gradient(180deg, transparent, rgba(70,50,150,0.2), rgba(70,50,150,0.12))",
    borderRadius: 2,
  },
  groundGlow: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    width: 180,
    height: 24,
    borderRadius: "50%",
    background:
      "radial-gradient(ellipse, rgba(80,120,255,0.18), transparent 70%)",
    filter: "blur(6px)",
  },
  spriteWrap: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  shadow: {
    position: "absolute",
    bottom: -4,
    left: "50%",
    transform: "translateX(-50%)",
    width: Math.round(DISPLAY_W * 0.8),
    height: 8,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.55)",
    filter: "blur(5px)",
    zIndex: 0,
  },
  energyRing: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: DISPLAY_W * 2,
    height: DISPLAY_W * 2,
    borderRadius: "50%",
    border: "2px solid rgba(80,160,255,0.45)",
    zIndex: 0,
    pointerEvents: "none",
  },
  groundLine: {
    width: 240,
    height: 1,
    background:
      "linear-gradient(90deg, transparent, rgba(90,130,255,0.28), transparent)",
    marginTop: 6,
  },
  controlRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    width: "100%",
  },
  statPill: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: "6px 16px",
    minWidth: 72,
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(190,180,220,0.5)",
  },
  pillValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(195,215,255,0.92)",
  },
  btnGroup: {
    display: "flex",
    gap: 10,
  },
  idleBtn: {
    padding: "8px 20px",
    borderRadius: 10,
    border: "1px solid rgba(100,140,255,0.28)",
    background: "rgba(80,100,255,0.14)",
    color: "rgba(170,195,255,0.75)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    cursor: "default",
    fontFamily: "inherit",
  },
  attackBtn: {
    padding: "8px 20px",
    borderRadius: 10,
    border: "1px solid rgba(80,160,255,0.5)",
    background:
      "linear-gradient(135deg, rgba(55,120,255,0.38), rgba(100,60,220,0.38))",
    color: "rgba(175,220,255,0.95)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow:
      "0 0 18px rgba(80,140,255,0.22), inset 0 1px 0 rgba(255,255,255,0.1)",
    transition: "opacity 0.15s ease",
  },
  strip: {
    display: "flex",
    gap: 4,
    flexWrap: "nowrap",
    overflowX: "auto",
    padding: "8px 12px",
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    maxWidth: "100%",
    scrollbarWidth: "none",
    alignItems: "center",
  },
  thumb: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderRadius: 5,
    flexShrink: 0,
    overflow: "hidden",
    position: "relative",
    transition: "outline 0.1s ease",
  },
  thumbNum: {
    position: "absolute",
    bottom: 1,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 6,
    color: "rgba(190,180,220,0.4)",
    fontWeight: 700,
    lineHeight: 1,
  },
  idleTag: {
    position: "absolute",
    top: 1,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 5,
    fontWeight: 800,
    letterSpacing: "0.04em",
    color: "rgba(120,180,255,0.9)",
    background: "rgba(60,100,255,0.22)",
    borderRadius: 2,
    padding: "0 2px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
};

const css = `
  @keyframes idleBob {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-5px); }
  }
  @keyframes attackJolt {
    0%   { transform: translateX(0) scale(1); }
    20%  { transform: translateX(10px) scale(1.06); }
    40%  { transform: translateX(-5px) scale(0.97); }
    100% { transform: translateX(0) scale(1); }
  }
  @keyframes energyPulse {
    0%   { opacity: 0.9; transform: translateX(-50%) scale(0.3); }
    65%  { opacity: 0.5; transform: translateX(-50%) scale(1.15); }
    100% { opacity: 0; transform: translateX(-50%) scale(1.6); }
  }
  .sprite-idle  { animation: idleBob 1.9s ease-in-out infinite; }
  .sprite-attack { animation: attackJolt 0.25s ease-out; }
  .energy-ring  { animation: energyPulse 0.75s ease-out forwards !important; }
`;
