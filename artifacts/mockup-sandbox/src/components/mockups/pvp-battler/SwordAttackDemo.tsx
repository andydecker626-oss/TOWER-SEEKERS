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

function AnimeSprite({ side }: { side: "ally" | "enemy" }) {
  const s = side;
  return (
    <div className={`sprite sprite-${s}`}>
      {/* Behind layers */}
      <div className="sp-cape" />
      <div className="sp-arm sp-arm-back" />
      <div className="sp-leg sp-leg-back" />
      {/* Body */}
      <div className="sp-body">
        <div className="sp-chest" />
        <div className="sp-belt" />
      </div>
      {/* Front layers */}
      <div className="sp-leg sp-leg-front" />
      <div className="sp-arm sp-arm-front" />
      <div className="sp-collar" />
      {/* Head & face */}
      <div className="sp-head">
        <div className="sp-eye sp-eye-l" />
        <div className="sp-eye sp-eye-r" />
        <div className="sp-nose" />
      </div>
      {/* Hair */}
      <div className="sp-hair-base" />
      <div className="sp-hair-spike sp-spike-1" />
      <div className="sp-hair-spike sp-spike-2" />
      <div className="sp-hair-spike sp-spike-3" />
      <div className="sp-hair-bang" />
      {/* Weapon */}
      <div className="sp-weapon" />
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
      <AnimeSprite side={unit.side} />
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
      <AnimeSprite side="ally" />
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
    --unit-offset-x: 14px;
    --unit-offset-y: -4px;
    --dur: 5.2s;
  }

  /* ── Shell ── */
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

  /* ── HUD ── */
  .hud {
    position: absolute;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    left: 52px; right: 52px;
  }
  .top-hud  { top: 34px; }
  .bottom-hud { bottom: 34px; gap: 18px; }

  .hud p, .hud span, .unit-plate small {
    margin: 0;
    color: rgba(248,239,226,0.60);
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
  .allies-panel  { border-color: rgba(96,179,255,0.32); }
  .enemies-panel { border-color: rgba(255,92,121,0.32); text-align: right; }
  .combat-log { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 14px; }
  .log-line { opacity: 0; animation: logPulse var(--dur) infinite; }
  .log-2 { animation-delay: 0.6s; }
  .log-3 { animation-delay: 1.3s; }

  /* ── Isometric grid ── */
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
    width: var(--grid-size); height: var(--grid-size);
    display: grid;
    grid-template-columns: repeat(4, var(--tile-size));
    grid-template-rows:    repeat(4, var(--tile-size));
    gap: var(--tile-gap);
    transform-style: preserve-3d;
  }
  .enemy-board { left: var(--enemy-grid-x); }

  .grid-label {
    position: absolute;
    top: -48px; width: var(--grid-size);
    transform: translateZ(96px) rotateZ(38deg) rotateX(-56deg);
    color: rgba(255,248,224,0.78);
    font-size: 12px; font-weight: 900;
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

  /* Tiles */
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
  .ally-tile  { border-color: rgba(96,179,255,0.19); }
  .enemy-tile {
    border-color: rgba(255,92,121,0.2);
    background:
      linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03)),
      linear-gradient(135deg, rgba(102,62,97,0.74), rgba(47,24,56,0.94));
  }
  .tile span {
    position: absolute; left: 10px; bottom: 8px;
    font-size: 11px; color: rgba(255,255,255,0.32);
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
    width: 56px; height: 106px;
    transform: translateZ(74px) rotateZ(38deg) rotateX(-56deg);
    transform-style: preserve-3d;
    z-index: 12;
  }
  .unit-target { animation: targetRecoil var(--dur) infinite; }
  .unit-active { opacity: 0.36; }

  .runner {
    left: calc(0 * var(--tile-size) + 0 * var(--tile-gap) + var(--unit-offset-x));
    top:  calc(2 * var(--tile-size) + 2 * var(--tile-gap) + var(--unit-offset-y));
    width: 174px; height: 140px;
    margin-left: -56px; margin-top: -38px;
    z-index: 26;
    animation: attackDash var(--dur) cubic-bezier(0.2,0.9,0.16,1) infinite;
  }

  .unit-shadow {
    position: absolute;
    left: 4px; bottom: -8px;
    width: 50px; height: 14px;
    border-radius: 999px;
    background: rgba(0,0,0,0.48);
    filter: blur(3px);
  }
  .runner .unit-shadow { left: 48px; bottom: 0; width: 60px; height: 16px; }

  /* ════════════════════════════════════════════
     ANIME SPRITE  (56 × 100 px logical container)

     Ally colors:   purple-indigo hair / blue armor / cyan eyes
     Enemy colors:  crimson hair / dark red armor / red eyes
  ════════════════════════════════════════════ */
  .sprite {
    position: absolute;
    left: 2px; bottom: 6px;
    width: 52px; height: 98px;
    image-rendering: pixelated;
    animation: idleBob 0.84s steps(2) infinite;
  }

  /* ── Cape / cloak (behind everything) ── */
  .sp-cape {
    position: absolute;
    left: 3px; top: 34px;
    width: 32px; height: 60px;
    border-radius: 10px 2px 16px 8px;
    z-index: 1;
    transform: skewX(-4deg);
    box-shadow: inset -3px -4px 0 rgba(0,0,0,0.3);
  }
  .sprite-ally  .sp-cape { background: #0c1460; }
  .sprite-enemy .sp-cape { background: #200006; }

  /* ── Back arm ── */
  .sp-arm-back {
    position: absolute;
    left: 1px; top: 36px;
    width: 9px; height: 32px;
    border-radius: 5px 2px 8px 8px;
    z-index: 2;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.26);
  }
  .sprite-ally  .sp-arm-back { background: #1848c0; }
  .sprite-enemy .sp-arm-back { background: #800010; }

  /* ── Back leg ── */
  .sp-leg-back {
    position: absolute;
    left: 10px; top: 64px;
    width: 13px; height: 36px;
    border-radius: 3px 3px 8px 8px;
    z-index: 3;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.28);
  }
  .sprite-ally  .sp-leg-back { background: linear-gradient(180deg, #1438a8, #0c2070 70%, #060e38 100%); }
  .sprite-enemy .sp-leg-back { background: linear-gradient(180deg, #6e0010, #4a000c 70%, #280006 100%); }

  /* ── Body / torso ── */
  .sp-body {
    position: absolute;
    left: 9px; top: 33px;
    width: 34px; height: 34px;
    border-radius: 8px 8px 4px 4px;
    z-index: 5;
    box-shadow: inset -3px -4px 0 rgba(0,0,0,0.22);
  }
  .sprite-ally  .sp-body { background: #1848c0; }
  .sprite-enemy .sp-body { background: #8c0818; }

  /* chest highlight plate */
  .sp-chest {
    position: absolute;
    left: 4px; top: 3px;
    width: 26px; height: 17px;
    border-radius: 5px 5px 2px 2px;
    box-shadow: inset 0 2px 0 rgba(255,255,255,0.14);
  }
  .sprite-ally  .sp-chest { background: #4880f0; }
  .sprite-enemy .sp-chest { background: #c41c30; }

  /* belt */
  .sp-belt {
    position: absolute;
    left: 0; bottom: 0;
    width: 100%; height: 8px;
    border-radius: 0 0 4px 4px;
  }
  .sprite-ally  .sp-belt { background: #d09400; }
  .sprite-enemy .sp-belt { background: #a07000; }

  /* ── Front leg ── */
  .sp-leg-front {
    position: absolute;
    left: 22px; top: 62px;
    width: 13px; height: 38px;
    border-radius: 3px 3px 8px 8px;
    z-index: 7;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.28);
  }
  .sprite-ally  .sp-leg-front { background: linear-gradient(180deg, #1438a8, #0c2070 70%, #060e38 100%); }
  .sprite-enemy .sp-leg-front { background: linear-gradient(180deg, #6e0010, #4a000c 70%, #280006 100%); }

  /* ── Front arm ── */
  .sp-arm-front {
    position: absolute;
    right: 1px; top: 36px;
    width: 9px; height: 30px;
    border-radius: 2px 5px 8px 8px;
    z-index: 8;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.22);
  }
  .sprite-ally  .sp-arm-front { background: #f2b870; }
  .sprite-enemy .sp-arm-front { background: #f2b070; }

  /* ── Collar / neck scarf ── */
  .sp-collar {
    position: absolute;
    left: 16px; top: 30px;
    width: 20px; height: 8px;
    border-radius: 4px 4px 0 0;
    z-index: 9;
  }
  .sprite-ally  .sp-collar { background: #f2b870; }
  .sprite-enemy .sp-collar { background: #e8a860; }

  /* ── Head ── */
  .sp-head {
    position: absolute;
    left: 13px; top: 10px;
    width: 26px; height: 24px;
    border-radius: 8px 8px 6px 6px;
    z-index: 10;
    box-shadow: inset -2px -3px 0 rgba(0,0,0,0.12);
  }
  .sprite-ally  .sp-head { background: #f2b870; }
  .sprite-enemy .sp-head { background: #f0ad68; }

  /* ── Eyes — large anime-style ── */
  .sp-eye {
    position: absolute;
    top: 9px;
    width: 7px; height: 8px;
    border-radius: 3px 3px 4px 4px;
    z-index: 11;
  }
  .sp-eye::after {
    content: "";
    position: absolute;
    left: 1px; top: 1px;
    width: 3px; height: 3px;
    background: rgba(255,255,255,0.7);
    border-radius: 50%;
  }
  .sp-eye-l { left: 3px; }
  .sp-eye-r { right: 3px; }

  .sprite-ally  .sp-eye { background: #00d8ff; box-shadow: 0 0 6px rgba(0,210,255,0.7); }
  .sprite-enemy .sp-eye { background: #ff2020; box-shadow: 0 0 6px rgba(255,40,40,0.7); }

  /* ── Nose ── */
  .sp-nose {
    position: absolute;
    left: 11px; top: 17px;
    width: 4px; height: 3px;
    border-radius: 2px;
    background: rgba(0,0,0,0.14);
    z-index: 11;
  }

  /* ── Hair base ── */
  .sp-hair-base {
    position: absolute;
    left: 9px; top: 4px;
    width: 38px; height: 18px;
    border-radius: 12px 18px 4px 3px;
    z-index: 12;
    box-shadow: inset -2px -2px 0 rgba(0,0,0,0.3);
  }
  .sprite-ally  .sp-hair-base { background: #4820d8; }
  .sprite-enemy .sp-hair-base { background: #d81808; }

  /* ── Hair bang (front fringe over forehead) ── */
  .sp-hair-bang {
    position: absolute;
    left: 12px; top: 12px;
    width: 16px; height: 10px;
    border-radius: 0 0 8px 8px;
    z-index: 13;
    box-shadow: inset -1px -2px 0 rgba(0,0,0,0.25);
  }
  .sprite-ally  .sp-hair-bang { background: #5830e0; }
  .sprite-enemy .sp-hair-bang { background: #e82210; }

  /* ── Hair spikes ── */
  .sp-hair-spike {
    position: absolute;
    z-index: 13;
    box-shadow: inset -1px -2px 0 rgba(0,0,0,0.28);
  }
  /* Main top spike */
  .sp-spike-1 {
    left: 28px; top: -10px;
    width: 9px; height: 16px;
    border-radius: 8px 10px 2px 2px;
    transform: rotate(6deg);
  }
  /* Second spike leaning right */
  .sp-spike-2 {
    left: 36px; top: -5px;
    width: 7px; height: 14px;
    border-radius: 7px 10px 2px 2px;
    transform: rotate(18deg);
  }
  /* Left side spike */
  .sp-spike-3 {
    left: 8px; top: -3px;
    width: 7px; height: 12px;
    border-radius: 8px 6px 2px 3px;
    transform: rotate(-10deg);
  }
  .sprite-ally  .sp-hair-spike { background: #5830e0; }
  .sprite-enemy .sp-hair-spike { background: #e82210; }

  /* ── Weapon ── */
  .sp-weapon {
    position: absolute;
    right: -6px; top: 16px;
    width: 6px; height: 64px;
    border-radius: 999px 999px 3px 3px;
    transform: rotate(-22deg);
    transform-origin: bottom center;
    z-index: 14;
  }
  .sprite-ally  .sp-weapon {
    background: linear-gradient(180deg, #ffffff 0%, #b8e8ff 40%, #80c0f0 100%);
    box-shadow: 0 0 12px rgba(140,210,255,0.8), 0 0 24px rgba(100,180,255,0.4);
  }
  .sprite-enemy .sp-weapon {
    background: linear-gradient(180deg, #fff0b0 0%, #e8c060 40%, #c09020 100%);
    box-shadow: 0 0 10px rgba(255,210,80,0.6);
  }

  /* ── Unit name plate ── */
  .unit-plate {
    position: absolute;
    left: 50%; top: -32px;
    width: 110px;
    transform: translateX(-50%);
    padding: 5px 7px;
    border-radius: 9px;
    background: rgba(5,8,22,0.76);
    border: 1px solid rgba(255,255,255,0.12);
    text-align: center;
    box-shadow: 0 10px 20px rgba(0,0,0,0.32);
  }
  .unit-plate strong { display: block; font-size: 11px; line-height: 1; color: #fff7df; }
  .unit-plate small  { display: block; margin-top: 2px; color: rgba(248,239,226,0.55); font-size: 8px; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 800; }

  /* ── Grid impact / slash VFX (on grid) ── */
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
    transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(0.18) rotate(-35deg);
    opacity: 0; z-index: 40;
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
    left: calc(var(--enemy-grid-x) + 28px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) + 30px);
    width: 64px; height: 64px;
    background: radial-gradient(circle, #fff 0 12%, #ffe68f 13% 30%, rgba(255,92,121,0.7) 31% 50%, transparent 51%);
    clip-path: polygon(50% 0, 62% 31%, 98% 17%, 71% 48%, 100% 67%, 62% 64%, 54% 100%, 42% 65%, 5% 82%, 31% 51%, 0 34%, 38% 36%);
    transform: translateZ(154px) rotateZ(38deg) rotateX(-56deg) scale(0);
    opacity: 0; z-index: 45;
    animation: impactPop var(--dur) infinite;
  }
  .impact-two { animation-delay: 0.09s; filter: hue-rotate(44deg); }

  .damage-text, .damage-number {
    position: absolute;
    left: calc(var(--enemy-grid-x) + 4px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) - 54px);
    transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg);
    opacity: 0; z-index: 50; text-align: center;
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
    top:  calc(1 * var(--tile-size) + 1 * var(--tile-gap) - 92px);
    font-family: "Cinzel", Georgia, serif;
    font-size: 54px; font-weight: 900; color: #fff;
    animation: damageFloat var(--dur) infinite;
  }

  /* ══════════════════════════════
     KEYFRAMES
  ══════════════════════════════ */
  @keyframes idleBob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-4px); }
  }

  @keyframes attackDash {
    0%, 16%   { transform: translate3d(0,0,74px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
    25%       { transform: translate3d(214px,-35px,96px) rotateZ(38deg) rotateX(-56deg) scale(1.04); opacity: 1; }
    36%, 43%  { transform: translate3d(490px,-92px,112px) rotateZ(38deg) rotateX(-56deg) scale(1.12); opacity: 1; }
    54%       { transform: translate3d(280px,-48px,96px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
    70%, 100% { transform: translate3d(0,0,74px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
  }

  @keyframes targetRecoil {
    0%, 36%, 100% { transform: translateZ(74px) rotateZ(38deg) rotateX(-56deg); filter: brightness(1); }
    41%           { transform: translate3d(18px,-8px,76px) rotateZ(38deg) rotateX(-56deg); filter: brightness(2.2); }
    48%           { transform: translate3d(-9px,4px,74px) rotateZ(38deg) rotateX(-56deg); filter: brightness(1); }
    55%           { transform: translateZ(74px) rotateZ(38deg) rotateX(-56deg); }
  }

  @keyframes slashBurst {
    0%, 35%, 48%, 100% { opacity: 0; transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(0.18) rotate(-35deg); }
    39%  { opacity: 1; transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(1.2) rotate(16deg); }
    44%  { opacity: 0; transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(1.9) rotate(74deg); }
  }

  @keyframes impactPop {
    0%, 37%, 49%, 100% { opacity: 0; transform: translateZ(154px) rotateZ(38deg) rotateX(-56deg) scale(0); }
    40%  { opacity: 1; transform: translateZ(154px) rotateZ(38deg) rotateX(-56deg) scale(1.25); }
    46%  { opacity: 0; transform: translateZ(154px) rotateZ(38deg) rotateX(-56deg) scale(2); }
  }

  @keyframes damageFloat {
    0%, 39%, 56%, 100% { opacity: 0; transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg) translateY(16px) scale(0.8); }
    43%  { opacity: 1; transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg) translateY(-8px) scale(1.18); }
    52%  { opacity: 0; transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg) translateY(-46px) scale(1); }
  }

  @keyframes textPop {
    0%, 34%, 58%, 100% { opacity: 0; transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg) translateY(18px); }
    40%, 51%           { opacity: 1; transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg) translateY(0); }
  }

  @keyframes pathGlow {
    0%, 13%, 68%, 100% {
      background:
        linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)),
        linear-gradient(135deg, rgba(72,86,138,0.72), rgba(26,33,67,0.9));
    }
    20%, 49% {
      background:
        linear-gradient(135deg, rgba(139,221,255,0.34), rgba(255,234,156,0.14)),
        linear-gradient(135deg, rgba(60,106,172,0.9), rgba(40,38,96,0.98));
    }
  }

  @keyframes targetPulse {
    0%, 32%, 61%, 100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 12px 0 #0b1127, 0 24px 24px rgba(0,0,0,0.28); }
    38%, 48%           { box-shadow: inset 0 0 0 2px rgba(255,231,150,0.92), 0 12px 0 #0b1127, 0 0 46px rgba(255,95,122,0.72); }
  }

  @keyframes bridgePulse {
    0%, 14%, 62%, 100% { opacity: 0.18; transform: translateZ(34px) scaleX(0.72); }
    24%, 48%           { opacity: 1;    transform: translateZ(34px) scaleX(1); }
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
