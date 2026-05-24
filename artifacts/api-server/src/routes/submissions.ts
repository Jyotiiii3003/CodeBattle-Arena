import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, submissionsTable, problemsTable, usersTable } from "@workspace/db";
import { SubmitCodeBody, GetSubmissionParams } from "@workspace/api-zod";
import { requireAuth, optionalAuth, type AuthRequest } from "../lib/auth";
import { executeCode } from "../lib/judge0";

const router: IRouter = Router();

router.post("/submissions", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = SubmitCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { problemId, language, code, battleId } = parsed.data;
  const userId = req.user?.userId ?? null;

  // Verify problem exists
  const [problem] = await db
    .select()
    .from(problemsTable)
    .where(eq(problemsTable.id, problemId))
    .limit(1);

  if (!problem) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }

  // Create pending submission
  const [submission] = await db
    .insert(submissionsTable)
    .values({
      userId,
      problemId,
      battleId: battleId ?? null,
      language,
      code,
      verdict: "pending",
    })
    .returning();

  // Execute code asynchronously
  const testCases = problem.testCases as Array<{ input: string; expectedOutput: string }>;
  executeCode(code, language, testCases)
    .then(async (result) => {
      await db
        .update(submissionsTable)
        .set({
          verdict: result.verdict,
          executionTime: result.executionTime ?? undefined,
          output: result.output ?? undefined,
        })
        .where(eq(submissionsTable.id, submission.id));

      // If accepted, update user stats
      if (result.verdict === "accepted" && userId) {
        await db
          .update(usersTable)
          .set({ solvedCount: db.$count(submissionsTable) })
          .where(eq(usersTable.id, userId));

        // Increment problem solved count
        await db
          .update(problemsTable)
          .set({ solvedBy: problem.solvedBy + 1 })
          .where(eq(problemsTable.id, problemId));
      }
    })
    .catch(() => {
      // Update with runtime error if execution fails
      db.update(submissionsTable)
        .set({ verdict: "runtime_error" })
        .where(eq(submissionsTable.id, submission.id));
    });

  res.status(201).json({
    id: submission.id,
    userId: submission.userId,
    problemId: submission.problemId,
    battleId: submission.battleId ?? null,
    language: submission.language,
    code: submission.code,
    verdict: submission.verdict,
    executionTime: submission.executionTime ?? null,
    output: submission.output ?? null,
    createdAt: submission.createdAt.toISOString(),
  });
});

router.get("/submissions/:id", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetSubmissionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [submission] = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.id, params.data.id))
    .limit(1);

  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  res.json({
    id: submission.id,
    userId: submission.userId,
    problemId: submission.problemId,
    battleId: submission.battleId ?? null,
    language: submission.language,
    code: submission.code,
    verdict: submission.verdict,
    executionTime: submission.executionTime ?? null,
    output: submission.output ?? null,
    createdAt: submission.createdAt.toISOString(),
  });
});

export default router;
