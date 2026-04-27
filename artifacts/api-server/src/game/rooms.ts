import { randomUUID } from "crypto";
import type { Server, Socket } from "socket.io";
import type { RoomState, PlayerAction, Side, SideState } from "./types.js";
import { assignRosters, getUnitDef, shuffleArray, ALL_UNITS } from "./units.js";
import { createGridUnits, resolveTurn, checkWinner } from "./engine.js";
import { logger } from "../lib/logger.js";

const rooms = new Map<string, RoomState>();
const socketToRoom = new Map<string, { code: string; side: Side }>();
const sessionTokenToRoom = new Map<string, { code: string; side: Side }>();

const SILENT_GRACE_MS = 8_000;
const TOTAL_GRACE_MS = 30_000;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateCode() : code;
}

function getRosterDefs(ids: string[]) {
  return ids.map((id) => getUnitDef(id)).filter(Boolean);
}

function buildReconnectPayload(room: RoomState, side: Side) {
  const sideState = side === "A" ? room.sideA : room.sideB!;
  const otherState = side === "A" ? room.sideB : room.sideA;
  const phase = room.phase;

  const base = { phase, side, code: room.code };

  if (phase === "waiting") {
    return {
      ...base,
      myRoster: getRosterDefs(sideState.roster),
    };
  }

  if (phase === "preselection") {
    return {
      ...base,
      myRoster: getRosterDefs(sideState.roster),
      enemyRoster: getRosterDefs(otherState?.roster ?? []),
      picksSubmitted: !!sideState.picks,
      submittedPickIds: sideState.picks ?? null,
      opponentPicksLocked: !!otherState?.picks,
    };
  }

  if (phase === "placement") {
    return {
      ...base,
      myPicks: getRosterDefs(sideState.picks ?? []),
      enemyPicks: getRosterDefs(otherState?.picks ?? []),
      placementSubmitted: !!sideState.placement,
      submittedPlacement: sideState.placement ?? null,
    };
  }

  if (phase === "battle") {
    const myUnits = room.battleState.filter((u) => u.side === side);
    const enemyUnits = room.battleState.filter((u) => u.side !== side);
    return {
      ...base,
      myUnits,
      enemyUnits,
      turnNumber: room.turnNumber,
      actionsSubmitted: !!sideState.actions,
    };
  }

  if (phase === "gameover") {
    const myUnits = room.battleState.filter((u) => u.side === side);
    const enemyUnits = room.battleState.filter((u) => u.side !== side);
    return {
      ...base,
      winner: room.winner,
      myUnits,
      enemyUnits,
      turnNumber: room.turnNumber,
    };
  }

  return base;
}

