import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const spaces = pgTable('spaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  ownerId: uuid('owner_id').notNull(),
});

export type Space = typeof spaces.$inferSelect;
