CREATE TABLE IF NOT EXISTS "apolo_peliculas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"year" integer,
	"movie" varchar(255) NOT NULL,
	"director" varchar(255),
	"country" varchar(100),
	"producer" varchar(255),
	"distributed" varchar(255),
	"genre" varchar(100),
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_visualizacion" date,
	"rating" numeric(3, 1),
	"stars" numeric(3, 1),
	"category" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
