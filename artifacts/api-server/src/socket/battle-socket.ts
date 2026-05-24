import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { eq } from "drizzle-orm";
import { db, battlesTable, usersTable, submissionsTable } from "@workspace/db";
import { verifyToken } from "../lib/auth";
import { updateElo } from "../lib/elo";
import { logger } from "../lib/logger";

interface PlayerCodeState {
  code: string;
  language: string;
  lastVerdict?: string;
}

interface BattleRoom {
  player1SocketId?: string;
  player2SocketId?: string;
  player1UserId?: number;
  player2UserId?: number;
  startTime?: Date;
  timerInterval?: ReturnType<typeof setInterval>;
  spectatorSocketIds: Set<string>;
  spectatorUsernames: Map<string, string>;
  playerCode: Map<number, PlayerCodeState>;
}

const battleRooms = new Map<number, BattleRoom>();

export function getBattleSocketState() {
  return battleRooms;
}

export function getActiveBattleSpectatorCounts(): Map<number, number> {
  const counts = new Map<number, number>();
  for (const [battleId, room] of battleRooms.entries()) {
    counts.set(battleId, room.spectatorSocketIds.size);
  }
  return counts;
}

function createRoom(): BattleRoom {
  return {
    spectatorSocketIds: new Set(),
    spectatorUsernames: new Map(),
    playerCode: new Map(),
  };
}

