CREATE TABLE IF NOT EXISTS "usuario_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"achievement_id" varchar(100) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"progreso" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"desbloqueado" boolean DEFAULT false NOT NULL,
	"desbloqueado_at" timestamp with time zone,
	"xp_otorgado" integer DEFAULT 0 NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" varchar(500),
	"icono" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
