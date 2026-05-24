import { Router, type IRouter } from "express";
import { desc, ilike, sql, count } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";
import { getRank } from "../lib/elo";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page = 1, limit = 20, search } = parsed.data;
  const offset = (page - 1) * limit;

  const whereClause = search ? ilike(usersTable.username, `%${search}%`) : undefined;

  const [countResult] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(whereClause);
  const total = Number(countResult.count);

  const users = await db
    .select()
    .from(usersTable)
    .where(whereClause)
    .orderBy(desc(usersTable.rating))
    .limit(limit)
    .offset(offset);

  const entries = users.map((user, idx) => {
    const totalGames = user.wins + user.losses;
    const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) / 100 : 0;
    return {
      rank: offset + idx + 1,
      userId: user.id,
      username: user.username,
      rating: user.rating,
      wins: user.wins,
      losses: user.losses,
      winRate,
      tier: getRank(user.rating),
    };
  });

  res.json({
    entries,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/stats/overview", async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);

  const { battlesTable, submissionsTable, problemsTable } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");

  const [battleCount] = await db.select({ count: count() }).from(battlesTable);
  const [submissionCount] = await db.select({ count: count() }).from(submissionsTable);
  const [problemCount] = await db.select({ count: count() }).from(problemsTable);
  const [activeBattleCount] = await db
    .select({ count: count() })
    .from(battlesTable)
    .where(eq(battlesTable.status, "active"));

  const topPlayers = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.rating))
    .limit(5);

  const topEntries = topPlayers.map((user, idx) => {
    const totalGames = user.wins + user.losses;
    const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) / 100 : 0;
    return {
      rank: idx + 1,
      userId: user.id,
      username: user.username,
      rating: user.rating,
      wins: user.wins,
      losses: user.losses,
      winRate,
      tier: getRank(user.rating),
    };
  });

  res.json({
    totalUsers: Number(userCount.count),
    totalBattles: Number(battleCount.count),
    totalSubmissions: Number(submissionCount.count),
    totalProblems: Number(problemCount.count),
    activeBattles: Number(activeBattleCount.count),
    topPlayers: topEntries,
  });
});

export default router;
