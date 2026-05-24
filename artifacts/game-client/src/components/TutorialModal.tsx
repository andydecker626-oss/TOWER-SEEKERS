interface Props {
  onClose: () => void;
}

export default function TutorialModal({ onClose }: Props) {
  return (
    <div className="tm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{CSS}</style>
      <div className="tm-panel">
        <div className="tm-header">
          <span className="tm-title">Tutorial</span>
          <button className="tm-close" onClick={onClose}>✕</button>
        </div>
        <div className="tm-body">
          <p className="tm-para">
            Tower Seekers is a 2-player online PvP turn-based grid battler. Each player fields
            4 units on a 4×4 grid and takes turns submitting actions — Move, Attack, Skill, Wait,
            or Defend — which all resolve simultaneously in speed order.
          </p>
          <p className="tm-para">
            Build your party in the Units tab, then head to Battle to challenge a rival. Full
            tutorial content coming soon.
          </p>
        </div>
        <div className="tm-footer">
          <button className="tm-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

  .tm-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.72); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 1.5rem;
  }
  .tm-panel {
    background: linear-gradient(160deg, #0e0a22 0%, #080618 100%);
    border: 1px solid rgba(220,220,255,0.22);
    border-radius: 14px;
    width: 100%; max-width: 480px;
    box-shadow: 0 24px 72px rgba(0,0,0,0.85), 0 0 40px rgba(180,180,255,0.05);
    display: flex; flex-direction: column;
  }
  .tm-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.2rem 1.4rem 1rem;
    border-bottom: 1px solid rgba(220,220,255,0.1);
  }
  .tm-title {
    font-family: 'Cinzel', serif; font-size: 1rem; font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase; color: rgba(220,230,255,0.9);
  }
  .tm-close {
    background: none; border: none; cursor: pointer;
    color: rgba(180,190,220,0.4); font-size: 1rem; line-height: 1;
    padding: 2px 6px; border-radius: 5px; transition: color 0.15s;
  }
  .tm-close:hover { color: rgba(220,230,255,0.85); }
  .tm-body { padding: 1.3rem 1.4rem; }
  .tm-para {
    font-family: 'Cinzel', serif; font-size: 0.82rem; line-height: 1.75;
    color: rgba(180,190,220,0.7); margin: 0 0 0.9rem;
  }
  .tm-para:last-child { margin-bottom: 0; }
  .tm-footer {
    padding: 0.9rem 1.4rem;
    border-top: 1px solid rgba(220,220,255,0.08);
    display: flex; justify-content: flex-end;
  }
  .tm-btn {
    font-family: 'Cinzel', serif; font-size: 0.72rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    background: rgba(220,220,255,0.08); border: 1px solid rgba(220,220,255,0.28);
    border-radius: 7px; padding: 0.5rem 1.3rem; cursor: pointer;
    color: rgba(220,230,255,0.8); transition: all 0.15s;
  }
  .tm-btn:hover { background: rgba(220,220,255,0.15); color: #fff; border-color: rgba(220,220,255,0.5); }
`;
