export const VARIANT_B_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700;900&display=swap');

  .vb-phone {
    width: 390px;
    height: 844px;
    background: #07040f;
    border-radius: 36px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 0 0 2px rgba(240,192,64,0.15), 0 32px 80px rgba(0,0,0,0.85);
    display: flex;
    flex-direction: column;
    font-family: 'Cinzel', serif;
  }

  .vb-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 100% 80% at 70% 40%, rgba(20,10,55,0.8) 0%, transparent 70%),
      linear-gradient(160deg, #07040f 0%, #0d0a22 40%, #0b0819 70%, #07040f 100%);
    z-index: 0;
  }

  .vb-bg::before {
    content: '';
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    width: 380px;
    height: 260px;
    opacity: 0.22;
    background:
      linear-gradient(180deg,
        transparent 0%,
        rgba(25,12,65,1) 50%,
        rgba(18,9,50,1) 100%
      );
    clip-path: polygon(
      0% 100%, 3% 55%, 8% 55%, 8% 45%, 12% 45%, 12% 55%, 17% 55%,
      17% 30%, 20% 30%, 20% 22%, 25% 22%, 25% 30%, 30% 30%,
      30% 52%, 38% 52%, 38% 15%, 42% 15%, 42% 8%, 46% 8%, 46% 3%,
      50% 3%, 54% 3%, 54% 8%, 58% 8%, 58% 15%, 62% 15%, 62% 52%,
      70% 52%, 70% 30%, 75% 30%, 75% 22%, 80% 22%, 80% 30%,
      83% 30%, 83% 55%, 88% 55%, 88% 45%, 92% 45%, 92% 55%, 97% 55%,
      100% 100%
    );
  }

  .vb-overlay {
    position: absolute;
    inset: 0;
    background: rgba(5,3,12,0.72);
    z-index: 1;
    pointer-events: none;
  }

  .vb-topbar {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px 12px;
    flex-shrink: 0;
  }

  .vb-logo {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: rgba(240,192,64,0.75);
  }

  .vb-settings {
    font-size: 16px;
    color: rgba(200,170,100,0.6);
    cursor: pointer;
  }

  .vb-body {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    gap: 0;
    padding: 8px 12px 8px;
    overflow: hidden;
  }

  .vb-left {
    width: 35%;
    background: linear-gradient(180deg, rgba(20,12,45,0.92) 0%, rgba(12,8,28,0.95) 100%);
    border: 1px solid rgba(240,192,64,0.18);
    border-radius: 16px;
    padding: 16px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    margin-right: 10px;
  }

  .vb-left::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, rgba(240,192,64,0.6), transparent);
    border-radius: 16px 16px 0 0;
  }

  .vb-portrait-ring {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 2px solid rgba(240,192,64,0.55);
    padding: 3px;
    background: linear-gradient(135deg, rgba(240,192,64,0.12), transparent);
    box-shadow: 0 0 16px rgba(240,192,64,0.2);
    margin-bottom: 4px;
  }

  .vb-portrait {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a0d3a, #2a1555);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }

  .vb-player-name {
    font-family: 'Cinzel Decorative', serif;
    font-size: 13px;
    font-weight: 700;
    color: #f0e0a0;
    letter-spacing: 0.06em;
    margin-top: 2px;
  }

  .vb-rank-badge {
    font-size: 9px;
    font-family: 'Cinzel', serif;
    color: rgba(200,170,100,0.7);
    background: rgba(240,192,64,0.1);
    border: 1px solid rgba(240,192,64,0.2);
    border-radius: 8px;
    padding: 2px 7px;
    letter-spacing: 0.06em;
  }

  .vb-trophy-row {
    font-family: 'Cinzel', serif;
    font-size: 10px;
    color: #f0c040;
    letter-spacing: 0.06em;
    margin-top: 2px;
  }
  .vb-trophy-row span { font-weight: 700; }

  .vb-divider {
    width: 70%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(240,192,64,0.2), transparent);
    margin: 6px 0;
    flex-shrink: 0;
  }

  .vb-party-label {
    font-size: 8px;
    letter-spacing: 0.16em;
    color: rgba(240,192,64,0.5);
    text-transform: uppercase;
  }

  .vb-party-strip {
    display: flex;
    gap: 5px;
    margin-top: 3px;
  }

  .vb-unit-sil {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba(15,10,35,0.9);
    border: 1px solid rgba(240,192,64,0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
  }

  .vb-party-more {
    font-size: 8px;
    color: rgba(180,150,100,0.5);
    font-family: 'Cinzel', serif;
    letter-spacing: 0.08em;
  }

  .vb-stat-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
  }
  .vb-stat-label {
    font-size: 8px;
    letter-spacing: 0.08em;
    color: rgba(180,150,100,0.55);
  }
  .vb-stat-val {
    font-size: 10px;
    font-weight: 600;
    color: rgba(240,192,64,0.8);
  }

  .vb-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .vb-mode-card {
    border-radius: 14px;
    padding: 14px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    flex: 1;
    position: relative;
    overflow: hidden;
    border: 1px solid transparent;
  }

  .vb-mode-card.blue {
    background: linear-gradient(135deg, rgba(20,40,100,0.85), rgba(10,25,70,0.92));
    border-color: rgba(80,120,255,0.25);
  }
  .vb-mode-card.green {
    background: linear-gradient(135deg, rgba(15,55,30,0.85), rgba(8,35,18,0.92));
    border-color: rgba(60,160,80,0.25);
  }
  .vb-mode-card.amber {
    background: linear-gradient(135deg, rgba(70,40,10,0.85), rgba(50,28,5,0.92));
    border-color: rgba(200,130,40,0.3);
  }

  .vb-mode-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: 14px 14px 0 0;
  }
  .vb-mode-card.blue::before { background: linear-gradient(90deg, transparent, rgba(80,120,255,0.5), transparent); }
  .vb-mode-card.green::before { background: linear-gradient(90deg, transparent, rgba(60,200,90,0.4), transparent); }
  .vb-mode-card.amber::before { background: linear-gradient(90deg, transparent, rgba(240,150,50,0.45), transparent); }

  .vb-mode-icon {
    font-size: 24px;
    width: 36px;
    text-align: center;
    flex-shrink: 0;
  }

  .vb-mode-content { flex: 1; }
  .vb-mode-title {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 700;
    color: #f0e8d0;
    letter-spacing: 0.05em;
    margin-bottom: 3px;
  }
  .vb-mode-sub {
    font-family: 'Cinzel', serif;
    font-size: 8.5px;
    color: rgba(200,180,140,0.55);
    letter-spacing: 0.05em;
  }

  .vb-mode-arrow {
    font-size: 22px;
    color: rgba(240,192,64,0.4);
    font-family: sans-serif;
    font-weight: 300;
  }

  .vb-season-card {
    background: linear-gradient(135deg, rgba(70,15,15,0.7), rgba(40,8,8,0.85));
    border: 1px solid rgba(200,60,40,0.25);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .vb-season-icon { font-size: 18px; }
  .vb-season-title {
    font-size: 9px;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    color: rgba(255,180,150,0.85);
    letter-spacing: 0.08em;
  }
  .vb-season-sub {
    font-size: 8px;
    font-family: 'Cinzel', serif;
    color: rgba(200,140,120,0.55);
    letter-spacing: 0.06em;
  }

  .vb-bottom {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: rgba(5,3,12,0.92);
    border-top: 1px solid rgba(240,192,64,0.12);
    padding: 10px 16px;
    flex-shrink: 0;
  }

  .vb-bottom-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    cursor: pointer;
    opacity: 0.55;
  }
  .vb-bottom-icon { font-size: 18px; }
  .vb-bottom-lbl {
    font-family: 'Cinzel', serif;
    font-size: 8px;
    color: rgba(200,170,100,0.7);
    letter-spacing: 0.1em;
  }
