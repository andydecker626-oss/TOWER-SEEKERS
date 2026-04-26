import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SocketProvider, useSocket } from "@/context/SocketContext";
import Lobby from "@/pages/Lobby";
import PreSelection from "@/pages/PreSelection";
import Placement from "@/pages/Placement";
import Battle from "@/pages/Battle";
import GameOver from "@/pages/GameOver";

const queryClient = new QueryClient();

function GameRouter() {
  const { state } = useSocket();
  const phase = state.phase;

  if (phase === "lobby" || phase === "waiting") return <Lobby />;
  if (phase === "preselection") return <PreSelection />;
  if (phase === "placement") return <Placement />;
  if (phase === "battle") return <Battle />;
  if (phase === "gameover") return <GameOver />;
  return <Lobby />;
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={base}>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<GameRouter />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
