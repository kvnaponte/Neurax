CREATE TABLE IF NOT EXISTS "auth_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"result" varchar(20) NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_logs" ADD CONSTRAINT "auth_logs_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auth_logs_usuario_id" ON "auth_logs" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auth_logs_created_at" ON "auth_logs" USING btree ("created_at");