import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
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
  const [, navigate] = useLocation();

  const phase = state.phase;

  if (phase === "lobby" || phase === "waiting") return <Lobby />;
  if (phase === "preselection") return <PreSelection />;
  if (phase === "placement") return <Placement />;
  if (phase === "battle") return <Battle />;
  if (phase === "gameover") return <GameOver />;
  return <Lobby />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <SocketProvider>
          <Switch>
            <Route path="/" component={GameRouter} />
            <Route path="/:rest*" component={GameRouter} />
          </Switch>
        </SocketProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
