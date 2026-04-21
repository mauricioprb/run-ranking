import type { EventoWebhookRepository } from "@/core/repositories/evento-webhook.repository";
import type { ServicoSincronizacao } from "@/core/services/sync";

const MAX_TENTATIVAS = 5;
const BACKOFF_MS = [60_000, 300_000, 1_800_000, 7_200_000, 43_200_000];

export type ResultadoProcessamento = {
  reivindicados: number;
  sucessos: number;
  falhas: number;
  falhasPermanentes: number;
};

export class ProcessadorFilaWebhook {
  constructor(
    private eventoRepo: EventoWebhookRepository,
    private syncService: ServicoSincronizacao,
  ) {}

  async drenar(limite: number = 10): Promise<ResultadoProcessamento> {
    const eventos = await this.eventoRepo.reivindicar(limite);

    const resultado: ResultadoProcessamento = {
      reivindicados: eventos.length,
      sucessos: 0,
      falhas: 0,
      falhasPermanentes: 0,
    };

    for (const evento of eventos) {
      try {
        await this.syncService.processarEventoWebhook({
          object_type: evento.object_type,
          object_id: evento.object_id,
          aspect_type: evento.aspect_type,
          owner_id: evento.owner_id,
        });
        await this.eventoRepo.marcarConcluido(evento.id);
        resultado.sucessos++;
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        const proximaTentativa = evento.tentativas + 1;

        if (proximaTentativa >= MAX_TENTATIVAS) {
          await this.eventoRepo.marcarFalhadoPermanente(evento.id, mensagem);
          resultado.falhasPermanentes++;
          console.error(
            `Evento ${evento.id} (atividade ${evento.object_id}) em falha permanente após ${proximaTentativa} tentativas:`,
            mensagem,
          );
        } else {
          const atrasoMs = BACKOFF_MS[proximaTentativa - 1] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
          const proximaEm = new Date(Date.now() + atrasoMs);
          await this.eventoRepo.marcarFalhado(evento.id, mensagem, proximaEm);
          resultado.falhas++;
          console.warn(
            `Evento ${evento.id} (atividade ${evento.object_id}) falhou (tentativa ${proximaTentativa}), retry em ${atrasoMs}ms:`,
            mensagem,
          );
        }
      }
    }

    return resultado;
  }
}
