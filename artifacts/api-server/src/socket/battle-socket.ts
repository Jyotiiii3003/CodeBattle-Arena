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

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  ts: number;
  role: "spectator" | "player" | "system";
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
  chatHistory: ChatMessage[];
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
    chatHistory: [],
  };
}

function makeSystemMessage(text: string): ChatMessage {
  return {
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    username: "ARENA",
    text,
    ts: Date.now(),
    role: "system",
  };
}

const MAX_CHAT_HISTORY = 200;

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

        const myCode = room.playerCode.get(userId);
        if (myCode) socket.emit("codeState", { userId, ...myCode });

        if (battle.status === "active" && room.player1SocketId && room.player2SocketId) {
          io.to(`battle:${battleId}`).emit("battleStarted", {
            battleId,
            startTime: battle.startTime?.toISOString(),
          });
        }

        socket.emit("joinedRoom", { battleId, status: battle.status });
        socket.emit("chatHistory", { messages: room.chatHistory });

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
        const displayName = username?.trim() || "Guest";
        room.spectatorSocketIds.add(socket.id);
        room.spectatorUsernames.set(socket.id, displayName);

        // Send current code state to new spectator
        for (const [playerId, state] of room.playerCode.entries()) {
          socket.emit("codeUpdate", { userId: playerId, ...state });
        }

        // Send chat history
        socket.emit("chatHistory", { messages: room.chatHistory });

        socket.emit("spectating", {
          battleId,
          status: battle.status,
          spectatorCount: room.spectatorSocketIds.size,
        });

        // Announce join in chat
        const joinMsg = makeSystemMessage(`👁 ${displayName} joined as spectator`);
        room.chatHistory.push(joinMsg);
        if (room.chatHistory.length > MAX_CHAT_HISTORY) room.chatHistory.shift();
        io.to(`battle:${battleId}`).emit("chat:message", joinMsg);

        io.to(`battle:${battleId}`).emit("spectatorCount", {
          count: room.spectatorSocketIds.size,
        });

        logger.info({ battleId, username: displayName }, "Spectator joined");
      } catch (err) {
        logger.error({ err }, "spectate error");
        socket.emit("error", { message: "Failed to spectate" });
      }
    });

    // ── Chat message from spectator or player ─────────────────────────────────
    socket.on("chat:send", ({
      battleId, username, text, role,
    }: { battleId: number; username: string; text: string; role?: "spectator" | "player" }) => {
      const room = battleRooms.get(battleId);
      if (!room) return;

      const trimmed = text?.trim().slice(0, 300);
      if (!trimmed) return;

      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        username: username?.trim().slice(0, 32) || "Anonymous",
        text: trimmed,
        ts: Date.now(),
        role: role ?? "spectator",
      };

      room.chatHistory.push(msg);
      if (room.chatHistory.length > MAX_CHAT_HISTORY) room.chatHistory.shift();

      io.to(`battle:${battleId}`).emit("chat:message", msg);
    });

    // ── Player broadcasts their code to spectators ───────────────────────────
    socket.on("codeUpdate", ({
      battleId, userId, code, language,
    }: { battleId: number; userId: number; code: string; language: string }) => {
      const room = battleRooms.get(battleId);
      if (!room) return;

      room.playerCode.set(userId, {
        code,
        language,
        lastVerdict: room.playerCode.get(userId)?.lastVerdict,
      });

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

        const room = battleRooms.get(battleId);
        if (room) {
          const existing = room.playerCode.get(userId);
          if (existing) existing.lastVerdict = submission.verdict;
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

        // Announce submission result in chat
        if (room) {
          const [user] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
          const uname = user?.username ?? "Player";
          const verdictLabel = submission.verdict.replace(/_/g, " ").toUpperCase();
          const submitMsg = makeSystemMessage(
            submission.verdict === "accepted"
              ? `🏆 ${uname} got ACCEPTED!`
              : `⚡ ${uname} submitted — ${verdictLabel}`
          );
          room.chatHistory.push(submitMsg);
          if (room.chatHistory.length > MAX_CHAT_HISTORY) room.chatHistory.shift();
          io.to(`battle:${battleId}`).emit("chat:message", submitMsg);
        }

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
              const [p1] = await db.select().from(usersTable).where(eq(usersTable.id, updatedBattle.player1Id)).limit(1);
              const [p2] = await db.select().from(usersTable).where(eq(usersTable.id, updatedBattle.player2Id)).limit(1);

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
          const username = room.spectatorUsernames.get(socket.id) ?? "Guest";
          room.spectatorSocketIds.delete(socket.id);
          room.spectatorUsernames.delete(socket.id);

          const leaveMsg = makeSystemMessage(`👁 ${username} left`);
          room.chatHistory.push(leaveMsg);
          if (room.chatHistory.length > MAX_CHAT_HISTORY) room.chatHistory.shift();
          io.to(`battle:${battleId}`).emit("chat:message", leaveMsg);

          io.to(`battle:${battleId}`).emit("spectatorCount", {
            count: room.spectatorSocketIds.size,
          });
        }
      }
    });
  });

  return io;
}
