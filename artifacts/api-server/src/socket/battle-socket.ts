import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { eq } from "drizzle-orm";
import { db, battlesTable, usersTable, submissionsTable } from "@workspace/db";
import { verifyToken } from "../lib/auth";
import { updateElo } from "../lib/elo";
import { logger } from "../lib/logger";

interface BattleRoom {
  player1SocketId?: string;
  player2SocketId?: string;
  player1UserId?: number;
  player2UserId?: number;
  startTime?: Date;
  timerInterval?: ReturnType<typeof setInterval>;
}

const battleRooms = new Map<number, BattleRoom>();

export function getBattleSocketState() {
  return battleRooms;
}

export function initSocket(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/ws/socket.io",
  });

  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("joinRoom", async ({ battleId, userId, token }: { battleId: number; userId: number; token?: string }) => {
      try {
        // Verify auth if token provided
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
          battleRooms.set(battleId, {});
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

        // If both players connected and battle is active, emit start
        if (battle.status === "active" && room.player1SocketId && room.player2SocketId) {
          io.to(`battle:${battleId}`).emit("battleStarted", {
            battleId,
            startTime: battle.startTime?.toISOString(),
          });
        }

        socket.emit("joinedRoom", { battleId, status: battle.status });
      } catch (err) {
        logger.error({ err }, "joinRoom error");
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("submitBattle", async ({ battleId, userId, submissionId }: { battleId: number; userId: number; submissionId: number }) => {
      try {
        // Poll for verdict
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

        // Broadcast verdict to room
        io.to(`battle:${battleId}`).emit("opponentSubmitted", {
          userId,
          verdict: submission.verdict,
        });

        socket.emit("verdictReceived", {
          submissionId,
          verdict: submission.verdict,
          executionTime: submission.executionTime,
        });

        // If accepted, end the battle
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

            // Update ELO ratings
            if (updatedBattle.player1Id && updatedBattle.player2Id) {
              const [p1] = await db.select().from(usersTable).where(eq(usersTable.id, updatedBattle.player1Id)).limit(1);
              const [p2] = await db.select().from(usersTable).where(eq(usersTable.id, updatedBattle.player2Id)).limit(1);

              if (p1 && p2) {
                const player1Won = updatedBattle.winnerId === p1.id;
                const { newRating1, newRating2 } = updateElo(p1.rating, p2.rating, player1Won);

                await db.update(usersTable)
                  .set({
                    rating: newRating1,
                    wins: player1Won ? p1.wins + 1 : p1.wins,
                    losses: player1Won ? p1.losses : p1.losses + 1,
                  })
                  .where(eq(usersTable.id, p1.id));

                await db.update(usersTable)
                  .set({
                    rating: newRating2,
                    wins: player1Won ? p2.wins : p2.wins + 1,
                    losses: player1Won ? p2.losses + 1 : p2.losses,
                  })
                  .where(eq(usersTable.id, p2.id));
              }
            }

            const winnerUser = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

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

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });

  return io;
}
