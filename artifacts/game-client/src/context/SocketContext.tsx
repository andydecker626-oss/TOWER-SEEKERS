import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import type {
  Phase,
  Side,
  UnitDef,
  GridUnit,
  PlayerAction,
  TurnEvent,
} from "@/lib/types";

const SESSION_TOKEN_KEY = "ts_session_token";

interface GameState {
  phase: Phase;
  roomCode: string | null;
  mySide: Side | null;
  myRoster: UnitDef[];
  enemyRoster: UnitDef[];
  myPicks: UnitDef[];
  enemyPicks: UnitDef[];
  myBattlePicks: UnitDef[];
  enemyBattlePicks: UnitDef[];
  myUnits: GridUnit[];
  enemyUnits: GridUnit[];
  turnNumber: number;
  isWaitingForOpponent: boolean;
  winner: Side | null;
  pendingEvents: TurnEvent[] | null;
  pendingGameOver: Side | null;
  opponentPicksLocked: boolean;
  opponentBattlePicksLocked: boolean;
  errorMsg: string | null;
  opponentReconnecting: boolean;
  submittedPickIds: string[] | null;
  submittedBattlePickIds: string[] | null;
  submittedPlacement: { unitId: string; x: number; y: number }[] | null;
}

const initial: GameState = {
  phase: "lobby",
  pendingGameOver: null,
  opponentPicksLocked: false,
  opponentBattlePicksLocked: false,
  roomCode: null,
  mySide: null,
  myRoster: [],
  enemyRoster: [],
  myPicks: [],
  enemyPicks: [],
  myBattlePicks: [],
  enemyBattlePicks: [],
  myUnits: [],
  enemyUnits: [],
  turnNumber: 0,
  isWaitingForOpponent: false,
  winner: null,
  pendingEvents: null,
  errorMsg: null,
  opponentReconnecting: false,
  submittedPickIds: null,
  submittedBattlePickIds: null,
  submittedPlacement: null,
};

type ReconnectPayload =
  | { phase: "waiting"; side: Side; code: string; myRoster: UnitDef[] }
  | {
      phase: "preselection";
      side: Side;
      code: string;
      myRoster: UnitDef[];
      enemyRoster: UnitDef[];
      picksSubmitted: boolean;
      submittedPickIds: string[] | null;
      opponentPicksLocked: boolean;
    }
  | {
      phase: "battleselect";
      side: Side;
      code: string;
      myPicks: UnitDef[];
      enemyPicks: UnitDef[];
      battlePicksSubmitted: boolean;
      submittedBattlePickIds: string[] | null;
      enemyBattlePicksLocked: boolean;
    }
  | {
      phase: "placement";
      side: Side;
      code: string;
      myBattlePicks: UnitDef[];
      enemyBattlePicks: UnitDef[];
      placementSubmitted: boolean;
      submittedPlacement: { unitId: string; x: number; y: number }[] | null;
    }
  | {
      phase: "battle";
      side: Side;
      code: string;
      myUnits: GridUnit[];
      enemyUnits: GridUnit[];
      turnNumber: number;
      actionsSubmitted: boolean;
    }
  | {
      phase: "gameover";
      side: Side;
      code: string;
      winner: Side;
      myUnits: GridUnit[];
      enemyUnits: GridUnit[];
      turnNumber: number;
    };

