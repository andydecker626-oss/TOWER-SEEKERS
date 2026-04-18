import { useMemo } from "react";

type Unit = {
  name: string;
  side: "ally" | "enemy";
  x: number;
  y: number;
  role: string;
  active?: boolean;
  target?: boolean;
};

const allies: Unit[] = [
  { name: "Astra", side: "ally", x: 0, y: 2, role: "Blade Knight", active: true },
  { name: "Lyra", side: "ally", x: 0, y: 0, role: "Rune Archer" },
  { name: "Mira", side: "ally", x: 1, y: 1, role: "Cleric" },
  { name: "Rook", side: "ally", x: 1, y: 3, role: "Guardian" },
];

const enemies: Unit[] = [
  { name: "Veyr", side: "enemy", x: 0, y: 1, role: "Fell Duelist", target: true },
  { name: "Nox", side: "enemy", x: 3, y: 3, role: "Hex Mage" },
  { name: "Kain", side: "enemy", x: 2, y: 0, role: "Lancer" },
  { name: "Sera", side: "enemy", x: 1, y: 2, role: "Invoker" },
];

const allUnits = [...allies, ...enemies];

function Tile({ index, x, y, side }: { index: number; x: number; y: number; side: "ally" | "enemy" }) {
  const isPath =
    side === "ally"
      ? (x === 0 && y === 2) || (x === 1 && y === 2) || (x === 2 && y === 2) || (x === 3 && y === 2)
      : (x === 0 && y === 1) || (x === 1 && y === 1);
  const isImpact = side === "enemy" && x === 0 && y === 1;
  return (
    <div
      className={`tile tile-${index} ${side}-tile ${isPath ? "tile-path" : ""} ${isImpact ? "tile-impact" : ""}`}
      style={{ gridColumn: x + 1, gridRow: y + 1 }}
    >
      <span>{x + 1},{y + 1}</span>
    </div>
  );
}

function SmallSprite({ side }: { side: "ally" | "enemy" }) {
  return (
    <div className="sprite">
      <div className="cape" />
      <div className="head" />
      <div className="hair" />
      <div className="body" />
      <div className="arm arm-back" />
      <div className="arm arm-front" />
      <div className="leg leg-back" />
      <div className="leg leg-front" />
      <div className={`weapon ${side === "enemy" ? "weapon-enemy" : ""}`} />
    </div>
  );
}

function PixelUnit({ unit }: { unit: Unit }) {
  const tint = unit.side === "ally" ? "ally" : "enemy";
  const style = {
    left:
      unit.side === "enemy"
        ? `calc(var(--enemy-grid-x) + ${unit.x} * var(--tile-size) + ${unit.x} * var(--tile-gap) + var(--unit-offset-x))`
        : `calc(${unit.x} * var(--tile-size) + ${unit.x} * var(--tile-gap) + var(--unit-offset-x))`,
    top: `calc(${unit.y} * var(--tile-size) + ${unit.y} * var(--tile-gap) + var(--unit-offset-y))`,
  };
  return (
    <div className={`unit ${tint} ${unit.active ? "active-unit" : ""} ${unit.target ? "target-unit" : ""}`} style={style}>
      <div className="unit-shadow" />
      <SmallSprite side={unit.side} />
      <div className="unit-plate">
        <strong>{unit.name}</strong>
        <small>{unit.role}</small>
      </div>
    </div>
  );
}

function AttackRunner() {
  return (
    <div className="runner active-unit">
      <div className="unit-shadow" />
      <SmallSprite side="ally" />
    </div>
  );
}

function BattleGrid() {
  const tiles = useMemo(
    () => Array.from({ length: 16 }, (_, index) => ({ index, x: index % 4, y: Math.floor(index / 4) })),
    []
  );
  return (
    <div className="battle-stage">
      <div className="battlefield">
        <div className="grid-board ally-board">
          {tiles.map((t) => <Tile key={`ally-${t.index}`} {...t} side="ally" />)}
        </div>
        <div className="grid-board enemy-board">
          {tiles.map((t) => <Tile key={`enemy-${t.index}`} {...t} side="enemy" />)}
        </div>
        <div className="grid-label ally-label">Blue 16-Tile Grid</div>
        <div className="grid-label enemy-label">Crimson 16-Tile Grid</div>
        <div className="bridge-line" />
        {allUnits.map((u) => <PixelUnit key={u.name} unit={u} />)}
        <AttackRunner />
        <div className="slash slash-a" />
        <div className="slash slash-b" />
        <div className="impact impact-one" />
        <div className="impact impact-two" />
        <div className="damage-text">Blade Strike</div>
        <div className="damage-number">42</div>
      </div>
    </div>
  );
}

function Myrmidon({ className = "" }: { className?: string }) {
  return (
    <div className={`myr ${className}`}>
      <div className="myr-cape" />
      <div className="myr-arm-back" />
      <div className="myr-leg-back" />
      <div className="myr-torso">
        <div className="myr-chest-plate" />
        <div className="myr-belt" />
      </div>
      <div className="myr-shoulder-l" />
      <div className="myr-shoulder-r" />
      <div className="myr-leg-front" />
      <div className="myr-boot-back" />
      <div className="myr-boot-front" />
      <div className="myr-neck" />
      <div className="myr-arm-sword">
        <div className="myr-glove" />
        <div className="myr-sword-wrap">
          <div className="myr-grip" />
          <div className="myr-guard" />
          <div className="myr-blade">
            <div className="myr-edge" />
          </div>
          <div className="myr-glow" />
        </div>
      </div>
      <div className="myr-head">
        <div className="myr-eye-l" />
        <div className="myr-eye-r" />
      </div>
      <div className="myr-hair" />
    </div>
  );
}

