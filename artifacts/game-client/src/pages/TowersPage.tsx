import MenuShell from "@/components/MenuShell";

const TOWERS = [
  { name: "The Iron Spire",    sub: "Tier I — Level 1–10"   },
  { name: "The Ember Citadel", sub: "Tier II — Level 11–25"  },
  { name: "The Void Obelisk",  sub: "Tier III — Level 26–40" },
  { name: "The Sky Throne",    sub: "Tier IV — Level 41–60"  },
];

export default function TowersPage() {
  return (
    <MenuShell active="towers" bgSrc="/assets/towers-bg.png">
      <style>{CSS}</style>
      <div className="tp-body">
        <div className="tp-head">
          <h2 className="tp-title">Choose Your Ascent</h2>
          <p className="tp-sub">Conquer each tower tier to unlock the next. Full progression coming soon.</p>
        </div>
        <div className="tp-grid">
          {TOWERS.map((t) => (
            <div key={t.name} className="tp-card">
              <div className="tp-lock">🔒</div>
              <div className="tp-card-name">{t.name}</div>
              <div className="tp-card-sub">{t.sub}</div>
              <div className="tp-soon">Coming Soon</div>
            </div>
          ))}
        </div>
      </div>
    </MenuShell>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

  .tp-body {
    max-width: 860px; width: 100%; margin: 0 auto;
    padding: clamp(24px,4vh,48px) clamp(16px,4vw,32px);
    display: flex; flex-direction: column; align-items: center; gap: 2rem;
  }
  .tp-head { text-align: center; }
  .tp-title {
    font-family: 'Cinzel', serif; font-size: clamp(18px,2.5vw,28px); font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(220,230,255,0.9);
    text-shadow: 0 2px 20px rgba(0,0,0,0.9);
    margin: 0 0 0.5rem;
  }
  .tp-sub {
    font-family: 'Cinzel', serif; font-size: clamp(10px,1vw,13px);
    color: rgba(180,190,220,0.5); letter-spacing: 0.08em;
    margin: 0;
  }
  .tp-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(180px, 220px));
    gap: clamp(12px,2vw,20px);
  }
  .tp-card {
    width: 200px; min-height: 260px;
    background: rgba(8,6,22,0.82);
    border: 1px solid rgba(220,220,255,0.14);
    border-radius: 12px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 0.55rem; padding: 1.5rem 1rem;
    cursor: default; opacity: 0.72;
    position: relative; overflow: hidden;
  }
  .tp-lock { font-size: 1.8rem; opacity: 0.45; }
  .tp-card-name {
    font-family: 'Cinzel', serif; font-size: clamp(11px,1.1vw,14px); font-weight: 700;
    color: rgba(200,210,240,0.75); text-align: center; letter-spacing: 0.06em;
  }
  .tp-card-sub {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.78vw,11px);
    color: rgba(160,175,210,0.4); text-align: center;
  }
  .tp-soon {
    font-family: 'Cinzel', serif; font-size: 0.6rem; letter-spacing: 0.2em;
    text-transform: uppercase; color: rgba(180,190,220,0.3);
    border: 1px solid rgba(180,190,220,0.15); border-radius: 4px;
    padding: 3px 8px; margin-top: 0.3rem;
  }
`;
