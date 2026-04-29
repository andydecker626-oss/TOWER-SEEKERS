import BattleRenderer from "@/components/BattleRenderer";

export default function ArenaDemo() {
  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#070311", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');
        .ad-label {
          font-family: 'Cinzel', serif;
          color: rgba(240,210,140,0.75);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-shadow: 0 0 12px rgba(240,170,50,0.5);
          margin: 0;
          padding: 10px 0 4px;
          text-align: center;
          flex-shrink: 0;
        }
        .ad-back {
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
          align-self: center;
          flex-shrink: 0;
          margin: 8px 0 12px;
        }
        .ad-back:hover {
          color: rgba(240,215,145,0.9);
          border-color: rgba(240,195,70,0.45);
        }
      `}</style>

      <p className="ad-label">Castle Arena — 3D Preview</p>

      <div style={{ flex: 1, position: "relative" }}>
        <BattleRenderer
          myUnits={[]}
          enemyUnits={[]}
          mySide="A"
          selectedId={null}
          highlights={[]}
          selectMode="none"
          queued={{}}
          flashUnits={{}}
          onUnitClick={() => {}}
          onTileClick={() => {}}
        />
      </div>

      <button className="ad-back" onClick={() => window.history.back()}>← Back</button>
    </div>
  );
}
