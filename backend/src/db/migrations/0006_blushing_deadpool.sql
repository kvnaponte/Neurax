CREATE TABLE IF NOT EXISTS "leonidas_referencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(500) NOT NULL,
	"url_referencia" text,
	"thumbnail_url" text,
	"grupo_muscular" varchar(100),
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fuente" varchar(50) DEFAULT 'manual' NOT NULL,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leonidas_referencias" ADD CONSTRAINT "leonidas_referencias_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leonidas_referencias_usuario_id" ON "leonidas_referencias" USING btree ("usuario_id");