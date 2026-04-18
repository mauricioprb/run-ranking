import { eq, and, gte, inArray } from "drizzle-orm";
import { db } from "@/infra/db/pool";
import { atividades } from "@/infra/db/schema";
import type {
  AtividadeRepository,
  DadosAtividade,
  AtividadeLocal,
} from "@/core/repositories/atividade.repository";

export class AtividadeDrizzleRepository implements AtividadeRepository {
  async upsert(dados: DadosAtividade | DadosAtividade[]): Promise<void> {
    const lista = Array.isArray(dados) ? dados : [dados];

    if (lista.length === 0) return;

    await db
      .insert(atividades)
      .values(
        lista.map((a) => ({
          id: a.id,
          corredor_id: a.corredor_id,
          distancia: a.distancia,
          tempo: a.tempo,
          data_inicio: new Date(a.data_inicio),
          tipo: a.tipo,
        })),
      )
      .onConflictDoUpdate({
        target: atividades.id,
        set: {
          corredor_id: atividades.corredor_id,
          distancia: atividades.distancia,
          tempo: atividades.tempo,
          data_inicio: atividades.data_inicio,
          tipo: atividades.tipo,
        },
      });
  }

  async removerPorIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const numericIds = ids.map(Number);
    await db.delete(atividades).where(inArray(atividades.id, numericIds));
  }

  async removerPorId(id: number): Promise<void> {
    await db.delete(atividades).where(eq(atividades.id, id));
  }

  async listarPorCorredorDesde(corredorId: number, dataInicio: string): Promise<AtividadeLocal[]> {
    const resultado = await db
      .select({ id: atividades.id })
      .from(atividades)
      .where(
        and(
          eq(atividades.corredor_id, corredorId),
          gte(atividades.data_inicio, new Date(dataInicio)),
        ),
      );

    return resultado;
  }
}
