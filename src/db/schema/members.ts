import { index, pgEnum, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { spaces } from './spaces';

export const memberRole = pgEnum('member_role', ['owner', 'member']);

export const members = pgTable(
  'space_members',
  {
    spaceId: uuid('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    role: memberRole('role').notNull().default('owner'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.spaceId, t.userId] }),
    userIdx: index('space_members_user_idx').on(t.userId),
    spaceIdx: index('space_members_space_idx').on(t.spaceId),
  }),
);

export type Member = typeof members.$inferSelect;
