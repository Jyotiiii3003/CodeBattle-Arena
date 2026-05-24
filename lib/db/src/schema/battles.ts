import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { problemsTable } from "./problems";

export const battlesTable = pgTable("battles", {
  id: serial("id").primaryKey(),
  inviteCode: text("invite_code").notNull().unique(),
  player1Id: integer("player1_id").references(() => usersTable.id),
  player2Id: integer("player2_id").references(() => usersTable.id),
  problemId: integer("problem_id").references(() => problemsTable.id),
  status: text("status").notNull().default("waiting"), // waiting | active | finished
  winnerId: integer("winner_id").references(() => usersTable.id),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBattleSchema = createInsertSchema(battlesTable).omit({
  id: true,
  status: true,
  winnerId: true,
  startTime: true,
  endTime: true,
  createdAt: true,
});
export type InsertBattle = z.infer<typeof insertBattleSchema>;
export type Battle = typeof battlesTable.$inferSelect;
