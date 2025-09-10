CREATE TYPE "public"."category_kind" AS ENUM('expense', 'income');--> statement-breakpoint
CREATE TYPE "public"."holding_type" AS ENUM('bank', 'card', 'cash', 'etc');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"kind" "category_kind" NOT NULL,
	"color" varchar(7) NOT NULL,
	"icon" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "holding_type" NOT NULL,
	"color" varchar(7) NOT NULL,
	"currency" varchar(8) DEFAULT 'KRW' NOT NULL,
	"opening_balance" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_categories_space_created" ON "categories" USING btree ("space_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "u_categories_space_name" ON "categories" USING btree ("space_id","name");--> statement-breakpoint
CREATE INDEX "idx_holdings_space_created" ON "holdings" USING btree ("space_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "u_holdings_space_name" ON "holdings" USING btree ("space_id","name");