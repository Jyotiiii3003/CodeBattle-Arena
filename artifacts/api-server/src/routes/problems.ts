import { Router, type IRouter } from "express";
import { eq, ilike, sql, and, inArray } from "drizzle-orm";
import { db, problemsTable } from "@workspace/db";
import { GetProblemParams, ListProblemsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/problems", async (req, res): Promise<void> => {
  const parsed = ListProblemsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { difficulty, tag, search, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (difficulty) {
    conditions.push(eq(problemsTable.difficulty, difficulty));
  }
  if (search) {
    conditions.push(ilike(problemsTable.title, `%${search}%`));
  }
  if (tag) {
    conditions.push(sql`${problemsTable.tags} @> ARRAY[${tag}]::text[]`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(problemsTable)
    .where(whereClause);
  const total = Number(countResult.count);

  const problems = await db
    .select({
      id: problemsTable.id,
      title: problemsTable.title,
      difficulty: problemsTable.difficulty,
      tags: problemsTable.tags,
      solvedBy: problemsTable.solvedBy,
    })
    .from(problemsTable)
    .where(whereClause)
    .orderBy(problemsTable.id)
    .limit(limit)
    .offset(offset);

  res.json({
    problems,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/problems/:id", async (req, res): Promise<void> => {
  const params = GetProblemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [problem] = await db
    .select()
    .from(problemsTable)
    .where(eq(problemsTable.id, params.data.id))
    .limit(1);

  if (!problem) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }

  res.json({
    id: problem.id,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    constraints: problem.constraints ?? null,
    examples: problem.examples as Array<{ input: string; output: string; explanation?: string }>,
    tags: problem.tags,
    starterCode: problem.starterCode as Record<string, string>,
    solvedBy: problem.solvedBy,
  });
});

export default router;
