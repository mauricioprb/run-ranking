import { CorredorDrizzleRepository } from "./corredor.drizzle";
import { AtividadeDrizzleRepository } from "./atividade.drizzle";
import { EventoWebhookDrizzleRepository } from "./evento-webhook.drizzle";

export const corredorRepository = new CorredorDrizzleRepository();
export const atividadeRepository = new AtividadeDrizzleRepository();
export const eventoWebhookRepository = new EventoWebhookDrizzleRepository();
