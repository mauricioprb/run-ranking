import { eq, sql } from "drizzle-orm";
import { db } from "@/infra/db/pool";
import { eventosWebhook } from "@/infra/db/schema";
import type {
  EventoWebhookRepository,
  DadosEventoWebhook,
  EventoWebhookReivindicado,
} from "@/core/repositories/evento-webhook.repository";

export class EventoWebhookDrizzleRepository implements EventoWebhookRepository {
  async inserir(dados: DadosEventoWebhook): Promise<{ id: number; novo: boolean }> {
    const inseridos = await db
      .insert(eventosWebhook)
      .values({
        object_type: dados.object_type,
        object_id: dados.object_id,
        aspect_type: dados.aspect_type,
        owner_id: dados.owner_id,
        event_time: dados.event_time,
        subscription_id: dados.subscription_id,
      })
      .onConflictDoNothing({
        target: [
          eventosWebhook.object_id,
          eventosWebhook.aspect_type,
          eventosWebhook.event_time,
          eventosWebhook.owner_id,
        ],
      })
      .returning({ id: eventosWebhook.id });

    if (inseridos.length > 0) {
      return { id: inseridos[0].id, novo: true };
    }

    const [existente] = await db
      .select({ id: eventosWebhook.id })
      .from(eventosWebhook)
      .where(
        sql`${eventosWebhook.object_id} = ${dados.object_id}
            AND ${eventosWebhook.aspect_type} = ${dados.aspect_type}
            AND ${eventosWebhook.event_time} = ${dados.event_time}
            AND ${eventosWebhook.owner_id} = ${dados.owner_id}`,
      )
      .limit(1);

    return { id: existente.id, novo: false };
  }

  async reivindicar(limite: number): Promise<EventoWebhookReivindicado[]> {
    const resultado = await db.execute<{
      id: string | number;
      object_type: string;
      object_id: string | number;
      aspect_type: string;
      owner_id: string | number;
      tentativas: number;
    }>(sql`
      WITH candidatos AS (
        SELECT id
        FROM eventos_webhook
        WHERE status IN ('pendente', 'falhado')
          AND processar_apos <= NOW()
        ORDER BY processar_apos ASC
        LIMIT ${limite}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE eventos_webhook AS ew
      SET status = 'processando',
          atualizado_em = NOW()
      FROM candidatos
      WHERE ew.id = candidatos.id
      RETURNING ew.id, ew.object_type, ew.object_id, ew.aspect_type, ew.owner_id, ew.tentativas
    `);

    return resultado.rows.map((row) => ({
      id: Number(row.id),
      object_type: row.object_type,
      object_id: Number(row.object_id),
      aspect_type: row.aspect_type,
      owner_id: Number(row.owner_id),
      tentativas: row.tentativas,
    }));
  }

  async marcarConcluido(id: number): Promise<void> {
    await db
      .update(eventosWebhook)
      .set({
        status: "concluido",
        atualizado_em: new Date(),
        ultimo_erro: null,
      })
      .where(eq(eventosWebhook.id, id));
  }

  async marcarFalhado(id: number, erro: string, proximaTentativaEm: Date): Promise<void> {
    await db
      .update(eventosWebhook)
      .set({
        status: "falhado",
        tentativas: sql`${eventosWebhook.tentativas} + 1`,
        ultimo_erro: erro.slice(0, 2000),
        atualizado_em: new Date(),
        processar_apos: proximaTentativaEm,
      })
      .where(eq(eventosWebhook.id, id));
  }

  async marcarFalhadoPermanente(id: number, erro: string): Promise<void> {
    await db
      .update(eventosWebhook)
      .set({
        status: "falhado_permanente",
        tentativas: sql`${eventosWebhook.tentativas} + 1`,
        ultimo_erro: erro.slice(0, 2000),
        atualizado_em: new Date(),
      })
      .where(eq(eventosWebhook.id, id));
  }
}
