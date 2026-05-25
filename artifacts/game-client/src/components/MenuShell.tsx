import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
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

const PATH_TO_TAB: Record<string, ActiveTab> = {
  "/warroom": "home",
  "/towers":  "towers",
  "/town":    "town",
  "/hub":     "units",
  "/shop":    "shop",
};

const VISTAS: Record<ActiveTab, string> = {
  home:   "/assets/hub-bg.png",
  towers: "/assets/towers-bg.png",
  town:   "/assets/town-bg.png",
  units:  "/assets/units-bg.png",
  shop:   "/assets/hub-bg.png",
};

export default function MenuShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const active: ActiveTab = PATH_TO_TAB[pathname] ?? "home";

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

      {/* ── Background stack (crossfade) ────────────────────────── */}
      <div className="ms-bg-stack">
        {(Object.keys(VISTAS) as ActiveTab[]).map((tab) => (
          <div
            key={tab}
            className={`ms-bg${active === tab ? " is-active" : ""}`}
            style={{ backgroundImage: `url('${VISTAS[tab]}')` }}
          />
        ))}
        <div className="ms-overlay" />
      </div>

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

      {/* ── Scrollable content (re-keyed on active tab) ──────────── */}
      <main className="ms-content" key={active}>
        <Outlet />
      </main>

      {/* ── Bottom tab bar ───────────────────────────────────────── */}
      <nav className="ms-tabbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`ms-tab${active === tab.id ? " ms-tab-active" : ""}${tab.id === "shop" ? " ms-tab-shop" : ""}`}
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
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap');

  .ms-root {
    position: fixed; inset: 0;
    display: flex; flex-direction: column;
    font-family: 'Cinzel', serif;
    background: #07040f;
    overflow: hidden;
  }

  /* ── Background stack ── */
  .ms-bg-stack {
    position: absolute; inset: 0; z-index: 0;
  }
  .ms-bg {
    position: absolute; inset: 0;
    background-size: cover; background-position: center 40%;
    filter: brightness(0.45);
    opacity: 0;
    transition: opacity 300ms ease-in-out;
  }
  .ms-bg.is-active {
    opacity: 1;
  }
  .ms-overlay {
    position: absolute; inset: 0; pointer-events: none;
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
    position: relative; z-index: 2; flex: 1; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: rgba(160,180,240,0.15) transparent;
    animation: msContentEnter 300ms ease-out both;
  }
  .ms-content::-webkit-scrollbar { width: 4px; }
  .ms-content::-webkit-scrollbar-track { background: transparent; }
  .ms-content::-webkit-scrollbar-thumb { background: rgba(160,180,240,0.2); border-radius: 2px; }

  @keyframes msContentEnter {
    from { opacity: 0; transform: scale(0.985); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Tab bar ── */
  .ms-tabbar {
    position: relative; z-index: 10; flex-shrink: 0;
    display: flex; align-items: stretch;
    background: linear-gradient(180deg, rgba(4,2,12,0.82) 0%, rgba(7,4,15,0.95) 100%);
    backdrop-filter: blur(12px);
    border-top: 1px solid rgba(221,226,236,0.09);
    height: clamp(56px,7vh,68px);
  }
  .ms-tab {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; border: none; background: transparent; cursor: pointer;
    color: #aab2c2; opacity: 0.7; transition: opacity 0.18s, color 0.18s;
    padding: 0;
    position: relative;
  }
  .ms-tab:hover { opacity: 0.88; color: #dde2ec; }
  /* 2px pearl gradient accent bar via pseudo-element */
  .ms-tab::before {
    content: ""; position: absolute; top: 0; left: 10%; right: 10%; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(221,226,236,0.9) 30%, rgba(200,215,245,0.7) 70%, transparent);
    opacity: 0; transition: opacity 0.18s;
    border-radius: 0 0 1px 1px;
  }
  .ms-tab-active { opacity: 1; color: #f5f3ee; }
  .ms-tab-active::before { opacity: 1; }
  .ms-tab-icon { font-size: clamp(16px,2vw,20px); line-height: 1; }
  .ms-tab-label {
    font-family: 'Cinzel', serif; font-size: clamp(9px,0.8vw,10px);
    letter-spacing: 0.08em; text-transform: uppercase; color: inherit;
  }
  /* Shop tab — ornamental pearl ring around icon */
  .ms-tab-shop .ms-tab-icon {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 50%;
    border: 1px solid rgba(200,215,245,0.22);
    background: rgba(10,7,24,0.55);
    transition: border-color 0.18s, background 0.18s;
  }
  .ms-tab-shop:hover .ms-tab-icon,
  .ms-tab-shop.ms-tab-active .ms-tab-icon {
    border-color: rgba(221,226,236,0.65);
    background: rgba(160,180,240,0.1);
  }
  @media (max-width: 768px) {
    .ms-tab-label { font-size: 9px; }
    .ms-tab-shop .ms-tab-icon { width: 24px; height: 24px; }
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .ms-bg { transition: none; }
    .ms-content { animation: none; }
  }
`;
