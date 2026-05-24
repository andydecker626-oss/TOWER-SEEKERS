import MenuShell from "@/components/MenuShell";

const DISTRICTS = [
  { name: "The Forge",      icon: "⚒",  desc: "Craft and upgrade gear" },
  { name: "The Barracks",   icon: "🛡",  desc: "Train and level units"  },
  { name: "The Arcane Hall", icon: "🔮", desc: "Research new spells"    },
  { name: "The Market",     icon: "🛒",  desc: "Trade with merchants"   },
];

export default function TownPage() {
  return (
    <MenuShell active="town">
      <style>{CSS}</style>
      <div className="tn-body">
        <div className="tn-head">
          <h2 className="tn-title">The Town</h2>
          <p className="tn-sub">Develop your stronghold between battles. Districts unlock as you ascend.</p>
        </div>
        <div className="tn-grid">
          {DISTRICTS.map((d) => (
            <div key={d.name} className="tn-card">
              <div className="tn-icon">{d.icon}</div>
              <div className="tn-lock">🔒</div>
              <div className="tn-card-name">{d.name}</div>
              <div className="tn-card-desc">{d.desc}</div>
              <div className="tn-soon">Coming Soon</div>
            </div>
          ))}
        </div>
      </div>
    </MenuShell>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

  .tn-body {
    max-width: 940px; width: 100%; margin: 0 auto;
    padding: clamp(24px,4vh,48px) clamp(16px,4vw,32px);
    display: flex; flex-direction: column; align-items: center; gap: 2rem;
  }
  .tn-head { text-align: center; }
  .tn-title {
    font-family: 'Cinzel', serif; font-size: clamp(18px,2.5vw,28px); font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(220,230,255,0.9);
    text-shadow: 0 2px 20px rgba(0,0,0,0.9); margin: 0 0 0.5rem;
  }
  .tn-sub {
    font-family: 'Cinzel', serif; font-size: clamp(10px,1vw,13px);
    color: rgba(180,190,220,0.5); letter-spacing: 0.08em; margin: 0;
  }
  .tn-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(180px, 220px));
    gap: clamp(12px,2vw,20px);
  }
  .tn-card {
    width: 200px; min-height: 200px;
    background: rgba(8,6,22,0.82);
    border: 1px solid rgba(220,220,255,0.14);
    border-radius: 12px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 0.4rem; padding: 1.4rem 1rem;
    cursor: default; opacity: 0.72;
  }
  .tn-icon { font-size: 1.6rem; opacity: 0.35; }
  .tn-lock { font-size: 1.1rem; opacity: 0.4; margin-top: -0.2rem; }
  .tn-card-name {
    font-family: 'Cinzel', serif; font-size: clamp(11px,1.1vw,14px); font-weight: 700;
    color: rgba(200,210,240,0.75); text-align: center; letter-spacing: 0.06em;
  }
  .tn-card-desc {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.78vw,11px);
    color: rgba(160,175,210,0.4); text-align: center;
  }
  .tn-soon {
    font-family: 'Cinzel', serif; font-size: 0.6rem; letter-spacing: 0.2em;
    text-transform: uppercase; color: rgba(180,190,220,0.3);
    border: 1px solid rgba(180,190,220,0.15); border-radius: 4px;
    padding: 3px 8px; margin-top: 0.3rem;
  }
`;
