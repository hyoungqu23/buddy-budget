import {
  index,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { spaces } from './spaces';

export const holdingType = pgEnum('holding_type', ['bank', 'card', 'cash', 'etc']);

export const holdings = pgTable(
  'holdings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    spaceId: uuid('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    type: holdingType('type').notNull(),
    color: varchar('color', { length: 7 }).notNull(), // #RRGGBB
    currency: varchar('currency', { length: 8 }).notNull().default('KRW'),
    openingBalance: numeric('opening_balance', { precision: 18, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bySpaceCreated: index('idx_holdings_space_created').on(t.spaceId, t.createdAt),
    uniqueNameInSpace: uniqueIndex('u_holdings_space_name').on(t.spaceId, t.name),
  }),
);

export type Holding = typeof holdings.$inferSelect;
