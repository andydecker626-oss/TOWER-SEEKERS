import { useSocket } from "@/context/SocketContext";
import { getUnitDef } from "@/lib/units";

export default function GameOver() {
  const { state, requestRematch, reset } = useSocket();

  const didWin = state.winner === state.mySide;
  const myAlive = state.myUnits.filter((u) => u.alive);
  const enemyAlive = state.enemyUnits.filter((u) => u.alive);

  const STEP = 48;
  const TILE = 44;

  return (
    <div className="go-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700;900&display=swap');
        ${spriteCSS()}

        .go-root {
          min-height: 100vh;
          background: #06040e;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 1.5rem 1rem;
        }

        .go-bg {
          position: absolute; inset: 0; pointer-events: none;
          background: ${didWin
            ? "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(200,150,0,0.2) 0%, transparent 65%)"
            : "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(120,20,20,0.25) 0%, transparent 65%)"};
        }

        .go-content {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          align-items: center; gap: 1.5rem;
          max-width: 640px; width: 100%;
          text-align: center;
        }

        .go-crest {
          font-size: 4rem;
          filter: ${didWin ? "drop-shadow(0 0 30px rgba(240,192,64,0.6))" : "drop-shadow(0 0 20px rgba(200,40,40,0.4))"};
          animation: crestBob 2s ease-in-out infinite;
        }
        @keyframes crestBob {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.04); }
        }

        .go-result {
          font-family: 'Cinzel Decorative', serif;
          font-size: ${didWin ? "2.8rem" : "2.2rem"};
          font-weight: 900;
          color: ${didWin ? "#f0c040" : "#e06060"};
          text-shadow: ${didWin
            ? "0 0 30px rgba(240,192,64,0.7), 0 0 60px rgba(200,140,0,0.4), 2px 3px 0 rgba(0,0,0,0.8)"
            : "0 0 20px rgba(200,40,40,0.5), 2px 3px 0 rgba(0,0,0,0.8)"};
          margin: 0; line-height: 1.1;
        }

        .go-subtitle {
          font-family: 'Cinzel', serif;
          font-size: 0.82rem;
          color: ${didWin ? "rgba(240,192,64,0.6)" : "rgba(200,100,100,0.6)"};
          letter-spacing: 0.3em; text-transform: uppercase;
          margin-top: -0.8rem;
        }

        .go-divider {
          width: 80%; height: 1px;
          background: linear-gradient(to right, transparent, ${didWin ? "rgba(240,192,64,0.4)" : "rgba(200,60,60,0.3)"}, transparent);
        }

        .go-stats {
          display: flex; gap: 1.5rem;
          font-family: 'Cinzel', serif;
        }
        .go-stat { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
        .go-stat-val { font-size: 1.3rem; font-weight: 700; color: #f0e0a0; }
        .go-stat-lbl { font-size: 0.62rem; color: rgba(200,170,100,0.5); letter-spacing: 0.15em; text-transform: uppercase; }

        /* Mini battlefield */
        .go-battlefield-wrap {
          position: relative; z-index: 1;
          width: 100%;
        }
        .go-bf-label {
          font-family: 'Cinzel', serif; font-size: 0.68rem;
          color: rgba(200,170,100,0.45); letter-spacing: 0.2em;
          text-transform: uppercase; text-align: center;
          margin-bottom: 0.5rem;
        }
        .go-battlefield {
          display: flex; justify-content: center; align-items: center; gap: 1rem;
        }
        .go-grid {
          display: grid;
          gap: 3px;
        }
        .go-tile {
          border-radius: 3px;
          display: flex; align-items: center; justify-content: center;
        }
        .go-tile.ally-tile {
          background: rgba(20,15,45,0.6);
          border: 1px solid rgba(80,120,200,0.2);
        }
        .go-tile.enemy-tile {
          background: rgba(40,10,20,0.6);
          border: 1px solid rgba(200,60,60,0.15);
        }
        .go-tile.has-unit {
          border-color: rgba(240,192,64,0.3);
        }
        .go-tile.has-enemy {
          border-color: rgba(200,80,80,0.4);
        }
        .go-bf-divider {
          width: 1px; align-self: stretch;
          background: linear-gradient(to bottom, transparent, rgba(240,192,64,0.3), transparent);
        }

        .go-btn-row { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: 320px; }

        .btn-rematch {
          font-family: 'Cinzel', serif; font-size: 1rem;
          font-weight: 700; letter-spacing: 0.08em;
          background: linear-gradient(135deg, #c89000, #f0c040, #c89000);
          color: #0a0810; border: none; border-radius: 8px;
          padding: 0.9rem 2rem; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(240,192,64,0.3);
        }
        .btn-rematch:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(240,192,64,0.45); }

        .btn-lobby {
          font-family: 'Cinzel', serif; font-size: 0.9rem;
          font-weight: 600; letter-spacing: 0.08em;
          background: transparent; color: rgba(200,170,100,0.7);
          border: 1px solid rgba(240,192,64,0.25); border-radius: 8px;
          padding: 0.75rem 2rem; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-lobby:hover { background: rgba(240,192,64,0.07); border-color: rgba(240,192,64,0.45); color: #f0c040; }
      `}</style>

      <div className="go-bg" />

      <div className="go-content">
        <div className="go-crest">{didWin ? "🏆" : "💀"}</div>

        <div>
          <h1 className="go-result">{didWin ? "Victory!" : "Defeat"}</h1>
          <div className="go-subtitle">{didWin ? "The realm bows to you" : "Darkness claims another"}</div>
        </div>

        <div className="go-divider" />

        <div className="go-stats">
          <div className="go-stat">
            <div className="go-stat-val">{myAlive.length}</div>
            <div className="go-stat-lbl">Survivors</div>
          </div>
          <div className="go-stat">
            <div className="go-stat-val">{state.turnNumber}</div>
            <div className="go-stat-lbl">Turns</div>
          </div>
          <div className="go-stat">
            <div className="go-stat-val">{state.enemyUnits.filter((u) => !u.alive).length}</div>
            <div className="go-stat-lbl">Foes Slain</div>
          </div>
        </div>

        {/* Final battlefield */}
        <div className="go-battlefield-wrap">
          <div className="go-bf-label">Final Battlefield</div>
          <div className="go-battlefield">
            {/* My grid */}
            <div
              className="go-grid"
              style={{ gridTemplateColumns: `repeat(4, ${TILE}px)`, gridTemplateRows: `repeat(4, ${TILE}px)` }}
            >
              {Array.from({ length: 4 }).map((_, r) =>
                Array.from({ length: 4 }).map((_, c) => {
                  const unit = state.myUnits.find((u) => u.x === c && u.y === r && u.alive);
                  const def = unit ? getUnitDef(unit.defId) : null;
                  return (
                    <div key={`my-${r}-${c}`} className={`go-tile ally-tile${unit ? " has-unit" : ""}`} style={{ width: TILE, height: TILE }}>
                      {def && (
                        <img
                          className="sprite sprite-ally"
                          src={`/assets/units/${def.id}-sprite.png`}
                          alt={def.name ?? def.id}
                          style={{ transform: "scale(0.55)", transformOrigin: "center" }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="go-bf-divider" />

            {/* Enemy grid */}
            <div
              className="go-grid"
              style={{ gridTemplateColumns: `repeat(4, ${TILE}px)`, gridTemplateRows: `repeat(4, ${TILE}px)` }}
            >
              {Array.from({ length: 4 }).map((_, r) =>
                Array.from({ length: 4 }).map((_, c) => {
                  const unit = state.enemyUnits.find((u) => u.x === c && u.y === r && u.alive);
                  const def = unit ? getUnitDef(unit.defId) : null;
                  return (
                    <div key={`en-${r}-${c}`} className={`go-tile enemy-tile${unit ? " has-enemy" : ""}`} style={{ width: TILE, height: TILE }}>
                      {def && (
                        <img
                          className="sprite sprite-enemy"
                          src={`/assets/units/${def.id}-sprite.png`}
                          alt={def.name ?? def.id}
                          style={{ transform: "scale(0.55)", transformOrigin: "center" }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="go-btn-row">
          <button className="btn-rematch" onClick={requestRematch}>
            Rematch
          </button>
          <button className="btn-lobby" onClick={reset}>
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}

function spriteCSS() {
  return `
    .sprite {
      image-rendering: pixelated;
      object-fit: contain;
      object-position: center bottom;
      width: 48px;
      height: 64px;
      flex-shrink: 0;
      display: block;
    }
    .sprite-ally { filter: none; }
    .sprite-enemy { filter: hue-rotate(180deg) saturate(1.3); }
  `;
}