export function SwordAttackDemo() {
  return (
    <div className="demo-shell">
      <style>{css}</style>
      <div className="scene-glow" />
      <section className="hud top-hud">
        <div>
          <p>Prototype Animation</p>
          <h1>4v4 Tactical Sword Strike</h1>
        </div>
        <div className="turn-card">
          <span>Turn 03</span>
          <strong>Astra uses Slash</strong>
        </div>
      </section>
      <BattleGrid />

      <section className="cin-layer" aria-hidden="true">
        <div className="cin-floor" />

        <div className="cin-attacker-root">
          <div className="cin-after cin-after-2"><Myrmidon /></div>
          <div className="cin-after cin-after-1"><Myrmidon /></div>
          <div className="cin-char-wrap">
            <div className="cin-torso-pivot">
              <Myrmidon className="cin-main-myr" />
            </div>
          </div>
        </div>

        <svg className="cin-slash-svg" viewBox="0 0 900 520" preserveAspectRatio="none">
          <line className="svg-sl svg-sl-1" x1="410" y1="60" x2="720" y2="430" />
          <line className="svg-sl svg-sl-2" x1="720" y1="60" x2="410" y2="430" />
          <line className="svg-sl svg-sl-3" x1="390" y1="180" x2="740" y2="310" />
        </svg>

        <div className="cin-target">
          <div className="ct-shadow" />
          <div className="ct-leg-back" />
          <div className="ct-leg-front" />
          <div className="ct-cape" />
          <div className="ct-body" />
          <div className="ct-shoulder-l" />
          <div className="ct-shoulder-r" />
          <div className="ct-neck" />
          <div className="ct-arm-back" />
          <div className="ct-arm-front" />
          <div className="ct-head">
            <div className="ct-eye-l" />
            <div className="ct-eye-r" />
          </div>
          <div className="ct-hair" />
          <div className="ct-sword-wrap">
            <div className="ct-grip" />
            <div className="ct-guard" />
            <div className="ct-blade">
              <div className="ct-edge" />
            </div>
          </div>
        </div>

        <div className="cin-hit-flash" />
        <div className="cin-damage">42</div>
      </section>

      <section className="hud bottom-hud">
        <div className="team-panel allies-panel">
          <span>Blue Team</span>
          <strong>4 units ready</strong>
        </div>
        <div className="combat-log">
          <span className="log-line log-1">Selecting attacker on tile 1,3</span>
          <span className="log-line log-2">Attack crosses into enemy grid</span>
          <span className="log-line log-3">Dash, sword arc, impact, recoil</span>
        </div>
        <div className="team-panel enemies-panel">
          <span>Crimson Team</span>
          <strong>Target staggered</strong>
        </div>
      </section>
    </div>
  );
}