`;

const MODE_CARDS = [
  { cls: "blue", icon: "⚔", title: "Quick PvP", sub: "Matched opponent · Ranked" },
  { cls: "green", icon: "🤖", title: "Practice vs AI", sub: "No stakes · Adjustable difficulty" },
  { cls: "amber", icon: "🔗", title: "Custom Duel", sub: "Invite a friend · Private room" },
];

const BOTTOM_TABS = [
  { icon: "🏰", label: "Hub" },
  { icon: "🏆", label: "Ranks" },
  { icon: "✉", label: "Messages" },
  { icon: "🛒", label: "Shop" },
];

export function VariantBPhone() {
  return (
    <div className="vb-phone">
      <div className="vb-bg" />
      <div className="vb-overlay" />
      <div className="vb-topbar">
        <div className="vb-logo">⚔ TOWER SEEKERS</div>
        <div className="vb-settings">⚙</div>
      </div>
      <div className="vb-body">
        <div className="vb-left">
          <div className="vb-portrait-ring">
            <div className="vb-portrait">⚔</div>
          </div>
          <div className="vb-player-name">Aldric</div>
          <div className="vb-rank-badge">🏅 Silver II</div>
          <div className="vb-trophy-row">🏆 <span>1,240</span></div>
          <div className="vb-divider" />
          <div className="vb-party-label">Your Party</div>
          <div className="vb-party-strip">
            {["🗡", "🏹", "🔮"].map((icon, i) => (
              <div key={i} className="vb-unit-sil">{icon}</div>
            ))}
          </div>
          <div className="vb-party-more">+3 more</div>
          <div className="vb-divider" />
          <div className="vb-stat-row">
            <span className="vb-stat-label">Wins</span>
            <span className="vb-stat-val">84</span>
          </div>
          <div className="vb-stat-row">
            <span className="vb-stat-label">Win Rate</span>
            <span className="vb-stat-val">61%</span>
          </div>
        </div>
        <div className="vb-right">
          {MODE_CARDS.map(card => (
            <div key={card.title} className={`vb-mode-card ${card.cls}`}>
              <div className="vb-mode-icon">{card.icon}</div>
              <div className="vb-mode-content">
                <div className="vb-mode-title">{card.title}</div>
                <div className="vb-mode-sub">{card.sub}</div>
              </div>
              <div className="vb-mode-arrow">›</div>
            </div>
          ))}
          <div className="vb-season-card">
            <div className="vb-season-icon">🔥</div>
            <div>
              <div className="vb-season-title">Season 1 · The Iron Age</div>
              <div className="vb-season-sub">18 days remaining</div>
            </div>
          </div>
        </div>
      </div>
      <div className="vb-bottom">
        {BOTTOM_TABS.map(item => (
          <div key={item.label} className="vb-bottom-btn">
            <span className="vb-bottom-icon">{item.icon}</span>
            <span className="vb-bottom-lbl">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VariantB() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0614", padding: "1rem" }}>
      <style>{VARIANT_B_CSS}</style>
      <VariantBPhone />
    </div>
  );
}