type Action =
  | { type: "ROOM_CREATED"; code: string; side: Side; roster: UnitDef[] }
  | {
      type: "ROOM_READY";
      code: string;
      side: Side;
      myRoster: UnitDef[];
      enemyRoster: UnitDef[];
    }
  | { type: "OPPONENT_PICKS_LOCKED" }
  | { type: "PICKS_SUBMITTED" }
  | {
      type: "PICKS_READY";
      myPicks: UnitDef[];
      enemyPicks: UnitDef[];
    }
  | { type: "BATTLE_PICKS_SUBMITTED" }
  | { type: "OPPONENT_BATTLE_PICKS_LOCKED" }
  | {
      type: "BATTLE_PICKS_READY";
      myBattlePicks: UnitDef[];
      enemyBattlePicks: UnitDef[];
    }
  | { type: "OPPONENT_PLACEMENT_READY" }
  | { type: "PLACEMENT_SUBMITTED" }
  | {
      type: "BATTLE_START";
      myUnits: GridUnit[];
      enemyUnits: GridUnit[];
      turnNumber: number;
    }
  | { type: "ACTIONS_SUBMITTED" }
  | { type: "OPPONENT_ACTIONS_READY" }
  | {
      type: "TURN_RESULT";
      myUnits: GridUnit[];
      enemyUnits: GridUnit[];
      turnNumber: number;
      events: TurnEvent[];
    }
  | { type: "GAME_OVER"; winner: Side; events: TurnEvent[]; newState: GridUnit[] }
  | { type: "CONFIRM_GAME_OVER" }
  | {
      type: "REMATCH_READY";
      side: Side;
      myRoster: UnitDef[];
      enemyRoster: UnitDef[];
    }
  | { type: "OPPONENT_DISCONNECTED" }
  | { type: "OPPONENT_RECONNECTING" }
  | { type: "OPPONENT_RECONNECTED" }
  | { type: "RECONNECT_SUCCESS"; payload: ReconnectPayload }
  | { type: "ERROR"; message: string }
  | { type: "CLEAR_PENDING_EVENTS" }
  | { type: "RESET" }
  | {
      type: "WENT_BACK";
      toPhase: "preselection" | "battleselect";
      myPicks?: UnitDef[];
      enemyPicks?: UnitDef[];
    };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "ROOM_CREATED":
      return {
        ...state,
        phase: "waiting",
        roomCode: action.code,
        mySide: action.side,
        myRoster: action.roster,
        isWaitingForOpponent: true,
        errorMsg: null,
      };
    case "ROOM_READY":
      return {
        ...state,
        phase: "preselection",
        roomCode: action.code,
        mySide: action.side,
        myRoster: action.myRoster,
        enemyRoster: action.enemyRoster,
        isWaitingForOpponent: false,
        errorMsg: null,
      };
    case "PICKS_SUBMITTED":
      return { ...state, isWaitingForOpponent: true };
    case "OPPONENT_PICKS_LOCKED":
      return { ...state, opponentPicksLocked: true };
    case "PICKS_READY":
      return {
        ...state,
        phase: "battleselect",
        myPicks: action.myPicks,
        enemyPicks: action.enemyPicks,
        isWaitingForOpponent: false,
        opponentPicksLocked: false,
        submittedBattlePickIds: null,
        opponentBattlePicksLocked: false,
      };
    case "BATTLE_PICKS_SUBMITTED":
      return { ...state, isWaitingForOpponent: true };
    case "OPPONENT_BATTLE_PICKS_LOCKED":
      return { ...state, opponentBattlePicksLocked: true };
    case "BATTLE_PICKS_READY":
      return {
        ...state,
        phase: "placement",
        myBattlePicks: action.myBattlePicks,
        enemyBattlePicks: action.enemyBattlePicks,
        isWaitingForOpponent: false,
        opponentBattlePicksLocked: false,
      };
    case "PLACEMENT_SUBMITTED":
      return { ...state, isWaitingForOpponent: true };
    case "OPPONENT_PLACEMENT_READY":
      return state;
    case "BATTLE_START":
      return {
        ...state,
        phase: "battle",
        myUnits: action.myUnits,
        enemyUnits: action.enemyUnits,
        turnNumber: action.turnNumber,
        isWaitingForOpponent: false,
      };
    case "ACTIONS_SUBMITTED":
      return { ...state, isWaitingForOpponent: true };
    case "OPPONENT_ACTIONS_READY":
      return state;
    case "TURN_RESULT":
      return {
        ...state,
        myUnits: action.myUnits,
        enemyUnits: action.enemyUnits,
        turnNumber: action.turnNumber,
        pendingEvents: action.events,
        isWaitingForOpponent: false,
      };
    case "GAME_OVER": {
      const mySide = state.mySide!;
      const myNewUnits = action.newState.filter((u) => u.side === mySide);
      const enemyNewUnits = action.newState.filter((u) => u.side !== mySide);
      return {
        ...state,
        phase: "battle",
        winner: action.winner,
        myUnits: myNewUnits,
        enemyUnits: enemyNewUnits,
        pendingEvents: action.events,
        pendingGameOver: action.winner,
        isWaitingForOpponent: false,
      };
    }
    case "CONFIRM_GAME_OVER":
      return { ...state, phase: "gameover", pendingGameOver: null };
    case "REMATCH_READY":
      return {
        ...initial,
        phase: "preselection",
        roomCode: state.roomCode,
        mySide: action.side,
        myRoster: action.myRoster,
        enemyRoster: action.enemyRoster,
      };
    case "OPPONENT_RECONNECTING":
      return { ...state, opponentReconnecting: true };
    case "OPPONENT_RECONNECTED":
      return { ...state, opponentReconnecting: false };
    case "OPPONENT_DISCONNECTED":
      return {
        ...initial,
        errorMsg: "Opponent disconnected",
        phase: "lobby",
      };
    case "RECONNECT_SUCCESS": {
      const p = action.payload;
      if (p.phase === "waiting") {
        return {
          ...initial,
          phase: "waiting",
          roomCode: p.code,
          mySide: p.side,
          myRoster: p.myRoster,
          isWaitingForOpponent: true,
        };
      }
      if (p.phase === "preselection") {
        return {
          ...initial,
          phase: "preselection",
          roomCode: p.code,
          mySide: p.side,
          myRoster: p.myRoster,
          enemyRoster: p.enemyRoster,
          isWaitingForOpponent: p.picksSubmitted,
          opponentPicksLocked: p.opponentPicksLocked,
          submittedPickIds: p.submittedPickIds,
        };
      }
      if (p.phase === "battleselect") {
        return {
          ...initial,
          phase: "battleselect",
          roomCode: p.code,
          mySide: p.side,
          myPicks: p.myPicks,
          enemyPicks: p.enemyPicks,
          isWaitingForOpponent: p.battlePicksSubmitted,
          opponentBattlePicksLocked: p.enemyBattlePicksLocked,
          submittedBattlePickIds: p.submittedBattlePickIds,
        };
      }
      if (p.phase === "placement") {
        return {
          ...initial,
          phase: "placement",
          roomCode: p.code,
          mySide: p.side,
          myBattlePicks: p.myBattlePicks,
          enemyBattlePicks: p.enemyBattlePicks,
          isWaitingForOpponent: p.placementSubmitted,
          submittedPlacement: p.submittedPlacement,
        };
      }
      if (p.phase === "battle") {
        return {
          ...initial,
          phase: "battle",
          roomCode: p.code,
          mySide: p.side,
          myUnits: p.myUnits,
          enemyUnits: p.enemyUnits,
          turnNumber: p.turnNumber,
          isWaitingForOpponent: p.actionsSubmitted,
        };
      }
      if (p.phase === "gameover") {
        return {
          ...initial,
          phase: "gameover",
          roomCode: p.code,
          mySide: p.side,
          winner: p.winner,
          myUnits: p.myUnits,
          enemyUnits: p.enemyUnits,
          turnNumber: p.turnNumber,
        };
      }
      return state;
    }
    case "ERROR":
      return { ...state, errorMsg: action.message };
    case "CLEAR_PENDING_EVENTS":
      return { ...state, pendingEvents: null };
    case "RESET":
      return { ...initial };
    case "WENT_BACK":
      if (action.toPhase === "preselection") {
        return {
          ...state,
          phase: "preselection",
          isWaitingForOpponent: false,
          opponentPicksLocked: false,
          submittedPickIds: state.myPicks.map((p) => p.id),
          myBattlePicks: [],
          enemyBattlePicks: [],
          submittedBattlePickIds: null,
        };
      }
      if (action.toPhase === "battleselect") {
        return {
          ...state,
          phase: "battleselect",
          myPicks: action.myPicks ?? state.myPicks,
          enemyPicks: action.enemyPicks ?? state.enemyPicks,
          isWaitingForOpponent: false,
          opponentBattlePicksLocked: false,
          submittedBattlePickIds: null,
          myBattlePicks: [],
          enemyBattlePicks: [],
        };
      }
      return state;
    default:
      return state;
  }
}

