import { index, numeric, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { budgets } from './budgets';

export const budgetsHistory = pgTable(
  'budgets_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    budgetId: uuid('budget_id')
      .notNull()
      .references(() => budgets.id, { onDelete: 'cascade' }),
    prevAmount: numeric('prev_amount', { precision: 18, scale: 2 }),
    newAmount: numeric('new_amount', { precision: 18, scale: 2 }).notNull(),
    changedBy: uuid('changed_by').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byBudgetChangedAt: index('idx_budgets_history_budget_changed').on(t.budgetId, t.changedAt),
  }),
);

export type BudgetHistory = typeof budgetsHistory.$inferSelect;
