import { useMemo } from "react";

type Unit = {
  name: string;
  side: "ally" | "enemy";
  x: number;
  y: number;
  role: string;
  cls: string;
  active?: boolean;
  target?: boolean;
};

const allies: Unit[] = [
  { name: "Astra", side: "ally", x: 0, y: 2, role: "Blade Knight", cls: "blade-knight", active: true },
  { name: "Lyra",  side: "ally", x: 0, y: 0, role: "Rune Archer",  cls: "rune-archer" },
  { name: "Mira",  side: "ally", x: 1, y: 1, role: "Cleric",       cls: "cleric" },
  { name: "Rook",  side: "ally", x: 1, y: 3, role: "Guardian",     cls: "guardian" },
];

const enemies: Unit[] = [
  { name: "Veyr", side: "enemy", x: 0, y: 1, role: "Fell Duelist", cls: "fell-duelist", target: true },
  { name: "Nox",  side: "enemy", x: 3, y: 3, role: "Hex Mage",     cls: "hex-mage" },
  { name: "Kain", side: "enemy", x: 2, y: 0, role: "Lancer",       cls: "lancer" },
  { name: "Sera", side: "enemy", x: 1, y: 2, role: "Invoker",      cls: "invoker" },
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
      className={`tile ${side}-tile ${isPath ? "tile-path" : ""} ${isImpact ? "tile-impact" : ""}`}
      style={{ gridColumn: x + 1, gridRow: y + 1 }}
    >
      <span>{x + 1},{y + 1}</span>
    </div>
  );
}

/* ── Weapon rendering by class ── */
function WeaponParts({ cls }: { cls: string }) {
  switch (cls) {
    case "rune-archer":
      return (
        <>
          <div className="sp-bow" />
          <div className="sp-bow-string" />
          <div className="sp-arrow" />
        </>
      );
    case "cleric":
    case "invoker":
      return (
        <>
          <div className="sp-staff-shaft" />
          <div className="sp-staff-orb" />
          <div className="sp-staff-glow" />
        </>
      );
    case "guardian":
      return (
        <>
          <div className="sp-shield" />
          <div className="sp-axe-handle" />
          <div className="sp-axe-head" />
        </>
      );
    case "lancer":
      return (
        <>
          <div className="sp-lance-shaft" />
          <div className="sp-lance-tip" />
        </>
      );
    case "hex-mage":
      return (
        <>
          <div className="sp-orb-glow" />
          <div className="sp-orb-outer" />
          <div className="sp-orb-inner" />
        </>
      );
    default:
      return <div className="sp-weapon" />;
  }
}

function AnimeSprite({ side, cls }: { side: "ally" | "enemy"; cls: string }) {
  return (
    <div className={`sprite sprite-${side} role-${cls}`}>
      <div className="sp-cape" />
      <div className="sp-arm sp-arm-back" />
      <div className="sp-leg sp-leg-back" />
      <div className="sp-body">
        <div className="sp-chest" />
        <div className="sp-belt" />
      </div>
      <div className="sp-shoulder sp-sh-l" />
      <div className="sp-shoulder sp-sh-r" />
      <div className="sp-leg sp-leg-front" />
      <div className="sp-arm sp-arm-front" />
      <div className="sp-collar" />
      <div className="sp-head">
        <div className="sp-eye sp-eye-l" />
        <div className="sp-eye sp-eye-r" />
        <div className="sp-nose" />
      </div>
      <div className="sp-hair-base" />
      <div className="sp-spike sp-spike-1" />
      <div className="sp-spike sp-spike-2" />
      <div className="sp-spike sp-spike-3" />
      <div className="sp-bang" />
      <WeaponParts cls={cls} />
    </div>
  );
}

function PixelUnit({ unit }: { unit: Unit }) {
  const style = {
    left:
      unit.side === "enemy"
        ? `calc(var(--enemy-grid-x) + ${unit.x} * var(--tile-size) + ${unit.x} * var(--tile-gap) + var(--unit-offset-x))`
        : `calc(${unit.x} * var(--tile-size) + ${unit.x} * var(--tile-gap) + var(--unit-offset-x))`,
    top: `calc(${unit.y} * var(--tile-size) + ${unit.y} * var(--tile-gap) + var(--unit-offset-y))`,
  };
  return (
    <div
      className={`unit unit-${unit.side} ${unit.active ? "unit-active" : ""} ${unit.target ? "unit-target" : ""}`}
      style={style}
    >
      <div className="unit-shadow" />
      <AnimeSprite side={unit.side} cls={unit.cls} />
      <div className="unit-plate">
        <strong>{unit.name}</strong>
        <small>{unit.role}</small>
      </div>
    </div>
  );
}

function AttackRunner() {
  return (
    <div className="runner">
      <div className="unit-shadow" />
      <AnimeSprite side="ally" cls="blade-knight" />
    </div>
  );
}

