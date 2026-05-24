import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { audioManager } from "@/lib/audio";
import { useSettings } from "@/context/SettingsContext";
import { useSocket } from "@/context/SocketContext";
import SettingsModal from "@/components/SettingsModal";

const PHASE_ROUTES: Record<string, string> = {
  preselection: "/preselect",
  battleselect: "/battleselect",
  placement: "/place",
  battle: "/battle",
  gameover: "/gameover",
  waiting: "/lobby",
};

export default function WarRoom() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { state, reset } = useSocket();
  const [showSettings, setShowSettings] = useState(false);

  const hasActiveGame = state.phase !== "lobby";

  useEffect(() => {
    audioManager.play("hub");
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const username = user.username || user.firstName || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Adventurer";
    const avatarUrl = user.imageUrl || "";
    fetch(`/api/player/me?username=${encodeURIComponent(username)}&avatarUrl=${encodeURIComponent(avatarUrl)}`, {
      credentials: "include",
    }).catch(() => {});
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div style={{
        minHeight: "100vh", background: "#07040f", display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "rgba(180,195,230,0.55)", fontFamily: "'Cinzel', serif",
        fontSize: "1rem", letterSpacing: "0.12em",
      }}>
        Loading…
      </div>
    );
  }

  const displayName = user?.username || user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Adventurer";
  const avatarUrl = user?.imageUrl;

  return (
    <div className="war-root">
      <style>{CSS}</style>

      <div className="war-bg">
        <div className="war-bg-inner" />
      </div>
      <div className="war-overlay" />
      <div className="war-vignette" />

      <div className="war-motes">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>

      <div className="war-topbar">
        <div className="war-player-strip">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="war-avatar" />
          ) : (
            <div className="war-avatar war-avatar-fallback">⚔</div>
          )}
          <span className="war-username">{displayName}</span>
          <button
            className="war-icon-btn"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            title="Settings"
          >
            ⚙
          </button>
          <button className="war-signout-btn" onClick={() => signOut(() => navigate("/"))}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="war-body">
        <div className="war-center">
          <div className="war-echo">Choose your path.</div>

          {hasActiveGame && (
            <div className="war-active-banner">
              <div className="war-active-left">
                <span className="war-active-dot" />
                <div>
                  <div className="war-active-title">Game in progress</div>
                  <div className="war-active-sub">You have an unfinished battle</div>
                </div>
              </div>
              <div className="war-active-btns">
                <button
                  className="war-active-btn war-active-resume"
                  onClick={() => navigate(PHASE_ROUTES[state.phase] ?? "/lobby")}
                >Resume</button>
                <button
                  className="war-active-btn war-active-abandon"
                  onClick={reset}
                >Abandon</button>
              </div>
            </div>
          )}

          <div className="war-menu">
            <button className="war-menu-btn war-btn-pvp" onClick={() => navigate("/lobby")}>
              <span className="war-btn-icon">⚔</span>
              <span className="war-btn-content">
                <span className="war-btn-title">Battle</span>
                <span className="war-btn-sub">Matchmake or play AI</span>
              </span>
              <span className="war-btn-arrow">›</span>
            </button>

            <button className="war-menu-btn war-btn-hub" onClick={() => navigate("/hub")}>
              <span className="war-btn-icon">🏰</span>
              <span className="war-btn-content">
                <span className="war-btn-title">Gathering Hub</span>
                <span className="war-btn-sub">Configure your party &amp; units</span>
              </span>
              <span className="war-btn-arrow">›</span>
            </button>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cinzel+Decorative:wght@700;900&display=swap');

  :root {
    --war-pearl-1:   #ffffff;
    --war-pearl-2:   #dde2ec;
    --war-pearl-3:   #aab2c2;
    --war-fg-dim:    rgba(180,190,210,0.6);
    --war-deep:      #07040f;
    --war-gold-deep: #c8960d;
  }

  @keyframes warMoteRise {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
    10%  { opacity: 0.9; }
    90%  { opacity: 0.5; }
    100% { transform: translateY(-100vh) translateX(calc((var(--i, 0) % 3 - 1) * 40px)) scale(0.5); opacity: 0; }
  }

  @keyframes bannerIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%,100% { opacity:1; transform:scale(1) }
    50%     { opacity:0.6; transform:scale(0.82) }
  }

  @keyframes warCardRise {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .war-root {
    min-height: 100vh;
    width: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--war-deep);
    font-family: 'Cinzel', serif;
  }

  .war-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
  }

  .war-bg-inner {
    position: absolute;
    inset: 0;
    background-image: url('/assets/title-bg.png');
    background-size: cover;
    background-position: center 40%;
    filter: brightness(0.55);
  }

  .war-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(4,2,10,0.38) 0%,
      rgba(4,2,10,0.12) 35%,
      rgba(4,2,10,0.28) 65%,
      rgba(4,2,10,0.72) 100%
    );
    z-index: 1;
    pointer-events: none;
  }

  .war-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(4,2,10,0.5) 68%, rgba(4,2,10,0.85) 100%);
    z-index: 2;
    pointer-events: none;
  }

  .war-motes {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    overflow: hidden;
  }
  .war-motes span {
    position: absolute;
    bottom: -10px;
    left: calc(6% + (var(--i, 0) * 6.5%));
    width: clamp(1px, 0.18vw, 2.5px);
    height: clamp(1px, 0.18vw, 2.5px);
    border-radius: 50%;
    background: rgba(160,180,240,0.5);
    animation: warMoteRise calc(14s + (var(--i, 0) * 2.1s)) calc(var(--i, 0) * -3.3s) linear infinite;
  }
  .war-motes span:nth-child(3n+2) { background: rgba(180,200,255,0.35); width: 1.5px; height: 1.5px; }
  .war-motes span:nth-child(5n)   { background: rgba(200,220,255,0.25); }

  /* ── Topbar ── */
  .war-topbar {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: clamp(10px,2vh,16px) clamp(14px,3vw,28px);
    flex-shrink: 0;
    border-bottom: 1px solid rgba(160,180,240,0.08);
    background: rgba(4,2,10,0.38);
    backdrop-filter: blur(10px);
  }

  .war-player-strip {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .war-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid rgba(160,180,240,0.3);
    object-fit: cover;
    flex-shrink: 0;
  }
  .war-avatar-fallback {
    background: linear-gradient(135deg, #1a0d3a, #2a1555);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
  }

  .war-username {
    font-size: clamp(9px,1vw,12px);
    color: rgba(180,195,230,0.55);
    letter-spacing: 0.08em;
    font-weight: 400;
  }

  .war-icon-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(160,180,240,0.16);
    border-radius: 7px;
    color: rgba(160,180,220,0.55);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.18s;
  }
  .war-icon-btn:hover {
    border-color: rgba(180,200,255,0.38);
    color: var(--war-pearl-2);
    background: rgba(160,180,240,0.08);
  }

  .war-signout-btn {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(160,180,240,0.14);
    border-radius: 6px;
    padding: 4px 10px;
    color: rgba(160,180,220,0.45);
    font-family: 'Cinzel', serif;
    font-size: clamp(8px,0.78vw,10px);
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.18s;
  }
  .war-signout-btn:hover {
    border-color: rgba(180,200,255,0.32);
    color: rgba(180,200,240,0.8);
    background: rgba(160,180,240,0.07);
  }

  /* ── Body ── */
  .war-body {
    position: relative;
    z-index: 10;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(24px,5vh,60px) clamp(16px,4vw,40px);
  }

  .war-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(18px,2.8vh,32px);
    width: 100%;
    max-width: 480px;
  }

  .war-echo {
    font-family: 'Cinzel', serif;
    font-size: clamp(12px,1.3vw,16px);
    font-style: italic;
    letter-spacing: 0.22em;
    color: var(--war-fg-dim);
    text-align: center;
    text-shadow: 0 2px 10px rgba(0,0,0,0.8);
    animation: warCardRise 0.8s ease forwards;
    animation-delay: 0.1s;
    opacity: 0;
  }

  /* ── Menu cards ── */
  .war-menu {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: clamp(8px,1.2vh,14px);
    animation: warCardRise 0.8s ease forwards;
    animation-delay: 0.3s;
    opacity: 0;
  }

  .war-menu-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: clamp(12px,1.8vw,20px);
    border-radius: 12px;
    padding: clamp(14px,2vh,20px) clamp(16px,2.5vw,24px);
    cursor: pointer;
    text-align: left;
    transition: filter 0.18s, transform 0.18s, box-shadow 0.18s;
    position: relative;
    overflow: hidden;
    background: rgba(8,6,22,0.78);
    border: 1px solid rgba(160,180,240,0.18);
  }

  .war-menu-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.45);
    filter: brightness(1.08);
  }
  .war-menu-btn:active { transform: translateY(0); }

  .war-btn-pvp {
    border-left: 2px solid rgba(80,130,255,0.6);
    box-shadow: inset 3px 0 12px rgba(60,100,220,0.06);
  }
  .war-btn-pvp:hover {
    border-color: rgba(80,130,255,0.55);
    border-left-color: rgba(100,160,255,0.85);
    box-shadow: 0 8px 28px rgba(0,0,0,0.45), inset 0 0 20px rgba(60,100,220,0.06);
  }

  .war-btn-hub {
    border-left: 2px solid rgba(200,140,40,0.55);
    box-shadow: inset 3px 0 12px rgba(180,110,20,0.06);
  }
  .war-btn-hub:hover {
    border-color: rgba(160,180,240,0.28);
    border-left-color: rgba(220,160,60,0.85);
    box-shadow: 0 8px 28px rgba(0,0,0,0.45), inset 0 0 20px rgba(180,120,20,0.06);
  }

  .war-btn-icon {
    font-size: clamp(18px,2.2vw,26px);
    width: clamp(28px,3vw,38px);
    text-align: center;
    flex-shrink: 0;
  }
  .war-btn-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .war-btn-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(12px,1.4vw,17px);
    font-weight: 600;
    color: var(--war-pearl-2);
    letter-spacing: 0.06em;
  }
  .war-btn-sub {
    font-family: 'Cinzel', serif;
    font-size: clamp(9px,0.82vw,11px);
    color: var(--war-fg-dim);
    letter-spacing: 0.04em;
  }
  .war-btn-arrow {
    font-size: clamp(18px,2vw,26px);
    color: rgba(160,180,240,0.28);
    font-family: sans-serif;
    font-weight: 300;
    flex-shrink: 0;
    transition: transform 0.15s, color 0.15s;
  }
  .war-menu-btn:hover .war-btn-arrow {
    transform: translateX(3px);
    color: rgba(180,200,255,0.6);
  }

  /* ── Active game banner ── */
  .war-active-banner {
    width: 100%;
    display: flex; align-items: center; justify-content: space-between;
    gap: 1rem;
    background: rgba(200,120,20,0.1);
    border: 1px solid rgba(220,150,40,0.3);
    border-radius: 12px;
    padding: clamp(10px,1.5vh,14px) clamp(14px,2vw,18px);
    animation: bannerIn 0.25s ease-out;
  }
  .war-active-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
  .war-active-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    background: #f0a030;
    box-shadow: 0 0 8px rgba(240,160,40,0.65);
    animation: pulse 1.5s ease-in-out infinite;
  }
  .war-active-title {
    font-family: 'Cinzel', serif; font-size: clamp(11px,1.1vw,13px);
    font-weight: 700; color: rgba(230,175,70,0.9); letter-spacing: 0.06em;
  }
  .war-active-sub {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.82vw,10px);
    color: rgba(200,160,80,0.45); letter-spacing: 0.04em; margin-top: 2px;
  }
  .war-active-btns { display: flex; gap: 0.5rem; flex-shrink: 0; }
  .war-active-btn {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.85vw,11px);
    font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    border-radius: 7px; padding: 0.38rem 0.9rem; cursor: pointer; transition: all 0.15s;
  }
  .war-active-resume {
    background: rgba(220,155,40,0.14); border: 1px solid rgba(220,155,40,0.4);
    color: rgba(230,180,70,0.88);
  }
  .war-active-resume:hover { background: rgba(220,155,40,0.24); border-color: rgba(230,165,50,0.65); color: #f0c040; }
  .war-active-abandon {
    background: rgba(180,40,40,0.1); border: 1px solid rgba(200,60,60,0.25);
    color: rgba(220,120,120,0.65);
  }
  .war-active-abandon:hover { background: rgba(200,50,50,0.18); border-color: rgba(220,80,80,0.45); color: #f87171; }
`;
