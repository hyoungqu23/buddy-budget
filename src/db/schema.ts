import {
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const memberRole = pgEnum("member_role", ["owner", "member"]);

export const spaces = pgTable("spaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  ownerId: uuid("owner_id").notNull(),
});

export const spaceMembers = pgTable(
  "space_members",
  {
    spaceId: uuid("space_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: memberRole("role").notNull().default("owner"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.spaceId, t.userId] }),
  })
);

export type Space = typeof spaces.$inferSelect;
export type SpaceMember = typeof spaceMembers.$inferSelect;
