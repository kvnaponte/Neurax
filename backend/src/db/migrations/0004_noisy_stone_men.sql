ALTER TABLE "proeza_canciones" ADD COLUMN "fecha_objetivo_lanzamiento" date;--> statement-breakpoint
ALTER TABLE "proeza_canciones" ADD COLUMN "cronos_sincronizado" boolean DEFAULT false NOT NULL;