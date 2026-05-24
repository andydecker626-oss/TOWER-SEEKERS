import MenuShell from "@/components/MenuShell";

const ROWS: { label: string; cards: { name: string; icon: string }[] }[] = [
  {
    label: "Currency Bundles",
    cards: [
      { name: "Starter Pack",  icon: "💎" },
      { name: "Seeker's Cache", icon: "💎" },
      { name: "Warlord's Hoard", icon: "💎" },
    ],
  },
  {
    label: "Cosmetic Bundles",
    cards: [
      { name: "Iron Age Set",   icon: "🛡" },
      { name: "Ember Knight",   icon: "🔥" },
      { name: "Void Walker",    icon: "✨" },
    ],
  },
  {
    label: "Aesthetic Rewards",
    cards: [
      { name: "Tower Banner",   icon: "🏳" },
      { name: "Arena Theme",    icon: "🗺" },
      { name: "Unit Frame",     icon: "🖼" },
    ],
  },
];

export default function ShopPage() {
  return (
    <MenuShell active="shop">
      <style>{CSS}</style>
      <div className="sp-body">
        <div className="sp-head">
          <h2 className="sp-title">Treasury</h2>
          <p className="sp-sub">Cosmetics and currencies. Progression items never sold — earn them in battle.</p>
        </div>
        {ROWS.map((row) => (
          <div key={row.label} className="sp-row-block">
            <div className="sp-row-label">{row.label}</div>
            <div className="sp-row-cards">
              {row.cards.map((c) => (
                <div key={c.name} className="sp-card">
                  <div className="sp-card-icon">{c.icon}</div>
                  <div className="sp-lock">🔒</div>
                  <div className="sp-card-name">{c.name}</div>
                  <div className="sp-soon">Coming Soon</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </MenuShell>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

  .sp-body {
    max-width: 860px; width: 100%; margin: 0 auto;
    padding: clamp(24px,4vh,48px) clamp(16px,4vw,32px);
    display: flex; flex-direction: column; gap: 2rem;
  }
  .sp-head { text-align: center; }
  .sp-title {
    font-family: 'Cinzel', serif; font-size: clamp(18px,2.5vw,28px); font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(220,230,255,0.9);
    text-shadow: 0 2px 20px rgba(0,0,0,0.9); margin: 0 0 0.5rem;
  }
  .sp-sub {
    font-family: 'Cinzel', serif; font-size: clamp(10px,1vw,13px);
    color: rgba(180,190,220,0.5); letter-spacing: 0.08em; margin: 0;
  }
  .sp-row-block { display: flex; flex-direction: column; gap: 0.75rem; }
  .sp-row-label {
    font-family: 'Cinzel', serif; font-size: clamp(10px,0.9vw,12px);
    letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(180,190,220,0.5);
    border-bottom: 1px solid rgba(220,220,255,0.08); padding-bottom: 0.5rem;
  }
  .sp-row-cards {
    display: flex; gap: clamp(10px,1.5vw,16px); flex-wrap: wrap;
  }
  .sp-card {
    width: 160px; min-height: 200px;
    background: rgba(8,6,22,0.82);
    border: 1px solid rgba(220,220,255,0.14);
    border-radius: 12px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 0.4rem; padding: 1.2rem 0.8rem;
    cursor: default; opacity: 0.68;
  }
  .sp-card-icon { font-size: 1.6rem; opacity: 0.35; }
  .sp-lock { font-size: 1rem; opacity: 0.4; }
  .sp-card-name {
    font-family: 'Cinzel', serif; font-size: clamp(10px,0.95vw,12px); font-weight: 600;
    color: rgba(200,210,240,0.7); text-align: center; letter-spacing: 0.05em;
  }
  .sp-soon {
    font-family: 'Cinzel', serif; font-size: 0.58rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: rgba(180,190,220,0.28);
    border: 1px solid rgba(180,190,220,0.14); border-radius: 4px;
    padding: 2px 7px; margin-top: 0.25rem;
  }
`;
