CREATE TABLE IF NOT EXISTS "atividades" (
	"id" bigint PRIMARY KEY NOT NULL,
	"corredor_id" bigint,
	"distancia" double precision NOT NULL,
	"tempo" integer,
	"data_inicio" timestamp with time zone NOT NULL,
	"tipo" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corredores" (
	"strava_id" bigint PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"url_avatar" text,
	"token_acesso" text NOT NULL,
	"token_atualizacao" text NOT NULL,
	"expira_em" bigint NOT NULL,
	"esta_ativo" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eventos_webhook" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"object_type" text NOT NULL,
	"object_id" bigint NOT NULL,
	"aspect_type" text NOT NULL,
	"owner_id" bigint NOT NULL,
	"event_time" bigint NOT NULL,
	"subscription_id" bigint NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"tentativas" integer DEFAULT 0 NOT NULL,
	"ultimo_erro" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"processar_apos" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'atividades_corredor_id_corredores_strava_id_fk') THEN
        ALTER TABLE "atividades" ADD CONSTRAINT "atividades_corredor_id_corredores_strava_id_fk" FOREIGN KEY ("corredor_id") REFERENCES "public"."corredores"("strava_id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_eventos_webhook_unicos" ON "eventos_webhook" USING btree ("object_id","aspect_type","event_time","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_eventos_webhook_fila" ON "eventos_webhook" USING btree ("processar_apos");