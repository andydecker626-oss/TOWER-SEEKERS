import { useRef } from "react";
import BattleRenderer from "@/components/BattleRenderer";

const STEP = 78;
const ENEMY_OFFSET = 4 * STEP + 36;
const BOARD_H = 4 * STEP;
const BW = ENEMY_OFFSET + 4 * STEP;   // 660

export default function ArenaDemo() {
  const stageRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#080412", overflow: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');
        .arena-demo-label {
          font-family: 'Cinzel', serif;
          color: rgba(240,210,140,0.8);
          font-size: 12px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-shadow: 0 0 14px rgba(240,170,50,0.55);
          margin: 0;
        }
        /* BattleRenderer queries these exact class names for projection math */
        .b-field-wrap {
          position: relative;
          z-index: 2;
          perspective: 900px;
          perspective-origin: 50% 42%;
        }
        .b-battlefield {
          position: relative;
          transform: rotateX(30deg);
          transform-style: preserve-3d;
          width: ${BW}px;
          height: ${BOARD_H}px;
        }
        .demo-stage {
          position: relative;
          width: 100vw;
          height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .demo-back {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(200,175,110,0.55);
          background: none;
          border: 1px solid rgba(200,170,80,0.2);
          border-radius: 4px;
          padding: 6px 18px;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
        }
        .demo-back:hover {
          color: rgba(240,215,145,0.9);
          border-color: rgba(240,195,70,0.45);
        }
      `}</style>

      <p className="arena-demo-label">Castle Arena — Animated Preview</p>

      {/* stageRef is the PixiJS canvas parent — must contain both the canvas and the DOM elements */}
      <div className="demo-stage" ref={stageRef}>
        <BattleRenderer
          battleBg="/assets/bg-castle.png"
          myUnits={[]}
          enemyUnits={[]}
          mySide="A"
          flashUnits={{}}
          stageRef={stageRef}
        />
        {/* These class names are queried by BattleRenderer's ticker for perspective projection */}
        <div className="b-field-wrap">
          <div className="b-battlefield" />
        </div>
      </div>

      <button className="demo-back" onClick={() => window.history.back()}>← Back</button>
    </div>
  );
}
