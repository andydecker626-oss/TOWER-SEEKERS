import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/react";
import { audioManager } from "@/lib/audio";
import SettingsModal from "@/components/SettingsModal";
import TutorialModal from "@/components/TutorialModal";

export type ActiveTab = "home" | "towers" | "town" | "units" | "shop";

const TABS: { id: ActiveTab; label: string; icon: string; path: string }[] = [
  { id: "home",   label: "Home",   icon: "⚔",  path: "/warroom" },
  { id: "towers", label: "Towers", icon: "🗼", path: "/towers"  },
  { id: "town",   label: "Town",   icon: "🏛",  path: "/town"    },
  { id: "units",  label: "Units",  icon: "👥", path: "/hub"     },
  { id: "shop",   label: "Shop",   icon: "💎", path: "/shop"    },
];

interface Props {
  active: ActiveTab;
  children: React.ReactNode;
  bgSrc?: string;
}

export default function MenuShell({ active, children, bgSrc }: Props) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    audioManager.play("hub");
  }, []);

  const displayName =
    user?.username ||
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "Adventurer";
  const avatarUrl = user?.imageUrl;

  return (
    <div className="ms-root">
      <style>{CSS}</style>

      <div
        className="ms-bg"
        style={bgSrc ? { backgroundImage: `url('${bgSrc}')`, filter: "none" } : undefined}
      />
      <div
        className="ms-overlay"
        style={bgSrc ? {
          background: "linear-gradient(180deg, rgba(7,4,15,0.20) 0%, rgba(7,4,15,0.35) 50%, rgba(7,4,15,0.55) 100%)"
        } : undefined}
      />

      {/* ── Top HUD ─────────────────────────────────────────────── */}
      <div className="ms-topbar">
        <div className="ms-player">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="ms-avatar" />
          ) : (
            <div className="ms-avatar ms-avatar-fb">⚔</div>
          )}
          <span className="ms-username">{displayName}</span>
        </div>

        <div className="ms-currency">
          <div className="ms-pill">
            <span className="ms-pill-icon">💎</span>
            <span className="ms-pill-count">1,200</span>
          </div>
          <div className="ms-pill">
            <span className="ms-pill-icon">🪙</span>
            <span className="ms-pill-count">4,500</span>
          </div>
        </div>

        <div className="ms-actions">
          <button className="ms-icon-btn" onClick={() => setShowTutorial(true)} title="Tutorial" aria-label="Tutorial">
            ?
          </button>
          <button className="ms-icon-btn" onClick={() => setShowSettings(true)} title="Settings" aria-label="Settings">
            ⚙
          </button>
          <button className="ms-signout" onClick={() => signOut(() => navigate("/"))}>
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────────── */}
      <div className="ms-content">{children}</div>

      {/* ── Bottom tab bar ───────────────────────────────────────── */}
      <nav className="ms-tabbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`ms-tab${active === tab.id ? " ms-tab-active" : ""}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="ms-tab-icon">{tab.icon}</span>
            <span className="ms-tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Orbitron:wght@300&display=swap');

  .ms-root {
    position: fixed; inset: 0;
    display: flex; flex-direction: column;
    font-family: 'Cinzel', serif;
    background: #07040f;
    overflow: hidden;
  }

  /* ── Background ── */
  .ms-bg {
    position: absolute; inset: 0; z-index: 0;
    background-image: url('/assets/title-bg.png');
    background-size: cover; background-position: center 40%;
    filter: brightness(0.45);
  }
  .ms-overlay {
    position: absolute; inset: 0; z-index: 1; pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(4,2,10,0.42) 0%,
      rgba(4,2,10,0.10) 30%,
      rgba(4,2,10,0.18) 65%,
      rgba(4,2,10,0.78) 100%
    );
  }

  /* ── Top HUD ── */
  .ms-topbar {
    position: relative; z-index: 10; flex-shrink: 0;
    display: flex; align-items: center; gap: 12px;
    padding: clamp(8px,1.4vh,14px) clamp(12px,2.5vw,24px);
    background: rgba(4,2,10,0.55); backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(160,180,240,0.09);
  }
  .ms-player { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .ms-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    border: 1px solid rgba(160,180,240,0.28); object-fit: cover; flex-shrink: 0;
  }
  .ms-avatar-fb {
    background: linear-gradient(135deg,#1a0d3a,#2a1555);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
  }
  .ms-username {
    font-size: clamp(9px,0.9vw,11px); color: rgba(180,195,230,0.52);
    letter-spacing: 0.08em; font-weight: 400;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 120px;
  }

  .ms-currency {
    display: flex; align-items: center; gap: 6px; flex: 1;
  }
  .ms-pill {
    display: flex; align-items: center; gap: 4px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(180,190,240,0.15);
    border-radius: 100px; padding: 3px 10px;
    font-size: clamp(10px,0.9vw,12px);
  }
  .ms-pill-icon { font-size: 13px; line-height: 1; }
  .ms-pill-count { color: rgba(220,225,245,0.75); font-weight: 600; letter-spacing: 0.04em; }

  @media (max-width: 768px) {
    .ms-pill-count { display: none; }
    .ms-pill { padding: 3px 6px; }
    .ms-username { max-width: 72px; }
  }

  .ms-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .ms-icon-btn {
    width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(160,180,240,0.16);
    border-radius: 7px; color: rgba(160,180,220,0.52);
    font-size: 13px; cursor: pointer; transition: all 0.18s;
    font-family: 'Cinzel', serif; font-weight: 700;
  }
  .ms-icon-btn:hover {
    border-color: rgba(180,200,255,0.36); color: rgba(220,230,255,0.9);
    background: rgba(160,180,240,0.09);
  }
  .ms-signout {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(160,180,240,0.13);
    border-radius: 6px; padding: 4px 10px;
    color: rgba(160,180,220,0.42); font-family: 'Cinzel', serif;
    font-size: clamp(8px,0.72vw,10px); letter-spacing: 0.1em; cursor: pointer; transition: all 0.18s;
  }
  .ms-signout:hover {
    border-color: rgba(180,200,255,0.3); color: rgba(180,200,240,0.78);
    background: rgba(160,180,240,0.07);
  }

  /* ── Content ── */
  .ms-content {
    position: relative; z-index: 10; flex: 1; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: rgba(160,180,240,0.15) transparent;
  }
  .ms-content::-webkit-scrollbar { width: 4px; }
  .ms-content::-webkit-scrollbar-track { background: transparent; }
  .ms-content::-webkit-scrollbar-thumb { background: rgba(160,180,240,0.2); border-radius: 2px; }

  /* ── Tab bar ── */
  .ms-tabbar {
    position: relative; z-index: 10; flex-shrink: 0;
    display: flex; align-items: stretch;
    background: rgba(4,2,10,0.78); backdrop-filter: blur(12px);
    border-top: 1px solid rgba(160,180,240,0.09);
    height: clamp(56px,7vh,68px);
  }
  .ms-tab {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; border: none; background: transparent; cursor: pointer;
    opacity: 0.52; transition: opacity 0.18s;
    border-bottom: 2px solid transparent;
    padding: 0; color: rgba(200,210,240,0.8);
  }
  .ms-tab:hover { opacity: 0.8; }
  .ms-tab-active {
    opacity: 1;
    border-bottom-color: rgba(220,225,255,0.85);
  }
  .ms-tab-icon { font-size: clamp(16px,2vw,20px); line-height: 1; }
  .ms-tab-label {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.8vw,11px);
    letter-spacing: 0.1em; text-transform: uppercase; color: inherit;
  }
  @media (max-width: 768px) {
    .ms-tab-label { font-size: 9px; }
  }
`;
