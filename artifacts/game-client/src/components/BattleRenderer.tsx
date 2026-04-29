import { useEffect, useRef } from "react";
import type { ColorMatrix } from "pixi.js";
import type { GridUnit } from "@/lib/types";

type MapType = "castle" | "desert" | "forest" | "colosseum";

function getMapType(bgUrl: string): MapType {
  if (bgUrl.includes("castle")) return "castle";
  if (bgUrl.includes("desert")) return "desert";
  if (bgUrl.includes("forest")) return "forest";
  return "colosseum";
}

// Ambient light tint per map: diagonal scale matrix [r, g, b]
const MAP_AMBIENT: Record<MapType, [number, number, number]> = {
  castle:    [0.88, 0.85, 1.12],
  desert:    [1.18, 1.05, 0.75],
  forest:    [0.82, 1.10, 0.88],
  colosseum: [1.06, 0.98, 0.82],
};

// Ground plane color per map (for the PixiJS ground plane)
const MAP_GROUND_COLOR: Record<MapType, number> = {
  castle:    0x2a1a3a,
  desert:    0x4a3010,
  forest:    0x102015,
  colosseum: 0x301a08,
};

// ── Perspective constants — must match Battle.tsx CSS ────────────────────────
// perspective: 900px; rotateX(30deg); perspective-origin: 50% 42%
const ROT_DEG   = 30;
const PERSP_PX  = 900;
const PERSP_OY  = 0.42; // perspective-origin Y fraction (0=top, 0.5=center, 1=bottom)
// Battlefield layout constants (match Battle.tsx: STEP=78, ENEMY_OFFSET=348, BOARD_H=312)
const BF_STEP   = 78;
const BF_ENEMY_OFFSET = 348; // 4*STEP + 36
// Column X positions in unrotated battlefield local space (left-edge = 0)
const BF_COL_XS = [
  0, BF_STEP, BF_STEP * 2, BF_STEP * 3, BF_STEP * 4,
  BF_ENEMY_OFFSET, BF_ENEMY_OFFSET + BF_STEP, BF_ENEMY_OFFSET + BF_STEP * 2,
  BF_ENEMY_OFFSET + BF_STEP * 3,
];

/** Build a 20-element PixiJS ColorMatrix from per-channel multipliers. */
function buildScaleMatrix(r: number, g: number, b: number): ColorMatrix {
  return [
    r, 0, 0, 0, 0,
    0, g, 0, 0, 0,
    0, 0, b, 0, 0,
    0, 0, 0, 1, 0,
  ] as ColorMatrix;
}

// Per-map particle config
type ParticleConfig = {
  count: number;
  color: number;
  alphaRange: [number, number];
  speedX: [number, number];
  speedY: [number, number];
  sizeRange: [number, number];
  shape: "circle" | "leaf";
  turbulence: number;
};

const MAP_PARTICLES: Record<MapType, ParticleConfig> = {
  castle: {
    count: 40, color: 0xff6020,
    alphaRange: [0.3, 0.85],
    speedX: [-0.6, 0.8], speedY: [-1.2, -0.3],
    sizeRange: [1.5, 4], shape: "circle", turbulence: 0.08,
  },
  desert: {
    count: 35, color: 0xd4b882,
    alphaRange: [0.12, 0.45],
    speedX: [0.3, 1.1], speedY: [-0.2, 0.2],
    sizeRange: [2, 5], shape: "circle", turbulence: 0.04,
  },
  forest: {
    count: 30, color: 0x5a8a30,
    alphaRange: [0.35, 0.75],
    speedX: [-0.4, -1.2], speedY: [0.5, 1.4],
    sizeRange: [3, 7], shape: "leaf", turbulence: 0.12,
  },
  colosseum: {
    count: 28, color: 0xffe0a0,
    alphaRange: [0.1, 0.4],
    speedX: [-0.2, 0.3], speedY: [-0.8, -0.2],
    sizeRange: [2, 4], shape: "circle", turbulence: 0.05,
  },
};

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; size: number;
  rotation: number; rotationSpeed: number;
  life: number; maxLife: number;
  turbOffset: number;
}

