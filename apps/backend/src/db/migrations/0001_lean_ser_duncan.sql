CREATE TABLE IF NOT EXISTS "alejandria_libros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"autor" varchar(255),
	"genero" varchar(50),
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"paginas_totales" integer,
	"paginas_leidas" integer DEFAULT 0,
	"fecha_inicio" date,
	"fecha_fin" date,
	"cover_url" text,
	"criterio_escritura" integer,
	"criterio_trama" integer,
	"criterio_personajes" integer,
	"criterio_ritmo" integer,
	"criterio_impacto_personal" integer,
	"calificacion_final" numeric(4, 2),
	"resena" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "michelin_recetas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"tipo" varchar(20),
	"origen" varchar(100),
	"dificultad" integer,
	"tiempo_minutos" integer,
	"ingredientes" text[],
	"instrucciones" text,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"veces_cocinada" integer DEFAULT 0,
	"url_referencia" text,
	"foto_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nemesis_juegos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"plataforma" varchar(20),
	"genero" varchar(100),
	"estado" varchar(20) DEFAULT 'por_jugar' NOT NULL,
	"fecha_inicio" date,
	"fecha_completado" date,
	"horas_jugadas" numeric(6, 1),
	"precio" numeric(10, 2),
	"cover_url" text,
	"criterio_historia" integer,
	"criterio_jugabilidad" integer,
	"criterio_graficos" integer,
	"criterio_musica" integer,
	"criterio_rejugabilidad" integer,
	"criterio_dificultad" integer,
	"calificacion_final" numeric(4, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "odysseia_destinos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"pais" varchar(100),
	"categorias" text[],
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_visita" date,
	"duracion_dias" integer,
	"fotos_urls" text[],
	"calificacion" integer,
	"costo_estimado" numeric(15, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cronos_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"tipo" varchar(50),
	"area" varchar(50),
	"inicio_at" timestamp with time zone NOT NULL,
	"fin_at" timestamp with time zone NOT NULL,
	"prioridad" varchar(10) DEFAULT '2',
	"completado" boolean DEFAULT false,
	"seccion_origen" varchar(50),
	"seccion_ref_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "demeter_movimientos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"monto" numeric(15, 2) NOT NULL,
	"moneda" varchar(10) DEFAULT 'COP',
	"categoria" varchar(100),
	"descripcion" varchar(500),
	"fecha_movimiento" varchar(10) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "demeter_presupuestos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"anio" integer NOT NULL,
	"mes" integer NOT NULL,
	"ingreso_esperado" numeric(15, 2),
	"gastos_fijos" numeric(15, 2),
	"disponible" numeric(15, 2),
	"categorias" jsonb,
	"fondos_especiales" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kubera_productos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"categoria" varchar(50),
	"precio_estimado" numeric(15, 2),
	"precio_real" numeric(15, 2),
	"enlace" text,
	"estado" varchar(30) DEFAULT 'deseado' NOT NULL,
	"fecha_meta" date,
	"fecha_adquisicion" date,
	"foto_url" text,
	"notas" text,
	"demeter_fondo_activo" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prodigy_cursos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"categoria" varchar(50),
	"plataforma" varchar(100),
	"estado" varchar(20) DEFAULT 'por_empezar' NOT NULL,
	"porcentaje_completado" integer DEFAULT 0,
	"fecha_inicio" timestamp with time zone,
	"fecha_limite" timestamp with time zone,
	"horas_totales" numeric(6, 1),
	"otorga_certificado" boolean DEFAULT false,
	"calificacion" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prodigy_entregas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"curso_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"fecha_entrega" timestamp with time zone NOT NULL,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"prioridad" integer DEFAULT 2,
	"cronos_evento_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proeza_canciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"estado_pipeline" varchar(20) DEFAULT 'idea' NOT NULL,
	"beatmaker" varchar(255),
	"fecha_inicio" date,
	"fecha_objetivo_lanzamiento" date,
	"fecha_objetivo_mezcla" date,
	"links" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proeza_exploracion_musical" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"pais" varchar(100) NOT NULL,
	"ciudad" varchar(100) NOT NULL,
	"estado" varchar(20) DEFAULT 'asignado' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
