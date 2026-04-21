import { pgTable, bigint, bigserial, text, boolean, doublePrecision, integer, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const corredores = pgTable("corredores", {
  strava_id: bigint("strava_id", { mode: "number" }).primaryKey(),
  nome: text("nome").notNull(),
  url_avatar: text("url_avatar"),
  token_acesso: text("token_acesso").notNull(),
  token_atualizacao: text("token_atualizacao").notNull(),
  expira_em: bigint("expira_em", { mode: "number" }).notNull(),
  esta_ativo: boolean("esta_ativo").default(true),
});

export const atividades = pgTable("atividades", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  corredor_id: bigint("corredor_id", { mode: "number" }).references(() => corredores.strava_id, { onDelete: "cascade" }),
  distancia: doublePrecision("distancia").notNull(),
  tempo: integer("tempo"),
  data_inicio: timestamp("data_inicio", { withTimezone: true }).notNull(),
  tipo: text("tipo").notNull(),
});

export const corredoresRelations = relations(corredores, ({ many }) => ({
  atividades: many(atividades),
}));

export const atividadesRelations = relations(atividades, ({ one }) => ({
  corredor: one(corredores, {
    fields: [atividades.corredor_id],
    references: [corredores.strava_id],
  }),
}));

export const eventosWebhook = pgTable(
  "eventos_webhook",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    object_type: text("object_type").notNull(),
    object_id: bigint("object_id", { mode: "number" }).notNull(),
    aspect_type: text("aspect_type").notNull(),
    owner_id: bigint("owner_id", { mode: "number" }).notNull(),
    event_time: bigint("event_time", { mode: "number" }).notNull(),
    subscription_id: bigint("subscription_id", { mode: "number" }).notNull(),
    status: text("status").notNull().default("pendente"),
    tentativas: integer("tentativas").notNull().default(0),
    ultimo_erro: text("ultimo_erro"),
    criado_em: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizado_em: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
    processar_apos: timestamp("processar_apos", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_eventos_webhook_unicos").on(
      table.object_id,
      table.aspect_type,
      table.event_time,
      table.owner_id,
    ),
    index("idx_eventos_webhook_fila").on(table.processar_apos),
  ],
);
