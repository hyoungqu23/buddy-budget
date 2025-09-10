import { index, pgEnum, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { spaces } from './spaces';

export const categoryKind = pgEnum('category_kind', ['expense', 'income']);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    spaceId: uuid('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    kind: categoryKind('kind').notNull(),
    color: varchar('color', { length: 7 }).notNull(), // #RRGGBB
    icon: varchar('icon', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bySpaceCreated: index('idx_categories_space_created').on(t.spaceId, t.createdAt),
    uniqueNameInSpace: uniqueIndex('u_categories_space_name').on(t.spaceId, t.name),
  }),
);

export type Category = typeof categories.$inferSelect;
