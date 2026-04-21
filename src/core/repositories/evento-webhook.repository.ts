export type StatusEventoWebhook = "pendente" | "processando" | "concluido" | "falhado" | "falhado_permanente";

export type DadosEventoWebhook = {
  object_type: string;
  object_id: number;
  aspect_type: string;
  owner_id: number;
  event_time: number;
  subscription_id: number;
};

export type EventoWebhookReivindicado = {
  id: number;
  object_type: string;
  object_id: number;
  aspect_type: string;
  owner_id: number;
  tentativas: number;
};

export interface EventoWebhookRepository {
  inserir(dados: DadosEventoWebhook): Promise<{ id: number; novo: boolean }>;
  reivindicar(limite: number): Promise<EventoWebhookReivindicado[]>;
  marcarConcluido(id: number): Promise<void>;
  marcarFalhado(id: number, erro: string, proximaTentativaEm: Date): Promise<void>;
  marcarFalhadoPermanente(id: number, erro: string): Promise<void>;
}
