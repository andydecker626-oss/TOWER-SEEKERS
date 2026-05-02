import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, Show, useClerk } from "@clerk/react";
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
import WarRoom from "@/pages/WarRoom";
import SpritePreview from "@/pages/SpritePreview";
import ArenaDemo from "@/pages/ArenaDemo";
import IntroSequence, { shouldShowIntro } from "@/components/IntroSequence";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

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
    const safePaths = ["/", "/warroom", "/arena-demo", "/sprites"];
    if (safePaths.includes(location.pathname)) return;
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

function RequireAuth({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out"><Navigate to="/" replace /></Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  return (
    <SettingsProvider>
      <SocketProvider>
        <ClerkQueryClientCacheInvalidator />
        <PhaseNavigator />
        <OpponentReconnectingBanner />
        <Routes>
          <Route path="/" element={<TitleScreen />} />
          <Route path="/warroom" element={<RequireAuth><WarRoom /></RequireAuth>} />
          <Route path="/lobby" element={<RequireAuth><Lobby /></RequireAuth>} />
          <Route path="/hub" element={<RequireAuth><GatheringHub /></RequireAuth>} />
          <Route path="/sprites" element={<RequireAuth><SpritePreview /></RequireAuth>} />
          <Route path="/preselect" element={<RequireAuth><PreSelection /></RequireAuth>} />
          <Route path="/battleselect" element={<RequireAuth><BattleSelect /></RequireAuth>} />
          <Route path="/place" element={<RequireAuth><Placement /></RequireAuth>} />
          <Route path="/battle" element={<RequireAuth><Battle /></RequireAuth>} />
          <Route path="/gameover" element={<RequireAuth><GameOver /></RequireAuth>} />
          <Route path="/arena-demo" element={<RequireAuth><ArenaDemo /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </SettingsProvider>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [introComplete, setIntroComplete] = useState(!shouldShowIntro());

  if (!clerkPubKey) {
    return (
      <div style={{ color: "#f0c040", background: "#07040f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "serif" }}>
        Missing Clerk publishable key — check VITE_CLERK_PUBLISHABLE_KEY.
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider
        publishableKey={clerkPubKey}
        proxyUrl={clerkProxyUrl}
        signInUrl={`${basePath}/`}
        signUpUrl={`${basePath}/`}
      >
        {!introComplete && (
          <IntroSequence onComplete={() => setIntroComplete(true)} />
        )}
        {introComplete && (
          <BrowserRouter basename={base}>
            <AppRoutes />
          </BrowserRouter>
        )}
      </ClerkProvider>
    </QueryClientProvider>
  );
}

export default App;