export function initSocket(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/ws/socket.io",
  });

  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    // ── Player joins their own battle ────────────────────────────────────────
    socket.on("joinRoom", async ({
      battleId, userId, token,
    }: { battleId: number; userId: number; token?: string }) => {
      try {
        if (token) {
          const payload = verifyToken(token);
          if (payload.userId !== userId) {
            socket.emit("error", { message: "Auth mismatch" });
            return;
          }
        }

        const [battle] = await db
          .select()
          .from(battlesTable)
          .where(eq(battlesTable.id, battleId))
          .limit(1);

        if (!battle) {
          socket.emit("error", { message: "Battle not found" });
          return;
        }

        socket.join(`battle:${battleId}`);

        if (!battleRooms.has(battleId)) {
          battleRooms.set(battleId, createRoom());
        }

        const room = battleRooms.get(battleId)!;

        if (battle.player1Id === userId) {
          room.player1SocketId = socket.id;
          room.player1UserId = userId;
        } else if (battle.player2Id === userId) {
          room.player2SocketId = socket.id;
          room.player2UserId = userId;
        }

        logger.info({ battleId, userId }, "Player joined room");

        // Send existing code state to reconnecting player
        const myCode = room.playerCode.get(userId);
        if (myCode) {
          socket.emit("codeState", { userId, ...myCode });
        }

        if (battle.status === "active" && room.player1SocketId && room.player2SocketId) {
          io.to(`battle:${battleId}`).emit("battleStarted", {
            battleId,
            startTime: battle.startTime?.toISOString(),
          });
        }

        socket.emit("joinedRoom", { battleId, status: battle.status });

        // Broadcast updated spectator count
        io.to(`battle:${battleId}`).emit("spectatorCount", {
          count: room.spectatorSocketIds.size,
        });
      } catch (err) {
        logger.error({ err }, "joinRoom error");
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ── Spectator joins to watch ─────────────────────────────────────────────
    socket.on("spectate", async ({
      battleId, username,
    }: { battleId: number; username?: string }) => {
      try {
        const [battle] = await db
          .select()
          .from(battlesTable)
          .where(eq(battlesTable.id, battleId))
          .limit(1);

        if (!battle) {
          socket.emit("error", { message: "Battle not found" });
          return;
        }

        if (battle.status === "finished") {
          socket.emit("error", { message: "Battle already finished" });
          return;
        }

        socket.join(`battle:${battleId}`);

        if (!battleRooms.has(battleId)) {
          battleRooms.set(battleId, createRoom());
        }

        const room = battleRooms.get(battleId)!;
        room.spectatorSocketIds.add(socket.id);
        room.spectatorUsernames.set(socket.id, username ?? "Guest");

        logger.info({ battleId, spectatorSocketId: socket.id, username }, "Spectator joined");

        // Send current code state to the new spectator
        for (const [playerId, state] of room.playerCode.entries()) {
          socket.emit("codeUpdate", { userId: playerId, ...state });
        }

        socket.emit("spectating", {
          battleId,
          status: battle.status,
          spectatorCount: room.spectatorSocketIds.size,
        });

        // Broadcast updated spectator count to the whole room
        io.to(`battle:${battleId}`).emit("spectatorCount", {
          count: room.spectatorSocketIds.size,
        });
      } catch (err) {
        logger.error({ err }, "spectate error");
        socket.emit("error", { message: "Failed to spectate" });
      }
    });

    // ── Player broadcasts their code to spectators ───────────────────────────
    socket.on("codeUpdate", ({
      battleId, userId, code, language,
    }: { battleId: number; userId: number; code: string; language: string }) => {
      const room = battleRooms.get(battleId);
      if (!room) return;

      // Update stored code state
      room.playerCode.set(userId, {
        code,
        language,
        lastVerdict: room.playerCode.get(userId)?.lastVerdict,
      });

      // Forward to spectators (not back to the player who sent it)
      socket.to(`battle:${battleId}`).emit("codeUpdate", { userId, code, language });
    });

    // ── Player submits ────────────────────────────────────────────────────────
    socket.on("submitBattle", async ({
      battleId, userId, submissionId,
    }: { battleId: number; userId: number; submissionId: number }) => {
      try {
        const maxAttempts = 15;
        let submission;
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const [sub] = await db
            .select()
            .from(submissionsTable)
            .where(eq(submissionsTable.id, submissionId))
            .limit(1);
          if (sub && sub.verdict !== "pending") {
            submission = sub;
            break;
          }
        }

        if (!submission) {
          socket.emit("verdictReceived", { submissionId, verdict: "runtime_error" });
          return;
        }

        // Update stored verdict for spectators
        const room = battleRooms.get(battleId);
        if (room) {
          const existing = room.playerCode.get(userId);
          if (existing) {
            existing.lastVerdict = submission.verdict;
          }
        }

        io.to(`battle:${battleId}`).emit("opponentSubmitted", {
          userId,
          verdict: submission.verdict,
        });

        socket.emit("verdictReceived", {
          submissionId,
          verdict: submission.verdict,
          executionTime: submission.executionTime,
        });

        if (submission.verdict === "accepted") {
          const [battle] = await db
            .select()
            .from(battlesTable)
            .where(eq(battlesTable.id, battleId))
            .limit(1);

          if (battle && battle.status === "active") {
            const [updatedBattle] = await db
              .update(battlesTable)
              .set({ winnerId: userId, status: "finished", endTime: new Date() })
              .where(eq(battlesTable.id, battleId))
              .returning();

            if (updatedBattle.player1Id && updatedBattle.player2Id) {
              const [p1] = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.id, updatedBattle.player1Id))
                .limit(1);
              const [p2] = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.id, updatedBattle.player2Id))
                .limit(1);

              if (p1 && p2) {
                const player1Won = updatedBattle.winnerId === p1.id;
                const { newRating1, newRating2 } = updateElo(p1.rating, p2.rating, player1Won);

                await db.update(usersTable).set({
                  rating: newRating1,
                  wins: player1Won ? p1.wins + 1 : p1.wins,
                  losses: player1Won ? p1.losses : p1.losses + 1,
                }).where(eq(usersTable.id, p1.id));

                await db.update(usersTable).set({
                  rating: newRating2,
                  wins: player1Won ? p2.wins : p2.wins + 1,
                  losses: player1Won ? p2.losses + 1 : p2.losses,
                }).where(eq(usersTable.id, p2.id));
              }
            }

            const winnerUser = await db
              .select({ username: usersTable.username })
              .from(usersTable)
              .where(eq(usersTable.id, userId))
              .limit(1);

            io.to(`battle:${battleId}`).emit("battleEnded", {
              battleId,
              winnerId: userId,
              winnerUsername: winnerUser[0]?.username ?? "Unknown",
            });

            battleRooms.delete(battleId);
          }
        }
      } catch (err) {
        logger.error({ err }, "submitBattle error");
      }
    });

    // ── Disconnect: clean up spectator tracking ───────────────────────────────
    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
      for (const [battleId, room] of battleRooms.entries()) {
        if (room.spectatorSocketIds.has(socket.id)) {
          room.spectatorSocketIds.delete(socket.id);
          room.spectatorUsernames.delete(socket.id);
          io.to(`battle:${battleId}`).emit("spectatorCount", {
            count: room.spectatorSocketIds.size,
          });
        }
      }
    });
  });

  return io;
}
