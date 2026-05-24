import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { problemsTable } from "./problems";
import { battlesTable } from "./battles";

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  problemId: integer("problem_id").notNull().references(() => problemsTable.id),
  battleId: integer("battle_id").references(() => battlesTable.id),
  language: text("language").notNull(), // cpp | java | python | javascript
  code: text("code").notNull(),
  verdict: text("verdict").notNull().default("pending"), // pending | accepted | wrong_answer | runtime_error | compilation_error | time_limit_exceeded
  executionTime: real("execution_time"),
  output: text("output"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({
  id: true,
  verdict: true,
  executionTime: true,
  output: true,
  createdAt: true,
});
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
