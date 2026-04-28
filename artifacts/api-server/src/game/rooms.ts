import { randomUUID } from "crypto";
import type { Server, Socket } from "socket.io";
import type { RoomState, PlayerAction, Side, SideState, GridUnit } from "./types.js";
import { assignRosters, getUnitDef, shuffleArray, ALL_UNITS } from "./units.js";
import { createGridUnits, resolveTurn, checkWinner, crossGridDist, getAttackRange } from "./engine.js";
import { logger } from "../lib/logger.js";

const AI_SOCKET_ID = "AI_BOT";

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

// ─── AI helpers ──────────────────────────────────────────────────────────────

function aiPickUnits(roster: string[]): string[] {
  return roster.slice(0, 6);
}

function aiBattlePickUnits(picks: string[]): string[] {
  return picks.slice(0, 4);
}

function aiPlaceUnits(picks: string[]): { unitId: string; x: number; y: number }[] {
  // Place units across the front two columns of the AI side (x=3 is frontline)
  return picks.map((unitId, i) => ({
    unitId,
    x: 3 - Math.floor(i / 4),
    y: i % 4,
  }));
}

function generateAiActions(battleState: GridUnit[], aiSide: Side): PlayerAction[] {
  const aiUnits = battleState.filter((u) => u.side === aiSide && u.alive);
  const enemies = battleState.filter((u) => u.side !== aiSide && u.alive);

  const actions: PlayerAction[] = [];
  const pendingMoves = new Set<string>();

  for (const unit of aiUnits) {
    const def = getUnitDef(unit.defId);
    if (!def || enemies.length === 0) {
      actions.push({ unitInstanceId: unit.instanceId, type: "wait" });
      continue;
    }

    // Find nearest living enemy
    let nearest = enemies[0];
    let nearestDist = Infinity;
    for (const enemy of enemies) {
      const dist =
        aiSide === "A"
          ? crossGridDist(unit.x, unit.y, enemy.x, enemy.y)
          : crossGridDist(enemy.x, enemy.y, unit.x, unit.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    const attackRange = getAttackRange(def.baseAttackStyle);

    if (nearestDist <= attackRange) {
      actions.push({
        unitInstanceId: unit.instanceId,
        type: "attack",
        targetX: nearest.x,
        targetY: nearest.y,
      });
    } else {
      // Move toward the nearest enemy (greedy best step within moveDist)
      const occupiedBySide = new Set(
        battleState
          .filter((u) => u.side === aiSide && u.alive && u.instanceId !== unit.instanceId)
          .map((u) => `${u.x},${u.y}`)
      );

      let bestMove: { x: number; y: number } | null = null;
      let bestMoveDist = nearestDist;

      for (let dx = -def.moveDist; dx <= def.moveDist; dx++) {
        for (let dy = -def.moveDist; dy <= def.moveDist; dy++) {
          if (Math.abs(dx) + Math.abs(dy) > def.moveDist) continue;
          if (dx === 0 && dy === 0) continue;
          const nx = unit.x + dx;
          const ny = unit.y + dy;
          if (nx < 0 || nx > 3 || ny < 0 || ny > 3) continue;
          const posKey = `${nx},${ny}`;
          if (occupiedBySide.has(posKey) || pendingMoves.has(posKey)) continue;
          const d =
            aiSide === "A"
              ? crossGridDist(nx, ny, nearest.x, nearest.y)
              : crossGridDist(nearest.x, nearest.y, nx, ny);
          if (d < bestMoveDist) {
            bestMoveDist = d;
            bestMove = { x: nx, y: ny };
          }
        }
      }

      if (bestMove) {
        pendingMoves.add(`${bestMove.x},${bestMove.y}`);
        actions.push({
          unitInstanceId: unit.instanceId,
          type: "move",
          targetX: bestMove.x,
          targetY: bestMove.y,
        });
      } else {
        actions.push({ unitInstanceId: unit.instanceId, type: "wait" });
      }
    }
  }

  return actions;
}

// ─── Reconnection payload ────────────────────────────────────────────────────

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

  if (phase === "battleselect") {
    return {
      ...base,
      myPicks: getRosterDefs(sideState.picks ?? []),
      enemyPicks: getRosterDefs(otherState?.picks ?? []),
      battlePicksSubmitted: !!sideState.battlePicks,
      submittedBattlePickIds: sideState.battlePicks ?? null,
      enemyBattlePicksLocked: !!otherState?.battlePicks,
    };
  }

  if (phase === "placement") {
    return {
      ...base,
      myBattlePicks: getRosterDefs(sideState.battlePicks ?? []),
      enemyBattlePicks: getRosterDefs(otherState?.battlePicks ?? []),
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

// ─── Disconnect ──────────────────────────────────────────────────────────────

function handlePlayerDisconnect(io: Server, socket: Socket, room: RoomState, side: Side) {
  if (room.isAiRoom) return; // AI never disconnects

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

// ─── Socket handlers ─────────────────────────────────────────────────────────

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

      if (otherState && !room.isAiRoom) {
        io.to(otherState.socketId).emit("opponentReconnected", {});
      }

      const payload = buildReconnectPayload(room, side);
      socket.emit("reconnectSuccess", payload);

      logger.info({ code: info.code, side }, "Player reconnected via session token");
    });

    socket.on("createRoom", () => {
      const code = generateCode();
      const fullRoster = ALL_UNITS.map((u) => u.id);
      const sessionToken = randomUUID();
      const room: RoomState = {
        code,
        phase: "waiting",
        sideA: { socketId: socket.id, sessionToken, roster: fullRoster },
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
        roster: getRosterDefs(fullRoster),
        sessionToken,
      });
      logger.info({ code, socketId: socket.id }, "Room created");
    });

    // ── vs AI ────────────────────────────────────────────────────────────────
    socket.on("createAiRoom", () => {
      const code = generateCode();
      const fullRoster = ALL_UNITS.map((u) => u.id);
      const sessionToken = randomUUID();
      const room: RoomState = {
        code,
        phase: "preselection",
        isAiRoom: true,
        sideA: { socketId: socket.id, sessionToken, roster: fullRoster },
        sideB: { socketId: AI_SOCKET_ID, sessionToken: AI_SOCKET_ID, roster: fullRoster },
        battleState: [],
        turnNumber: 0,
        disconnectTimers: {},
      };
      rooms.set(code, room);
      socketToRoom.set(socket.id, { code, side: "A" });
      sessionTokenToRoom.set(sessionToken, { code, side: "A" });
      socket.join(code);
      socket.emit("roomReady", {
        code,
        side: "A",
        myRoster: getRosterDefs(fullRoster),
        enemyRoster: getRosterDefs(fullRoster),
        sessionToken,
      });
      logger.info({ code, socketId: socket.id }, "AI room created");
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

      const fullRoster = ALL_UNITS.map((u) => u.id);
      const normalizedCode = code.toUpperCase();
      const sessionToken = randomUUID();
      room.sideB = { socketId: socket.id, sessionToken, roster: fullRoster };
      room.phase = "preselection";
      socketToRoom.set(socket.id, { code: normalizedCode, side: "B" });
      sessionTokenToRoom.set(sessionToken, { code: normalizedCode, side: "B" });
      socket.join(normalizedCode);

      const fullRosterDefs = getRosterDefs(fullRoster);

      io.to(room.sideA.socketId).emit("roomReady", {
        code: normalizedCode,
        side: "A",
        myRoster: fullRosterDefs,
        enemyRoster: fullRosterDefs,
      });
      socket.emit("roomReady", {
        code: normalizedCode,
        side: "B",
        myRoster: fullRosterDefs,
        enemyRoster: fullRosterDefs,
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

      const uniquePicks = [...new Set(picks.filter((id) => sideState.roster.includes(id)))].slice(0, 6);
      if (uniquePicks.length !== 6) {
        socket.emit("gameError", { message: "Must pick exactly 6 distinct units from the roster" });
        return;
      }
      sideState.picks = uniquePicks;

      // AI auto-picks immediately after human picks
      if (room.isAiRoom && info.side === "A" && room.sideB && !room.sideB.picks) {
        room.sideB.picks = aiPickUnits(room.sideB.roster);
      }

      const otherSideState = info.side === "A" ? room.sideB : room.sideA;
      if (otherSideState && otherSideState.picks) {
        room.phase = "battleselect";
        socket.emit("picksReady", {
          myPicks: getRosterDefs(sideState.picks),
          enemyPicks: getRosterDefs(otherSideState.picks),
        });
        if (!room.isAiRoom) {
          io.to(otherSideState.socketId).emit("picksReady", {
            myPicks: getRosterDefs(otherSideState.picks),
            enemyPicks: getRosterDefs(sideState.picks),
          });
        }
      } else {
        socket.emit("picksSubmitted", {});
        if (!room.isAiRoom) {
          io.to(info.code).except(socket.id).emit("opponentPicksLocked", {});
        }
      }
      logger.info({ code: info.code, side: info.side }, "Picks submitted");
    });

    socket.on("submitBattlePicks", ({ battlePicks }: { battlePicks: string[] }) => {
      const info = socketToRoom.get(socket.id);
      if (!info) return;
      const room = rooms.get(info.code);
      if (!room) return;
      if (room.phase !== "battleselect") return;

      const sideState = info.side === "A" ? room.sideA : room.sideB;
      if (!sideState) return;

      const myPicks = sideState.picks ?? [];
      const uniqueBattlePicks = [...new Set(battlePicks.filter((id) => myPicks.includes(id)))].slice(0, 4);
      if (uniqueBattlePicks.length !== 4) {
        socket.emit("gameError", { message: "Must choose exactly 4 units from your party for battle" });
        return;
      }
      sideState.battlePicks = uniqueBattlePicks;

      if (room.isAiRoom && info.side === "A" && room.sideB && !room.sideB.battlePicks) {
        room.sideB.battlePicks = aiBattlePickUnits(room.sideB.picks ?? []);
      }

      const otherSideState = info.side === "A" ? room.sideB : room.sideA;
      if (otherSideState && otherSideState.battlePicks) {
        room.phase = "placement";
        socket.emit("battlePicksReady", {
          myBattlePicks: getRosterDefs(sideState.battlePicks),
          enemyBattlePicks: getRosterDefs(otherSideState.battlePicks),
        });
        if (!room.isAiRoom) {
          io.to(otherSideState.socketId).emit("battlePicksReady", {
            myBattlePicks: getRosterDefs(otherSideState.battlePicks),
            enemyBattlePicks: getRosterDefs(sideState.battlePicks),
          });
        }
      } else {
        socket.emit("battlePicksSubmitted", {});
        if (!room.isAiRoom) {
          io.to(info.code).except(socket.id).emit("opponentBattlePicksLocked", {});
        }
      }
      logger.info({ code: info.code, side: info.side }, "Battle picks submitted");
    });

    socket.on("requestGoBack", () => {
      const info = socketToRoom.get(socket.id);
      if (!info) return;
      const room = rooms.get(info.code);
      if (!room) return;

      if (room.phase === "battleselect") {
        room.phase = "preselection";
        room.sideA.battlePicks = undefined;
        if (room.sideB) room.sideB.battlePicks = undefined;

        socket.emit("wentBack", { toPhase: "preselection" });
        if (!room.isAiRoom && room.sideB) {
          io.to(room.sideB.socketId).emit("wentBack", { toPhase: "preselection" });
        }
        logger.info({ code: info.code, side: info.side }, "Went back to preselection");
      } else if (room.phase === "placement") {
        room.phase = "battleselect";
        room.sideA.placement = undefined;
        room.sideA.battlePicks = undefined;
        if (room.sideB) {
          room.sideB.placement = undefined;
          room.sideB.battlePicks = undefined;
        }

        const mySideState = info.side === "A" ? room.sideA : room.sideB;
        const otherSideState = info.side === "A" ? room.sideB : room.sideA;

        socket.emit("wentBack", {
          toPhase: "battleselect",
          myPicks: getRosterDefs(mySideState?.picks ?? []),
          enemyPicks: getRosterDefs(otherSideState?.picks ?? []),
        });
        if (!room.isAiRoom && room.sideB) {
          const otherSocketId = info.side === "A" ? room.sideB.socketId : room.sideA.socketId;
          io.to(otherSocketId).emit("wentBack", {
            toPhase: "battleselect",
            myPicks: getRosterDefs(otherSideState?.picks ?? []),
            enemyPicks: getRosterDefs(mySideState?.picks ?? []),
          });
        }
        logger.info({ code: info.code, side: info.side }, "Went back to battleselect");
      }
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

        const picks = sideState.battlePicks ?? [];
        if (placement.length !== picks.length) {
          socket.emit("gameError", { message: `Must place exactly ${picks.length} units` });
          return;
        }
        const invalidUnit = placement.find((p) => !picks.includes(p.unitId));
        if (invalidUnit) {
          socket.emit("gameError", { message: `Unit ${invalidUnit.unitId} was not in your battle party` });
          return;
        }
        const unitIdSet = new Set(placement.map((p) => p.unitId));
        if (unitIdSet.size !== placement.length) {
          socket.emit("gameError", { message: "Duplicate unit in placement" });
          return;
        }
        const posSet = new Set(placement.map((p) => `${p.x},${p.y}`));
        if (posSet.size !== placement.length) {
          socket.emit("gameError", { message: "Duplicate placement positions" });
          return;
        }
        const outOfBounds = placement.find((p) => p.x < 0 || p.x > 3 || p.y < 0 || p.y > 3);
        if (outOfBounds) {
          socket.emit("gameError", { message: `Placement position out of bounds` });
          return;
        }

        sideState.placement = placement;

        // AI auto-places immediately
        if (room.isAiRoom && info.side === "A" && room.sideB && !room.sideB.placement) {
          room.sideB.placement = aiPlaceUnits(room.sideB.battlePicks ?? []);
        }

        const otherSide = info.side === "A" ? room.sideB : room.sideA;
        if (otherSide && otherSide.placement) {
          try {
            const unitsA = createGridUnits(room.sideA.battlePicks!, room.sideA.placement!, "A");
            const unitsB = createGridUnits(room.sideB!.battlePicks!, room.sideB!.placement!, "B");
            room.battleState = [...unitsA, ...unitsB];
            room.phase = "battle";
            room.turnNumber = 1;

            socket.emit("battleStart", {
              myUnits: unitsA,
              enemyUnits: unitsB,
              turnNumber: 1,
            });
            if (!room.isAiRoom) {
              io.to(room.sideB!.socketId).emit("battleStart", {
                myUnits: unitsB,
                enemyUnits: unitsA,
                turnNumber: 1,
              });
            }
          } catch (err) {
            logger.error({ err }, "Failed to start battle");
          }
        } else {
          socket.emit("placementSubmitted", {});
          if (!room.isAiRoom) {
            io.to(info.code).except(socket.id).emit("opponentPlacementReady", {});
          }
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

      // AI generates its actions immediately after human submits
      if (room.isAiRoom && info.side === "A" && room.sideB && !room.sideB.actions) {
        room.sideB.actions = generateAiActions(room.battleState, "B");
      }

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
          socket.emit("gameOver", { winner, events, newState });
          if (!room.isAiRoom) {
            io.to(info.code).except(socket.id).emit("gameOver", { winner, events, newState });
          }
        } else {
          socket.emit("turnResult", {
            events,
            myUnits: newState.filter((u) => u.side === "A"),
            enemyUnits: newState.filter((u) => u.side === "B"),
            turnNumber: room.turnNumber,
          });
          if (!room.isAiRoom) {
            io.to(room.sideB!.socketId).emit("turnResult", {
              events,
              myUnits: newState.filter((u) => u.side === "B"),
              enemyUnits: newState.filter((u) => u.side === "A"),
              turnNumber: room.turnNumber,
            });
          }
        }
        logger.info({ code: info.code }, `Turn ${room.turnNumber - 1} resolved`);
      } else {
        socket.emit("actionsSubmitted", {});
        if (!room.isAiRoom) {
          io.to(info.code).except(socket.id).emit("opponentActionsReady", {});
        }
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

      const fullRoster = ALL_UNITS.map((u) => u.id);
      room.sideA.roster = fullRoster;
      room.sideA.picks = undefined;
      room.sideA.battlePicks = undefined;
      room.sideA.placement = undefined;
      room.sideA.actions = undefined;
      if (room.sideB) {
        room.sideB.roster = fullRoster;
        room.sideB.picks = undefined;
        room.sideB.battlePicks = undefined;
        room.sideB.placement = undefined;
        room.sideB.actions = undefined;
      }

      const fullRosterDefs = getRosterDefs(fullRoster);
      socket.emit("rematchReady", {
        side: "A",
        myRoster: fullRosterDefs,
        enemyRoster: fullRosterDefs,
      });

      if (!room.isAiRoom && room.sideB) {
        io.to(room.sideB.socketId).emit("rematchReady", {
          side: "B",
          myRoster: fullRosterDefs,
          enemyRoster: fullRosterDefs,
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
          if (!room.isAiRoom) {
            io.to(info.code).emit("opponentDisconnected", {});
          }
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
