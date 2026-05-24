import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, submissionsTable, battlesTable } from "@workspace/db";
import { GetUserProfileParams, GetUserSubmissionsParams, GetUserBattlesParams } from "@workspace/api-zod";
import { getRank } from "../lib/elo";

const router: IRouter = Router();

router.get("/users/:username", async (req, res): Promise<void> => {
  const params = GetUserProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, params.data.username))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const total = user.wins + user.losses;
  const winRate = total > 0 ? Math.round((user.wins / total) * 100) / 100 : 0;

  res.json({
    id: user.id,
    username: user.username,
    rating: user.rating,
    wins: user.wins,
    losses: user.losses,
    rank: getRank(user.rating),
    solvedCount: user.solvedCount,
    createdAt: user.createdAt.toISOString(),
    winRate,
  });
});

router.get("/users/:username/submissions", async (req, res): Promise<void> => {
  const params = GetUserSubmissionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, params.data.username))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const submissions = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.userId, user.id))
    .orderBy(desc(submissionsTable.createdAt))
    .limit(20);

  res.json(
    submissions.map((s) => ({
      id: s.id,
      userId: s.userId,
      problemId: s.problemId,
      battleId: s.battleId ?? null,
      language: s.language,
      code: s.code,
      verdict: s.verdict,
      executionTime: s.executionTime ?? null,
      output: s.output ?? null,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

router.get("/users/:username/battles", async (req, res): Promise<void> => {
  const params = GetUserBattlesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, params.data.username))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { or, eq: eqOp } = await import("drizzle-orm");
  const battles = await db
    .select()
    .from(battlesTable)
    .where(or(eqOp(battlesTable.player1Id, user.id), eqOp(battlesTable.player2Id, user.id)))
    .orderBy(desc(battlesTable.createdAt))
    .limit(10);

  res.json(
    battles.map((b) => ({
      id: b.id,
      inviteCode: b.inviteCode,
      player1Id: b.player1Id ?? null,
      player2Id: b.player2Id ?? null,
      player1Username: null,
      player2Username: null,
      problemId: b.problemId ?? null,
      problemTitle: null,
      status: b.status,
      winnerId: b.winnerId ?? null,
      winnerUsername: null,
      startTime: b.startTime?.toISOString() ?? null,
      endTime: b.endTime?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
    }))
  );
});

export default router;
