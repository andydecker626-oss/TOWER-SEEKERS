export const VARIANT_A_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700;900&display=swap');

  .va-phone {
    width: 390px;
    height: 844px;
    background: #05030d;
    border-radius: 36px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 0 0 2px rgba(240,192,64,0.15), 0 32px 80px rgba(0,0,0,0.85);
    display: flex;
    flex-direction: column;
    font-family: 'Cinzel', serif;
  }

  .va-season-ribbon {
    position: relative;
    z-index: 10;
    background: linear-gradient(90deg, #5a1010, #7a1a1a, #5a1010);
    color: rgba(255,220,180,0.9);
    font-size: 9px;
    letter-spacing: 0.18em;
    text-align: center;
    padding: 5px 0;
    font-family: 'Cinzel', serif;
    border-bottom: 1px solid rgba(240,100,80,0.3);
    flex-shrink: 0;
  }

  .va-topbar {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgba(5,3,13,0.82);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(240,192,64,0.12);
    flex-shrink: 0;
  }

  .va-player {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .va-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a0d3a, #2a1555);
    border: 1.5px solid rgba(240,192,64,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .va-pname {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 600;
    color: #f0e0b0;
    letter-spacing: 0.06em;
  }

  .va-resources {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .va-res-chip {
    display: flex;
    align-items: center;
    gap: 3px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(240,192,64,0.2);
    border-radius: 12px;
    padding: 3px 8px;
    font-size: 10px;
    color: rgba(220,190,140,0.9);
  }
  .va-res-chip.gold { border-color: rgba(240,192,64,0.4); color: #f0c040; }
  .va-res-chip.gem { border-color: rgba(100,160,255,0.4); color: #80b8ff; }
  .va-res-chip span { font-family: 'Cinzel', serif; font-size: 9px; font-weight: 600; }

  .va-settings-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(240,192,64,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    cursor: pointer;
  }

  .va-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 120% 60% at 50% 55%, rgba(30,15,80,0.4) 0%, transparent 65%),
      linear-gradient(180deg, #05030d 0%, #0d0821 30%, #130a2e 55%, #0a0617 80%, #05030d 100%);
    z-index: 1;
  }

  .va-bg::after {
    content: '';
    position: absolute;
    bottom: 200px;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    height: 220px;
    background:
      linear-gradient(180deg,
        transparent 0%,
        rgba(20,10,50,0.95) 60%,
        rgba(15,8,40,0.98) 100%
      );
    clip-path: polygon(
      0% 100%, 5% 60%, 5% 50%, 8% 50%, 8% 45%, 12% 45%, 12% 50%, 15% 50%,
      15% 35%, 18% 35%, 18% 30%, 22% 30%, 22% 35%, 25% 35%,
      25% 55%, 35% 55%, 35% 20%, 38% 20%, 38% 10%, 42% 10%, 42% 5%, 46% 5%,
      46% 10%, 50% 10%, 50% 5%, 54% 5%, 54% 10%, 58% 10%, 58% 20%, 62% 20%,
      62% 55%, 72% 55%, 72% 35%, 75% 35%, 75% 30%, 78% 30%, 78% 35%,
      82% 35%, 82% 50%, 85% 50%, 85% 45%, 88% 45%, 88% 50%, 92% 50%,
      92% 60%, 95% 60%, 100% 100%
    );
    filter: blur(0.5px);
  }

  .va-vignette {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to bottom, rgba(5,3,13,0.0) 15%, transparent 45%, rgba(5,3,13,0.55) 75%, rgba(5,3,13,0.85) 100%);
    z-index: 2;
    pointer-events: none;
  }

  .va-center {
    position: absolute;
    z-index: 10;
    left: 0; right: 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-top: -40px;
  }

  .va-mode-chips {
    display: flex;
    gap: 10px;
  }

  .va-chip {
    font-family: 'Cinzel', serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    padding: 5px 14px;
    border-radius: 20px;
    background: rgba(10,6,26,0.82);
    border: 1px solid rgba(240,192,64,0.25);
    color: rgba(200,170,110,0.7);
    cursor: pointer;
    backdrop-filter: blur(6px);
  }
  .va-chip.active {
    background: rgba(240,192,64,0.12);
    border-color: rgba(240,192,64,0.65);
    color: #f0c040;
    box-shadow: 0 0 12px rgba(240,192,64,0.2);
  }

  .va-battle-btn {
    font-family: 'Cinzel Decorative', serif;
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 0.18em;
    color: #0a0508;
    background: linear-gradient(135deg, #c88000 0%, #f0c040 45%, #ffd060 60%, #c88000 100%);
    border: none;
    border-radius: 50px;
    padding: 18px 60px;
    cursor: pointer;
    box-shadow:
      0 0 0 3px rgba(240,192,64,0.18),
      0 0 30px rgba(240,192,64,0.45),
      0 8px 24px rgba(0,0,0,0.7);
    text-shadow: 0 1px 2px rgba(255,255,255,0.3);
  }

  .va-chests {
    position: absolute;
    z-index: 10;
    bottom: 72px;
    left: 0; right: 0;
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 10px 16px;
    background: rgba(5,3,13,0.72);
    backdrop-filter: blur(8px);
    border-top: 1px solid rgba(240,192,64,0.1);
    border-bottom: 1px solid rgba(240,192,64,0.1);
  }

  .va-chest-slot {
    width: 72px;
    height: 70px;
    background: rgba(15,10,30,0.85);
    border: 1px solid rgba(240,192,64,0.18);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .va-chest-icon { font-size: 26px; filter: grayscale(0.5) brightness(0.7); }
  .va-chest-label {
    font-family: 'Cinzel', serif;
    font-size: 8px;
    color: rgba(180,150,100,0.5);
    letter-spacing: 0.1em;
  }

  .va-bottomnav {
    position: absolute;
    z-index: 10;
    bottom: 0; left: 0; right: 0;
    height: 72px;
    background: rgba(5,3,13,0.95);
    border-top: 1px solid rgba(240,192,64,0.2);
    display: flex;
    align-items: center;
    backdrop-filter: blur(10px);
  }

  .va-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px 0;
    cursor: pointer;
    opacity: 0.45;
  }
  .va-tab.active { opacity: 1; }

  .va-tab-icon { font-size: 18px; }
  .va-tab-label {
    font-family: 'Cinzel', serif;
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: rgba(200,170,100,0.85);
  }
  .va-tab.active .va-tab-label { color: #f0c040; }
  .va-tab.active .va-tab-icon { filter: drop-shadow(0 0 6px rgba(240,192,64,0.7)); }
`;

const TABS = [
  { icon: "⚔", label: "Battle", active: true },
  { icon: "📜", label: "Army" },
  { icon: "🏆", label: "Ranks" },
  { icon: "🛒", label: "Shop" },
  { icon: "👤", label: "Profile" },
];

export function VariantAPhone() {
  return (
    <div className="va-phone">
      <div className="va-season-ribbon">⚔ Season 1 · The Iron Age ⚔</div>
      <div className="va-topbar">
        <div className="va-player">
          <div className="va-avatar">⚔</div>
          <span className="va-pname">Aldric</span>
        </div>
        <div className="va-resources">
          <div className="va-res-chip">🏆 <span>1,240</span></div>
          <div className="va-res-chip gold">🪙 <span>8,500</span></div>
          <div className="va-res-chip gem">💎 <span>340</span></div>
          <div className="va-settings-btn">⚙</div>
        </div>
      </div>
      <div className="va-bg" />
      <div className="va-vignette" />
      <div className="va-center">
        <div className="va-mode-chips">
          <div className="va-chip active">⚔ Quick PvP</div>
          <div className="va-chip">🤖 vs AI</div>
        </div>
        <button className="va-battle-btn">BATTLE</button>
      </div>
      <div className="va-chests">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="va-chest-slot">
            <div className="va-chest-icon">📦</div>
            <div className="va-chest-label">Locked</div>
          </div>
        ))}
      </div>
      <div className="va-bottomnav">
        {TABS.map(tab => (
          <div key={tab.label} className={`va-tab${tab.active ? " active" : ""}`}>
            <span className="va-tab-icon">{tab.icon}</span>
            <span className="va-tab-label">{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VariantA() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0614", padding: "1rem" }}>
      <style>{VARIANT_A_CSS}</style>
      <VariantAPhone />
    </div>
  );
}