interface SocketContextValue {
  state: GameState;
  connected: boolean;
  hasStoredSession: boolean;
  createRoom: () => void;
  createAiRoom: () => void;
  joinRoom: (code: string) => void;
  submitPicks: (picks: string[]) => void;
  submitBattlePicks: (battlePicks: string[]) => void;
  submitPlacement: (placement: { unitId: string; x: number; y: number }[]) => void;
  submitActions: (actions: PlayerAction[]) => void;
  requestRematch: () => void;
  requestGoBack: () => void;
  reset: () => void;
  clearPendingEvents: () => void;
  confirmGameOver: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [connected, setConnected] = React.useState(false);
  const [hasStoredSession, setHasStoredSession] = React.useState(
    () => !!localStorage.getItem(SESSION_TOKEN_KEY)
  );
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
    const socket = io(apiBase, {
      path: "/api/socket.io",
      autoConnect: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      if (token) {
        socket.emit("reconnectSession", { token });
      }
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("roomCreated", (data: { code: string; side: Side; roster: UnitDef[]; sessionToken: string }) => {
      localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
      setHasStoredSession(true);
      dispatch({ type: "ROOM_CREATED", code: data.code, side: data.side, roster: data.roster });
    });

    socket.on(
      "roomReady",
      (data: { code: string; side: Side; myRoster: UnitDef[]; enemyRoster: UnitDef[]; sessionToken?: string }) => {
        if (data.sessionToken) {
          localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
          setHasStoredSession(true);
        }
        dispatch({ type: "ROOM_READY", code: data.code, side: data.side, myRoster: data.myRoster, enemyRoster: data.enemyRoster });
      }
    );

    socket.on("picksSubmitted", () => dispatch({ type: "PICKS_SUBMITTED" }));
    socket.on("opponentPicksLocked", () => dispatch({ type: "OPPONENT_PICKS_LOCKED" }));
    socket.on(
      "picksReady",
      (data: { myPicks: UnitDef[]; enemyPicks: UnitDef[] }) => {
        dispatch({ type: "PICKS_READY", ...data });
      }
    );
    socket.on("battlePicksSubmitted", () => dispatch({ type: "BATTLE_PICKS_SUBMITTED" }));
    socket.on("opponentBattlePicksLocked", () => dispatch({ type: "OPPONENT_BATTLE_PICKS_LOCKED" }));
    socket.on(
      "battlePicksReady",
      (data: { myBattlePicks: UnitDef[]; enemyBattlePicks: UnitDef[] }) => {
        dispatch({ type: "BATTLE_PICKS_READY", ...data });
      }
    );
    socket.on("placementSubmitted", () => dispatch({ type: "PLACEMENT_SUBMITTED" }));
    socket.on("opponentPlacementReady", () =>
      dispatch({ type: "OPPONENT_PLACEMENT_READY" })
    );
    socket.on(
      "battleStart",
      (data: { myUnits: GridUnit[]; enemyUnits: GridUnit[]; turnNumber: number }) => {
        dispatch({ type: "BATTLE_START", ...data });
      }
    );
    socket.on("actionsSubmitted", () => dispatch({ type: "ACTIONS_SUBMITTED" }));
    socket.on("opponentActionsReady", () =>
      dispatch({ type: "OPPONENT_ACTIONS_READY" })
    );
    socket.on(
      "turnResult",
      (data: {
        myUnits: GridUnit[];
        enemyUnits: GridUnit[];
        turnNumber: number;
        events: TurnEvent[];
      }) => {
        dispatch({ type: "TURN_RESULT", ...data });
      }
    );
    socket.on(
      "gameOver",
      (data: { winner: Side; events: TurnEvent[]; newState: GridUnit[] }) => {
        dispatch({ type: "GAME_OVER", ...data });
      }
    );
    socket.on(
      "rematchReady",
      (data: { side: Side; myRoster: UnitDef[]; enemyRoster: UnitDef[] }) => {
        dispatch({ type: "REMATCH_READY", ...data });
      }
    );
    socket.on("opponentReconnecting", () =>
      dispatch({ type: "OPPONENT_RECONNECTING" })
    );
    socket.on("opponentReconnected", () =>
      dispatch({ type: "OPPONENT_RECONNECTED" })
    );
    socket.on("opponentDisconnected", () => {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setHasStoredSession(false);
      dispatch({ type: "OPPONENT_DISCONNECTED" });
    });
    socket.on("reconnectSuccess", (payload: ReconnectPayload) => {
      dispatch({ type: "RECONNECT_SUCCESS", payload });
    });
    socket.on("reconnectFailed", () => {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setHasStoredSession(false);
    });
    socket.on("gameError", ({ message }: { message: string }) => {
      dispatch({ type: "ERROR", message });
    });
    socket.on(
      "wentBack",
      (data: {
        toPhase: "preselection" | "battleselect";
        myPicks?: UnitDef[];
        enemyPicks?: UnitDef[];
      }) => {
        dispatch({ type: "WENT_BACK", ...data });
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback(() => {
    socketRef.current?.emit("createRoom");
  }, []);

  const createAiRoom = useCallback(() => {
    socketRef.current?.emit("createAiRoom");
  }, []);

  const joinRoom = useCallback((code: string) => {
    socketRef.current?.emit("joinRoom", { code });
  }, []);

  const submitPicks = useCallback((picks: string[]) => {
    socketRef.current?.emit("submitPicks", { picks });
  }, []);

  const submitBattlePicks = useCallback((battlePicks: string[]) => {
    socketRef.current?.emit("submitBattlePicks", { battlePicks });
  }, []);

  const submitPlacement = useCallback(
    (placement: { unitId: string; x: number; y: number }[]) => {
      socketRef.current?.emit("submitPlacement", { placement });
    },
    []
  );

  const submitActions = useCallback((actions: PlayerAction[]) => {
    socketRef.current?.emit("submitActions", { actions });
  }, []);

  const requestRematch = useCallback(() => {
    socketRef.current?.emit("requestRematch");
  }, []);

  const requestGoBack = useCallback(() => {
    socketRef.current?.emit("requestGoBack");
  }, []);

  const reset = useCallback(() => {
    socketRef.current?.emit("leaveRoom");
    localStorage.removeItem(SESSION_TOKEN_KEY);
    setHasStoredSession(false);
    dispatch({ type: "RESET" });
  }, []);

  const clearPendingEvents = useCallback(() => {
    dispatch({ type: "CLEAR_PENDING_EVENTS" });
  }, []);

  const confirmGameOver = useCallback(() => {
    dispatch({ type: "CONFIRM_GAME_OVER" });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        state,
        connected,
        hasStoredSession,
        createRoom,
        createAiRoom,
        joinRoom,
        submitPicks,
        submitBattlePicks,
        submitPlacement,
        submitActions,
        requestRematch,
        requestGoBack,
        reset,
        clearPendingEvents,
        confirmGameOver,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
}
