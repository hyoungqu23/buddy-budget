import { index, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { categories } from './categories';
import { holdings } from './holdings';
import { spaces } from './spaces';

export const txType = pgEnum('tx_type', ['income', 'expense', 'transfer']);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    spaceId: uuid('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    type: txType('type').notNull(),
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    memo: text('memo'),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'restrict' }),
    fromHoldingId: uuid('from_holding_id').references(() => holdings.id, { onDelete: 'restrict' }),
    toHoldingId: uuid('to_holding_id').references(() => holdings.id, { onDelete: 'restrict' }),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bySpaceOccurred: index('idx_tx_space_occurred').on(t.spaceId, t.occurredAt),
    bySpaceType: index('idx_tx_space_type').on(t.spaceId, t.type),
    bySpaceCategory: index('idx_tx_space_category').on(t.spaceId, t.categoryId),
    bySpaceFrom: index('idx_tx_space_from').on(t.spaceId, t.fromHoldingId),
    bySpaceTo: index('idx_tx_space_to').on(t.spaceId, t.toHoldingId),
  }),
);

export type Transaction = typeof transactions.$inferSelect;
