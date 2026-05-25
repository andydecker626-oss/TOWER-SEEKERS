import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import { useSocket } from "@/context/SocketContext";

const PHASE_ROUTES: Record<string, string> = {
  preselection: "/preselect",
  battleselect:  "/battleselect",
  placement:     "/place",
  battle:        "/battle",
  gameover:      "/gameover",
  waiting:       "/lobby",
};

export default function WarRoom() {
  const navigate = useNavigate();
  const { isLoaded, user } = useUser();
  const { state, reset } = useSocket();

  const hasActiveGame = state.phase !== "lobby";

  useEffect(() => {
    if (!isLoaded || !user) return;
    const username =
      user.username ||
      user.firstName ||
      user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      "Adventurer";
    const avatarUrl = user.imageUrl || "";
    fetch(
      `/api/player/me?username=${encodeURIComponent(username)}&avatarUrl=${encodeURIComponent(avatarUrl)}`,
      { credentials: "include" }
    ).catch(() => {});
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div style={{
        height: "100%", display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "rgba(180,195,230,0.55)", fontFamily: "'Cinzel', serif",
        fontSize: "1rem", letterSpacing: "0.12em",
      }}>
        Loading…
      </div>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="wr-body">

        {hasActiveGame && (
          <div className="wr-banner">
            <div className="wr-banner-left">
              <span className="wr-banner-dot" />
              <div>
                <div className="wr-banner-title">Game in progress</div>
                <div className="wr-banner-sub">You have an unfinished battle</div>
              </div>
            </div>
            <div className="wr-banner-btns">
              <button
                className="wr-banner-btn wr-banner-resume"
                onClick={() => navigate(PHASE_ROUTES[state.phase] ?? "/lobby")}
              >Resume</button>
              <button
                className="wr-banner-btn wr-banner-abandon"
                onClick={reset}
              >Abandon</button>
            </div>
          </div>
        )}

        <button className="wr-battle-btn" onClick={() => navigate("/lobby")}>
          <span className="wr-battle-label">BATTLE</span>
          <span className="wr-battle-sub">Find a Match</span>
        </button>

        <div className="wr-chips">
          <div className="wr-chip wr-chip-ranked">⚔ Ranked</div>
          <div className="wr-chip wr-chip-casual">🌀 Casual</div>
        </div>

      </div>
    </>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap');

  @keyframes bannerIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.6; transform:scale(0.82); }
  }
  @keyframes battleGlow {
    0%,100% { box-shadow: 0 4px 24px rgba(100,130,220,0.18), inset 0 1px 0 rgba(200,220,255,0.07); }
    50%      { box-shadow: 0 8px 36px rgba(100,130,220,0.32), inset 0 1px 0 rgba(200,220,255,0.11); }
  }

  .wr-body {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: clamp(16px,2.4vh,28px);
    width: 100%; height: 100%;
    min-height: 100%;
    padding: clamp(20px,4vh,48px) clamp(16px,4vw,40px);
    box-sizing: border-box;
  }

  /* ── Active game banner ── */
  .wr-banner {
    width: 100%; max-width: 520px;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    background: rgba(160,180,240,0.06);
    border: 1px solid rgba(200,215,245,0.18);
    border-radius: 8px;
    padding: clamp(10px,1.4vh,14px) clamp(14px,2vw,18px);
    animation: bannerIn 0.25s ease-out;
  }
  .wr-banner-left { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
  .wr-banner-dot {
    width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
    background: #aab2c2; box-shadow: 0 0 8px rgba(170,178,194,0.55);
    animation: pulse 1.5s ease-in-out infinite;
  }
  .wr-banner-title {
    font-family: 'Cinzel', serif; font-size: clamp(11px,1vw,13px);
    font-weight: 700; color: rgba(245,243,238,0.88); letter-spacing: 0.06em;
  }
  .wr-banner-sub {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.78vw,10px);
    color: rgba(170,178,194,0.55); letter-spacing: 0.04em; margin-top: 2px;
  }
  .wr-banner-btns { display: flex; gap: 0.45rem; flex-shrink: 0; }
  .wr-banner-btn {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.82vw,11px);
    font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    border-radius: 6px; padding: 0.36rem 0.85rem; cursor: pointer; transition: all 0.15s;
  }
  .wr-banner-resume {
    background: rgba(160,180,240,0.08); border: 1px solid rgba(200,215,245,0.28);
    color: rgba(221,226,236,0.88);
  }
  .wr-banner-resume:hover { background: rgba(160,180,240,0.16); color: #f5f3ee; border-color: rgba(200,215,245,0.52); }
  .wr-banner-abandon {
    background: rgba(180,40,40,0.09); border: 1px solid rgba(200,60,60,0.22);
    color: rgba(220,120,120,0.62);
  }
  .wr-banner-abandon:hover { background: rgba(200,50,50,0.17); color: #f87171; border-color: rgba(220,80,80,0.42); }

  /* ── Battle button ── */
  .wr-battle-btn {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    width: clamp(220px,28vw,320px);
    padding: clamp(22px,3.2vh,34px) clamp(28px,4vw,48px);
    background: linear-gradient(145deg, rgba(10,7,24,0.96) 0%, rgba(16,10,36,0.96) 100%);
    border: 1px solid rgba(200,215,245,0.28); border-radius: 8px; cursor: pointer;
    transition: transform 0.2s, filter 0.2s, border-color 0.2s;
    animation: battleGlow 3s ease-in-out infinite;
    position: relative; overflow: hidden;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  }
  .wr-battle-btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%);
    pointer-events: none;
  }
  .wr-battle-btn:hover { transform: scale(1.04); border-color: rgba(200,215,245,0.52); filter: brightness(1.1); }
  .wr-battle-btn:active { transform: scale(0.99); }
  .wr-battle-label {
    font-family: 'Cinzel', serif; font-size: clamp(22px,3vw,34px); font-weight: 700;
    letter-spacing: 0.28em; color: #f5f3ee;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
    position: relative;
  }
  .wr-battle-sub {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.9vw,12px);
    letter-spacing: 0.2em; color: rgba(160,180,220,0.55); position: relative;
  }

  /* ── Mode chips ── */
  .wr-chips { display: flex; gap: 8px; }
  .wr-chip {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.82vw,11px);
    letter-spacing: 0.12em; text-transform: uppercase;
    padding: 5px 16px; border-radius: 100px; border: 1px solid; cursor: default;
  }
  .wr-chip-ranked {
    border-color: rgba(160,180,240,0.2); color: rgba(160,180,240,0.35); opacity: 0.4;
  }
  .wr-chip-casual {
    border-color: rgba(220,225,255,0.5); color: rgba(220,225,255,0.82);
    background: rgba(220,225,255,0.07);
  }
`;
