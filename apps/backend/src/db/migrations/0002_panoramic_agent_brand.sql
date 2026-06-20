CREATE TABLE IF NOT EXISTS "dionisio_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"url" text NOT NULL,
	"titulo" varchar(500),
	"thumbnail_url" text,
	"fuente" varchar(50),
	"categoria" varchar(50),
	"subcategoria" varchar(100),
	"destino_sugerido" varchar(50),
	"estado" varchar(30) DEFAULT 'guardado' NOT NULL,
	"pipeline_estado" varchar(30) DEFAULT 'manual' NOT NULL,
	"pipeline_error" text,
	"seccion_destino" varchar(50),
	"seccion_ref_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