function createParticle(cfg: ParticleConfig, w: number, h: number): Particle {
  const maxLife = 120 + Math.random() * 180;
  return {
    x: Math.random() * w, y: Math.random() * h,
    vx: cfg.speedX[0] + Math.random() * (cfg.speedX[1] - cfg.speedX[0]),
    vy: cfg.speedY[0] + Math.random() * (cfg.speedY[1] - cfg.speedY[0]),
    alpha: cfg.alphaRange[0] + Math.random() * (cfg.alphaRange[1] - cfg.alphaRange[0]),
    size: cfg.sizeRange[0] + Math.random() * (cfg.sizeRange[1] - cfg.sizeRange[0]),
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.06,
    life: Math.random() * maxLife, maxLife,
    turbOffset: Math.random() * Math.PI * 2,
  };
}

interface VfxBurst {
  x: number; y: number;
  radius: number; maxRadius: number;
  alpha: number; color: number;
  time: number; maxTime: number;
}

interface Props {
  battleBg: string;
  myUnits: GridUnit[];
  enemyUnits: GridUnit[];
  mySide: string;
  flashUnits: Record<string, string>;
  stageRef: React.RefObject<HTMLDivElement | null>;
}

export default function BattleRenderer({
  battleBg, myUnits, enemyUnits, mySide, flashUnits, stageRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFlashRef = useRef<Record<string, string>>({});
  const vfxQueueRef = useRef<Array<{ instanceId: string; type: string }>>([]);

  // Live ref so the ticker always reads current prop values
  const liveRef = useRef({ myUnits, enemyUnits, mySide, flashUnits });
  useEffect(() => {
    liveRef.current = { myUnits, enemyUnits, mySide, flashUnits };
  }, [myUnits, enemyUnits, mySide, flashUnits]);

  // Queue VFX events when flashUnits changes
  useEffect(() => {
    const prev = prevFlashRef.current;
    Object.entries(flashUnits).forEach(([id, type]) => {
      if (type && prev[id] !== type) {
        vfxQueueRef.current.push({ instanceId: id, type });
      }
    });
    prevFlashRef.current = { ...flashUnits };
  }, [flashUnits]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const stageEl: HTMLDivElement = stage;
    const canvasEl: HTMLCanvasElement = canvas;

    let destroyed = false;
    let appInstance: import("pixi.js").Application | null = null;
    // Closure variable for ResizeObserver cleanup — avoids `as any` on app object
    let roCleanup: (() => void) | null = null;

    async function init() {
      const {
        Application, Assets, Sprite, Container, Graphics,
        ColorMatrixFilter, BlurFilter,
      } = await import("pixi.js");

      const app = new Application();
      await app.init({
        canvas: canvasEl,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });

      if (destroyed) { app.destroy(false); return; }
      appInstance = app;

      const mapType = getMapType(battleBg);
      const partCfg = MAP_PARTICLES[mapType];

      // ── Resize handler ───────────────────────────────────────────────────
      function resize() {
        const { width, height } = stageEl.getBoundingClientRect();
        app.renderer.resize(width, height);
      }
      resize();
      const roResize = new ResizeObserver(resize);
      roResize.observe(stageEl);

      // ── Root container with ambient color grading ─────────────────────────
      const root = new Container();
      app.stage.addChild(root);

      const ambientFilter = new ColorMatrixFilter();
      const [ar, ag, ab] = MAP_AMBIENT[mapType];
      ambientFilter.matrix = buildScaleMatrix(ar, ag, ab);
      root.filters = [ambientFilter];

      // ── Background layers ─────────────────────────────────────────────────
      const bgContainer = new Container();
      root.addChild(bgContainer);

      let farSprite: import("pixi.js").Sprite | null = null;
      let midSprite: import("pixi.js").Sprite | null = null;

      try {
        const bgTexture = await Assets.load(battleBg);
        if (destroyed) return;

        farSprite = new Sprite(bgTexture);
        midSprite = new Sprite(bgTexture);

        for (const sp of [farSprite, midSprite]) {
          sp.anchor.set(0.5, 0.5);
          bgContainer.addChild(sp);
        }

        // Mid-ground layer gets a blur+additive blend for persistent HD-2D glow
        const midBlur = new BlurFilter({ strength: 1.5, quality: 2 });
        midSprite.filters = [midBlur];
        midSprite.alpha = 0.55;
        midSprite.blendMode = "add";
      } catch {
        // Background failed to load — canvas stays transparent
      }

      function scaleBg() {
        const w = app.renderer.width / (app.renderer.resolution ?? 1);
        const h = app.renderer.height / (app.renderer.resolution ?? 1);
        for (const sp of [farSprite, midSprite]) {
          if (!sp) continue;
          const tex = sp.texture;
          const scale = Math.max(w / tex.width, h / tex.height) * 1.08;
          sp.scale.set(scale);
          sp.x = w / 2;
          sp.y = h / 2;
        }
      }
      scaleBg();
      const roScale = new ResizeObserver(scaleBg);
      roScale.observe(stageEl);

      roCleanup = () => { roResize.disconnect(); roScale.disconnect(); };

      // Parallax settling: camera drifts in from an offset over ~1.6 s
      let parallaxX = -18;
      let parallaxY = -10;
      let parallaxTime = 0;
      const PARALLAX_DURATION = 100; // ticks @ 60 fps

      // ── Ground plane layer ────────────────────────────────────────────────
      // Drawn as a PixiJS Graphics rect matching the battlefield element's
      // actual screen-space bounding rect (after CSS rotateX transform).
      const groundLayer = new Container();
      root.addChild(groundLayer);
      const groundGfx = new Graphics();
      groundLayer.addChild(groundGfx);
      const groundColor = MAP_GROUND_COLOR[mapType];

      // ── Particle layer ────────────────────────────────────────────────────
      const particleContainer = new Container();
      root.addChild(particleContainer);
      const particleGfx = new Graphics();
      particleContainer.addChild(particleGfx);

      const particles: Particle[] = [];
      function spawnParticles(count: number) {
        const w = app.renderer.width / (app.renderer.resolution ?? 1);
        const h = app.renderer.height / (app.renderer.resolution ?? 1);
        for (let i = 0; i < count; i++) particles.push(createParticle(partCfg, w, h));
      }
      spawnParticles(partCfg.count);

      // ── Shadow layer ──────────────────────────────────────────────────────
      const shadowLayer = new Container();
      root.addChild(shadowLayer);
      const unitShadows = new Map<string, import("pixi.js").Graphics>();

      function ensureShadow(instanceId: string): import("pixi.js").Graphics {
        if (unitShadows.has(instanceId)) return unitShadows.get(instanceId)!;
        const g = new Graphics();
        shadowLayer.addChild(g);
        unitShadows.set(instanceId, g);
        return g;
      }

      // ── VFX / Bloom layer ─────────────────────────────────────────────────
      // Separate container above the ambient root so bloom is unaffected by
      // scene color grading. Additive blending + blur creates a genuine
      // light-bloom pipeline: bright shapes → spread via blur → add over scene.
      const vfxRoot = new Container();
      app.stage.addChild(vfxRoot);

      // Glow layer: blurred additive shapes that simulate light spreading
      const glowContainer = new Container();
      glowContainer.blendMode = "add";
      const glowBlur = new BlurFilter({ strength: 18, quality: 4 });
      glowContainer.filters = [glowBlur];
      vfxRoot.addChild(glowContainer);

      // Sharp layer: crisp expanding ring on top of the glow, also additive
      const sharpContainer = new Container();
      sharpContainer.blendMode = "add";
      vfxRoot.addChild(sharpContainer);

      const glowGfx = new Graphics();
      glowContainer.addChild(glowGfx);
      const sharpGfx = new Graphics();
      sharpContainer.addChild(sharpGfx);

      const vfxBursts: VfxBurst[] = [];

      // ── Main ticker ───────────────────────────────────────────────────────
      let tick = 0;

      app.ticker.add(() => {
        if (destroyed) return;
        tick++;

        const res = app.renderer.resolution ?? 1;
        const w = app.renderer.width / res;
        const h = app.renderer.height / res;
        const canvasRect = canvasEl.getBoundingClientRect();

        // ── Parallax settling ────────────────────────────────────────────
        if (parallaxTime < PARALLAX_DURATION) {
          parallaxTime++;
          const t = parallaxTime / PARALLAX_DURATION;
          const ease = 1 - Math.pow(1 - t, 3);
          const cx = parallaxX * (1 - ease);
          const cy = parallaxY * (1 - ease);
          if (farSprite) { farSprite.x = w / 2 + cx * 0.5; farSprite.y = h / 2 + cy * 0.5; }
          if (midSprite) { midSprite.x = w / 2 + cx;       midSprite.y = h / 2 + cy; }
        } else {
          // Subtle ambient sway after settling
          const swayX = Math.sin(tick * 0.003) * 2;
          const swayY = Math.cos(tick * 0.0022) * 2;
          if (farSprite) { farSprite.x = w / 2 + swayX * 0.5; farSprite.y = h / 2 + swayY * 0.5; }
          if (midSprite) { midSprite.x = w / 2 + swayX;       midSprite.y = h / 2 + swayY; }
        }

        // ── Perspective-correct 3D floor grid ───────────────────────────────
        // Matches CSS: perspective(PERSP_PX) rotateX(ROT_DEG) on .b-battlefield
        const bfEl = document.querySelector<HTMLElement>(".b-battlefield");
        const fwEl = document.querySelector<HTMLElement>(".b-field-wrap");
        groundGfx.clear();
        if (bfEl && fwEl) {
          const fwRect = fwEl.getBoundingClientRect();
          const BW      = bfEl.offsetWidth;
          const BH      = bfEl.offsetHeight;
          const BH_STEP = BH / 4; // = STEP (78px): vertical spacing between rows

          const θ = ROT_DEG * Math.PI / 180;
          const cosθ = Math.cos(θ);
          const sinθ = Math.sin(θ);
          const d    = PERSP_PX;

          // Perspective-origin in canvas coords.
          // CSS perspective-origin: 50% PERSP_OY*100% on .b-field-wrap
          const fw_cx = (fwRect.left + fwRect.right) / 2 - canvasRect.left;
          const fw_cy = fwRect.top + fwRect.height * PERSP_OY - canvasRect.top;

          // Offset of battlefield center from the perspective-origin
          const dx = bfEl.offsetLeft + BW / 2 - fwEl.offsetWidth  * 0.5;
          const dy = bfEl.offsetTop  + BH / 2 - fwEl.offsetHeight * PERSP_OY;

          // Project a point in battlefield local space (relative to bf center) → canvas
          const proj = (lx: number, ly: number) => {
            const z     = ly * sinθ;
            const scale = d / (d - z);
            return {
              x: fw_cx + (dx + lx) * scale,
              y: fw_cy + (dy + ly * cosθ) * scale,
            };
          };

          const hw = BW / 2, hh = BH / 2;
          const TL = proj(-hw, -hh), TR = proj(hw, -hh);
          const BL = proj(-hw,  hh), BR = proj(hw,  hh);

          // ─ Base floor fill ───────────────────────────────────────────────
          groundGfx
            .poly([TL.x, TL.y, TR.x, TR.y, BR.x, BR.y, BL.x, BL.y])
            .fill({ color: groundColor, alpha: 0.72 });

          // ─ Row depth bands (front rows slightly lighter) ─────────────────
          for (let r = 0; r < 4; r++) {
            const ly0 = -hh + r       * BH_STEP;
            const ly1 = -hh + (r + 1) * BH_STEP;
            const L0 = proj(-hw, ly0), R0 = proj(hw, ly0);
            const L1 = proj(-hw, ly1), R1 = proj(hw, ly1);
            groundGfx
              .poly([L0.x, L0.y, R0.x, R0.y, R1.x, R1.y, L1.x, L1.y])
              .fill({ color: 0xffffff, alpha: 0.03 + r * 0.025 });
          }

          // ─ Row grid lines (5 lines including top/bottom edges) ───────────
          for (let r = 0; r <= 4; r++) {
            const ly   = -hh + r * BH_STEP;
            const L    = proj(-hw, ly), R = proj(hw, ly);
            const edge = r === 0 || r === 4;
            groundGfx
              .moveTo(L.x, L.y).lineTo(R.x, R.y)
              .stroke({ color: 0xffffff, alpha: edge ? 0.28 : 0.10, width: edge ? 2 : 1 });
          }

          // ─ Column grid lines (ally cols + divider gap + enemy cols) ──────
          for (const colX of BF_COL_XS) {
            const lx         = colX - hw;
            const T          = proj(lx, -hh), Bo = proj(lx, hh);
            const isEdge     = colX === 0;
            const isDivider  = colX === BF_STEP * 4;
            groundGfx
              .moveTo(T.x, T.y).lineTo(Bo.x, Bo.y)
              .stroke({
                color: 0xffffff,
                alpha: isEdge ? 0.20 : isDivider ? 0.16 : 0.07,
                width: 1,
              });
          }
          // Right edge column
          { const lx = hw; const T = proj(lx, -hh), Bo = proj(lx, hh);
            groundGfx.moveTo(T.x, T.y).lineTo(Bo.x, Bo.y).stroke({ color: 0xffffff, alpha: 0.20, width: 1 }); }

          // ─ Front edge highlight ──────────────────────────────────────────
          groundGfx
            .moveTo(BL.x, BL.y).lineTo(BR.x, BR.y)
            .stroke({ color: 0xffffff, alpha: 0.50, width: 3 });

          // ─ Back (far) edge — horizon glow in map color ───────────────────
          groundGfx
            .moveTo(TL.x, TL.y).lineTo(TR.x, TR.y)
            .stroke({ color: groundColor, alpha: 0.80, width: 4 });

          // ─ Center divider glow (between ally/enemy halves) ───────────────
          const divMidX  = (BF_STEP * 4 + BF_ENEMY_OFFSET) / 2 - hw;
          const T_div    = proj(divMidX, -hh), B_div = proj(divMidX, hh);
          groundGfx
            .moveTo(T_div.x, T_div.y).lineTo(B_div.x, B_div.y)
            .stroke({ color: 0xffcc44, alpha: 0.12, width: 3 });
        }

        // ── Particles ─────────────────────────────────────────────────────
        particleGfx.clear();
        const col = partCfg.color;
        for (const p of particles) {
          p.x += p.vx + Math.sin(tick * 0.04 + p.turbOffset) * partCfg.turbulence;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
          p.life++;

          const lifePct = p.life / p.maxLife;
          const fade = lifePct < 0.15 ? lifePct / 0.15
                     : lifePct > 0.8  ? (1 - lifePct) / 0.2
                     : 1;
          const alpha = p.alpha * fade;

          if (p.life > p.maxLife || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
            const r = createParticle(partCfg, w, h);
            Object.assign(p, r);
            p.life = 0;
            if (mapType === "desert")   { p.x = -5; }
            if (mapType === "castle")   { p.x = Math.random() * w; p.y = h + 5; }
            if (mapType === "forest")   { p.x = w + 5; p.y = Math.random() * h * 0.6; }
            if (mapType === "colosseum") { p.x = Math.random() * w; p.y = h + 5; }
            continue;
          }

          if (partCfg.shape === "leaf") {
            particleGfx.rect(p.x - p.size / 2, p.y - p.size * 0.4, p.size, p.size * 0.8)
              .fill({ color: col, alpha });
          } else {
            particleGfx.circle(p.x, p.y, p.size).fill({ color: col, alpha });
          }
        }

        // ── Ground shadows (PixiJS tracks DOM positions for depth-aware shadows) ──
        const { myUnits: lmy, enemyUnits: len, flashUnits: lfu } = liveRef.current;
        const allUnits = [...lmy, ...len];

        for (const unit of allUnits) {
          const spriteEl = document.querySelector<HTMLElement>(`[data-sprite-id="${unit.instanceId}"]`);
          const shadow = ensureShadow(unit.instanceId);

          if (!spriteEl || !unit.alive) {
            shadow.clear(); shadow.visible = false;
            continue;
          }

          const sr = spriteEl.getBoundingClientRect();
          const sx = sr.left + sr.width  / 2 - canvasRect.left;
          const sy = sr.bottom           - canvasRect.top;
          const depthScale = 0.82 + (unit.y / 3) * 0.18;

          const dmgFlash = lfu[unit.instanceId] === "damage";
          const shadowAlpha = (0.42 + (unit.y / 3) * 0.22) * (dmgFlash ? 1.6 : 1);
          shadow.clear();
          shadow.visible = true;
          shadow.ellipse(sx, sy + 2, 36 * depthScale, 7 * depthScale)
            .fill({ color: 0x000000, alpha: Math.min(shadowAlpha, 0.85) });
        }

        // Remove shadows for units that left the field
        for (const [id, g] of unitShadows) {
          if (!allUnits.find(u => u.instanceId === id)) {
            shadowLayer.removeChild(g);
            g.destroy();
            unitShadows.delete(id);
          }
        }

        // ── VFX / Bloom bursts ─────────────────────────────────────────────
        // Flash event taxonomy (from Battle.tsx applyEventAnimation):
        //   "attack" — set on the ACTOR during attack/skill (amber lunge glow)
        //   "skill"  — set on the ACTOR during skill cast (purple burst)
        //   "damage" — set on the TARGET when it receives damage from any source
        //              (includes critical hits, which use the same flash; there is
        //               no separate "crit" event type in the game engine)
        //   "ko"     — KO'd unit (no bloom, sprite fades out)
        //   "defend" / "wait" — no bloom
        // Each event produces: a large blurred additive circle (bloom spread)
        // + a crisp expanding ring (flash front), composited additively over scene.
        const pending = vfxQueueRef.current.splice(0);
        for (const ev of pending) {
          const el = document.querySelector<HTMLElement>(`[data-unit-id="${ev.instanceId}"]`);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          const bx = r.left + r.width / 2 - canvasRect.left;
          const by = r.top  + r.height / 2 - canvasRect.top;
          const color = ev.type === "skill"  ? 0xaa66ff  // purple — skill cast on actor
                      : ev.type === "damage" ? 0xff5522  // red-orange — damage on target
                      : ev.type === "attack" ? 0xffaa33  // amber — attack lunge on actor
                      : 0x44ffaa;                        // green — heal or fallback
          const maxR = ev.type === "skill" ? 72 : 52;
          vfxBursts.push({ x: bx, y: by, radius: 4, maxRadius: maxR,
                           alpha: 0.9, color, time: 0, maxTime: 22 });
        }

        glowGfx.clear();
        sharpGfx.clear();
        for (let i = vfxBursts.length - 1; i >= 0; i--) {
          const b = vfxBursts[i];
          b.time++;
          const progress = b.time / b.maxTime;
          const eased = 1 - Math.pow(1 - Math.min(progress, 1), 2);
          b.radius = b.maxRadius * eased;
          b.alpha  = 0.9 * (1 - Math.min(progress, 1));

          if (b.alpha <= 0.01) { vfxBursts.splice(i, 1); continue; }

          // Glow layer: large translucent filled circle — blurred into bloom spread
          glowGfx.circle(b.x, b.y, b.radius * 1.4).fill({ color: b.color, alpha: b.alpha * 0.65 });
          // Sharp layer: thin ring at the expansion front
          sharpGfx.circle(b.x, b.y, b.radius).stroke({ color: b.color, alpha: b.alpha, width: 3 });
        }
      });
    }

    init().catch(console.error);

    return () => {
      destroyed = true;
      roCleanup?.();
      appInstance?.destroy(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleBg]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
