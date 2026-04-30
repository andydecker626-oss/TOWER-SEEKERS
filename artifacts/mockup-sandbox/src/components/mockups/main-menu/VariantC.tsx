export const VARIANT_C_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700;900&display=swap');

  .vc-phone {
    width: 390px;
    height: 844px;
    background: #04020b;
    border-radius: 36px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 0 0 2px rgba(240,192,64,0.15), 0 32px 80px rgba(0,0,0,0.85);
    font-family: 'Cinzel', serif;
  }

  .vc-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(ellipse 90% 50% at 50% 65%, rgba(35,18,90,0.6) 0%, transparent 60%),
      radial-gradient(ellipse 60% 30% at 50% 80%, rgba(15,8,40,0.9) 0%, transparent 55%),
      linear-gradient(180deg,
        #030210 0%,
        #080520 15%,
        #0e0828 30%,
        #150b35 50%,
        #0d0822 70%,
        #060415 85%,
        #020110 100%
      );
  }

  .vc-bg::after {
    content: '';
    position: absolute;
    bottom: 220px;
    left: 50%;
    transform: translateX(-50%);
    width: 390px;
    height: 280px;
    background: linear-gradient(180deg,
      transparent 0%,
      rgba(18,10,50,0.85) 40%,
      rgba(12,7,35,0.95) 100%
    );
    clip-path: polygon(
      0% 100%,
      0% 70%, 4% 70%, 4% 58%, 7% 58%, 7% 52%, 10% 52%, 10% 45%,
      13% 45%, 13% 52%, 16% 52%, 16% 42%, 19% 42%, 19% 35%,
      22% 35%, 22% 28%, 26% 28%, 26% 22%, 30% 22%, 30% 28%,
      34% 28%, 34% 55%, 38% 55%, 38% 18%, 41% 18%, 41% 10%,
      44% 10%, 44% 4%, 48% 4%, 48% 0%, 50% 0%, 52% 0%, 52% 4%,
      56% 4%, 56% 10%, 59% 10%, 59% 18%, 62% 18%, 62% 55%,
      66% 55%, 66% 28%, 70% 28%, 70% 22%, 74% 22%, 74% 28%,
      78% 28%, 78% 35%, 81% 35%, 81% 42%, 84% 42%, 84% 52%,
      87% 52%, 87% 45%, 90% 45%, 90% 52%, 93% 52%, 93% 58%,
      96% 58%, 96% 70%, 100% 70%,
      100% 100%
    );
  }

  .vc-stars {
    position: absolute;
    inset: 0;
    z-index: 1;
    background-image:
      radial-gradient(1px 1px at 15% 12%, rgba(255,255,255,0.7) 0%, transparent 100%),
      radial-gradient(1px 1px at 75% 8%, rgba(255,255,255,0.6) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 30% 6%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 55% 18%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 88% 22%, rgba(255,255,255,0.55) 0%, transparent 100%),
      radial-gradient(1px 1px at 42% 10%, rgba(240,192,64,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 10% 28%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 65% 5%, rgba(255,255,255,0.45) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 90% 10%, rgba(255,255,255,0.4) 0%, transparent 100%);
    pointer-events: none;
  }

  .vc-vignette {
    position: absolute;
    inset: 0;
    z-index: 2;
    background:
      linear-gradient(to bottom, rgba(3,2,11,0.6) 0%, rgba(3,2,11,0.2) 20%, transparent 50%, rgba(3,2,11,0.2) 70%, rgba(3,2,11,0.55) 100%);
    pointer-events: none;
  }

  .vc-topstrip {
    position: absolute;
    z-index: 20;
    top: 14px;
    left: 14px;
    right: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(5,3,15,0.62);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(240,192,64,0.14);
    border-radius: 30px;
    padding: 8px 14px;
  }

  .vc-ident {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .vc-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a0d3a, #2a1555);
    border: 1.5px solid rgba(240,192,64,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
  }

  .vc-playername {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 600;
    color: #f0e0b0;
    letter-spacing: 0.06em;
  }
  .vc-trophyrow {
    font-family: 'Cinzel', serif;
    font-size: 9px;
    color: rgba(240,192,64,0.7);
    letter-spacing: 0.05em;
    margin-top: 1px;
  }

  .vc-resources {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
  }
  .vc-res {
    font-family: 'Cinzel', serif;
    font-size: 9px;
    color: #f0c040;
    letter-spacing: 0.06em;
  }
  .vc-res.gem { color: #80b8ff; }
  .vc-res span { font-weight: 700; }

  .vc-title-logo {
    position: absolute;
    z-index: 5;
    top: 130px;
    left: 0; right: 0;
    text-align: center;
    font-family: 'Cinzel Decorative', serif;
    font-size: 32px;
    font-weight: 900;
    line-height: 1.0;
    color: rgba(240,220,160,0.12);
    letter-spacing: 0.08em;
    pointer-events: none;
    text-shadow: 0 0 60px rgba(240,192,64,0.08);
    user-select: none;
  }

  .vc-card {
    position: absolute;
    z-index: 20;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin-top: 20px;
    width: 310px;
    background: linear-gradient(
      160deg,
      rgba(28,18,8,0.94) 0%,
      rgba(20,13,5,0.97) 100%
    );
    border: 1px solid rgba(240,192,64,0.28);
    border-radius: 20px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    box-shadow:
      0 0 0 1px rgba(240,192,64,0.08) inset,
      0 20px 60px rgba(0,0,0,0.75),
      0 0 40px rgba(0,0,0,0.5);
  }

  .vc-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(240,192,64,0.012) 2px,
      rgba(240,192,64,0.012) 4px
    );
    pointer-events: none;
  }

  .vc-card-header {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .vc-party-title {
    font-family: 'Cinzel', serif;
    font-size: 10px;
    letter-spacing: 0.2em;
    color: rgba(240,192,64,0.55);
    text-transform: uppercase;
  }

  .vc-unit-previews {
    display: flex;
    gap: 7px;
  }

  .vc-unit-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(10,6,22,0.85);
    border: 1px solid rgba(240,192,64,0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }
  .vc-unit-icon.more {
    font-family: 'Cinzel', serif;
    font-size: 10px;
    font-weight: 600;
    color: rgba(200,170,100,0.5);
    border-style: dashed;
  }

  .vc-card-divider {
    width: 85%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(240,192,64,0.25), transparent);
    flex-shrink: 0;
  }

  .vc-find-btn {
    position: relative;
    font-family: 'Cinzel Decorative', serif;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 0.16em;
    color: #0a0508;
    background: linear-gradient(135deg, #c88000, #f0c040 45%, #ffd060 60%, #c88000);
    border: none;
    border-radius: 40px;
    padding: 14px 44px;
    cursor: pointer;
    overflow: hidden;
    box-shadow:
      0 0 0 2px rgba(240,192,64,0.2),
      0 0 24px rgba(240,192,64,0.5),
      0 6px 20px rgba(0,0,0,0.6);
    width: 100%;
    text-align: center;
  }

  .vc-btn-glow {
    position: absolute;
    top: 0; left: 25%;
    width: 50%;
    height: 40%;
    background: rgba(255,255,255,0.28);
    border-radius: 0 0 50% 50%;
    pointer-events: none;
  }

  .vc-mode-pills {
    display: flex;
    gap: 8px;
  }

  .vc-pill {
    font-family: 'Cinzel', serif;
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.07em;
    padding: 5px 13px;
    border-radius: 20px;
    background: rgba(8,5,18,0.9);
    border: 1px solid rgba(240,192,64,0.2);
    color: rgba(180,150,90,0.6);
    cursor: pointer;
  }
  .vc-pill.active {
    background: rgba(240,192,64,0.1);
    border-color: rgba(240,192,64,0.55);
    color: #f0c040;
    box-shadow: 0 0 10px rgba(240,192,64,0.18);
  }

  .vc-arc {
    position: absolute;
    z-index: 20;
    bottom: 30px;
    left: 0; right: 0;
    height: 90px;
  }

  .vc-arc-btn {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }

  .vc-arc-btn.tl { bottom: 48px; left: 46px; }
  .vc-arc-btn.tr { bottom: 48px; right: 46px; }
  .vc-arc-btn.bl { bottom: 4px; left: 24px; }
  .vc-arc-btn.br { bottom: 4px; right: 24px; }

  .vc-arc-icon {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: rgba(5,3,15,0.82);
    border: 1px solid rgba(240,192,64,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 14px rgba(0,0,0,0.5);
  }

  .vc-arc-lbl {
    font-family: 'Cinzel', serif;
    font-size: 8px;
    color: rgba(200,170,100,0.6);
    letter-spacing: 0.1em;
  }
`;

const UNIT_ICONS = ["🗡", "🏹", "🔮"];
const ARC_BUTTONS = [
  { cls: "tl", icon: "🏰", label: "Hub" },
  { cls: "tr", icon: "🏆", label: "Ranks" },
  { cls: "br", icon: "🛒", label: "Shop" },
  { cls: "bl", icon: "⚙", label: "Settings" },
];

export function VariantCPhone() {
  return (
    <div className="vc-phone">
      <div className="vc-bg" />
      <div className="vc-stars" />
      <div className="vc-vignette" />
      <div className="vc-topstrip">
        <div className="vc-ident">
          <div className="vc-avatar">⚔</div>
          <div>
            <div className="vc-playername">Aldric</div>
            <div className="vc-trophyrow">🏆 1,240</div>
          </div>
        </div>
        <div className="vc-resources">
          <div className="vc-res">🪙 <span>8,500</span></div>
          <div className="vc-res gem">💎 <span>340</span></div>
        </div>
      </div>
      <div className="vc-title-logo">TOWER<br />SEEKERS</div>
      <div className="vc-card">
        <div className="vc-card-header">
          <div className="vc-party-title">Your Party · 6 units</div>
          <div className="vc-unit-previews">
            {UNIT_ICONS.map((u, i) => (
              <div key={i} className="vc-unit-icon">{u}</div>
            ))}
            <div className="vc-unit-icon more">+3</div>
          </div>
        </div>
        <div className="vc-card-divider" />
        <button className="vc-find-btn">
          <span className="vc-btn-glow" />
          FIND MATCH
        </button>
        <div className="vc-mode-pills">
          <div className="vc-pill active">⚔ PvP Ladder</div>
          <div className="vc-pill">🤖 Solo Practice</div>
        </div>
      </div>
      <div className="vc-arc">
        {ARC_BUTTONS.map(btn => (
          <div key={btn.cls} className={`vc-arc-btn ${btn.cls}`}>
            <span className="vc-arc-icon">{btn.icon}</span>
            <span className="vc-arc-lbl">{btn.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VariantC() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0614", padding: "1rem" }}>
      <style>{VARIANT_C_CSS}</style>
      <VariantCPhone />
    </div>
  );
}
