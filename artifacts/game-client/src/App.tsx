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
import MenuShell from "@/components/MenuShell";
import WarRoom from "@/pages/WarRoom";
import TowersPage from "@/pages/TowersPage";
import TownPage from "@/pages/TownPage";
import ShopPage from "@/pages/ShopPage";
import SpritePreview from "@/pages/SpritePreview";
import ArenaDemo from "@/pages/ArenaDemo";
import SpriteTestPage from "@/pages/SpriteTestPage";
import IntroSequence from "@/components/IntroSequence";
import MusicControls from "@/components/MusicControls";
import { shouldShowIntro, markIntroDone } from "@/lib/introState";
import { audioManager } from "@/lib/audio";

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

function GlobalClickSound() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("button, [role='button']")) audioManager.playClick();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);
  return null;
}

function PhaseNavigator() {
  const { state } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const safePaths = ["/", "/warroom", "/hub", "/towers", "/town", "/shop", "/arena-demo", "/sprites", "/sprite-test"];
    if (safePaths.includes(location.pathname)) return;
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
      background: "rgba(15,10,25,0.95)",
      color: "#f5f3ee",
      textAlign: "center",
      padding: "0.6rem 1rem",
      fontFamily: "'Cinzel', serif",
      fontSize: "0.85rem",
      letterSpacing: "0.08em",
      backdropFilter: "blur(4px)",
      borderBottom: "1px solid rgba(221,226,236,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.6rem",
    }}>
      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#c8d4e6", boxShadow: "0 0 6px rgba(200,212,230,0.5)", animation: "pulse 1.4s ease-in-out infinite" }} />
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
        <GlobalClickSound />
        <PhaseNavigator />
        <OpponentReconnectingBanner />
        <MusicControls />
        <Routes>
          <Route path="/" element={<TitleScreen />} />
          <Route element={<RequireAuth><MenuShell /></RequireAuth>}>
            <Route path="/warroom" element={<WarRoom />} />
            <Route path="/towers" element={<TowersPage />} />
            <Route path="/town" element={<TownPage />} />
            <Route path="/hub" element={<GatheringHub />} />
            <Route path="/shop" element={<ShopPage />} />
          </Route>
          <Route path="/lobby" element={<RequireAuth><Lobby /></RequireAuth>} />
          <Route path="/sprites" element={<RequireAuth><SpritePreview /></RequireAuth>} />
          <Route path="/preselect" element={<RequireAuth><PreSelection /></RequireAuth>} />
          <Route path="/battleselect" element={<RequireAuth><BattleSelect /></RequireAuth>} />
          <Route path="/place" element={<RequireAuth><Placement /></RequireAuth>} />
          <Route path="/battle" element={<RequireAuth><Battle /></RequireAuth>} />
          <Route path="/gameover" element={<RequireAuth><GameOver /></RequireAuth>} />
          <Route path="/arena-demo" element={<RequireAuth><ArenaDemo /></RequireAuth>} />
          <Route path="/sprite-test" element={<SpriteTestPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </SettingsProvider>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const skipIntro = !shouldShowIntro() || window.location.pathname.endsWith("/sprite-test");
  const [introComplete, setIntroComplete] = useState(skipIntro);

  if (!clerkPubKey) {
    return (
      <div style={{ color: "#dde2ec", background: "#07040f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "serif" }}>
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
          <IntroSequence onComplete={() => { markIntroDone(); setIntroComplete(true); }} />
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