const css = `
  :root {
    --tile-size: 82px;
    --tile-gap: 10px;
    --grid-size: calc(4 * var(--tile-size) + 3 * var(--tile-gap));
    --grid-gap: 132px;
    --enemy-grid-x: calc(var(--grid-size) + var(--grid-gap));
    --unit-offset-x: 22px;
    --unit-offset-y: 0px;
    --dur: 5.2s;
  }

  .demo-shell {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 28%, rgba(122,91,255,0.22), transparent 34%),
      radial-gradient(circle at 78% 68%, rgba(255,84,122,0.14), transparent 27%),
      linear-gradient(135deg, #0d1426 0%, #14122a 44%, #241027 100%);
    color: #f8efe2;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .scene-glow {
    position: absolute;
    inset: auto -10% -40% -10%;
    height: 70%;
    background: radial-gradient(ellipse at center, rgba(234,190,92,0.16), transparent 66%);
    pointer-events: none;
  }

  /* ═══════════════════════════════════════════
     CINEMATIC LAYER
  ═══════════════════════════════════════════ */
  .cin-layer {
    position: absolute;
    inset: 110px 0 106px;
    z-index: 24;
    pointer-events: none;
    overflow: hidden;
  }

  .cin-floor {
    position: absolute;
    left: 12%;
    right: 10%;
    bottom: 68px;
    height: 32px;
    border-radius: 999px;
    background: radial-gradient(ellipse at center, rgba(255,228,164,0.20), rgba(120,169,255,0.07) 42%, transparent 72%);
    filter: blur(6px);
    animation: cinFloor var(--dur) infinite;
  }

  /* ── Attacker root: does the POSITION (dash) ── */
  .cin-attacker-root {
    position: absolute;
    left: 12%;
    bottom: 56px;
    width: 420px;
    height: 240px;
    animation: cinPos var(--dur) cubic-bezier(0.22,1,0.36,1) infinite;
  }

  /* ── Torso pivot: rotates for leaning ── */
  .cin-torso-pivot {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: 50% 100%;
    animation: cinLean var(--dur) cubic-bezier(0.22,1,0.36,1) infinite;
  }

  /* ── Afterimage trails ── */
  .cin-after {
    position: absolute;
    bottom: 0;
    left: 0;
    opacity: 0;
    pointer-events: none;
    filter: blur(1px) brightness(1.6);
  }

  .cin-after .myr { transform-origin: bottom center; }

  .cin-after-1 { animation: cinAfter1 var(--dur) cubic-bezier(0.22,1,0.36,1) infinite; }
  .cin-after-2 { animation: cinAfter2 var(--dur) cubic-bezier(0.22,1,0.36,1) infinite; }

  /* ── Sword arm animation override ── */
  .cin-main-myr .myr-arm-sword {
    animation: cinSwordArm var(--dur) cubic-bezier(0.22,1,0.36,1) infinite !important;
  }

  .cin-main-myr .myr-leg-front {
    animation: cinLegFront var(--dur) ease-in-out infinite !important;
  }

  .cin-main-myr .myr-leg-back {
    animation: cinLegBack var(--dur) ease-in-out infinite !important;
  }

  /* ═══════════════════════════════════════════
     MYRMIDON PIXEL-ART SPRITE
     ~26 game-px wide × 44 game-px tall @ 3px scale
  ═══════════════════════════════════════════ */
  .myr {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 92px;
    height: 160px;
    image-rendering: pixelated;
  }

  /* Cape — deep blue, behind body */
  .myr-cape {
    position: absolute;
    left: 4px; top: 46px;
    width: 34px; height: 76px;
    background: #162068;
    border-radius: 9px 0 18px 6px;
    z-index: 2;
    transform-origin: 17px 0;
    transform: skewX(-2deg);
  }

  /* Back arm — left arm, armored blue */
  .myr-arm-back {
    position: absolute;
    left: 2px; top: 62px;
    width: 16px; height: 36px;
    background: #2040a0;
    border-radius: 6px 3px 9px 9px;
    z-index: 3;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.25);
  }

  /* Back leg */
  .myr-leg-back {
    position: absolute;
    left: 16px; top: 112px;
    width: 20px; height: 42px;
    background: linear-gradient(180deg, #1e3090 0%, #142268 65%, #0e1640 100%);
    border-radius: 3px 3px 6px 6px;
    z-index: 4;
    transform-origin: 10px 0;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.3);
  }

  /* Torso — armored chest */
  .myr-torso {
    position: absolute;
    left: 14px; top: 56px;
    width: 48px; height: 52px;
    background: #2848b8;
    border-radius: 9px 9px 4px 4px;
    z-index: 6;
    box-shadow: inset -3px -4px 0 rgba(0,0,0,0.22);
  }

  .myr-chest-plate {
    position: absolute;
    left: 4px; top: 4px;
    width: 40px; height: 26px;
    background: #4070e0;
    border-radius: 6px 6px 0 0;
    box-shadow: inset 0 2px 0 rgba(255,255,255,0.18);
  }

  .myr-belt {
    position: absolute;
    left: 0; bottom: 0;
    width: 100%; height: 10px;
    background: #c07800;
    border-radius: 0 0 4px 4px;
    box-shadow: inset 0 2px 0 rgba(255,255,255,0.15);
  }

  /* Shoulder pads */
  .myr-shoulder-l {
    position: absolute;
    left: 6px; top: 54px;
    width: 16px; height: 16px;
    background: linear-gradient(135deg, #7090d8, #4868c0, #2e50a8);
    border-radius: 9px 0 6px 9px;
    z-index: 7;
    box-shadow: inset -2px -2px 0 rgba(0,0,0,0.2);
  }

  .myr-shoulder-r {
    position: absolute;
    right: 14px; top: 54px;
    width: 16px; height: 16px;
    background: linear-gradient(135deg, #7090d8, #4868c0, #2e50a8);
    border-radius: 0 9px 9px 6px;
    z-index: 7;
    box-shadow: inset -2px -2px 0 rgba(0,0,0,0.2);
  }

  /* Front leg */
  .myr-leg-front {
    position: absolute;
    left: 30px; top: 108px;
    width: 20px; height: 46px;
    background: linear-gradient(180deg, #1e3090 0%, #142268 65%, #0e1640 100%);
    border-radius: 3px 3px 6px 6px;
    z-index: 8;
    transform-origin: 10px 0;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.3);
  }

  /* Boots */
  .myr-boot-back {
    position: absolute;
    left: 12px; top: 146px;
    width: 26px; height: 14px;
    background: #0c1430;
    border-radius: 3px 3px 9px 9px;
    z-index: 5;
  }

  .myr-boot-front {
    position: absolute;
    left: 28px; top: 146px;
    width: 26px; height: 14px;
    background: #0c1430;
    border-radius: 3px 3px 9px 9px;
    z-index: 9;
  }

  /* Neck */
  .myr-neck {
    position: absolute;
    left: 27px; top: 50px;
    width: 18px; height: 10px;
    background: #e0a060;
    z-index: 10;
  }

  /* Head */
  .myr-head {
    position: absolute;
    left: 20px; top: 18px;
    width: 36px; height: 36px;
    background: #f0b060;
    border-radius: 9px 9px 6px 6px;
    z-index: 11;
    box-shadow: inset -3px -3px 0 rgba(0,0,0,0.12);
  }

  .myr-eye-l {
    position: absolute;
    left: 5px; top: 14px;
    width: 7px; height: 7px;
    background: #1c0e04;
    border-radius: 2px;
  }

  .myr-eye-r {
    position: absolute;
    right: 5px; top: 14px;
    width: 7px; height: 7px;
    background: #1c0e04;
    border-radius: 2px;
  }

  /* Hair — dark, swept back with spike */
  .myr-hair {
    position: absolute;
    left: 12px; top: 8px;
    width: 54px; height: 24px;
    background: #1a0a08;
    border-radius: 12px 24px 4px 4px;
    z-index: 12;
    box-shadow: inset -2px -2px 0 rgba(60,20,10,0.5);
  }

  /* Sword arm — front right arm, animates for sword swing */
  .myr-arm-sword {
    position: absolute;
    right: 6px; top: 60px;
    width: 20px; height: 44px;
    background: #f0b060;
    border-radius: 4px 9px 9px 9px;
    z-index: 13;
    transform-origin: 10px 6px;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.18);
  }

  .myr-glove {
    position: absolute;
    bottom: 0; left: 0;
    width: 20px; height: 14px;
    background: #2a1006;
    border-radius: 3px 3px 9px 9px;
  }

  /* Sword assembly — child of .myr-arm-sword */
  .myr-sword-wrap {
    position: absolute;
    right: -4px; top: 14px;
    width: 14px; height: 96px;
    transform-origin: 7px 8px;
  }

  .myr-grip {
    position: absolute;
    left: 4px; bottom: 0;
    width: 7px; height: 22px;
    background: #3c1c04;
    border-radius: 3px;
    box-shadow: inset -1px -2px 0 rgba(0,0,0,0.3);
  }

  .myr-guard {
    position: absolute;
    left: -6px; bottom: 22px;
    width: 26px; height: 7px;
    background: linear-gradient(90deg, #906000, #e0b010, #a07000);
    border-radius: 4px;
  }

  .myr-blade {
    position: absolute;
    left: 4px; top: 0;
    width: 6px; height: 70px;
    background: linear-gradient(180deg, #ffffff 0%, #c8e8ff 30%, #90c8f0 80%, #80b0e0 100%);
    border-radius: 3px 3px 1px 1px;
    box-shadow: 0 0 10px rgba(160,220,255,0.7), 0 0 24px rgba(140,200,255,0.4);
  }

  .myr-edge {
    position: absolute;
    right: -1px; top: 0;
    width: 2px; height: 100%;
    background: rgba(255,255,255,0.9);
    border-radius: 2px 2px 0 0;
  }

  .myr-glow {
    position: absolute;
    left: -8px; top: -8px;
    width: 22px; height: 86px;
    background: radial-gradient(ellipse at center, rgba(160,220,255,0.55) 0%, transparent 65%);
    pointer-events: none;
    animation: bladeGlow 1.3s ease-in-out infinite alternate;
  }

  /* ═══════════════════════════════════════════
     TARGET ENEMY PIXEL SPRITE
  ═══════════════════════════════════════════ */
  .cin-target {
    position: absolute;
    right: 12%;
    bottom: 56px;
    width: 88px;
    height: 172px;
    transform-origin: bottom center;
    animation: cinTarget var(--dur) infinite;
  }

  .ct-shadow {
    position: absolute;
    left: 4px; right: 2px; bottom: -6px;
    height: 18px;
    border-radius: 999px;
    background: rgba(0,0,0,0.45);
    filter: blur(4px);
  }

  /* Enemy color scheme: deep crimson */
  .ct-cape {
    position: absolute;
    left: 4px; top: 46px;
    width: 30px; height: 72px;
    background: #6e1020;
    border-radius: 9px 0 18px 6px;
    z-index: 2;
  }

  .ct-leg-back {
    position: absolute;
    left: 16px; top: 116px;
    width: 18px; height: 40px;
    background: linear-gradient(180deg, #801428 0%, #580e1e 65%, #3a0810 100%);
    border-radius: 3px 3px 6px 6px;
    z-index: 3;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.3);
  }

  .ct-leg-front {
    position: absolute;
    left: 28px; top: 112px;
    width: 18px; height: 44px;
    background: linear-gradient(180deg, #801428 0%, #580e1e 65%, #3a0810 100%);
    border-radius: 3px 3px 6px 6px;
    z-index: 8;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.3);
  }

  .ct-body {
    position: absolute;
    left: 14px; top: 56px;
    width: 46px; height: 52px;
    background: #a01828;
    border-radius: 9px 9px 4px 4px;
    z-index: 6;
    box-shadow: inset -3px -4px 0 rgba(0,0,0,0.22);
  }

  .ct-shoulder-l {
    position: absolute;
    left: 6px; top: 54px;
    width: 14px; height: 14px;
    background: linear-gradient(135deg, #e04060, #b02040, #801028);
    border-radius: 9px 0 6px 9px;
    z-index: 7;
  }

  .ct-shoulder-r {
    position: absolute;
    right: 14px; top: 54px;
    width: 14px; height: 14px;
    background: linear-gradient(135deg, #e04060, #b02040, #801028);
    border-radius: 0 9px 9px 6px;
    z-index: 7;
  }

  .ct-arm-back {
    position: absolute;
    left: 2px; top: 62px;
    width: 14px; height: 32px;
    background: #901020;
    border-radius: 6px 3px 9px 9px;
    z-index: 3;
  }

  .ct-arm-front {
    position: absolute;
    right: 6px; top: 60px;
    width: 16px; height: 42px;
    background: #f0b060;
    border-radius: 4px 9px 9px 9px;
    z-index: 13;
  }

  .ct-neck {
    position: absolute;
    left: 27px; top: 50px;
    width: 18px; height: 10px;
    background: #d09060;
    z-index: 10;
  }

  .ct-head {
    position: absolute;
    left: 20px; top: 18px;
    width: 36px; height: 36px;
    background: #f0b060;
    border-radius: 9px 9px 6px 6px;
    z-index: 11;
    box-shadow: inset -3px -3px 0 rgba(0,0,0,0.1);
  }

  .ct-eye-l {
    position: absolute;
    left: 5px; top: 14px;
    width: 7px; height: 7px;
    background: #1c0e04;
    border-radius: 2px;
  }

  .ct-eye-r {
    position: absolute;
    right: 5px; top: 14px;
    width: 7px; height: 7px;
    background: #1c0e04;
    border-radius: 2px;
  }

  .ct-hair {
    position: absolute;
    left: 14px; top: 8px;
    width: 48px; height: 22px;
    background: #e85030;
    border-radius: 10px 20px 3px 3px;
    z-index: 12;
  }

  /* Enemy sword */
  .ct-sword-wrap {
    position: absolute;
    right: 0px; top: 32px;
    width: 14px; height: 96px;
    transform: rotate(-14deg);
    transform-origin: 7px 80px;
    z-index: 14;
    animation: ctSwordIdle var(--dur) ease-in-out infinite;
  }

  .ct-grip {
    position: absolute;
    left: 4px; bottom: 0;
    width: 7px; height: 22px;
    background: #3c1c04;
    border-radius: 3px;
  }

  .ct-guard {
    position: absolute;
    left: -6px; bottom: 22px;
    width: 26px; height: 7px;
    background: linear-gradient(90deg, #a06000, #d0a010, #a06000);
    border-radius: 4px;
  }

  .ct-blade {
    position: absolute;
    left: 4px; top: 0;
    width: 6px; height: 70px;
    background: linear-gradient(180deg, #ffffff 0%, #ffd8a0 30%, #e0b060 80%);
    border-radius: 3px 3px 1px 1px;
    box-shadow: 0 0 10px rgba(255,200,100,0.5);
  }

  .ct-edge {
    position: absolute;
    right: -1px; top: 0;
    width: 2px; height: 100%;
    background: rgba(255,255,255,0.8);
    border-radius: 2px 2px 0 0;
  }

  /* ═══════════════════════════════════════════
     SVG SLASH ARCS
  ═══════════════════════════════════════════ */
  .cin-slash-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 30;
  }

  .svg-sl {
    fill: none;
    stroke-linecap: round;
    opacity: 0;
    stroke-width: 5;
  }

  .svg-sl-1 {
    stroke: rgba(255,255,255,0.96);
    filter: url(#glow);
    stroke-dasharray: 530;
    stroke-dashoffset: 530;
    animation: slashDraw1 var(--dur) infinite;
  }

  .svg-sl-2 {
    stroke: rgba(180,235,255,0.92);
    stroke-dasharray: 530;
    stroke-dashoffset: 530;
    animation: slashDraw2 var(--dur) infinite;
    animation-delay: 0.04s;
  }

  .svg-sl-3 {
    stroke: rgba(255,230,120,0.8);
    stroke-width: 3;
    stroke-dasharray: 360;
    stroke-dashoffset: 360;
    animation: slashDraw3 var(--dur) infinite;
    animation-delay: 0.02s;
  }

  /* ── Hit flash ── */
  .cin-hit-flash {
    position: absolute;
    right: 8%;
    bottom: 50px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,240,180,0.9) 20%, rgba(255,120,80,0.6) 45%, transparent 65%);
    opacity: 0;
    transform: scale(0);
    z-index: 28;
    animation: cinHitFlash var(--dur) infinite;
  }

  /* ── Damage popup ── */
  .cin-damage {
    position: absolute;
    right: 13%;
    bottom: 220px;
    font-family: "Cinzel", Georgia, serif;
    font-size: 74px;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 0 18px rgba(255,220,80,0.8), 0 8px 24px rgba(0,0,0,0.7);
    opacity: 0;
    z-index: 35;
    animation: cinDamage var(--dur) infinite;
  }

  /* ═══════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════ */
  .hud {
    position: absolute;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    left: 52px; right: 52px;
  }

  .top-hud { top: 34px; }
  .bottom-hud { bottom: 34px; gap: 18px; }

  .hud p, .hud span, .unit-plate small {
    margin: 0;
    color: rgba(248,239,226,0.62);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 800;
  }

  .hud h1 {
    margin: 4px 0 0;
    font-family: "Cinzel", Georgia, serif;
    letter-spacing: -0.04em;
    font-size: clamp(32px, 4vw, 58px);
    line-height: 0.9;
    text-shadow: 0 10px 28px rgba(0,0,0,0.45);
  }

  .turn-card, .team-panel, .combat-log {
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(8,12,28,0.66);
    box-shadow: 0 20px 55px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
    backdrop-filter: blur(18px);
    border-radius: 20px;
  }

  .turn-card { padding: 15px 18px; min-width: 220px; }
  .turn-card strong, .team-panel strong { display: block; margin-top: 4px; color: #fff8e8; font-size: 16px; }
  .team-panel { min-width: 210px; padding: 16px 18px; }
  .allies-panel { border-color: rgba(96,179,255,0.32); }
  .enemies-panel { border-color: rgba(255,92,121,0.32); text-align: right; }
  .combat-log { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 14px; }

  .log-line { opacity: 0; animation: logPulse var(--dur) infinite; }
  .log-2 { animation-delay: 0.6s; }
  .log-3 { animation-delay: 1.3s; }

  /* ═══════════════════════════════════════════
     ISOMETRIC GRID
  ═══════════════════════════════════════════ */
  .battle-stage {
    min-height: 100vh;
    display: grid;
    place-items: center;
    perspective: 1200px;
  }

  .battlefield {
    position: relative;
    width: calc(2 * var(--grid-size) + var(--grid-gap));
    height: var(--grid-size);
    transform: rotateX(56deg) rotateZ(-38deg) translateY(40px);
    transform-style: preserve-3d;
    filter: drop-shadow(0 42px 60px rgba(0,0,0,0.44));
  }

  .grid-board {
    position: absolute;
    top: 0; left: 0;
    width: var(--grid-size);
    height: var(--grid-size);
    display: grid;
    grid-template-columns: repeat(4, var(--tile-size));
    grid-template-rows: repeat(4, var(--tile-size));
    gap: var(--tile-gap);
    transform-style: preserve-3d;
  }

  .enemy-board { left: var(--enemy-grid-x); }

  .grid-label {
    position: absolute;
    top: -48px;
    width: var(--grid-size);
    transform: translateZ(96px) rotateZ(38deg) rotateX(-56deg);
    color: rgba(255,248,224,0.78);
    font-size: 12px; font-weight: 900;
    letter-spacing: 0.12em;
    text-align: center;
    text-transform: uppercase;
    text-shadow: 0 8px 20px rgba(0,0,0,0.65);
  }

  .ally-label { left: 0; }
  .enemy-label { left: var(--enemy-grid-x); }

  .bridge-line {
    position: absolute;
    left: calc(var(--grid-size) + 22px);
    top: calc(2 * var(--tile-size) + 2 * var(--tile-gap) + 39px);
    width: calc(var(--grid-gap) - 44px);
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(99,183,255,0), rgba(255,238,164,0.72), rgba(255,95,122,0));
    box-shadow: 0 0 28px rgba(255,221,127,0.42);
    transform: translateZ(34px);
    animation: bridgePulse var(--dur) infinite;
  }

  .tile {
    position: relative;
    border-radius: 18px;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)),
      linear-gradient(135deg, rgba(72,86,138,0.72), rgba(26,33,67,0.9));
    border: 1px solid rgba(255,255,255,0.14);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 12px 0 #0b1127, 0 24px 24px rgba(0,0,0,0.28);
    overflow: hidden;
  }

  .ally-tile { border-color: rgba(96,179,255,0.19); }
  .enemy-tile {
    border-color: rgba(255,92,121,0.2);
    background:
      linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03)),
      linear-gradient(135deg, rgba(102,62,97,0.74), rgba(47,24,56,0.94));
  }

  .tile span {
    position: absolute;
    left: 10px; bottom: 8px;
    font-size: 11px;
    color: rgba(255,255,255,0.34);
    transform: rotateZ(38deg) rotateX(-56deg);
  }

  .tile::after {
    content: "";
    position: absolute;
    inset: 8px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
  }

  .tile-path { animation: pathGlow var(--dur) infinite; }
  .tile-impact { animation: targetPulse var(--dur) infinite; }

  /* ── Small grid units ── */
  .unit, .runner {
    position: absolute;
    width: 62px; height: 96px;
    transform: translateZ(74px) rotateZ(38deg) rotateX(-56deg);
    transform-style: preserve-3d;
    z-index: 12;
  }

  .unit.target-unit { animation: targetRecoil var(--dur) infinite; }
  .unit.active-unit { opacity: 0.35; }

  .runner {
    left: calc(0 * var(--tile-size) + 0 * var(--tile-gap) + var(--unit-offset-x));
    top: calc(2 * var(--tile-size) + 2 * var(--tile-gap) + var(--unit-offset-y));
    width: 174px; height: 128px;
    margin-left: -59px; margin-top: -36px;
    z-index: 26;
    animation: attackDash var(--dur) cubic-bezier(0.2,0.9,0.16,1) infinite;
  }

  .unit-shadow {
    position: absolute;
    left: 4px; bottom: -7px;
    width: 54px; height: 15px;
    border-radius: 999px;
    background: rgba(0,0,0,0.44);
    filter: blur(2px);
  }

  /* Small CSS sprite parts */
  .sprite {
    position: absolute;
    left: 8px; bottom: 0;
    width: 46px; height: 82px;
    image-rendering: pixelated;
    animation: idleBob 0.72s steps(2) infinite;
  }

  .head, .hair, .body, .cape, .arm, .leg, .weapon {
    position: absolute;
    box-shadow: inset -2px -2px 0 rgba(0,0,0,0.22);
  }

  .head {
    left: 15px; top: 8px;
    width: 20px; height: 20px;
    background: #f0b060;
    border-radius: 7px 7px 5px 5px;
    z-index: 6;
  }

  .hair {
    left: 9px; top: 2px;
    width: 28px; height: 16px;
    background: #1a0a08;
    border-radius: 11px 14px 4px 5px;
    z-index: 7;
  }

  .body {
    left: 11px; top: 29px;
    width: 28px; height: 31px;
    background: linear-gradient(#4070e0, #2848b8 42%, #1a3080 43%);
    border-radius: 7px 7px 6px 6px;
    z-index: 5;
  }

  .enemy .body { background: linear-gradient(#d04060, #a01828 42%, #700e1a 43%); }

  .cape {
    left: 5px; top: 28px;
    width: 35px; height: 44px;
    background: #162068;
    border-radius: 11px 3px 12px 8px;
    z-index: 1;
    transform: skewX(-8deg);
  }

  .enemy .cape { background: #6e1020; }

  .arm {
    top: 34px;
    width: 10px; height: 28px;
    background: #f0b060;
    border-radius: 6px;
    transform-origin: top center;
    z-index: 7;
  }

  .arm-back { left: 5px; transform: rotate(18deg); }
  .arm-front { right: 4px; transform: rotate(-20deg); }

  .leg {
    top: 56px;
    width: 10px; height: 24px;
    background: #1a2f88;
    border-radius: 5px;
    z-index: 4;
  }

  .enemy .leg { background: #580e1e; }
  .leg-back { left: 13px; }
  .leg-front { right: 11px; }

  .weapon {
    right: -9px; top: 22px;
    width: 7px; height: 54px;
    background: linear-gradient(90deg, #c8f0ff, #ffffff, #a0d0ff);
    border-radius: 999px 999px 3px 3px;
    transform: rotate(-28deg);
    transform-origin: bottom center;
    z-index: 9;
    box-shadow: 0 0 14px rgba(177,224,255,0.65);
  }

  .weapon-enemy {
    background: linear-gradient(90deg, #ffd090, #ffffff, #ffa060);
    box-shadow: 0 0 14px rgba(255,200,100,0.5);
  }

  .unit-plate {
    position: absolute;
    left: 50%; top: -34px;
    width: 116px;
    transform: translateX(-50%);
    padding: 6px 8px;
    border-radius: 10px;
    background: rgba(5,8,22,0.72);
    border: 1px solid rgba(255,255,255,0.12);
    text-align: center;
    box-shadow: 0 12px 22px rgba(0,0,0,0.3);
  }

  .active-unit .unit-plate { top: -28px; }

  .runner .unit-shadow { left: 46px; bottom: 2px; width: 78px; height: 18px; }

  .unit-plate strong { display: block; font-size: 12px; line-height: 1; color: #fff7df; }
  .unit-plate small { display: block; margin-top: 3px; font-size: 8px; letter-spacing: 0.04em; }

  .slash {
    position: absolute;
    left: calc(var(--enemy-grid-x) + 0 * var(--tile-size) + 0 * var(--tile-gap) + 6px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) - 4px);
    width: 112px; height: 112px;
    border-radius: 50%;
    border: 7px solid transparent;
    border-left-color: rgba(255,255,255,0.96);
    border-top-color: rgba(104,218,255,0.86);
    filter: drop-shadow(0 0 14px rgba(142,228,255,0.82));
    transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(0.2) rotate(-35deg);
    opacity: 0;
    z-index: 40;
    animation: slashBurst var(--dur) infinite;
  }

  .slash-b {
    animation-delay: 0.06s;
    transform: translateZ(144px) rotateZ(38deg) rotateX(-56deg) scale(0.16) rotate(25deg);
    border-left-color: rgba(255,219,121,0.92);
    border-top-color: rgba(255,255,255,0.9);
  }

  .impact {
    position: absolute;
    left: calc(var(--enemy-grid-x) + 0 * var(--tile-size) + 0 * var(--tile-gap) + 28px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) + 30px);
    width: 64px; height: 64px;
    background: radial-gradient(circle, #fff 0 12%, #ffe68f 13% 30%, rgba(255,92,121,0.7) 31% 50%, transparent 51%);
    clip-path: polygon(50% 0, 62% 31%, 98% 17%, 71% 48%, 100% 67%, 62% 64%, 54% 100%, 42% 65%, 5% 82%, 31% 51%, 0 34%, 38% 36%);
    transform: translateZ(154px) rotateZ(38deg) rotateX(-56deg) scale(0);
    opacity: 0;
    z-index: 45;
    animation: impactPop var(--dur) infinite;
  }

  .impact-two { animation-delay: 0.09s; filter: hue-rotate(44deg); }

  .damage-text, .damage-number {
    position: absolute;
    left: calc(var(--enemy-grid-x) + 0 * var(--tile-size) + 0 * var(--tile-gap) + 4px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) - 54px);
    transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg);
    opacity: 0; z-index: 50;
    text-align: center;
    text-shadow: 0 5px 18px rgba(0,0,0,0.7);
  }

  .damage-text {
    width: 190px; color: #ffe6a3;
    font-size: 14px; font-weight: 900;
    letter-spacing: 0.08em; text-transform: uppercase;
    animation: textPop var(--dur) infinite;
  }

  .damage-number {
    width: 110px;
    left: calc(var(--enemy-grid-x) + 45px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) - 92px);
    font-family: "Cinzel", Georgia, serif;
    font-size: 54px; font-weight: 900; color: #fff;
    animation: damageFloat var(--dur) infinite;
  }

  /* ═══════════════════════════════════════════
     KEYFRAMES — CINEMATIC ATTACKER
     Timeline for --dur = 5.2s:
       0-10%  idle
       10-18% wind-up
       18-26% DASH (fast)
       26-31% SWING
       31-40% IMPACT / freeze
       40-52% recoil / step back
       52-75% return walk
       75-100% idle
  ═══════════════════════════════════════════ */

  /* Position (X dash) */
  @keyframes cinPos {
    0%, 18% { transform: translateX(0px); }
    26%      { transform: translateX(248px); }
    31%, 40% { transform: translateX(274px); }
    52%      { transform: translateX(140px); }
    72%, 100% { transform: translateX(0px); }
  }

  /* Body lean (torso pivot) */
  @keyframes cinLean {
    0%, 18%  { transform: rotate(0deg); }
    22%      { transform: rotate(-10deg); }
    26%      { transform: rotate(-18deg); }
    31%      { transform: rotate(-22deg); }
    38%      { transform: rotate(-12deg); }
    45%, 100% { transform: rotate(0deg); }
  }

  /* Afterimage 1 — slightly behind main */
  @keyframes cinAfter1 {
    0%, 20%  { transform: translateX(0px); opacity: 0; }
    24%, 29% { transform: translateX(210px); opacity: 0.5; }
    33%      { transform: translateX(248px); opacity: 0; }
    100%     { transform: translateX(0px); opacity: 0; }
  }

  /* Afterimage 2 — further behind */
  @keyframes cinAfter2 {
    0%, 19%  { transform: translateX(0px); opacity: 0; }
    23%, 27% { transform: translateX(140px); opacity: 0.28; }
    31%      { transform: translateX(210px); opacity: 0; }
    100%     { transform: translateX(0px); opacity: 0; }
  }

  /* Sword arm rotation — the swing */
  @keyframes cinSwordArm {
    0%, 16%  { transform: rotate(0deg); }
    20%      { transform: rotate(-35deg); }
    24%      { transform: rotate(-72deg); }
    28%      { transform: rotate(106deg); }
    32%      { transform: rotate(90deg); }
    42%, 100% { transform: rotate(0deg); }
  }

  /* Front leg during dash */
  @keyframes cinLegFront {
    0%, 17%  { transform: rotate(0deg); }
    20%      { transform: rotate(-22deg); }
    24%      { transform: rotate(16deg); }
    28%      { transform: rotate(-8deg); }
    36%, 100% { transform: rotate(0deg); }
  }

  /* Back leg during dash */
  @keyframes cinLegBack {
    0%, 17%  { transform: rotate(0deg); }
    20%      { transform: rotate(22deg); }
    24%      { transform: rotate(-16deg); }
    28%      { transform: rotate(8deg); }
    36%, 100% { transform: rotate(0deg); }
  }

  /* Target enemy reaction */
  @keyframes cinTarget {
    0%, 28%, 100% { transform: translateX(0) rotate(0deg) scale(1); filter: brightness(1); }
    33%           { transform: translateX(0) rotate(0deg) scale(1); filter: brightness(3); }
    36%           { transform: translateX(28px) rotate(6deg) scale(1.02); filter: brightness(1.4); }
    44%           { transform: translateX(-10px) rotate(-3deg) scale(1); filter: brightness(1); }
    52%           { transform: translateX(0) rotate(0deg) scale(1); }
  }

  /* Enemy idle sword wobble */
  @keyframes ctSwordIdle {
    0%, 28%, 100% { transform: rotate(-14deg); }
    33%, 36%      { transform: rotate(-30deg) translateX(8px); }
    44%           { transform: rotate(-6deg); }
    52%           { transform: rotate(-14deg); }
  }

  /* SVG slash arcs */
  @keyframes slashDraw1 {
    0%, 29%, 46%, 100% { opacity: 0; stroke-dashoffset: 530; }
    31%  { opacity: 1; stroke-dashoffset: 0; }
    42%  { opacity: 0.8; stroke-dashoffset: 0; }
    45%  { opacity: 0; stroke-dashoffset: 0; }
  }

  @keyframes slashDraw2 {
    0%, 30%, 47%, 100% { opacity: 0; stroke-dashoffset: 530; }
    32%  { opacity: 1; stroke-dashoffset: 0; }
    43%  { opacity: 0.7; stroke-dashoffset: 0; }
    46%  { opacity: 0; stroke-dashoffset: 0; }
  }

  @keyframes slashDraw3 {
    0%, 30%, 46%, 100% { opacity: 0; stroke-dashoffset: 360; }
    32%  { opacity: 0.85; stroke-dashoffset: 0; }
    43%  { opacity: 0.5; stroke-dashoffset: 0; }
    45%  { opacity: 0; stroke-dashoffset: 0; }
  }

  /* Impact hit flash */
  @keyframes cinHitFlash {
    0%, 30%, 44%, 100% { opacity: 0; transform: scale(0); }
    33%  { opacity: 1; transform: scale(1.4); }
    37%  { opacity: 0.7; transform: scale(1.8); }
    42%  { opacity: 0; transform: scale(2.4); }
  }

  /* Cinematic damage number */
  @keyframes cinDamage {
    0%, 32%, 54%, 100% { opacity: 0; transform: translateY(16px) scale(0.8); }
    36%  { opacity: 1; transform: translateY(-6px) scale(1.22); }
    48%  { opacity: 0.9; transform: translateY(-18px) scale(1.1); }
    52%  { opacity: 0; transform: translateY(-44px) scale(1); }
  }

  /* Floor glow */
  @keyframes cinFloor {
    0%, 14%, 72%, 100% { opacity: 0.1; transform: scaleX(0.8); }
    22%, 56%            { opacity: 0.9; transform: scaleX(1); }
  }

  /* Sword blade pulse */
  @keyframes bladeGlow {
    from { opacity: 0.6; }
    to   { opacity: 1; }
  }

  /* ═══════════════════════════════════════════
     KEYFRAMES — GRID / SMALL SPRITES
  ═══════════════════════════════════════════ */
  @keyframes attackDash {
    0%, 16%   { transform: translate3d(0, 0, 74px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
    25%       { transform: translate3d(214px, -35px, 96px) rotateZ(38deg) rotateX(-56deg) scale(1.04); opacity: 1; }
    36%, 43%  { transform: translate3d(490px, -92px, 112px) rotateZ(38deg) rotateX(-56deg) scale(1.12); opacity: 1; }
    54%       { transform: translate3d(280px, -48px, 96px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
    70%, 100% { transform: translate3d(0, 0, 74px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
  }

  @keyframes slashBurst {
    0%, 35%, 48%, 100% { opacity: 0; transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(0.18) rotate(-35deg); }
    39% { opacity: 1; transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(1.2) rotate(16deg); }
    44% { opacity: 0; transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(1.9) rotate(74deg); }
  }

  @keyframes impactPop {
    0%, 37%, 49%, 100% { opacity: 0; transform: translateZ(154px) rotateZ(38deg) rotateX(-56deg) scale(0); }
    40% { opacity: 1; transform: translateZ(154px) rotateZ(38deg) rotateX(-56deg) scale(1.25); }
    46% { opacity: 0; transform: translateZ(154px) rotateZ(38deg) rotateX(-56deg) scale(2); }
  }

  @keyframes targetRecoil {
    0%, 36%, 100% { transform: translateZ(74px) rotateZ(38deg) rotateX(-56deg); filter: brightness(1); }
    41% { transform: translate3d(18px, -8px, 76px) rotateZ(38deg) rotateX(-56deg); filter: brightness(1.8); }
    48% { transform: translate3d(-9px, 4px, 74px) rotateZ(38deg) rotateX(-56deg); filter: brightness(1); }
    55% { transform: translateZ(74px) rotateZ(38deg) rotateX(-56deg); }
  }

  @keyframes damageFloat {
    0%, 39%, 56%, 100% { opacity: 0; transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg) translateY(16px) scale(0.8); }
    43% { opacity: 1; transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg) translateY(-8px) scale(1.18); }
    52% { opacity: 0; transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg) translateY(-46px) scale(1); }
  }

  @keyframes textPop {
    0%, 34%, 58%, 100% { opacity: 0; transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg) translateY(18px); }
    40%, 51% { opacity: 1; transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg) translateY(0); }
  }

  @keyframes idleBob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-3px); }
  }

  @keyframes pathGlow {
    0%, 13%, 68%, 100% { background: linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)), linear-gradient(135deg, rgba(72,86,138,0.72), rgba(26,33,67,0.9)); }
    20%, 49%           { background: linear-gradient(135deg, rgba(139,221,255,0.34), rgba(255,234,156,0.14)), linear-gradient(135deg, rgba(60,106,172,0.9), rgba(40,38,96,0.98)); }
  }

  @keyframes targetPulse {
    0%, 32%, 61%, 100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 12px 0 #0b1127, 0 24px 24px rgba(0,0,0,0.28); }
    38%, 48%           { box-shadow: inset 0 0 0 2px rgba(255,231,150,0.92), 0 12px 0 #0b1127, 0 0 46px rgba(255,95,122,0.72); }
  }

  @keyframes bridgePulse {
    0%, 14%, 62%, 100% { opacity: 0.18; transform: translateZ(34px) scaleX(0.72); }
    24%, 48%           { opacity: 1; transform: translateZ(34px) scaleX(1); }
  }

  @keyframes logPulse {
    0%, 9%    { opacity: 0; transform: translateY(5px); }
    18%, 72%  { opacity: 1; transform: translateY(0); }
    88%, 100% { opacity: 0.38; }
  }

  @media (max-width: 900px) {
    :root { --tile-size: 62px; --tile-gap: 7px; --grid-gap: 76px; }
    .hud { left: 24px; right: 24px; }
    .bottom-hud { display: none; }
    .turn-card { display: none; }
  }
`;
