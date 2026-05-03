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

  // Resume skyforge music when returning to war room (e.g. from battle/hub)
  useEffect(() => {
    audioManager.play("skyforge");
    // Do NOT stop on unmount — music persists across menu screens
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
        color: "rgba(240,192,64,0.6)", fontFamily: "'Cinzel', serif",
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

      <div className="war-bg" />
      <div className="war-overlay" />

      <div className="war-topbar">
        <div className="war-logo">
          WAR ROOM
        </div>

        <div className="war-player-info">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="war-avatar" />
          ) : (
            <div className="war-avatar war-avatar-fallback">⚔</div>
          )}
          <span className="war-username">{displayName}</span>
          <button className="war-signout-btn" onClick={() => signOut(() => navigate("/"))}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="war-body">
        <div className="war-center">
          <div className="war-title-block">
            <div className="war-game-title">TOWER SEEKERS</div>
            <div className="war-game-subtitle">Season 1 · The Iron Age</div>
          </div>

          <div className="war-welcome">
            Welcome back, <span className="war-welcome-name">{displayName}</span>
          </div>

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

            <button className="war-menu-btn war-btn-settings" onClick={() => setShowSettings(true)}>
              <span className="war-btn-icon">⚙</span>
              <span className="war-btn-content">
                <span className="war-btn-title">Settings</span>
                <span className="war-btn-sub">Audio, display &amp; controls</span>
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
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700;900&display=swap');

  .war-root {
    min-height: 100vh;
    width: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #07040f;
    font-family: 'Cinzel', serif;
  }

  .war-bg {
    position: absolute;
    inset: 0;
    background-image: url('/assets/title-bg.png');
    background-size: cover;
    background-position: center 40%;
    filter: blur(3px) brightness(0.28);
    z-index: 0;
  }

  .war-overlay {
    position: absolute;
    inset: 0;
    background: rgba(4,2,10,0.72);
    z-index: 1;
    pointer-events: none;
  }

  .war-topbar {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: clamp(10px,2vh,18px) clamp(14px,3vw,28px);
    flex-shrink: 0;
    border-bottom: 1px solid rgba(240,192,64,0.1);
    background: rgba(4,2,10,0.5);
    backdrop-filter: blur(8px);
  }

  .war-logo {
    font-family: 'Cinzel', serif;
    font-size: clamp(11px, 1.4vw, 16px);
    font-weight: 700;
    letter-spacing: 0.22em;
    color: rgba(240,192,64,0.85);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .war-player-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .war-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(240,192,64,0.4);
    object-fit: cover;
  }
  .war-avatar-fallback {
    background: linear-gradient(135deg, #1a0d3a, #2a1555);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .war-username {
    font-size: clamp(10px,1.1vw,13px);
    color: rgba(240,192,64,0.8);
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  .war-signout-btn {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(240,192,64,0.18);
    border-radius: 6px;
    padding: 4px 10px;
    color: rgba(200,170,100,0.6);
    font-family: 'Cinzel', serif;
    font-size: clamp(8px,0.82vw,10px);
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.18s;
  }
  .war-signout-btn:hover {
    border-color: rgba(240,192,64,0.4);
    color: rgba(240,192,64,0.85);
    background: rgba(240,192,64,0.07);
  }

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
    gap: clamp(20px,3vh,36px);
    width: 100%;
    max-width: 500px;
  }

  .war-title-block {
    text-align: center;
  }
  .war-game-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: clamp(20px,3.5vw,42px);
    font-weight: 900;
    color: #f0c040;
    letter-spacing: 0.12em;
    text-shadow: 0 0 40px rgba(240,192,64,0.3), 0 2px 8px rgba(0,0,0,0.8);
    line-height: 1;
  }
  .war-game-subtitle {
    font-size: clamp(9px,0.9vw,11px);
    color: rgba(240,192,64,0.45);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-top: 8px;
  }

  .war-welcome {
    font-size: clamp(12px,1.3vw,16px);
    color: rgba(200,170,100,0.7);
    letter-spacing: 0.08em;
    text-align: center;
  }
  .war-welcome-name {
    color: rgba(240,192,64,0.9);
    font-weight: 700;
  }

  .war-menu {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: clamp(8px,1.2vh,14px);
  }

  .war-menu-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: clamp(12px,1.8vw,20px);
    border-radius: 14px;
    padding: clamp(14px,2vh,20px) clamp(16px,2.5vw,24px);
    border: 1px solid transparent;
    cursor: pointer;
    text-align: left;
    transition: filter 0.18s, transform 0.18s, box-shadow 0.18s;
    position: relative;
    overflow: hidden;
  }
  .war-menu-btn::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: 14px 14px 0 0;
  }
  .war-menu-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.5);
    filter: brightness(1.1);
  }
  .war-menu-btn:active { transform: translateY(0); }

  .war-btn-pvp {
    background: linear-gradient(135deg, rgba(20,40,100,0.88), rgba(10,25,70,0.95));
    border-color: rgba(80,120,255,0.28);
  }
  .war-btn-pvp::before { background: linear-gradient(90deg, transparent, rgba(80,120,255,0.6), transparent); }

  .war-btn-hub {
    background: linear-gradient(135deg, rgba(60,35,10,0.88), rgba(40,22,5,0.95));
    border-color: rgba(200,130,40,0.28);
  }
  .war-btn-hub::before { background: linear-gradient(90deg, transparent, rgba(240,150,50,0.5), transparent); }

  .war-btn-settings {
    background: linear-gradient(135deg, rgba(18,10,40,0.88), rgba(10,5,25,0.95));
    border-color: rgba(120,80,200,0.22);
  }
  .war-btn-settings::before { background: linear-gradient(90deg, transparent, rgba(120,80,200,0.4), transparent); }

  /* Active game banner */
  .war-active-banner {
    width: 100%;
    display: flex; align-items: center; justify-content: space-between;
    gap: 1rem;
    background: rgba(200,120,20,0.12);
    border: 1px solid rgba(240,160,40,0.35);
    border-radius: 12px;
    padding: clamp(10px,1.5vh,14px) clamp(14px,2vw,18px);
    animation: bannerIn 0.25s ease-out;
  }
  @keyframes bannerIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  .war-active-left { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
  .war-active-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    background: #f0a030;
    box-shadow: 0 0 8px rgba(240,160,40,0.7);
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.65;transform:scale(0.85)} }
  .war-active-title {
    font-family: 'Cinzel', serif; font-size: clamp(11px,1.1vw,13px);
    font-weight: 700; color: rgba(240,180,80,0.92); letter-spacing: 0.06em;
  }
  .war-active-sub {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.82vw,10px);
    color: rgba(200,160,80,0.5); letter-spacing: 0.04em; margin-top: 2px;
  }
  .war-active-btns { display: flex; gap: 0.5rem; flex-shrink: 0; }
  .war-active-btn {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.85vw,11px);
    font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    border-radius: 7px; padding: 0.38rem 0.9rem; cursor: pointer; transition: all 0.15s;
  }
  .war-active-resume {
    background: rgba(240,160,40,0.18); border: 1px solid rgba(240,160,40,0.45);
    color: rgba(240,180,80,0.9);
  }
  .war-active-resume:hover { background: rgba(240,160,40,0.28); border-color: rgba(240,160,40,0.7); color: #f0c040; }
  .war-active-abandon {
    background: rgba(180,40,40,0.1); border: 1px solid rgba(200,60,60,0.28);
    color: rgba(220,120,120,0.7);
  }
  .war-active-abandon:hover { background: rgba(200,50,50,0.18); border-color: rgba(220,80,80,0.5); color: #f87171; }

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
    font-weight: 700;
    color: #f0e8d0;
    letter-spacing: 0.05em;
  }
  .war-btn-sub {
    font-family: 'Cinzel', serif;
    font-size: clamp(9px,0.82vw,11px);
    color: rgba(200,180,140,0.5);
    letter-spacing: 0.04em;
  }
  .war-btn-arrow {
    font-size: clamp(18px,2vw,26px);
    color: rgba(240,192,64,0.35);
    font-family: sans-serif;
    font-weight: 300;
    flex-shrink: 0;
    transition: transform 0.15s, color 0.15s;
  }
  .war-menu-btn:hover .war-btn-arrow {
    transform: translateX(3px);
    color: rgba(240,192,64,0.7);
  }

  /* Settings modal (reused from TitleScreen) */
  .ts-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.78);
    backdrop-filter: blur(6px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .ts-modal {
    background: linear-gradient(160deg, #0d0921 0%, #070511 100%);
    border: 1px solid rgba(240,192,64,0.25);
    border-radius: 14px;
    padding: 2rem;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(240,192,64,0.08) inset;
    max-height: 90vh;
    overflow-y: auto;
  }
  .ts-modal-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f0e0a0;
    text-align: center;
    margin-bottom: 1.5rem;
    letter-spacing: 0.08em;
  }
  .ts-section-label {
    font-family: 'Cinzel', serif;
    font-size: 0.65rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(240,192,64,0.5);
    border-bottom: 1px solid rgba(240,192,64,0.12);
    padding-bottom: 0.3rem;
    margin: 1.2rem 0 0.8rem;
  }
  .ts-setting-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.7rem;
  }
  .ts-lbl {
    font-family: 'Cinzel', serif;
    font-size: 0.78rem;
    color: rgba(200,170,100,0.8);
    min-width: 120px;
  }
  .ts-toggle {
    padding: 0.3rem 0.9rem;
    border-radius: 6px;
    border: 1px solid rgba(240,192,64,0.25);
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    cursor: pointer;
    letter-spacing: 0.08em;
    transition: all 0.15s;
  }
  .ts-toggle.on  { background: rgba(240,192,64,0.15); color: #f0c040; }
  .ts-toggle.off { background: rgba(80,60,40,0.15); color: rgba(180,150,100,0.5); }
  .ts-slider {
    flex: 1;
    accent-color: #f0c040;
  }
  .ts-val {
    font-size: 0.75rem;
    color: rgba(240,192,64,0.7);
    min-width: 38px;
    text-align: right;
  }
  .ts-radio-group { display: flex; gap: 6px; }
  .ts-radio {
    padding: 0.28rem 0.75rem;
    border-radius: 6px;
    border: 1px solid rgba(240,192,64,0.18);
    background: rgba(20,12,40,0.6);
    color: rgba(180,150,100,0.6);
    font-family: 'Cinzel', serif;
    font-size: 0.68rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ts-radio.active {
    background: rgba(240,192,64,0.18);
    border-color: rgba(240,192,64,0.5);
    color: #f0c040;
  }
  .ts-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
    border-top: 1px solid rgba(240,192,64,0.1);
    padding-top: 1rem;
  }
  .ts-btn-sm {
    padding: 0.38rem 1rem;
    border-radius: 7px;
    border: 1px solid rgba(240,192,64,0.22);
    background: rgba(20,12,40,0.7);
    color: rgba(200,170,100,0.7);
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.06em;
  }
  .ts-btn-sm:hover { border-color: rgba(240,192,64,0.45); color: #f0d070; }
  .ts-btn-sm-primary {
    background: rgba(240,192,64,0.16);
    border-color: rgba(240,192,64,0.45);
    color: #f0c040;
  }
  .ts-btn-sm-primary:hover {
    background: rgba(240,192,64,0.26);
    box-shadow: 0 0 12px rgba(240,192,64,0.15);
  }
`;
