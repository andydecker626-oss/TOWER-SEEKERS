import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocketProvider, useSocket } from "@/context/SocketContext";
import { SettingsProvider } from "@/context/SettingsContext";
import type { Phase } from "@/lib/types";
import Lobby from "@/pages/Lobby";
import PreSelection from "@/pages/PreSelection";
import BattleSelect from "@/pages/BattleSelect";
import Placement from "@/pages/Placement";
import Battle from "@/pages/Battle";
import GameOver from "@/pages/GameOver";
import GatheringHub from "@/pages/GatheringHub";
import TitleScreen from "@/pages/TitleScreen";
import ArenaDemo from "@/pages/ArenaDemo";

const queryClient = new QueryClient();

const PHASE_ROUTES: Record<Phase, string> = {
  lobby: "/lobby",
  waiting: "/lobby",
  preselection: "/preselect",
  battleselect: "/battleselect",
  placement: "/place",
  battle: "/battle",
  gameover: "/gameover",
};

function PhaseNavigator() {
  const { state } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Never redirect away from standalone demo/title/hub pages
    if (location.pathname === "/" || location.pathname === "/arena-demo") return;
    const isHubPhase = state.phase === "lobby" || state.phase === "waiting";
    if (location.pathname === "/hub" && isHubPhase) return;
    const target = PHASE_ROUTES[state.phase] ?? "/lobby";
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [state.phase, location.pathname]);

  return null;
}

function OpponentReconnectingBanner() {
  const { state } = useSocket();
  if (!state.opponentReconnecting) return null;
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: "rgba(180, 120, 0, 0.95)",
      color: "#fff8e1",
      textAlign: "center",
      padding: "0.6rem 1rem",
      fontFamily: "'Cinzel', serif",
      fontSize: "0.85rem",
      letterSpacing: "0.08em",
      backdropFilter: "blur(4px)",
      borderBottom: "1px solid rgba(240,192,64,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.6rem",
    }}>
      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#f0c040", animation: "pulse 1.4s ease-in-out infinite" }} />
      Opponent lost connection — waiting for them to rejoin…
    </div>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <BrowserRouter basename={base}>
          <SocketProvider>
            <PhaseNavigator />
            <OpponentReconnectingBanner />
            <Routes>
              <Route path="/" element={<TitleScreen />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/hub" element={<GatheringHub />} />
              <Route path="/preselect" element={<PreSelection />} />
              <Route path="/battleselect" element={<BattleSelect />} />
              <Route path="/place" element={<Placement />} />
              <Route path="/battle" element={<Battle />} />
              <Route path="/gameover" element={<GameOver />} />
              <Route path="/arena-demo" element={<ArenaDemo />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </BrowserRouter>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
