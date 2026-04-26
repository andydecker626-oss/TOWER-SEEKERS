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

interface GameState {
  phase: Phase;
  roomCode: string | null;
  mySide: Side | null;
  myRoster: UnitDef[];
  enemyRoster: UnitDef[];
  myPicks: UnitDef[];
  enemyPicks: UnitDef[];
  myUnits: GridUnit[];
  enemyUnits: GridUnit[];
  turnNumber: number;
  isWaitingForOpponent: boolean;
  winner: Side | null;
  pendingEvents: TurnEvent[] | null;
  /** Set when server signals game-over; Battle stays mounted to play final animations */
  pendingGameOver: Side | null;
  errorMsg: string | null;
}

const initial: GameState = {
  phase: "lobby",
  pendingGameOver: null,
  roomCode: null,
  mySide: null,
  myRoster: [],
  enemyRoster: [],
  myPicks: [],
  enemyPicks: [],
  myUnits: [],
  enemyUnits: [],
  turnNumber: 0,
  isWaitingForOpponent: false,
  winner: null,
  pendingEvents: null,
  errorMsg: null,
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
  | { type: "ERROR"; message: string }
  | { type: "CLEAR_PENDING_EVENTS" }
  | { type: "RESET" };

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
      return state;
    case "PICKS_READY":
      return {
        ...state,
        phase: "placement",
        myPicks: action.myPicks,
        enemyPicks: action.enemyPicks,
        isWaitingForOpponent: false,
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
        // Stay in battle phase so Battle plays final animations before dismounting
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
    case "OPPONENT_DISCONNECTED":
      return {
        ...state,
        errorMsg: "Opponent disconnected",
        phase: "lobby",
      };
    case "ERROR":
      return { ...state, errorMsg: action.message };
    case "CLEAR_PENDING_EVENTS":
      return { ...state, pendingEvents: null };
    case "RESET":
      return { ...initial };
    default:
      return state;
  }
}

interface SocketContextValue {
  state: GameState;
  connected: boolean;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  submitPicks: (picks: string[]) => void;
  submitPlacement: (placement: { unitId: string; x: number; y: number }[]) => void;
  submitActions: (actions: PlayerAction[]) => void;
  requestRematch: () => void;
  reset: () => void;
  clearPendingEvents: () => void;
  confirmGameOver: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [connected, setConnected] = React.useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
    const socket = io(apiBase, {
      path: "/api/socket.io",
      autoConnect: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("roomCreated", (data: { code: string; side: Side; roster: UnitDef[] }) => {
      dispatch({ type: "ROOM_CREATED", ...data });
    });
    socket.on(
      "roomReady",
      (data: { code: string; side: Side; myRoster: UnitDef[]; enemyRoster: UnitDef[] }) => {
        dispatch({ type: "ROOM_READY", ...data });
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
    socket.on("opponentDisconnected", () =>
      dispatch({ type: "OPPONENT_DISCONNECTED" })
    );
    socket.on("error", ({ message }: { message: string }) => {
      dispatch({ type: "ERROR", message });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback(() => {
    socketRef.current?.emit("createRoom");
  }, []);

  const joinRoom = useCallback((code: string) => {
    socketRef.current?.emit("joinRoom", { code });
  }, []);

  const submitPicks = useCallback((picks: string[]) => {
    socketRef.current?.emit("submitPicks", { picks });
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

  const reset = useCallback(() => {
    socketRef.current?.emit("leaveRoom");
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
        createRoom,
        joinRoom,
        submitPicks,
        submitPlacement,
        submitActions,
        requestRematch,
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
