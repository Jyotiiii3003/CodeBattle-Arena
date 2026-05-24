import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, battlesTable, usersTable, problemsTable } from "@workspace/db";
import { CreateBattleBody, GetBattleParams, JoinBattleBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { getBattleSocketState } from "../socket/battle-socket";

const router: IRouter = Router();

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function formatBattle(battle: typeof battlesTable.$inferSelect) {
  const player1 = battle.player1Id
    ? (await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, battle.player1Id)).limit(1))[0]
    : null;
  const player2 = battle.player2Id
    ? (await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, battle.player2Id)).limit(1))[0]
    : null;
  const problem = battle.problemId
    ? (await db.select({ title: problemsTable.title }).from(problemsTable).where(eq(problemsTable.id, battle.problemId)).limit(1))[0]
    : null;
  const winner = battle.winnerId
    ? (await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, battle.winnerId)).limit(1))[0]
    : null;

  return {
    id: battle.id,
    inviteCode: battle.inviteCode,
    player1Id: battle.player1Id ?? null,
    player2Id: battle.player2Id ?? null,
    player1Username: player1?.username ?? null,
    player2Username: player2?.username ?? null,
    problemId: battle.problemId ?? null,
    problemTitle: problem?.title ?? null,
    status: battle.status,
    winnerId: battle.winnerId ?? null,
    winnerUsername: winner?.username ?? null,
    startTime: battle.startTime?.toISOString() ?? null,
    endTime: battle.endTime?.toISOString() ?? null,
    createdAt: battle.createdAt.toISOString(),
  };
}

router.post("/battles", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateBattleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.user!.userId;
  let inviteCode = generateInviteCode();

  // ensure uniqueness
  let existing;
  do {
    inviteCode = generateInviteCode();
    [existing] = await db
      .select()
      .from(battlesTable)
      .where(eq(battlesTable.inviteCode, inviteCode))
      .limit(1);
  } while (existing);

  // Pick random problem if not specified
  let problemId = parsed.data.problemId ?? null;
  if (!problemId) {
    const [randomProblem] = await db
      .select({ id: problemsTable.id })
      .from(problemsTable)
      .orderBy(sql`RANDOM()`)
      .limit(1);
    problemId = randomProblem?.id ?? null;
  }

  const [battle] = await db
    .insert(battlesTable)
    .values({
      inviteCode,
      player1Id: userId,
      problemId,
    })
    .returning();

  res.status(201).json(await formatBattle(battle));
});

router.get("/battles/:id", async (req, res): Promise<void> => {
  const params = GetBattleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [battle] = await db
    .select()
    .from(battlesTable)
    .where(eq(battlesTable.id, params.data.id))
    .limit(1);

  if (!battle) {
    res.status(404).json({ error: "Battle not found" });
    return;
  }

  res.json(await formatBattle(battle));
});

router.post("/battles/join", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = JoinBattleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { inviteCode } = parsed.data;
  const userId = req.user!.userId;

  const [battle] = await db
    .select()
    .from(battlesTable)
    .where(eq(battlesTable.inviteCode, inviteCode.toUpperCase()))
    .limit(1);

  if (!battle) {
    res.status(404).json({ error: "Battle room not found" });
    return;
  }

  if (battle.status !== "waiting") {
    res.status(400).json({ error: "Battle already started or finished" });
    return;
  }

  if (battle.player1Id === userId) {
    res.json(await formatBattle(battle));
    return;
  }

  const [updated] = await db
    .update(battlesTable)
    .set({ player2Id: userId, status: "active", startTime: new Date() })
    .where(eq(battlesTable.id, battle.id))
    .returning();

  res.json(await formatBattle(updated));
});

export default router;
