import { index, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { categories } from './categories';
import { spaces } from './spaces';

export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    spaceId: uuid('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    month: text('month').notNull(), // YYYY-MM
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bySpaceMonth: index('idx_budgets_space_month').on(t.spaceId, t.month),
    uniqueCatMonth: uniqueIndex('u_budgets_space_cat_month').on(t.spaceId, t.categoryId, t.month),
  }),
);

export type Budget = typeof budgets.$inferSelect;