function BattleGrid() {
  const tiles = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({ index: i, x: i % 4, y: Math.floor(i / 4) })),
    []
  );
  return (
    <div className="battle-stage">
      <div className="battlefield">
        <div className="grid-board ally-board">
          {tiles.map((t) => <Tile key={`a${t.index}`} {...t} side="ally" />)}
        </div>
        <div className="grid-board enemy-board">
          {tiles.map((t) => <Tile key={`e${t.index}`} {...t} side="enemy" />)}
        </div>
        <div className="grid-label ally-label">Blue 16-Tile Grid</div>
        <div className="grid-label enemy-label">Crimson 16-Tile Grid</div>
        <div className="bridge-line" />
        {allUnits.map((u) => <PixelUnit key={u.name} unit={u} />)}
        <AttackRunner />

        {/* Impact VFX */}
        <div className="slash slash-a" />
        <div className="slash slash-b" />
        <div className="slash slash-c" />
        <div className="impact-flash" />
        <div className="impact impact-one" />
        <div className="impact impact-two" />
        <div className="impact impact-three" />
        <div className="damage-text">Blade Strike</div>
        <div className="damage-number">42</div>
      </div>
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
      <section className="hud bottom-hud">
        <div className="team-panel allies-panel">
          <span>Blue Team</span>
          <strong>4 units ready</strong>
        </div>
        <div className="combat-log">
          <span className="log-line log-1">Selecting attacker on tile 1,3</span>
          <span className="log-line log-2">Attack crosses into enemy grid</span>
          <span className="log-line log-3">Dash · Slash · Impact · Recoil</span>
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
    --unit-offset-x: 6px;
    --unit-offset-y: -8px;
    --dur: 5.6s;
  }

  .demo-shell {
    position: relative; min-height: 100vh; overflow: hidden;
    background:
      radial-gradient(circle at 50% 28%, rgba(122,91,255,0.22), transparent 34%),
      radial-gradient(circle at 78% 68%, rgba(255,84,122,0.14), transparent 27%),
      linear-gradient(135deg, #0d1426 0%, #14122a 44%, #241027 100%);
    color: #f8efe2;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .scene-glow {
    position: absolute; inset: auto -10% -40% -10%; height: 70%;
    background: radial-gradient(ellipse at center, rgba(234,190,92,0.16), transparent 66%);
    pointer-events: none;
  }

  /* ── HUD ── */
  .hud {
    position: absolute; z-index: 40;
    display: flex; align-items: center; justify-content: space-between;
    left: 52px; right: 52px;
  }
  .top-hud    { top: 34px; }
  .bottom-hud { bottom: 34px; gap: 18px; }
  .hud p, .hud span, .unit-plate small {
    margin: 0; color: rgba(248,239,226,0.60);
    letter-spacing: 0.08em; text-transform: uppercase; font-size: 11px; font-weight: 800;
  }
  .hud h1 {
    margin: 4px 0 0; font-family: "Cinzel", Georgia, serif;
    letter-spacing: -0.04em; font-size: clamp(32px, 4vw, 58px); line-height: 0.9;
    text-shadow: 0 10px 28px rgba(0,0,0,0.45);
  }
  .turn-card, .team-panel, .combat-log {
    border: 1px solid rgba(255,255,255,0.14); background: rgba(8,12,28,0.66);
    box-shadow: 0 20px 55px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
    backdrop-filter: blur(18px); border-radius: 20px;
  }
  .turn-card { padding: 15px 18px; min-width: 220px; }
  .turn-card strong, .team-panel strong { display: block; margin-top: 4px; color: #fff8e8; font-size: 16px; }
  .team-panel { min-width: 210px; padding: 16px 18px; }
  .allies-panel  { border-color: rgba(96,179,255,0.32); }
  .enemies-panel { border-color: rgba(255,92,121,0.32); text-align: right; }
  .combat-log { flex: 1; display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; padding: 14px; }
  .log-line { opacity: 0; animation: logPulse var(--dur) infinite; }
  .log-2 { animation-delay: 0.6s; }
  .log-3 { animation-delay: 1.3s; }

  /* ── Isometric grid ── */
  .battle-stage {
    min-height: 100vh; display: grid; place-items: center; perspective: 1200px;
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
    position: absolute; top: 0; left: 0;
    width: var(--grid-size); height: var(--grid-size);
    display: grid;
    grid-template-columns: repeat(4, var(--tile-size));
    grid-template-rows:    repeat(4, var(--tile-size));
    gap: var(--tile-gap); transform-style: preserve-3d;
  }
  .enemy-board { left: var(--enemy-grid-x); }
  .grid-label {
    position: absolute; top: -48px; width: var(--grid-size);
    transform: translateZ(96px) rotateZ(38deg) rotateX(-56deg);
    color: rgba(255,248,224,0.78); font-size: 12px; font-weight: 900;
    letter-spacing: 0.12em; text-align: center; text-transform: uppercase;
    text-shadow: 0 8px 20px rgba(0,0,0,0.65);
  }
  .ally-label  { left: 0; }
  .enemy-label { left: var(--enemy-grid-x); }
  .bridge-line {
    position: absolute;
    left: calc(var(--grid-size) + 22px);
    top: calc(2 * var(--tile-size) + 2 * var(--tile-gap) + 39px);
    width: calc(var(--grid-gap) - 44px); height: 8px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(99,183,255,0), rgba(255,238,164,0.72), rgba(255,95,122,0));
    box-shadow: 0 0 28px rgba(255,221,127,0.42);
    transform: translateZ(34px);
    animation: bridgePulse var(--dur) infinite;
  }
  .tile {
    position: relative; border-radius: 18px;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)),
      linear-gradient(135deg, rgba(72,86,138,0.72), rgba(26,33,67,0.9));
    border: 1px solid rgba(255,255,255,0.14);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 12px 0 #0b1127, 0 24px 24px rgba(0,0,0,0.28);
    overflow: hidden;
  }
  .ally-tile  { border-color: rgba(96,179,255,0.19); }
  .enemy-tile {
    border-color: rgba(255,92,121,0.2);
    background:
      linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03)),
      linear-gradient(135deg, rgba(102,62,97,0.74), rgba(47,24,56,0.94));
  }
  .tile span {
    position: absolute; left: 10px; bottom: 8px;
    font-size: 11px; color: rgba(255,255,255,0.28);
    transform: rotateZ(38deg) rotateX(-56deg);
  }
  .tile::after {
    content: ""; position: absolute; inset: 8px;
    border-radius: 12px; border: 1px solid rgba(255,255,255,0.07);
  }
  .tile-path   { animation: pathGlow var(--dur) infinite; }
  .tile-impact { animation: targetPulse var(--dur) infinite; }

  /* ── Unit containers ── */
  .unit, .runner {
    position: absolute;
    width: 74px; height: 140px;
    transform: translateZ(74px) rotateZ(38deg) rotateX(-56deg);
    transform-style: preserve-3d;
    z-index: 12;
  }
  .unit-target { animation: targetRecoil var(--dur) infinite; }
  .unit-active { opacity: 0.30; }
  .runner {
    left: calc(0 * var(--tile-size) + 0 * var(--tile-gap) + var(--unit-offset-x));
    top:  calc(2 * var(--tile-size) + 2 * var(--tile-gap) + var(--unit-offset-y));
    width: 200px; height: 160px;
    margin-left: -60px; margin-top: -44px;
    z-index: 26;
    animation: attackDash var(--dur) cubic-bezier(0.2,0.9,0.16,1) infinite;
  }
  .unit-shadow {
    position: absolute; left: 4px; bottom: -8px;
    width: 62px; height: 14px;
    border-radius: 999px; background: rgba(0,0,0,0.52); filter: blur(3px);
  }
  .runner .unit-shadow { left: 56px; bottom: 0; width: 72px; height: 18px; }

  /* ══════════════════════════════════════════════════════
     ANIME SPRITE  — 70 × 130 px base container
     Colors and weapon shapes vary by .role-{cls}
  ══════════════════════════════════════════════════════ */
  .sprite {
    position: absolute;
    left: 0; bottom: 6px;
    width: 70px; height: 130px;
    image-rendering: pixelated;
    animation: idleSword 0.9s steps(2) infinite;
  }

  /* ── Default idle overrides per class ── */
  .sprite.role-cleric,
  .sprite.role-invoker  { animation: idleFloat  2.2s ease-in-out infinite; }
  .sprite.role-guardian { animation: idleStance 1.6s ease-in-out infinite; }
  .sprite.role-rune-archer { animation: idleArcher 1.5s ease-in-out infinite; }
  .sprite.role-hex-mage { animation: idleMage   1.8s ease-in-out infinite; }
  .sprite.role-lancer   { animation: idleLance  1.3s ease-in-out infinite; }

  /* ── Cape (deepest z) ── */
  .sp-cape {
    position: absolute;
    left: 2px; top: 44px;
    width: 40px; height: 78px;
    border-radius: 12px 2px 20px 8px;
    z-index: 1; transform: skewX(-4deg);
    box-shadow: inset -4px -5px 0 rgba(0,0,0,0.32);
  }
  .sprite-ally  .sp-cape { background: #0c1460; }
  .sprite-enemy .sp-cape { background: #200006; }
  /* class overrides */
  .role-cleric   .sp-cape { background: #cce0f8; }
  .role-guardian .sp-cape { background: #202830; }
  .role-hex-mage .sp-cape { background: #16003a; }
  .role-lancer   .sp-cape { background: #031428; }
  .role-invoker  .sp-cape { background: #1a0808; }

  /* ── Back arm ── */
  .sp-arm-back {
    position: absolute;
    left: 0; top: 46px;
    width: 12px; height: 44px;
    border-radius: 6px 2px 10px 10px;
    z-index: 2; box-shadow: inset -2px -3px 0 rgba(0,0,0,0.28);
  }
  .sprite-ally  .sp-arm-back { background: #1848c0; }
  .sprite-enemy .sp-arm-back { background: #800010; }
  .role-cleric   .sp-arm-back { background: #d8b840; }
  .role-guardian .sp-arm-back { background: #506070; }
  .role-hex-mage .sp-arm-back { background: #5020a8; }
  .role-lancer   .sp-arm-back { background: #1a3860; }
  .role-rune-archer .sp-arm-back { background: #1a6840; }
  .role-invoker  .sp-arm-back { background: #6c1010; }

  /* ── Back leg ── */
  .sp-leg-back {
    position: absolute;
    left: 13px; top: 86px;
    width: 17px; height: 48px;
    border-radius: 4px 4px 10px 10px;
    z-index: 3; box-shadow: inset -3px -4px 0 rgba(0,0,0,0.30);
  }
  .sprite-ally  .sp-leg-back { background: linear-gradient(180deg,#1438a8,#0c2070 65%,#060e38); }
  .sprite-enemy .sp-leg-back { background: linear-gradient(180deg,#6e0010,#4a000c 65%,#280006); }
  .role-cleric   .sp-leg-back { background: linear-gradient(180deg,#e0e8f8,#c0d0e8 65%,#a0b8d8); }
  .role-guardian .sp-leg-back { background: linear-gradient(180deg,#384858,#243038 65%,#141820); }
  .role-hex-mage .sp-leg-back { background: linear-gradient(180deg,#2c0870,#1a0448 65%,#0e0228); }
  .role-lancer   .sp-leg-back { background: linear-gradient(180deg,#1a3870,#102250 65%,#081030); }
  .role-rune-archer .sp-leg-back { background: linear-gradient(180deg,#145030,#0c3020 65%,#061810); }
  .role-invoker  .sp-leg-back { background: linear-gradient(180deg,#5a0808,#3c0404 65%,#1e0202); }

  /* ── Body / torso ── */
  .sp-body {
    position: absolute;
    left: 12px; top: 42px;
    width: 46px; height: 46px;
    border-radius: 10px 10px 4px 4px;
    z-index: 5; box-shadow: inset -4px -5px 0 rgba(0,0,0,0.22);
  }
  .sprite-ally  .sp-body { background: #1848c0; }
  .sprite-enemy .sp-body { background: #8c0818; }
  .role-cleric   .sp-body { background: #d8c060; }
  .role-guardian .sp-body { background: #384858; }
  .role-hex-mage .sp-body { background: #3c1090; }
  .role-lancer   .sp-body { background: #1a3870; }
  .role-rune-archer .sp-body { background: #145030; }
  .role-invoker  .sp-body { background: #6c1010; }

  .sp-chest {
    position: absolute; left: 5px; top: 4px;
    width: 36px; height: 22px;
    border-radius: 6px 6px 2px 2px;
    box-shadow: inset 0 3px 0 rgba(255,255,255,0.15);
  }
  .sprite-ally  .sp-chest { background: #4880f0; }
  .sprite-enemy .sp-chest { background: #c41c30; }
  .role-cleric   .sp-chest { background: #f8f0a0; }
  .role-guardian .sp-chest { background: #607080; }
  .role-hex-mage .sp-chest { background: #6030c0; }
  .role-lancer   .sp-chest { background: #2858a0; }
  .role-rune-archer .sp-chest { background: #1e7840; }
  .role-invoker  .sp-chest { background: #a02020; }

  .sp-belt {
    position: absolute; left: 0; bottom: 0;
    width: 100%; height: 10px; border-radius: 0 0 4px 4px;
  }
  .sprite-ally  .sp-belt { background: #d09400; }
  .sprite-enemy .sp-belt { background: #a07000; }
  .role-cleric   .sp-belt { background: #e8b000; }
  .role-guardian .sp-belt { background: #708090; }
  .role-hex-mage .sp-belt { background: #8030d0; }
  .role-lancer   .sp-belt { background: #4070b0; }
  .role-rune-archer .sp-belt { background: #20a050; }
  .role-invoker  .sp-belt { background: #c04010; }

  /* ── Shoulder pads ── */
  .sp-shoulder {
    position: absolute; top: 42px;
    width: 18px; height: 18px;
    border-radius: 9px 0 6px 9px;
    z-index: 7; box-shadow: inset -2px -3px 0 rgba(0,0,0,0.24);
  }
  .sp-sh-l { left: 6px; border-radius: 9px 0 6px 9px; }
  .sp-sh-r { right: 14px; border-radius: 0 9px 9px 6px; }
  .sprite-ally  .sp-shoulder { background: linear-gradient(135deg,#7090d8,#4868c0,#2e50a8); }
  .sprite-enemy .sp-shoulder { background: linear-gradient(135deg,#e04060,#b02040,#801028); }
  .role-cleric   .sp-shoulder { background: linear-gradient(135deg,#f8f4c0,#e8d870,#c0a830); }
  .role-guardian .sp-shoulder { background: linear-gradient(135deg,#90a0b0,#607080,#405060); }
  .role-hex-mage .sp-shoulder { background: linear-gradient(135deg,#9050e0,#6030b0,#401880); }
  .role-lancer   .sp-shoulder { background: linear-gradient(135deg,#4090d0,#2060a0,#103870); }
  .role-rune-archer .sp-shoulder { background: linear-gradient(135deg,#30c070,#189050,#0c5830); }
  .role-invoker  .sp-shoulder { background: linear-gradient(135deg,#e04020,#b02010,#700c08); }

  /* ── Front leg ── */
  .sp-leg-front {
    position: absolute;
    left: 30px; top: 83px;
    width: 17px; height: 50px;
    border-radius: 4px 4px 10px 10px;
    z-index: 7; box-shadow: inset -3px -4px 0 rgba(0,0,0,0.30);
  }
  .sprite-ally  .sp-leg-front { background: linear-gradient(180deg,#1438a8,#0c2070 65%,#060e38); }
  .sprite-enemy .sp-leg-front { background: linear-gradient(180deg,#6e0010,#4a000c 65%,#280006); }
  .role-cleric   .sp-leg-front { background: linear-gradient(180deg,#e0e8f8,#c0d0e8 65%,#a0b8d8); }
  .role-guardian .sp-leg-front { background: linear-gradient(180deg,#384858,#243038 65%,#141820); }
  .role-hex-mage .sp-leg-front { background: linear-gradient(180deg,#2c0870,#1a0448 65%,#0e0228); }
  .role-lancer   .sp-leg-front { background: linear-gradient(180deg,#1a3870,#102250 65%,#081030); }
  .role-rune-archer .sp-leg-front { background: linear-gradient(180deg,#145030,#0c3020 65%,#061810); }
  .role-invoker  .sp-leg-front { background: linear-gradient(180deg,#5a0808,#3c0404 65%,#1e0202); }

  /* ── Front arm ── */
  .sp-arm-front {
    position: absolute;
    right: 0; top: 46px;
    width: 12px; height: 40px;
    border-radius: 2px 6px 10px 10px;
    z-index: 8; box-shadow: inset -2px -3px 0 rgba(0,0,0,0.20);
    background: #f2b870;
  }

  /* ── Collar ── */
  .sp-collar {
    position: absolute;
    left: 22px; top: 39px;
    width: 24px; height: 10px;
    border-radius: 4px 4px 0 0;
    background: #f2b870;
    z-index: 9;
  }

  /* ── Head ── */
  .sp-head {
    position: absolute;
    left: 17px; top: 14px;
    width: 34px; height: 30px;
    border-radius: 10px 10px 7px 7px;
    background: #f2b870;
    z-index: 10;
    box-shadow: inset -3px -4px 0 rgba(0,0,0,0.12);
  }

  /* ── Eyes ── large anime-style with specular dot ── */
  .sp-eye {
    position: absolute;
    top: 10px; width: 9px; height: 10px;
    border-radius: 3px 3px 5px 5px;
    z-index: 11;
  }
  .sp-eye::after {
    content: "";
    position: absolute;
    left: 1px; top: 1px;
    width: 4px; height: 4px;
    background: rgba(255,255,255,0.75);
    border-radius: 50%;
  }
  .sp-eye-l { left: 3px; }
  .sp-eye-r { right: 3px; }
  .sprite-ally  .sp-eye { background: #00d8ff; box-shadow: 0 0 7px rgba(0,210,255,0.8); }
  .sprite-enemy .sp-eye { background: #ff2020; box-shadow: 0 0 7px rgba(255,30,30,0.8); }
  .role-cleric   .sp-eye { background: #f0c020; box-shadow: 0 0 7px rgba(240,192,32,0.8); }
  .role-guardian .sp-eye { background: #40d080; box-shadow: 0 0 7px rgba(64,208,128,0.7); }
  .role-hex-mage .sp-eye { background: #c040ff; box-shadow: 0 0 7px rgba(192,64,255,0.8); }
  .role-lancer   .sp-eye { background: #f0e020; box-shadow: 0 0 7px rgba(240,224,32,0.8); }
  .role-rune-archer .sp-eye { background: #20e080; box-shadow: 0 0 7px rgba(32,224,128,0.7); }
  .role-invoker  .sp-eye { background: #ff8020; box-shadow: 0 0 7px rgba(255,128,32,0.8); }

  .sp-nose {
    position: absolute;
    left: 13px; top: 20px;
    width: 5px; height: 4px;
    border-radius: 2px;
    background: rgba(0,0,0,0.12);
    z-index: 11;
  }

  /* ── Hair base ── */
  .sp-hair-base {
    position: absolute;
    left: 10px; top: 5px;
    width: 50px; height: 22px;
    border-radius: 14px 22px 4px 3px;
    z-index: 12; box-shadow: inset -2px -3px 0 rgba(0,0,0,0.32);
  }
  .sprite-ally  .sp-hair-base { background: #4820d8; }
  .sprite-enemy .sp-hair-base { background: #d81808; }
  .role-cleric   .sp-hair-base { background: #e8e8f8; }
  .role-guardian .sp-hair-base { background: #2c1808; }
  .role-hex-mage .sp-hair-base { background: #9018d0; }
  .role-lancer   .sp-hair-base { background: #a0c0e0; }
  .role-rune-archer .sp-hair-base { background: #009070; }
  .role-invoker  .sp-hair-base { background: #e84010; }

  /* ── Hair bang ── */
  .sp-bang {
    position: absolute;
    left: 14px; top: 16px;
    width: 20px; height: 12px;
    border-radius: 0 0 10px 10px;
    z-index: 13; box-shadow: inset -1px -2px 0 rgba(0,0,0,0.26);
  }
  .sprite-ally  .sp-bang { background: #5830e0; }
  .sprite-enemy .sp-bang { background: #e82210; }
  .role-cleric   .sp-bang { background: #d8d8f0; }
  .role-guardian .sp-bang { background: #3c2010; }
  .role-hex-mage .sp-bang { background: #b020e0; }
  .role-lancer   .sp-bang { background: #c0d8f0; }
  .role-rune-archer .sp-bang { background: #00b088; }
  .role-invoker  .sp-bang { background: #f05020; }

  /* ── Hair spikes ── */
  .sp-spike {
    position: absolute;
    z-index: 13; box-shadow: inset -1px -2px 0 rgba(0,0,0,0.30);
  }
  .sp-spike-1 { left: 36px; top: -13px; width: 11px; height: 20px; border-radius: 10px 14px 2px 2px; transform: rotate(7deg); }
  .sp-spike-2 { left: 46px; top: -7px;  width: 9px;  height: 16px; border-radius: 9px 14px 2px 2px; transform: rotate(20deg); }
  .sp-spike-3 { left: 8px;  top: -4px;  width: 9px;  height: 14px; border-radius: 10px 8px 2px 3px; transform: rotate(-12deg); }
  .sprite-ally  .sp-spike { background: #5830e0; }
  .sprite-enemy .sp-spike { background: #e82210; }
  .role-cleric   .sp-spike { background: #d0d0f0; }
  .role-guardian .sp-spike { background: #3c2010; }
  .role-hex-mage .sp-spike { background: #c020e8; }
  .role-lancer   .sp-spike { background: #b0d0f0; }
  .role-rune-archer .sp-spike { background: #009878; }
  .role-invoker  .sp-spike { background: #f04818; }

  /* ══════════════════════════════════════════════
     WEAPONS
  ══════════════════════════════════════════════ */

  /* ── Sword (blade-knight, fell-duelist) ── */
  .sp-weapon {
    position: absolute;
    right: -8px; top: 20px;
    width: 8px; height: 84px;
    border-radius: 999px 999px 4px 4px;
    transform: rotate(-20deg);
    transform-origin: bottom center;
    z-index: 14;
  }
  .sprite-ally  .sp-weapon {
    background: linear-gradient(180deg, #ffffff 0%, #b8e8ff 35%, #80c0f0 100%);
    box-shadow: 0 0 14px rgba(140,210,255,0.9), 0 0 28px rgba(100,180,255,0.5);
  }
  .sprite-enemy .sp-weapon {
    background: linear-gradient(180deg, #fff0b0 0%, #e8c060 35%, #c09020 100%);
    box-shadow: 0 0 12px rgba(255,210,80,0.7), 0 0 22px rgba(220,160,20,0.4);
  }

  /* ── Bow (rune-archer) ── */
  .sp-bow {
    position: absolute;
    right: -6px; top: 24px;
    width: 16px; height: 62px;
    border: 6px solid #1a8044;
    border-right: none;
    border-radius: 50% 0 0 50%;
    z-index: 14;
    box-shadow: inset 3px 0 0 rgba(255,255,255,0.15);
  }
  .sp-bow-string {
    position: absolute;
    right: -1px; top: 24px;
    width: 2px; height: 62px;
    background: rgba(240,220,140,0.9);
    z-index: 15;
  }
  .sp-arrow {
    position: absolute;
    right: -20px; top: 50px;
    width: 34px; height: 4px;
    background: #7c3e10;
    border-radius: 2px;
    z-index: 14;
  }
  .sp-arrow::after {
    content: "";
    position: absolute;
    right: -6px; top: -5px;
    border: 7px solid transparent;
    border-left: 12px solid #c8a820;
  }

  /* ── Staff (cleric / invoker) ── */
  .sp-staff-shaft {
    position: absolute;
    right: -9px; top: 6px;
    width: 7px; height: 90px;
    background: linear-gradient(180deg, #d8a830, #b07820, #8a5810);
    border-radius: 4px 4px 2px 2px;
    z-index: 14;
  }
  .sp-staff-orb {
    position: absolute;
    right: -15px; top: -10px;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: radial-gradient(circle, #ffffff, #f8f0a0 40%, #e0c030);
    z-index: 15;
    box-shadow: 0 0 12px rgba(255,240,80,0.8);
  }
  .sp-staff-glow {
    position: absolute;
    right: -22px; top: -18px;
    width: 34px; height: 34px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,240,100,0.55), transparent 65%);
    z-index: 13;
    animation: orbGlow 1.5s ease-in-out infinite alternate;
  }
  /* Invoker staff — dark orange orb */
  .role-invoker .sp-staff-orb {
    background: radial-gradient(circle, #ffb050, #e85020 40%, #a02000);
    box-shadow: 0 0 12px rgba(255,130,40,0.8);
  }
  .role-invoker .sp-staff-glow {
    background: radial-gradient(circle, rgba(255,110,30,0.55), transparent 65%);
  }

  /* ── Guardian: Shield + Axe ── */
  .sp-shield {
    position: absolute;
    left: -16px; top: 38px;
    width: 20px; height: 40px;
    border-radius: 5px 5px 12px 12px;
    background: linear-gradient(135deg, #90a8c0, #5878a0, #384e70);
    border: 2px solid #b0c8e0;
    z-index: 14;
    box-shadow: 0 0 10px rgba(100,160,255,0.25), inset -3px -4px 0 rgba(0,0,0,0.22);
  }
  .sp-shield::after {
    content: "";
    position: absolute;
    left: 4px; top: 4px; right: 4px; bottom: 4px;
    border-radius: 3px 3px 8px 8px;
    border: 1px solid rgba(255,255,255,0.25);
  }
  .sp-axe-handle {
    position: absolute;
    right: -8px; top: 24px;
    width: 7px; height: 74px;
    background: linear-gradient(180deg, #6b3a1f, #4a2510);
    border-radius: 4px;
    z-index: 14;
  }
  .sp-axe-head {
    position: absolute;
    right: -20px; top: 20px;
    width: 24px; height: 30px;
    background: linear-gradient(135deg, #b0c0d0, #7890a8, #506278);
    border-radius: 8px 16px 4px 4px;
    z-index: 15;
    box-shadow: inset -3px -4px 0 rgba(0,0,0,0.24);
  }

  /* ── Lance ── */
  .sp-lance-shaft {
    position: absolute;
    right: -16px; top: 14px;
    width: 9px; height: 96px;
    background: linear-gradient(180deg, #c8c8c8, #a0a8b0, #808898);
    border-radius: 4px;
    transform: rotate(-6deg);
    transform-origin: bottom center;
    z-index: 14;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.2);
  }
  .sp-lance-tip {
    position: absolute;
    right: -20px; top: -6px;
    width: 16px; height: 26px;
    background: linear-gradient(180deg, #e8f0ff, #90a8d0, #5878a0);
    border-radius: 60% 60% 20% 20%;
    transform: rotate(-6deg);
    transform-origin: bottom center;
    z-index: 15;
    box-shadow: 0 0 10px rgba(140,180,255,0.5);
  }

  /* ── Hex Mage orb ── */
  .sp-orb-glow {
    position: absolute;
    right: -24px; top: 20px;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(180,60,255,0.45), transparent 65%);
    z-index: 13;
    animation: orbGlow 1.0s ease-in-out infinite alternate;
  }
  .sp-orb-outer {
    position: absolute;
    right: -18px; top: 26px;
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 3px solid rgba(180,80,255,0.7);
    z-index: 14;
    animation: orbRotate 4s linear infinite;
  }
  .sp-orb-inner {
    position: absolute;
    right: -11px; top: 33px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: radial-gradient(circle, #e060ff, #9020c0);
    z-index: 15;
    box-shadow: 0 0 14px rgba(200,80,255,0.8);
    animation: orbPulse 0.85s ease-in-out infinite alternate;
  }

  /* ── Orb / float animations ── */
  @keyframes orbGlow {
    from { opacity: 0.5; transform: scale(0.88); }
    to   { opacity: 1;   transform: scale(1.12); }
  }
  @keyframes orbPulse {
    from { transform: scale(0.9); }
    to   { transform: scale(1.1); }
  }
  @keyframes orbRotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── Unit name plate ── */
  .unit-plate {
    position: absolute; left: 50%; top: -34px;
    width: 118px; transform: translateX(-50%);
    padding: 5px 8px; border-radius: 9px;
    background: rgba(5,8,22,0.80);
    border: 1px solid rgba(255,255,255,0.12);
    text-align: center; box-shadow: 0 10px 20px rgba(0,0,0,0.34);
  }
  .unit-plate strong { display: block; font-size: 11px; line-height: 1; color: #fff7df; }
  .unit-plate small  {
    display: block; margin-top: 2px;
    color: rgba(248,239,226,0.55); font-size: 8px;
    letter-spacing: 0.04em; text-transform: uppercase; font-weight: 800;
  }

  /* ══════════════════════════════════════════════
     ATTACK VFX — bigger, more dramatic
  ══════════════════════════════════════════════ */

  /* ── Slash arcs ── 3 now, larger ── */
  .slash {
    position: absolute;
    left: calc(var(--enemy-grid-x) + 0 * var(--tile-size) + 0 * var(--tile-gap) - 4px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) - 12px);
    width: 180px; height: 180px;
    border-radius: 50%;
    border: 12px solid transparent;
    border-left-color: rgba(255,255,255,0.98);
    border-top-color: rgba(104,218,255,0.90);
    filter: drop-shadow(0 0 18px rgba(142,228,255,0.95));
    transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(0.14) rotate(-35deg);
    opacity: 0; z-index: 40;
    animation: slashBurst var(--dur) infinite;
  }
  .slash-b {
    animation-delay: 0.07s;
    transform: translateZ(144px) rotateZ(38deg) rotateX(-56deg) scale(0.12) rotate(28deg);
    border-left-color: rgba(255,219,100,0.95);
    border-top-color: rgba(255,255,255,0.95);
    border-right-color: rgba(255,160,80,0.5);
  }
  .slash-c {
    animation-delay: 0.14s;
    left: calc(var(--enemy-grid-x) + 16px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) + 10px);
    width: 140px; height: 140px;
    border-left-color: rgba(200,240,255,0.92);
    border-top-color: rgba(255,255,255,0.88);
    transform: translateZ(148px) rotateZ(38deg) rotateX(-56deg) scale(0.12) rotate(-85deg);
  }

  /* ── Full-grid impact flash ── */
  .impact-flash {
    position: absolute;
    left: var(--enemy-grid-x); top: 0;
    width: var(--grid-size); height: var(--grid-size);
    background: rgba(255,255,255,0.92);
    transform: translateZ(60px) rotateZ(38deg) rotateX(-56deg);
    opacity: 0; z-index: 35; border-radius: 12px;
    animation: impactFlash var(--dur) infinite;
  }

  /* ── Impact stars ── */
  .impact {
    position: absolute;
    left: calc(var(--enemy-grid-x) + 14px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) + 20px);
    width: 90px; height: 90px;
    background: radial-gradient(circle, #fff 0 14%, #ffe68f 15% 32%, rgba(255,92,121,0.7) 33% 52%, transparent 53%);
    clip-path: polygon(50% 0, 62% 31%, 98% 17%, 71% 48%, 100% 67%, 62% 64%, 54% 100%, 42% 65%, 5% 82%, 31% 51%, 0 34%, 38% 36%);
    transform: translateZ(158px) rotateZ(38deg) rotateX(-56deg) scale(0);
    opacity: 0; z-index: 45;
    animation: impactPop var(--dur) infinite;
  }
  .impact-two   { animation-delay: 0.10s; filter: hue-rotate(44deg); left: calc(var(--enemy-grid-x) + 42px); top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) + 42px); }
  .impact-three { animation-delay: 0.20s; filter: hue-rotate(188deg); width: 64px; height: 64px; left: calc(var(--enemy-grid-x) + 60px); top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) + 10px); }

  /* ── Damage text ── */
  .damage-text, .damage-number {
    position: absolute;
    left: calc(var(--enemy-grid-x) + 4px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) - 60px);
    transform: translateZ(190px) rotateZ(38deg) rotateX(-56deg);
    opacity: 0; z-index: 50; text-align: center;
    text-shadow: 0 5px 18px rgba(0,0,0,0.7);
  }
  .damage-text {
    width: 200px; color: #ffe6a3;
    font-size: 14px; font-weight: 900;
    letter-spacing: 0.08em; text-transform: uppercase;
    animation: textPop var(--dur) infinite;
  }
  .damage-number {
    width: 120px;
    left: calc(var(--enemy-grid-x) + 44px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) - 106px);
    font-family: "Cinzel", Georgia, serif;
    font-size: 62px; font-weight: 900; color: #fff;
    animation: damageFloat var(--dur) infinite;
  }

  /* ══════════════════════════════════════════════
     KEYFRAMES
  ══════════════════════════════════════════════ */

  /* Class-specific idle animations */
  @keyframes idleSword {
    0%, 100% { transform: translateY(0) rotate(0.2deg); }
    50%       { transform: translateY(-5px) rotate(-0.2deg); }
  }
  @keyframes idleFloat {
    0%, 100% { transform: translateY(0); }
    40%      { transform: translateY(-8px); }
    70%      { transform: translateY(-6px); }
  }
  @keyframes idleStance {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-2px); }
  }
  @keyframes idleArcher {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25%      { transform: translateY(-4px) rotate(-0.5deg); }
    55%      { transform: translateY(-3px) rotate(0.4deg); }
  }
  @keyframes idleMage {
    0%, 100% { transform: translateY(0) scale(1); }
    35%      { transform: translateY(-7px) scale(1.01); }
    70%      { transform: translateY(-4px) scale(1.005); }
  }
  @keyframes idleLance {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    40%      { transform: translateY(-5px) rotate(0.8deg); }
    80%      { transform: translateY(-2px) rotate(-0.4deg); }
  }

  /* Attack dash */
  @keyframes attackDash {
    0%, 16%   { transform: translate3d(0,0,74px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
    25%       { transform: translate3d(214px,-35px,96px) rotateZ(38deg) rotateX(-56deg) scale(1.04); opacity: 1; }
    36%, 46%  { transform: translate3d(490px,-92px,112px) rotateZ(38deg) rotateX(-56deg) scale(1.12); opacity: 1; }
    57%       { transform: translate3d(280px,-48px,96px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
    72%, 100% { transform: translate3d(0,0,74px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
  }

  /* Target recoil */
  @keyframes targetRecoil {
    0%, 36%, 100%  { transform: translateZ(74px) rotateZ(38deg) rotateX(-56deg); filter: brightness(1); }
    40%            { transform: translate3d(20px,-10px,76px) rotateZ(38deg) rotateX(-56deg); filter: brightness(3.5); }
    43%            { transform: translate3d(22px,-12px,78px) rotateZ(38deg) rotateX(-56deg); filter: brightness(2.5); }
    50%            { transform: translate3d(-10px,5px,74px) rotateZ(38deg) rotateX(-56deg); filter: brightness(1); }
    58%            { transform: translateZ(74px) rotateZ(38deg) rotateX(-56deg); }
  }

  /* Slash burst — bigger peak, freeze held longer */
  @keyframes slashBurst {
    0%, 34%, 52%, 100% { opacity: 0; transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(0.14) rotate(-35deg); }
    37%   { opacity: 1;   transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(1.4) rotate(8deg); }
    44%   { opacity: 0.8; transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(1.5) rotate(22deg); }
    50%   { opacity: 0;   transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(2.1) rotate(76deg); }
  }

  /* Grid flash */
  @keyframes impactFlash {
    0%, 38%, 42%, 100% { opacity: 0; }
    39%                { opacity: 0.85; }
    41%                { opacity: 0.25; }
  }

  /* Impact star */
  @keyframes impactPop {
    0%, 37%, 54%, 100% { opacity: 0; transform: translateZ(158px) rotateZ(38deg) rotateX(-56deg) scale(0); }
    40%   { opacity: 1;   transform: translateZ(158px) rotateZ(38deg) rotateX(-56deg) scale(1.35); }
    47%   { opacity: 0.9; transform: translateZ(158px) rotateZ(38deg) rotateX(-56deg) scale(1.5); }
    52%   { opacity: 0;   transform: translateZ(158px) rotateZ(38deg) rotateX(-56deg) scale(2.2); }
  }

  /* Damage float */
  @keyframes damageFloat {
    0%, 40%, 60%, 100% { opacity: 0; transform: translateZ(190px) rotateZ(38deg) rotateX(-56deg) translateY(18px) scale(0.8); }
    44%   { opacity: 1; transform: translateZ(190px) rotateZ(38deg) rotateX(-56deg) translateY(-8px) scale(1.22); }
    55%   { opacity: 0; transform: translateZ(190px) rotateZ(38deg) rotateX(-56deg) translateY(-52px) scale(1); }
  }

  @keyframes textPop {
    0%, 36%, 62%, 100% { opacity: 0; transform: translateZ(190px) rotateZ(38deg) rotateX(-56deg) translateY(18px); }
    41%, 54%           { opacity: 1; transform: translateZ(190px) rotateZ(38deg) rotateX(-56deg) translateY(0); }
  }

  /* Tile glow + path */
  @keyframes pathGlow {
    0%, 13%, 72%, 100% {
      background:
        linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)),
        linear-gradient(135deg, rgba(72,86,138,0.72), rgba(26,33,67,0.9));
    }
    20%, 52% {
      background:
        linear-gradient(135deg, rgba(139,221,255,0.34), rgba(255,234,156,0.14)),
        linear-gradient(135deg, rgba(60,106,172,0.9), rgba(40,38,96,0.98));
    }
  }
  @keyframes targetPulse {
    0%, 32%, 65%, 100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 12px 0 #0b1127, 0 24px 24px rgba(0,0,0,0.28); }
    38%, 52%           { box-shadow: inset 0 0 0 3px rgba(255,231,150,0.95), 0 12px 0 #0b1127, 0 0 54px rgba(255,95,122,0.85); }
  }
  @keyframes bridgePulse {
    0%, 14%, 65%, 100% { opacity: 0.18; transform: translateZ(34px) scaleX(0.72); }
    24%, 50%           { opacity: 1;    transform: translateZ(34px) scaleX(1); }
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
    .turn-card  { display: none; }
  }
`;
