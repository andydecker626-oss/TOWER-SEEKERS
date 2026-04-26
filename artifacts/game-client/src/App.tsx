import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocketProvider, useSocket } from "@/context/SocketContext";
import type { Phase } from "@/lib/types";
import Lobby from "@/pages/Lobby";
import PreSelection from "@/pages/PreSelection";
import Placement from "@/pages/Placement";
import Battle from "@/pages/Battle";
import GameOver from "@/pages/GameOver";

const queryClient = new QueryClient();

const PHASE_ROUTES: Record<Phase, string> = {
  lobby: "/lobby",
  waiting: "/lobby",
  preselection: "/preselect",
  placement: "/place",
  battle: "/battle",
  gameover: "/gameover",
};

function PhaseNavigator() {
  const { state } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(PHASE_ROUTES[state.phase] ?? "/lobby", { replace: true });
  }, [state.phase]);

  return null;
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={base}>
        <SocketProvider>
          <PhaseNavigator />
          <Routes>
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/preselect" element={<PreSelection />} />
            <Route path="/place" element={<Placement />} />
            <Route path="/battle" element={<Battle />} />
            <Route path="/gameover" element={<GameOver />} />
            <Route path="*" element={<Navigate to="/lobby" replace />} />
          </Routes>
        </SocketProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
