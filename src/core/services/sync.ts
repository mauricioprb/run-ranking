import type { CorredorRepository } from "@/core/repositories/corredor.repository";
import type { AtividadeRepository } from "@/core/repositories/atividade.repository";
import type { ServicoAutenticacao } from "@/core/services/auth";
import type { StravaGateway } from "@/infra/strava/gateway";
import { AtividadeNaoEncontradaError } from "@/core/errors";

export class ServicoSincronizacao {
  constructor(
    private corredorRepo: CorredorRepository,
    private atividadeRepo: AtividadeRepository,
    private authService: ServicoAutenticacao,
    private stravaGateway: StravaGateway,
  ) {}

  async sincronizarTudo() {
    const corredores = await this.corredorRepo.listarAtivos();

    if (corredores.length === 0) {
      return {
        mensagem: "Nenhum corredor ativo para sincronizar",
        total: 0,
        sucessos: 0,
        falhas: 0,
      };
    }

    const resultados = await Promise.allSettled(
      corredores.map((corredor) => this.sincronizarCorredor(corredor)),
    );

    const sucessos = resultados.filter((r) => r.status === "fulfilled").length;
    const falhas = resultados.filter((r) => r.status === "rejected").length;

    return {
      mensagem: "Sincronização concluída",
      total: corredores.length,
      sucessos,
      falhas,
      detalhes: resultados.map((r, i) => ({
        corredor: corredores[i].nome,
        status: r.status,
        erro: r.status === "rejected" ? String(r.reason) : null,
      })),
    };
  }

  public async sincronizarCorredor(corredor: { strava_id: number }) {
    try {
      const tokenAcesso = await this.authService.garantirTokenValido(corredor.strava_id);

      const agora = new Date();
      const inicioDoAno = new Date(agora.getFullYear() - 5, 0, 1);
      const timestampInicioAno = Math.floor(inicioDoAno.getTime() / 1000);

      const atividades = await this.stravaGateway.buscarAtividades(tokenAcesso, timestampInicioAno);
      const corridas = atividades.filter((a) => a.type === "Run");

      if (corridas) {
        const atividadesLocais = await this.atividadeRepo.listarPorCorredorDesde(
          corredor.strava_id,
          inicioDoAno.toISOString(),
        );

        const idsStrava = new Set(corridas.map((c) => String(c.id)));
        const idsParaRemover = atividadesLocais
          .map((a) => String(a.id))
          .filter((id) => !idsStrava.has(id));

        if (idsParaRemover.length > 0) {
          console.log(
            `Removendo ${idsParaRemover.length} atividades excluídas para o corredor ${corredor.strava_id}`,
          );
          await this.atividadeRepo.removerPorIds(idsParaRemover);
        }
      }

      if (corridas.length === 0) {
        return;
      }

      const dadosUpsert = corridas.map((a) => ({
        id: a.id,
        corredor_id: corredor.strava_id,
        distancia: a.distance,
        tempo: a.moving_time,
        data_inicio: a.start_date,
        tipo: a.type,
      }));

      await this.atividadeRepo.upsert(dadosUpsert);
    } catch (erro) {
      console.error(`Erro ao sincronizar corredor ${corredor.strava_id}:`, erro);
      throw erro;
    }
  }

  async processarEventoWebhook(evento: {
    object_type: string;
    object_id: number;
    aspect_type: string;
    owner_id: number;
  }) {
    console.log("Processando evento webhook:", evento);

    if (evento.object_type !== "activity") {
      return;
    }

    const activityId = evento.object_id;
    const runnerId = evento.owner_id;

    try {
      if (evento.aspect_type === "delete") {
        await this.atividadeRepo.removerPorId(activityId);
        console.log(`Atividade ${activityId} removida via webhook`);
      } else if (evento.aspect_type === "create" || evento.aspect_type === "update") {
        await this.sincronizarAtividadeUnica(runnerId, activityId);
      }
    } catch (error) {
      console.error(`Erro ao processar webhook para atividade ${activityId}:`, error);
    }
  }

  private async sincronizarAtividadeUnica(runnerId: number, activityId: number) {
    try {
      const tokenAcesso = await this.authService.garantirTokenValido(runnerId);
      const atividade = await this.stravaGateway.buscarAtividade(tokenAcesso, activityId);

      if (atividade.type !== "Run") {
        return;
      }

      await this.atividadeRepo.upsert({
        id: atividade.id,
        corredor_id: runnerId,
        distancia: atividade.distance,
        tempo: atividade.moving_time,
        data_inicio: atividade.start_date,
        tipo: atividade.type,
      });

      console.log(`Atividade ${activityId} sincronizada com sucesso via webhook`);
    } catch (error) {
      if (error instanceof AtividadeNaoEncontradaError) {
        console.warn(`Atividade ${activityId} não encontrada no Strava. Ignorando.`);
        return;
      }
      throw error;
    }
  }
}
