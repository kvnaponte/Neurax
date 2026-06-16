CREATE TABLE IF NOT EXISTS "actividades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"area" varchar(100) NOT NULL,
	"duracion_minutos" integer NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"xp_base" integer NOT NULL,
	"xp_generado" integer NOT NULL,
	"bonus_racha" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"bonus_horario" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"limite_excedido" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"descripcion" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apolo_peliculas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"year" integer,
	"movie" varchar(500) NOT NULL,
	"director" varchar(255),
	"country" varchar(255),
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alejandria_libros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"titulo" varchar(500) NOT NULL,
	"autor" varchar(255),
	"genero" varchar(100),
	"año" integer,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_inicio" date,
	"fecha_fin" date,
	"rating" numeric(3, 1),
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "michelin_recetas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(500) NOT NULL,
	"tipo_cocina" varchar(100),
	"dificultad" varchar(50),
	"tiempo_minutos" integer,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_preparacion" date,
	"rating" numeric(3, 1),
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nemesis_juegos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"titulo" varchar(500) NOT NULL,
	"plataforma" varchar(100),
	"genero" varchar(100),
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_inicio" date,
	"fecha_fin" date,
	"horas_jugadas" numeric(7, 1),
	"completado" boolean DEFAULT false NOT NULL,
	"rating" numeric(3, 1),
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "odysseia_destinos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(500) NOT NULL,
	"pais" varchar(100),
	"tipo" varchar(100),
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_visita" date,
	"rating" numeric(3, 1),
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"device_info" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"hashed_password" text NOT NULL,
	"secret_answer_hash" text,
	"secret_activated" boolean DEFAULT false NOT NULL,
	"recovery_answer_1_hash" text,
	"recovery_answer_2_hash" text,
	"xp_total" integer DEFAULT 0 NOT NULL,
	"nivel" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cronos_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"permisos" jsonb,
	"activa" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cronos_api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cronos_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"area" varchar(100),
	"inicio_at" timestamp with time zone NOT NULL,
	"fin_at" timestamp with time zone NOT NULL,
	"duracion_minutos" integer GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (fin_at - inicio_at)) / 60) STORED NOT NULL,
	"prioridad" integer DEFAULT 2 NOT NULL,
	"energia_consumida" numeric(5, 2),
	"completado" boolean DEFAULT false NOT NULL,
	"completado_at" timestamp with time zone,
	"xp_penalizacion_impuntualidad" boolean DEFAULT false NOT NULL,
	"seccion_origen" varchar(100),
	"seccion_ref_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "demeter_movimientos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"monto" numeric(15, 2) NOT NULL,
	"moneda" varchar(10) DEFAULT 'COP' NOT NULL,
	"categoria" varchar(100) NOT NULL,
	"descripcion" text,
	"metodo_pago" varchar(100),
	"es_recurrente" boolean DEFAULT false NOT NULL,
	"frecuencia_recurrente" varchar(50),
	"fecha_movimiento" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "demeter_presupuestos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"año" integer NOT NULL,
	"mes" integer NOT NULL,
	"ingreso_esperado" numeric(15, 2) NOT NULL,
	"gastos_fijos" numeric(15, 2) NOT NULL,
	"disponible" numeric(15, 2) NOT NULL,
	"categorias" jsonb,
	"fondos_especiales" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dionisio_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"url" text NOT NULL,
	"titulo" varchar(500),
	"thumbnail_url" text,
	"fuente" varchar(100),
	"categoria" varchar(100),
	"subcategoria" varchar(100),
	"nota" text,
	"estado" varchar(30) DEFAULT 'guardado' NOT NULL,
	"transcripcion" text,
	"pipeline_estado" varchar(50),
	"pipeline_error" text,
	"seccion_destino" varchar(100),
	"seccion_ref_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rachas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"fecha" date NOT NULL,
	"tiene_actividad" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"fuente" varchar(100) NOT NULL,
	"fuente_id" uuid,
	"xp_amount" integer NOT NULL,
	"xp_base" integer NOT NULL,
	"bonus_racha" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"bonus_horario" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ia_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"clasificacion_dionisio" boolean DEFAULT true NOT NULL,
	"sugerencias_logros" boolean DEFAULT true NOT NULL,
	"sugerencias_misiones" boolean DEFAULT true NOT NULL,
	CONSTRAINT "ia_config_usuario_id_unique" UNIQUE("usuario_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notificaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"mensaje" varchar(1000) NOT NULL,
	"leida" boolean DEFAULT false NOT NULL,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notificaciones_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"hora_recordatorio" time,
	"push_token" text,
	"push_type" varchar(20),
	"no_molestar_inicio" time,
	"no_molestar_fin" time,
	"toggles" jsonb,
	CONSTRAINT "notificaciones_config_usuario_id_unique" UNIQUE("usuario_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "odin_cofres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"semana_numero" integer NOT NULL,
	"xp_otorgado" integer NOT NULL,
	"abierto_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "odin_misiones_catalogo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" varchar(1000),
	"tipo" varchar(50) NOT NULL,
	"objetivo_tipo" varchar(100) NOT NULL,
	"objetivo_valor" integer NOT NULL,
	"objetivo_filtro" jsonb,
	"xp_reward" integer NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "odin_misiones_usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"catalogo_id" uuid NOT NULL,
	"periodo_tipo" varchar(50) NOT NULL,
	"periodo_inicio" date NOT NULL,
	"periodo_fin" date NOT NULL,
	"progreso" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"estado" varchar(20) DEFAULT 'activa' NOT NULL,
	"completada_at" timestamp with time zone,
	"xp_otorgado" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leonidas_ejercicios_catalogo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"grupo_muscular" varchar(100) NOT NULL,
	"descripcion" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leonidas_ejercicios_sesion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sesion_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"grupo_muscular" varchar(100) NOT NULL,
	"series" integer NOT NULL,
	"repeticiones" integer NOT NULL,
	"peso_kg" numeric(6, 2),
	"notas" text,
	"orden" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leonidas_plan_semanal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"dia_semana" smallint NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"grupos_planeados" text[] NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leonidas_sesiones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"actividad_id" uuid NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"grupos_trabajados" text[] NOT NULL,
	"duracion_minutos" integer NOT NULL,
	"intensidad" smallint NOT NULL,
	"notas" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soberbio_lugares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"tipo_cocina" varchar(100),
	"ubicacion" varchar(500),
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"precio_estimado" numeric(10, 2),
	"fuente" varchar(50) DEFAULT 'manual' NOT NULL,
	"fecha_visita" date,
	"calificaciones" jsonb,
	"calificacion_final" numeric(3, 2),
	"resena" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proeza_canciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"titulo" varchar(500) NOT NULL,
	"artista" varchar(255),
	"album" varchar(255),
	"genero" varchar(100),
	"año" integer,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"rating" numeric(3, 1),
	"notas" text,
	"fecha_descubrimiento" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proeza_exploracion_musical" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"genero" varchar(100) NOT NULL,
	"artista" varchar(255),
	"descripcion" text,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_exploracion" date,
	"rating" numeric(3, 1),
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prodigy_cursos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"titulo" varchar(500) NOT NULL,
	"plataforma" varchar(100),
	"instructor" varchar(255),
	"categoria" varchar(100),
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_inicio" date,
	"fecha_fin" date,
	"progreso" integer DEFAULT 0 NOT NULL,
	"total_horas" numeric(6, 1),
	"horas_completadas" numeric(6, 1) DEFAULT '0' NOT NULL,
	"certificado" boolean DEFAULT false NOT NULL,
	"rating" numeric(3, 1),
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prodigy_entregas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"curso_id" uuid NOT NULL,
	"cronos_evento_id" uuid,
	"titulo" varchar(500) NOT NULL,
	"descripcion" text,
	"fecha_limite" date,
	"completado" boolean DEFAULT false NOT NULL,
	"completado_at" timestamp with time zone,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kubera_productos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(500) NOT NULL,
	"categoria" varchar(100),
	"descripcion" text,
	"precio_estimado" numeric(15, 2),
	"moneda" varchar(10) DEFAULT 'COP' NOT NULL,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"url" text,
	"demeter_fondo_activo" boolean DEFAULT false NOT NULL,
	"adquirido_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actividades" ADD CONSTRAINT "actividades_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apolo_peliculas" ADD CONSTRAINT "apolo_peliculas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alejandria_libros" ADD CONSTRAINT "alejandria_libros_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "michelin_recetas" ADD CONSTRAINT "michelin_recetas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nemesis_juegos" ADD CONSTRAINT "nemesis_juegos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "odysseia_destinos" ADD CONSTRAINT "odysseia_destinos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cronos_api_keys" ADD CONSTRAINT "cronos_api_keys_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cronos_eventos" ADD CONSTRAINT "cronos_eventos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "demeter_movimientos" ADD CONSTRAINT "demeter_movimientos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "demeter_presupuestos" ADD CONSTRAINT "demeter_presupuestos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dionisio_videos" ADD CONSTRAINT "dionisio_videos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rachas" ADD CONSTRAINT "rachas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usuario_achievements" ADD CONSTRAINT "usuario_achievements_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ia_config" ADD CONSTRAINT "ia_config_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notificaciones_config" ADD CONSTRAINT "notificaciones_config_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "odin_cofres" ADD CONSTRAINT "odin_cofres_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "odin_misiones_usuario" ADD CONSTRAINT "odin_misiones_usuario_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "odin_misiones_usuario" ADD CONSTRAINT "odin_misiones_usuario_catalogo_id_odin_misiones_catalogo_id_fk" FOREIGN KEY ("catalogo_id") REFERENCES "public"."odin_misiones_catalogo"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leonidas_ejercicios_sesion" ADD CONSTRAINT "leonidas_ejercicios_sesion_sesion_id_leonidas_sesiones_id_fk" FOREIGN KEY ("sesion_id") REFERENCES "public"."leonidas_sesiones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leonidas_plan_semanal" ADD CONSTRAINT "leonidas_plan_semanal_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leonidas_sesiones" ADD CONSTRAINT "leonidas_sesiones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leonidas_sesiones" ADD CONSTRAINT "leonidas_sesiones_actividad_id_actividades_id_fk" FOREIGN KEY ("actividad_id") REFERENCES "public"."actividades"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soberbio_lugares" ADD CONSTRAINT "soberbio_lugares_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proeza_canciones" ADD CONSTRAINT "proeza_canciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proeza_exploracion_musical" ADD CONSTRAINT "proeza_exploracion_musical_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prodigy_cursos" ADD CONSTRAINT "prodigy_cursos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prodigy_entregas" ADD CONSTRAINT "prodigy_entregas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prodigy_entregas" ADD CONSTRAINT "prodigy_entregas_curso_id_prodigy_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."prodigy_cursos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prodigy_entregas" ADD CONSTRAINT "prodigy_entregas_cronos_evento_id_cronos_eventos_id_fk" FOREIGN KEY ("cronos_evento_id") REFERENCES "public"."cronos_eventos"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kubera_productos" ADD CONSTRAINT "kubera_productos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_actividades_usuario_timestamp" ON "actividades" USING btree ("usuario_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_apolo_peliculas_usuario_id" ON "apolo_peliculas" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_alejandria_libros_usuario_id" ON "alejandria_libros" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_michelin_recetas_usuario_id" ON "michelin_recetas" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_nemesis_juegos_usuario_id" ON "nemesis_juegos" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_odysseia_destinos_usuario_id" ON "odysseia_destinos" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_usuario_id" ON "refresh_tokens" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cronos_api_keys_usuario_id" ON "cronos_api_keys" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_cronos_api_keys_key_hash" ON "cronos_api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cronos_eventos_usuario_fecha" ON "cronos_eventos" USING btree ("usuario_id","inicio_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_demeter_movimientos_usuario_id" ON "demeter_movimientos" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_demeter_presupuestos_usuario_año_mes" ON "demeter_presupuestos" USING btree ("usuario_id","año","mes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dionisio_videos_usuario_id" ON "dionisio_videos" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_rachas_usuario_fecha" ON "rachas" USING btree ("usuario_id","fecha");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usuario_achievements_usuario_id" ON "usuario_achievements" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_xp_events_usuario" ON "xp_events" USING btree ("usuario_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ia_config_usuario_id" ON "ia_config" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notificaciones_usuario_id" ON "notificaciones" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_notificaciones_config_usuario_id" ON "notificaciones_config" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_odin_cofres_usuario_id" ON "odin_cofres" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_odin_misiones_usuario_activas" ON "odin_misiones_usuario" USING btree ("usuario_id","estado","periodo_fin");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_odin_misiones_usuario_catalogo_id" ON "odin_misiones_usuario" USING btree ("catalogo_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leonidas_ejercicios_sesion_id" ON "leonidas_ejercicios_sesion" USING btree ("sesion_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_leonidas_plan_semanal_usuario_dia" ON "leonidas_plan_semanal" USING btree ("usuario_id","dia_semana");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leonidas_sesiones_usuario" ON "leonidas_sesiones" USING btree ("usuario_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leonidas_sesiones_actividad_id" ON "leonidas_sesiones" USING btree ("actividad_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_soberbio_lugares_usuario_id" ON "soberbio_lugares" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_proeza_canciones_usuario_id" ON "proeza_canciones" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_proeza_exploracion_usuario_id" ON "proeza_exploracion_musical" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prodigy_cursos_usuario_id" ON "prodigy_cursos" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prodigy_entregas_curso_id" ON "prodigy_entregas" USING btree ("curso_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prodigy_entregas_cronos_id" ON "prodigy_entregas" USING btree ("cronos_evento_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kubera_productos_usuario_id" ON "kubera_productos" USING btree ("usuario_id");