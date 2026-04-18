import { eq, and, isNotNull } from "drizzle-orm";
import { db } from "@/infra/db/pool";
import { corredores, atividades } from "@/infra/db/schema";
import type {
  CorredorRepository,
  DadosCorredor,
  CorredorComAtividades,
} from "@/core/repositories/corredor.repository";

export class CorredorDrizzleRepository implements CorredorRepository {
  async buscarPorStravaId(stravaId: number): Promise<DadosCorredor | null> {
    const resultado = await db
      .select()
      .from(corredores)
      .where(eq(corredores.strava_id, stravaId))
      .limit(1);

    if (resultado.length === 0) return null;

    const row = resultado[0];
    return {
      strava_id: row.strava_id,
      nome: row.nome,
      url_avatar: row.url_avatar,
      token_acesso: row.token_acesso,
      token_atualizacao: row.token_atualizacao,
      expira_em: row.expira_em,
      esta_ativo: row.esta_ativo ?? true,
    };
  }

  async inserir(corredor: DadosCorredor): Promise<void> {
    await db.insert(corredores).values({
      strava_id: corredor.strava_id,
      nome: corredor.nome,
      url_avatar: corredor.url_avatar,
      token_acesso: corredor.token_acesso,
      token_atualizacao: corredor.token_atualizacao,
      expira_em: corredor.expira_em,
      esta_ativo: corredor.esta_ativo ?? false,
    });
  }

  async atualizar(stravaId: number, dados: Partial<DadosCorredor>): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (dados.nome !== undefined) updateData.nome = dados.nome;
    if (dados.url_avatar !== undefined) updateData.url_avatar = dados.url_avatar;
    if (dados.token_acesso !== undefined) updateData.token_acesso = dados.token_acesso;
    if (dados.token_atualizacao !== undefined) updateData.token_atualizacao = dados.token_atualizacao;
    if (dados.expira_em !== undefined) updateData.expira_em = dados.expira_em;
    if (dados.esta_ativo !== undefined) updateData.esta_ativo = dados.esta_ativo;

    await db.update(corredores).set(updateData).where(eq(corredores.strava_id, stravaId));
  }

  async listarAtivos(): Promise<DadosCorredor[]> {
    const resultado = await db
      .select()
      .from(corredores)
      .where(eq(corredores.esta_ativo, true));

    return resultado.map((row) => ({
      strava_id: row.strava_id,
      nome: row.nome,
      url_avatar: row.url_avatar,
      token_acesso: row.token_acesso,
      token_atualizacao: row.token_atualizacao,
      expira_em: row.expira_em,
      esta_ativo: row.esta_ativo ?? true,
    }));
  }

  async listarAtivosComAtividades(): Promise<CorredorComAtividades[]> {
    const resultado = await db
      .select({
        strava_id: corredores.strava_id,
        nome: corredores.nome,
        url_avatar: corredores.url_avatar,
        atividade_id: atividades.id,
        distancia: atividades.distancia,
        tempo: atividades.tempo,
        data_inicio: atividades.data_inicio,
      })
      .from(corredores)
      .leftJoin(atividades, eq(corredores.strava_id, atividades.corredor_id))
      .where(and(eq(corredores.esta_ativo, true), isNotNull(corredores.url_avatar)));

    const corredoresMap = new Map<number, CorredorComAtividades>();

    for (const row of resultado) {
      if (!corredoresMap.has(row.strava_id)) {
        corredoresMap.set(row.strava_id, {
          strava_id: row.strava_id,
          nome: row.nome,
          url_avatar: row.url_avatar,
          atividades: [],
        });
      }

      if (row.atividade_id !== null && row.data_inicio !== null) {
        corredoresMap.get(row.strava_id)!.atividades.push({
          distancia: row.distancia!,
          tempo: row.tempo,
          data_inicio: row.data_inicio,
        });
      }
    }

    return Array.from(corredoresMap.values());
  }

  async existePorStravaId(stravaId: number): Promise<boolean> {
    const resultado = await db
      .select({ strava_id: corredores.strava_id })
      .from(corredores)
      .where(eq(corredores.strava_id, stravaId))
      .limit(1);

    return resultado.length > 0;
  }
}
