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
  { name: "Rook", side: "ally", x: 1, y: 3, role: "Guardian" }
];

const enemies: Unit[] = [
  { name: "Veyr", side: "enemy", x: 0, y: 1, role: "Fell Duelist", target: true },
  { name: "Nox", side: "enemy", x: 3, y: 3, role: "Hex Mage" },
  { name: "Kain", side: "enemy", x: 2, y: 0, role: "Lancer" },
  { name: "Sera", side: "enemy", x: 1, y: 2, role: "Invoker" }
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

function PixelUnit({ unit }: { unit: Unit }) {
  const tint = unit.side === "ally" ? "ally" : "enemy";
  const gridOffset = unit.side === "enemy" ? "var(--enemy-grid-x)" : "0px";
  const style = {
    left: `calc(${gridOffset} + ${unit.x} * var(--tile-size) + ${unit.x} * var(--tile-gap) + var(--unit-offset-x))`,
    top: `calc(${unit.y} * var(--tile-size) + ${unit.y} * var(--tile-gap) + var(--unit-offset-y))`
  };

  return (
    <div className={`unit ${tint} ${unit.active ? "active-unit" : ""} ${unit.target ? "target-unit" : ""}`} style={style}>
      <div className="unit-shadow" />
      {unit.active ? (
        <img className="idle-real-sprite" src="/__mockup/images/pvp-battler/myrmidon-idle-transparent.png" alt="" />
      ) : (
        <div className="sprite">
          <div className="cape" />
          <div className="head" />
          <div className="hair" />
          <div className="body" />
          <div className="arm arm-back" />
          <div className="arm arm-front" />
          <div className="leg leg-back" />
          <div className="leg leg-front" />
          <div className="weapon" />
        </div>
      )}
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
      <img className="myrmidon-attack-sprite" src="/__mockup/images/pvp-battler/myrmidon-sword-transparent.gif" alt="Myrmidon sword attack sprite animation" />
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
          {tiles.map((tile) => <Tile key={`ally-${tile.index}`} {...tile} side="ally" />)}
        </div>
        <div className="grid-board enemy-board">
          {tiles.map((tile) => <Tile key={`enemy-${tile.index}`} {...tile} side="enemy" />)}
        </div>
        <div className="grid-label ally-label">Blue 16-Tile Grid</div>
        <div className="grid-label enemy-label">Crimson 16-Tile Grid</div>
        <div className="bridge-line" />
        {allUnits.map((unit) => <PixelUnit key={unit.name} unit={unit} />)}
        <AttackRunner />
        <div className="slash slash-a" />
        <div className="slash slash-b" />
        <div className="impact impact-one" />
        <div className="impact impact-two" />
        <div className="damage-text">Base Sword Attack</div>
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
      <section className="cinematic-attack-layer" aria-hidden="true">
        <div className="cinematic-floor" />
        <div className="cinematic-attacker">
          <img src="/__mockup/images/pvp-battler/myrmidon-sword-transparent.gif" alt="" />
        </div>
        <div className="cinematic-target">
          <div className="target-shadow" />
          <div className="target-body" />
          <div className="target-head" />
          <div className="target-sword" />
        </div>
        <div className="cinematic-slash cinematic-slash-one" />
        <div className="cinematic-slash cinematic-slash-two" />
        <div className="cinematic-hit-flash" />
        <div className="cinematic-damage">42</div>
      </section>
      <section className="hud bottom-hud">
        <div className="team-panel allies-panel">
          <span>Blue Team</span>
          <strong>4 units ready</strong>
        </div>
        <div className="combat-log">
          <span className="log-line log-1">Selecting attacker on tile 1,3</span>
          <span className="log-line log-2">Attack crosses into enemy 4x4 grid</span>
          <span className="log-line log-3">Dash, sword arc, impact, recoil</span>
        </div>
        <div className="team-panel enemies-panel">
          <span>Crimson Team</span>
          <strong>Target staggered</strong>
        </div>
      </section>
      <div className="asset-credit">Sprite source: FE-Repo Awakening-Style Myrmidon Alt [M] — F2U/F2E credits: Iscaneus, Leo_link, Intestine</div>
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
  }

  .demo-shell {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 28%, rgba(122, 91, 255, 0.24), transparent 34%),
      radial-gradient(circle at 78% 68%, rgba(255, 84, 122, 0.16), transparent 27%),
      linear-gradient(135deg, #0d1426 0%, #14122a 44%, #241027 100%);
    color: #f8efe2;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .scene-glow {
    position: absolute;
    inset: auto -10% -40% -10%;
    height: 70%;
    background: radial-gradient(ellipse at center, rgba(234, 190, 92, 0.18), transparent 66%);
    pointer-events: none;
  }

  .cinematic-attack-layer {
    position: absolute;
    inset: 120px 0 116px;
    z-index: 24;
    pointer-events: none;
    overflow: hidden;
  }

  .cinematic-floor {
    position: absolute;
    left: 18%;
    right: 16%;
    bottom: 108px;
    height: 38px;
    border-radius: 999px;
    background: radial-gradient(ellipse at center, rgba(255, 232, 167, 0.18), rgba(120, 169, 255, 0.08) 42%, transparent 72%);
    filter: blur(5px);
    animation: cinematicFloorPulse 4.4s infinite;
  }

  .cinematic-attacker {
    position: absolute;
    left: 17%;
    bottom: 72px;
    width: 360px;
    height: 232px;
    opacity: 0;
    transform: translateX(-42px) scale(1);
    transform-origin: bottom center;
    animation: cinematicAttacker 4.4s cubic-bezier(0.18, 0.86, 0.18, 1) infinite;
    filter: drop-shadow(0 22px 20px rgba(0, 0, 0, 0.58));
  }

  .cinematic-attacker img {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 372px;
    height: auto;
    transform: translateX(-50%);
    image-rendering: pixelated;
  }

  .cinematic-target {
    position: absolute;
    right: 19.5%;
    bottom: 86px;
    width: 92px;
    height: 150px;
    opacity: 0;
    transform-origin: bottom center;
    animation: cinematicTarget 4.4s infinite;
  }

  .target-shadow {
    position: absolute;
    left: 4px;
    right: 2px;
    bottom: -5px;
    height: 18px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.5);
    filter: blur(3px);
  }

  .target-body,
  .target-head,
  .target-sword {
    position: absolute;
    image-rendering: pixelated;
    box-shadow: inset -5px -5px 0 rgba(0, 0, 0, 0.25);
  }

  .target-body {
    left: 24px;
    bottom: 24px;
    width: 42px;
    height: 72px;
    border-radius: 12px 12px 8px 8px;
    background: linear-gradient(#ffd0dc 0 28%, #e84d6c 29% 62%, #64142b 63%);
  }

  .target-head {
    left: 31px;
    bottom: 94px;
    width: 31px;
    height: 31px;
    border-radius: 10px 10px 8px 8px;
    background: #ffd0a1;
  }

  .target-sword {
    right: 4px;
    bottom: 39px;
    width: 8px;
    height: 86px;
    border-radius: 999px;
    background: linear-gradient(90deg, #9de9ff, #fff, #9de9ff);
    transform: rotate(-18deg);
    box-shadow: 0 0 16px rgba(178, 235, 255, 0.5);
  }

  .cinematic-slash {
    position: absolute;
    right: 19%;
    bottom: 118px;
    width: 210px;
    height: 210px;
    border-radius: 50%;
    border: 11px solid transparent;
    border-left-color: rgba(255, 255, 255, 0.98);
    border-top-color: rgba(119, 221, 255, 0.9);
    opacity: 0;
    transform: rotate(-30deg) scale(0.2);
    filter: drop-shadow(0 0 22px rgba(138, 230, 255, 0.95));
    animation: cinematicSlash 4.4s infinite;
  }

  .cinematic-slash-two {
    bottom: 102px;
    right: 18.2%;
    width: 180px;
    height: 180px;
    border-left-color: rgba(255, 224, 132, 0.95);
    border-top-color: rgba(255, 255, 255, 0.96);
    animation-delay: 0.07s;
  }

  .cinematic-hit-flash {
    position: absolute;
    right: 22.5%;
    bottom: 164px;
    width: 98px;
    height: 98px;
    opacity: 0;
    transform: scale(0);
    background: radial-gradient(circle, #fff 0 12%, #ffe68f 13% 31%, rgba(255, 92, 121, 0.8) 32% 54%, transparent 55%);
    clip-path: polygon(50% 0, 61% 31%, 98% 17%, 71% 48%, 100% 67%, 62% 64%, 54% 100%, 42% 65%, 5% 82%, 31% 51%, 0 34%, 38% 36%);
    filter: drop-shadow(0 0 24px rgba(255, 223, 111, 0.95));
    animation: cinematicHit 4.4s infinite;
  }

  .cinematic-damage {
    position: absolute;
    right: 21.7%;
    bottom: 248px;
    color: #fff8dc;
    font-family: "Cinzel", Georgia, serif;
    font-size: 68px;
    font-weight: 900;
    text-shadow: 0 8px 24px rgba(0, 0, 0, 0.72), 0 0 16px rgba(255, 217, 103, 0.6);
    opacity: 0;
    animation: cinematicDamage 4.4s infinite;
  }

  .hud {
    position: absolute;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    left: 52px;
    right: 52px;
  }

  .top-hud {
    top: 34px;
  }

  .bottom-hud {
    bottom: 34px;
    gap: 18px;
  }

  .hud p,
  .hud span,
  .unit-plate small {
    margin: 0;
    color: rgba(248, 239, 226, 0.66);
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
    text-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
  }

  .turn-card,
  .team-panel,
  .combat-log {
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(8, 12, 28, 0.66);
    box-shadow: 0 20px 55px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(18px);
    border-radius: 20px;
  }

  .turn-card {
    padding: 15px 18px;
    min-width: 220px;
  }

  .turn-card strong,
  .team-panel strong {
    display: block;
    margin-top: 4px;
    color: #fff8e8;
    font-size: 16px;
  }

  .team-panel {
    min-width: 210px;
    padding: 16px 18px;
  }

  .allies-panel {
    border-color: rgba(96, 179, 255, 0.32);
  }

  .enemies-panel {
    border-color: rgba(255, 92, 121, 0.32);
    text-align: right;
  }

  .combat-log {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 14px;
  }

  .log-line {
    opacity: 0;
    animation: logPulse 4.4s infinite;
  }

  .log-2 { animation-delay: 0.6s; }
  .log-3 { animation-delay: 1.3s; }

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
    filter: drop-shadow(0 42px 60px rgba(0, 0, 0, 0.44));
  }

  .grid-board {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--grid-size);
    height: var(--grid-size);
    display: grid;
    grid-template-columns: repeat(4, var(--tile-size));
    grid-template-rows: repeat(4, var(--tile-size));
    gap: var(--tile-gap);
    transform-style: preserve-3d;
  }

  .enemy-board {
    left: var(--enemy-grid-x);
  }

  .grid-label {
    position: absolute;
    top: -48px;
    width: var(--grid-size);
    transform: translateZ(96px) rotateZ(38deg) rotateX(-56deg);
    color: rgba(255, 248, 224, 0.78);
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-align: center;
    text-transform: uppercase;
    text-shadow: 0 8px 20px rgba(0, 0, 0, 0.65);
  }

  .ally-label {
    left: 0;
  }

  .enemy-label {
    left: var(--enemy-grid-x);
  }

  .bridge-line {
    position: absolute;
    left: calc(var(--grid-size) + 22px);
    top: calc(2 * var(--tile-size) + 2 * var(--tile-gap) + 39px);
    width: calc(var(--grid-gap) - 44px);
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(99, 183, 255, 0), rgba(255, 238, 164, 0.72), rgba(255, 95, 122, 0));
    box-shadow: 0 0 28px rgba(255, 221, 127, 0.42);
    transform: translateZ(34px);
    animation: bridgePulse 4.4s infinite;
  }

  .tile {
    position: relative;
    border-radius: 18px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03)),
      linear-gradient(135deg, rgba(72, 86, 138, 0.72), rgba(26, 33, 67, 0.9));
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 12px 0 #0b1127, 0 24px 24px rgba(0, 0, 0, 0.28);
    overflow: hidden;
  }

  .ally-tile {
    border-color: rgba(96, 179, 255, 0.19);
  }

  .enemy-tile {
    border-color: rgba(255, 92, 121, 0.2);
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03)),
      linear-gradient(135deg, rgba(102, 62, 97, 0.74), rgba(47, 24, 56, 0.94));
  }

  .tile span {
    position: absolute;
    left: 10px;
    bottom: 8px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.34);
    transform: rotateZ(38deg) rotateX(-56deg);
  }

  .tile::after {
    content: "";
    position: absolute;
    inset: 8px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .tile-path {
    animation: pathGlow 4.4s infinite;
  }

  .tile-impact {
    animation: targetPulse 4.4s infinite;
  }

  .unit,
  .runner {
    position: absolute;
    width: 62px;
    height: 96px;
    transform: translateZ(74px) rotateZ(38deg) rotateX(-56deg);
    transform-style: preserve-3d;
    z-index: 12;
  }

  .unit.target-unit {
    animation: targetRecoil 4.4s infinite;
  }

  .unit.active-unit {
    opacity: 0.42;
  }

  .runner {
    left: calc(0 * var(--tile-size) + 0 * var(--tile-gap) + var(--unit-offset-x));
    top: calc(2 * var(--tile-size) + 2 * var(--tile-gap) + var(--unit-offset-y));
    width: 174px;
    height: 128px;
    margin-left: -59px;
    margin-top: -36px;
    opacity: 1;
    z-index: 26;
    animation: attackDash 4.4s cubic-bezier(0.2, 0.9, 0.16, 1) infinite;
  }

  .unit-shadow {
    position: absolute;
    left: 4px;
    bottom: -7px;
    width: 54px;
    height: 15px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.44);
    filter: blur(2px);
  }

  .sprite {
    position: absolute;
    left: 8px;
    bottom: 0;
    width: 46px;
    height: 82px;
    image-rendering: pixelated;
    animation: idleBob 0.72s steps(2) infinite;
  }

  .runner-sprite {
    animation: runCycle 0.28s steps(2) infinite;
  }

  .idle-real-sprite,
  .myrmidon-attack-sprite {
    position: absolute;
    image-rendering: pixelated;
    pointer-events: none;
    filter: drop-shadow(0 13px 8px rgba(0, 0, 0, 0.38));
  }

  .idle-real-sprite {
    left: -56px;
    bottom: -13px;
    width: 166px;
    height: auto;
    object-fit: contain;
  }

  .myrmidon-attack-sprite {
    left: -22px;
    bottom: -14px;
    width: 198px;
    height: auto;
  }

  .head,
  .hair,
  .body,
  .cape,
  .arm,
  .leg,
  .weapon {
    position: absolute;
    box-shadow: inset -3px -3px 0 rgba(0, 0, 0, 0.22);
  }

  .head {
    left: 15px;
    top: 8px;
    width: 20px;
    height: 20px;
    background: #ffd7a3;
    border-radius: 7px 7px 5px 5px;
    z-index: 6;
  }

  .hair {
    left: 10px;
    top: 3px;
    width: 27px;
    height: 17px;
    background: #f2c14e;
    border-radius: 11px 11px 4px 5px;
    z-index: 7;
  }

  .body {
    left: 11px;
    top: 29px;
    width: 28px;
    height: 31px;
    background: linear-gradient(#d9f1ff, #609cff 42%, #263b8f 43%);
    border-radius: 7px 7px 6px 6px;
    z-index: 5;
  }

  .enemy .body {
    background: linear-gradient(#ffd0dc, #e84d6c 42%, #7d1834 43%);
  }

  .cape {
    left: 5px;
    top: 28px;
    width: 35px;
    height: 44px;
    background: #304ad4;
    border-radius: 11px 3px 12px 8px;
    z-index: 1;
    transform: skewX(-8deg);
  }

  .enemy .cape {
    background: #9d1737;
  }

  .arm {
    top: 34px;
    width: 10px;
    height: 28px;
    background: #ffd7a3;
    border-radius: 6px;
    transform-origin: top center;
    z-index: 7;
  }

  .arm-back { left: 5px; transform: rotate(18deg); }
  .arm-front { right: 4px; transform: rotate(-20deg); }

  .runner .arm-front {
    animation: swordArm 4.4s infinite;
  }

  .leg {
    top: 56px;
    width: 10px;
    height: 24px;
    background: #242f6c;
    border-radius: 5px;
    z-index: 4;
  }

  .enemy .leg {
    background: #581229;
  }

  .leg-back { left: 13px; }
  .leg-front { right: 11px; }

  .weapon {
    right: -9px;
    top: 22px;
    width: 8px;
    height: 54px;
    background: linear-gradient(90deg, #c8f4ff, #ffffff, #81b5ff);
    border-radius: 999px 999px 3px 3px;
    transform: rotate(-28deg);
    transform-origin: bottom center;
    z-index: 9;
    box-shadow: 0 0 18px rgba(177, 224, 255, 0.7);
  }

  .runner .weapon {
    animation: swordSwing 4.4s infinite;
  }

  .unit-plate {
    position: absolute;
    left: 50%;
    top: -34px;
    width: 116px;
    transform: translateX(-50%);
    padding: 6px 8px;
    border-radius: 10px;
    background: rgba(5, 8, 22, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.12);
    text-align: center;
    box-shadow: 0 12px 22px rgba(0, 0, 0, 0.3);
  }

  .active-unit .unit-plate {
    top: -28px;
  }

  .runner .unit-shadow {
    left: 46px;
    bottom: 2px;
    width: 78px;
    height: 18px;
  }

  .unit-plate strong {
    display: block;
    font-size: 12px;
    line-height: 1;
    color: #fff7df;
  }

  .unit-plate small {
    display: block;
    margin-top: 3px;
    font-size: 8px;
    letter-spacing: 0.04em;
  }

  .slash {
    position: absolute;
    left: calc(var(--enemy-grid-x) + 0 * var(--tile-size) + 0 * var(--tile-gap) + 6px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) - 4px);
    width: 112px;
    height: 112px;
    border-radius: 50%;
    border: 7px solid transparent;
    border-left-color: rgba(255, 255, 255, 0.96);
    border-top-color: rgba(104, 218, 255, 0.86);
    filter: drop-shadow(0 0 14px rgba(142, 228, 255, 0.82));
    transform: translateZ(142px) rotateZ(38deg) rotateX(-56deg) scale(0.2) rotate(-35deg);
    opacity: 0;
    z-index: 40;
    animation: slashBurst 4.4s infinite;
  }

  .slash-b {
    animation-delay: 0.06s;
    transform: translateZ(144px) rotateZ(38deg) rotateX(-56deg) scale(0.16) rotate(25deg);
    border-left-color: rgba(255, 219, 121, 0.92);
    border-top-color: rgba(255, 255, 255, 0.9);
  }

  .impact {
    position: absolute;
    left: calc(var(--enemy-grid-x) + 0 * var(--tile-size) + 0 * var(--tile-gap) + 28px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) + 30px);
    width: 64px;
    height: 64px;
    background: radial-gradient(circle, #fff 0 12%, #ffe68f 13% 30%, rgba(255, 92, 121, 0.7) 31% 50%, transparent 51%);
    clip-path: polygon(50% 0, 62% 31%, 98% 17%, 71% 48%, 100% 67%, 62% 64%, 54% 100%, 42% 65%, 5% 82%, 31% 51%, 0 34%, 38% 36%);
    transform: translateZ(154px) rotateZ(38deg) rotateX(-56deg) scale(0);
    opacity: 0;
    z-index: 45;
    animation: impactPop 4.4s infinite;
  }

  .impact-two {
    animation-delay: 0.09s;
    filter: hue-rotate(44deg);
  }

  .damage-text,
  .damage-number {
    position: absolute;
    left: calc(var(--enemy-grid-x) + 0 * var(--tile-size) + 0 * var(--tile-gap) + 4px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) - 54px);
    transform: translateZ(180px) rotateZ(38deg) rotateX(-56deg);
    opacity: 0;
    z-index: 50;
    text-align: center;
    text-shadow: 0 5px 18px rgba(0, 0, 0, 0.7);
  }

  .asset-credit {
    position: absolute;
    right: 54px;
    bottom: 10px;
    z-index: 35;
    color: rgba(248, 239, 226, 0.46);
    font-size: 10px;
    letter-spacing: 0.04em;
  }

  .damage-text {
    width: 190px;
    color: #ffe6a3;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    animation: textPop 4.4s infinite;
  }

  .damage-number {
    width: 110px;
    left: calc(var(--enemy-grid-x) + 0 * var(--tile-size) + 0 * var(--tile-gap) + 45px);
    top: calc(1 * var(--tile-size) + 1 * var(--tile-gap) - 92px);
    font-family: "Cinzel", Georgia, serif;
    font-size: 54px;
    font-weight: 900;
    color: #fff;
    animation: damageFloat 4.4s infinite;
  }

  @keyframes attackDash {
    0%, 16% { transform: translate3d(0, 0, 74px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
    25% { transform: translate3d(214px, -35px, 96px) rotateZ(38deg) rotateX(-56deg) scale(1.04); opacity: 1; }
    36%, 43% { transform: translate3d(490px, -92px, 112px) rotateZ(38deg) rotateX(-56deg) scale(1.12); opacity: 1; }
    54% { transform: translate3d(280px, -48px, 96px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
    70%, 100% { transform: translate3d(0, 0, 74px) rotateZ(38deg) rotateX(-56deg); opacity: 1; }
  }

  @keyframes swordSwing {
    0%, 28%, 34%, 100% { transform: rotate(-28deg); }
    38% { transform: rotate(-118deg) translateY(-8px); }
    43% { transform: rotate(68deg) translateY(8px); }
    48% { transform: rotate(-18deg); }
  }

  @keyframes swordArm {
    0%, 28%, 100% { transform: rotate(-20deg); }
    38% { transform: rotate(-98deg); }
    44% { transform: rotate(48deg); }
    50% { transform: rotate(-20deg); }
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
    50% { transform: translateY(-3px); }
  }

  @keyframes runCycle {
    0%, 100% { transform: translateY(0) skewX(-4deg); }
    50% { transform: translateY(-5px) skewX(6deg); }
  }

  @keyframes pathGlow {
    0%, 13%, 68%, 100% { background: linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03)), linear-gradient(135deg, rgba(72, 86, 138, 0.72), rgba(26, 33, 67, 0.9)); }
    20%, 49% { background: linear-gradient(135deg, rgba(139, 221, 255, 0.34), rgba(255, 234, 156, 0.14)), linear-gradient(135deg, rgba(60, 106, 172, 0.9), rgba(40, 38, 96, 0.98)); }
  }

  @keyframes targetPulse {
    0%, 32%, 61%, 100% { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 12px 0 #0b1127, 0 24px 24px rgba(0, 0, 0, 0.28); }
    38%, 48% { box-shadow: inset 0 0 0 2px rgba(255, 231, 150, 0.92), 0 12px 0 #0b1127, 0 0 46px rgba(255, 95, 122, 0.72); }
  }

  @keyframes bridgePulse {
    0%, 14%, 62%, 100% { opacity: 0.18; transform: translateZ(34px) scaleX(0.72); }
    24%, 48% { opacity: 1; transform: translateZ(34px) scaleX(1); }
  }

  @keyframes logPulse {
    0%, 9% { opacity: 0; transform: translateY(5px); }
    18%, 72% { opacity: 1; transform: translateY(0); }
    88%, 100% { opacity: 0.38; transform: translateY(0); }
  }

  @keyframes cinematicFloorPulse {
    0%, 15%, 68%, 100% { opacity: 0.12; transform: scaleX(0.82); }
    24%, 54% { opacity: 0.85; transform: scaleX(1); }
  }

  @keyframes cinematicAttacker {
    0%, 14% { opacity: 1; transform: translateX(-90px) scale(0.92); }
    18%, 25% { opacity: 1; transform: translateX(-20px) scale(1); }
    34%, 45% { opacity: 1; transform: translateX(420px) scale(1.16); }
    55% { opacity: 1; transform: translateX(210px) scale(1.03); }
    66% { opacity: 0.35; transform: translateX(-20px) scale(0.96); }
    75%, 100% { opacity: 0; transform: translateX(-90px) scale(0.92); }
  }

  @keyframes cinematicTarget {
    0%, 18%, 68%, 100% { opacity: 1; transform: translateX(24px) scale(0.96); filter: brightness(1); }
    23%, 36% { opacity: 1; transform: translateX(0) scale(1); filter: brightness(1); }
    42% { opacity: 1; transform: translateX(36px) rotate(5deg) scale(1.02); filter: brightness(1.85); }
    50% { opacity: 1; transform: translateX(-14px) rotate(-3deg) scale(1); filter: brightness(1); }
    61% { opacity: 1; transform: translateX(0) rotate(0) scale(1); }
  }

  @keyframes cinematicSlash {
    0%, 36%, 51%, 100% { opacity: 0; transform: rotate(-30deg) scale(0.16); }
    41% { opacity: 1; transform: rotate(24deg) scale(1.1); }
    47% { opacity: 0; transform: rotate(86deg) scale(1.85); }
  }

  @keyframes cinematicHit {
    0%, 39%, 52%, 100% { opacity: 0; transform: scale(0); }
    43% { opacity: 1; transform: scale(1.35); }
    49% { opacity: 0; transform: scale(2.1); }
  }

  @keyframes cinematicDamage {
    0%, 41%, 60%, 100% { opacity: 0; transform: translateY(18px) scale(0.82); }
    46% { opacity: 1; transform: translateY(-8px) scale(1.18); }
    56% { opacity: 0; transform: translateY(-62px) scale(1); }
  }

  @media (max-width: 900px) {
    :root { --tile-size: 62px; --tile-gap: 7px; --grid-gap: 76px; }
    .hud { left: 24px; right: 24px; }
    .bottom-hud { display: none; }
    .turn-card { display: none; }
    .cinematic-attacker { width: 260px; }
    .cinematic-attacker img { width: 278px; }
  }
`;
