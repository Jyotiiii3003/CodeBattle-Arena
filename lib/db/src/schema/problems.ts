import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const problemsTable = pgTable("problems", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(), // easy | medium | hard
  constraints: text("constraints"),
  examples: jsonb("examples").notNull().default([]),
  testCases: jsonb("test_cases").notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  starterCode: jsonb("starter_code").notNull().default({}),
  solvedBy: integer("solved_by").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProblemSchema = createInsertSchema(problemsTable).omit({
  id: true,
  solvedBy: true,
  createdAt: true,
});
export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type Problem = typeof problemsTable.$inferSelect;
