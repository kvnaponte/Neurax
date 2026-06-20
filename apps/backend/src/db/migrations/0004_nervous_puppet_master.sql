CREATE TABLE IF NOT EXISTS "ia_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"clasificacion_dionisio" boolean DEFAULT true NOT NULL,
	"sugerencias_logros" boolean DEFAULT true NOT NULL,
	"sugerencias_misiones" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ia_config_usuario_id_unique" UNIQUE("usuario_id")
);
