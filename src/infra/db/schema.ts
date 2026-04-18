import { pgTable, bigint, text, boolean, doublePrecision, integer, timestamp } from "drizzle-orm/pg-core";
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