function handlePlayerDisconnect(io: Server, socket: Socket, room: RoomState, side: Side) {
  const otherSide: Side = side === "A" ? "B" : "A";
  const otherState: SideState | undefined = otherSide === "A" ? room.sideA : room.sideB;

  if (room.disconnectTimers[side]) {
    clearTimeout(room.disconnectTimers[side]);
  }

  const silentTimer = setTimeout(() => {
    const sideState = side === "A" ? room.sideA : room.sideB!;
    const stillConnected = io.sockets.sockets.has(sideState.socketId);
    if (stillConnected) return;

    if (otherState) {
      io.to(otherState.socketId).emit("opponentReconnecting", {});
    }

    const hardTimer = setTimeout(() => {
      const sideState2 = side === "A" ? room.sideA : room.sideB!;
      const stillConnected2 = io.sockets.sockets.has(sideState2.socketId);
      if (stillConnected2) return;

      sessionTokenToRoom.delete(sideState2.sessionToken);
      socketToRoom.delete(sideState2.socketId);

      if (room.phase === "waiting") {
        rooms.delete(room.code);
      } else {
        if (otherState) {
          io.to(otherState.socketId).emit("opponentDisconnected", {});
        }
        rooms.delete(room.code);
      }

      logger.info({ code: room.code, side }, "Player permanently disconnected after grace period");
    }, TOTAL_GRACE_MS - SILENT_GRACE_MS);

    room.disconnectTimers[side] = hardTimer;
  }, SILENT_GRACE_MS);

  room.disconnectTimers[side] = silentTimer;
}

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("reconnectSession", ({ token }: { token: string }) => {
      const info = sessionTokenToRoom.get(token);
      if (!info) {
        socket.emit("reconnectFailed", { message: "Session expired or not found" });
        return;
      }

      const room = rooms.get(info.code);
      if (!room) {
        sessionTokenToRoom.delete(token);
        socket.emit("reconnectFailed", { message: "Room no longer exists" });
        return;
      }

      const side = info.side;
      const sideState = side === "A" ? room.sideA : room.sideB!;

      if (room.disconnectTimers[side]) {
        clearTimeout(room.disconnectTimers[side]);
        room.disconnectTimers[side] = undefined;
      }

      socketToRoom.delete(sideState.socketId);
      sideState.socketId = socket.id;
      socketToRoom.set(socket.id, { code: info.code, side });
      socket.join(info.code);

      const otherSide: Side = side === "A" ? "B" : "A";
      const otherState: SideState | undefined = otherSide === "A" ? room.sideA : room.sideB;

      if (otherState) {
        io.to(otherState.socketId).emit("opponentReconnected", {});
      }

      const payload = buildReconnectPayload(room, side);
      socket.emit("reconnectSuccess", payload);

      logger.info({ code: info.code, side }, "Player reconnected via session token");
    });

    socket.on("createRoom", () => {
      const code = generateCode();
      const { rosterA, rosterB } = assignRosters();
      const sessionToken = randomUUID();
      const room: RoomState = {
        code,
        phase: "waiting",
        sideA: { socketId: socket.id, sessionToken, roster: rosterA },
        battleState: [],
        turnNumber: 0,
        disconnectTimers: {},
      };
      rooms.set(code, room);
      socketToRoom.set(socket.id, { code, side: "A" });
      sessionTokenToRoom.set(sessionToken, { code, side: "A" });
      socket.join(code);
      socket.emit("roomCreated", {
        code,
        side: "A",
        roster: getRosterDefs(rosterA),
        sessionToken,
      });
      logger.info({ code, socketId: socket.id }, "Room created");
    });

    socket.on("joinRoom", ({ code }: { code: string }) => {
      const room = rooms.get(code.toUpperCase());
      if (!room) {
        socket.emit("gameError", { message: "Room not found" });
        return;
      }
      if (room.sideB) {
        socket.emit("gameError", { message: "Room is full" });
        return;
      }
      if (room.phase !== "waiting") {
        socket.emit("gameError", { message: "Game already started" });
        return;
      }

      const allIds = shuffleArray(ALL_UNITS.map((u) => u.id));
      const finalRosterB = allIds.filter((id) => !room.sideA.roster.includes(id)).slice(0, 6);

      const normalizedCode = code.toUpperCase();
      const sessionToken = randomUUID();
      room.sideB = { socketId: socket.id, sessionToken, roster: finalRosterB };
      room.phase = "preselection";
      socketToRoom.set(socket.id, { code: normalizedCode, side: "B" });
      sessionTokenToRoom.set(sessionToken, { code: normalizedCode, side: "B" });
      socket.join(normalizedCode);

      const rosterADefs = getRosterDefs(room.sideA.roster);
      const rosterBDefs = getRosterDefs(finalRosterB);

      io.to(room.sideA.socketId).emit("roomReady", {
        code: normalizedCode,
        side: "A",
        myRoster: rosterADefs,
        enemyRoster: rosterBDefs,
      });
      socket.emit("roomReady", {
        code: normalizedCode,
        side: "B",
        myRoster: rosterBDefs,
        enemyRoster: rosterADefs,
        sessionToken,
      });
      logger.info({ code: normalizedCode }, "Both players joined — preselection");
    });

    socket.on("submitPicks", ({ picks }: { picks: string[] }) => {
      const info = socketToRoom.get(socket.id);
      if (!info) return;
      const room = rooms.get(info.code);
      if (!room) return;
      if (room.phase !== "preselection") return;

      const sideState = info.side === "A" ? room.sideA : room.sideB;
      if (!sideState) return;

      const uniquePicks = [...new Set(picks.filter((id) => sideState.roster.includes(id)))].slice(0, 4);
      if (uniquePicks.length !== 4) {
        socket.emit("gameError", { message: "Must pick exactly 4 distinct units from your roster" });
        return;
      }
      sideState.picks = uniquePicks;

      const otherSideState = info.side === "A" ? room.sideB : room.sideA;
      if (otherSideState && otherSideState.picks) {
        room.phase = "placement";
        io.to(room.sideA.socketId).emit("picksReady", {
          myPicks: getRosterDefs(room.sideA.picks!),
          enemyPicks: getRosterDefs(room.sideB!.picks!),
        });
        io.to(room.sideB!.socketId).emit("picksReady", {
          myPicks: getRosterDefs(room.sideB!.picks!),
          enemyPicks: getRosterDefs(room.sideA.picks!),
        });
      } else {
        socket.emit("picksSubmitted", {});
        io.to(info.code).except(socket.id).emit("opponentPicksLocked", {});
      }
      logger.info({ code: info.code, side: info.side }, "Picks submitted");
    });

    socket.on(
      "submitPlacement",
      ({ placement }: { placement: { unitId: string; x: number; y: number }[] }) => {
        const info = socketToRoom.get(socket.id);
        if (!info) return;
        const room = rooms.get(info.code);
        if (!room) return;
        if (room.phase !== "placement") return;

        const sideState = info.side === "A" ? room.sideA : room.sideB;
        if (!sideState) return;

        const picks = sideState.picks ?? [];
        if (placement.length !== 4) {
          socket.emit("gameError", { message: "Must place exactly 4 units" });
          return;
        }
        const invalidUnit = placement.find((p) => !picks.includes(p.unitId));
        if (invalidUnit) {
          socket.emit("gameError", { message: `Unit ${invalidUnit.unitId} was not in your picks` });
          return;
        }
        const unitIdSet = new Set(placement.map((p) => p.unitId));
        if (unitIdSet.size !== placement.length) {
          socket.emit("gameError", { message: "Duplicate unit in placement" });
          return;
        }
        const posSet = new Set(placement.map((p) => `${p.x},${p.y}`));
        if (posSet.size !== 4) {
          socket.emit("gameError", { message: "Duplicate placement positions" });
          return;
        }
        const outOfBounds = placement.find((p) => p.x < 0 || p.x > 3 || p.y < 0 || p.y > 3);
        if (outOfBounds) {
          socket.emit("gameError", { message: `Placement position out of bounds` });
          return;
        }

        sideState.placement = placement;

        const otherSide = info.side === "A" ? room.sideB : room.sideA;
        if (otherSide && otherSide.placement) {
          try {
            const unitsA = createGridUnits(room.sideA.picks!, room.sideA.placement!, "A");
            const unitsB = createGridUnits(room.sideB!.picks!, room.sideB!.placement!, "B");
            room.battleState = [...unitsA, ...unitsB];
            room.phase = "battle";
            room.turnNumber = 1;

            io.to(room.sideA.socketId).emit("battleStart", {
              myUnits: unitsA,
              enemyUnits: unitsB,
              turnNumber: 1,
            });
            io.to(room.sideB!.socketId).emit("battleStart", {
              myUnits: unitsB,
              enemyUnits: unitsA,
              turnNumber: 1,
            });
          } catch (err) {
            logger.error({ err }, "Failed to start battle");
          }
        } else {
          socket.emit("placementSubmitted", {});
          io.to(info.code).except(socket.id).emit("opponentPlacementReady", {});
        }
        logger.info({ code: info.code, side: info.side }, "Placement submitted");
      }
    );

    socket.on("submitActions", ({ actions }: { actions: PlayerAction[] }) => {
      const info = socketToRoom.get(socket.id);
      if (!info) return;
      const room = rooms.get(info.code);
      if (!room) return;
      if (room.phase !== "battle") return;

      const sideState = info.side === "A" ? room.sideA : room.sideB;
      if (!sideState) return;

      const ownedAliveIds = room.battleState
        .filter((u) => u.side === info.side && u.alive)
        .map((u) => u.instanceId);
      const actionUnitIds = actions.map((a) => a.unitInstanceId);
      const foreignAction = actionUnitIds.find((id) => !ownedAliveIds.includes(id));
      if (foreignAction) {
        socket.emit("gameError", { message: `Unit ${foreignAction} is not your alive unit` });
        return;
      }
      const uniqueActingIds = new Set(actionUnitIds);
      if (uniqueActingIds.size !== actionUnitIds.length) {
        socket.emit("gameError", { message: "Duplicate actions for the same unit" });
        return;
      }
      if (actions.length !== ownedAliveIds.length) {
        socket.emit("gameError", { message: `Must submit exactly ${ownedAliveIds.length} actions (one per alive unit)` });
        return;
      }
      sideState.actions = actions;

      const otherSide = info.side === "A" ? room.sideB : room.sideA;
      if (otherSide && otherSide.actions) {
        const actionsA = room.sideA.actions ?? [];
        const actionsB = room.sideB!.actions ?? [];
        const { events, newState } = resolveTurn(room.battleState, actionsA, actionsB);

        room.battleState = newState;
        room.turnNumber++;
        room.sideA.actions = undefined;
        room.sideB!.actions = undefined;

        const winner = checkWinner(newState);
        if (winner) {
          room.phase = "gameover";
          room.winner = winner;
          io.to(info.code).emit("gameOver", {
            winner,
            events,
            newState,
          });
        } else {
          io.to(room.sideA.socketId).emit("turnResult", {
            events,
            myUnits: newState.filter((u) => u.side === "A"),
            enemyUnits: newState.filter((u) => u.side === "B"),
            turnNumber: room.turnNumber,
          });
          io.to(room.sideB!.socketId).emit("turnResult", {
            events,
            myUnits: newState.filter((u) => u.side === "B"),
            enemyUnits: newState.filter((u) => u.side === "A"),
            turnNumber: room.turnNumber,
          });
        }
        logger.info({ code: info.code }, `Turn ${room.turnNumber - 1} resolved`);
      } else {
        socket.emit("actionsSubmitted", {});
        io.to(info.code).except(socket.id).emit("opponentActionsReady", {});
      }
    });

    socket.on("requestRematch", () => {
      const info = socketToRoom.get(socket.id);
      if (!info) return;
      const room = rooms.get(info.code);
      if (!room || room.phase !== "gameover") return;

      room.phase = "preselection";
      room.battleState = [];
      room.turnNumber = 0;
      room.winner = undefined;

      const { rosterA, rosterB } = assignRosters();
      room.sideA.roster = rosterA;
      room.sideA.picks = undefined;
      room.sideA.placement = undefined;
      room.sideA.actions = undefined;
      if (room.sideB) {
        room.sideB.roster = rosterB;
        room.sideB.picks = undefined;
        room.sideB.placement = undefined;
        room.sideB.actions = undefined;
      }

      io.to(room.sideA.socketId).emit("rematchReady", {
        side: "A",
        myRoster: getRosterDefs(rosterA),
        enemyRoster: getRosterDefs(rosterB),
      });
      if (room.sideB) {
        io.to(room.sideB.socketId).emit("rematchReady", {
          side: "B",
          myRoster: getRosterDefs(rosterB),
          enemyRoster: getRosterDefs(rosterA),
        });
      }
    });

    socket.on("leaveRoom", () => {
      const info = socketToRoom.get(socket.id);
      if (!info) return;
      const room = rooms.get(info.code);
      socketToRoom.delete(socket.id);
      socket.leave(info.code);
      if (room) {
        const sideState = info.side === "A" ? room.sideA : room.sideB;
        if (sideState) {
          sessionTokenToRoom.delete(sideState.sessionToken);
        }
        if (room.disconnectTimers.A) clearTimeout(room.disconnectTimers.A);
        if (room.disconnectTimers.B) clearTimeout(room.disconnectTimers.B);
        if (room.phase === "waiting" || !room.sideB) {
          rooms.delete(info.code);
        } else {
          io.to(info.code).emit("opponentDisconnected", {});
          rooms.delete(info.code);
        }
      }
      logger.info({ code: info.code, side: info.side }, "Player left room voluntarily");
    });

    socket.on("disconnect", () => {
      const info = socketToRoom.get(socket.id);
      logger.info({ socketId: socket.id }, "Socket disconnected");
      if (info) {
        const room = rooms.get(info.code);
        if (room) {
          handlePlayerDisconnect(io, socket, room, info.side);
        } else {
          socketToRoom.delete(socket.id);
        }
      }
    });
  });
}
