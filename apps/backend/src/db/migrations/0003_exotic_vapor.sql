CREATE TABLE IF NOT EXISTS "soberbio_lugares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"tipo_cocina" varchar(100),
	"ubicacion" varchar(255),
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"precio_estimado" numeric(15, 2),
	"fuente" varchar(30) DEFAULT 'manual',
	"fecha_visita" date,
	"calificaciones" jsonb,
	"calificacion_final" numeric(4, 2),
	"resena" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
