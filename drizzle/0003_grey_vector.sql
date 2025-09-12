CREATE TYPE "public"."tx_type" AS ENUM('income', 'expense', 'transfer');--> statement-breakpoint
CREATE TABLE "budgets_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" uuid NOT NULL,
	"prev_amount" numeric(18, 2),
	"new_amount" numeric(18, 2) NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"month" text NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" uuid NOT NULL,
	"type" "tx_type" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"memo" text,
	"category_id" uuid,
	"from_holding_id" uuid,
	"to_holding_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budgets_history" ADD CONSTRAINT "budgets_history_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_holding_id_holdings_id_fk" FOREIGN KEY ("from_holding_id") REFERENCES "public"."holdings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_holding_id_holdings_id_fk" FOREIGN KEY ("to_holding_id") REFERENCES "public"."holdings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_budgets_history_budget_changed" ON "budgets_history" USING btree ("budget_id","changed_at");--> statement-breakpoint
CREATE INDEX "idx_budgets_space_month" ON "budgets" USING btree ("space_id","month");--> statement-breakpoint
CREATE UNIQUE INDEX "u_budgets_space_cat_month" ON "budgets" USING btree ("space_id","category_id","month");--> statement-breakpoint
CREATE INDEX "idx_tx_space_occurred" ON "transactions" USING btree ("space_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_tx_space_type" ON "transactions" USING btree ("space_id","type");--> statement-breakpoint
CREATE INDEX "idx_tx_space_category" ON "transactions" USING btree ("space_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_tx_space_from" ON "transactions" USING btree ("space_id","from_holding_id");--> statement-breakpoint
CREATE INDEX "idx_tx_space_to" ON "transactions" USING btree ("space_id","to_holding_id");