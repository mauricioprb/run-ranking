import { CorredorDrizzleRepository } from "./corredor.drizzle";
import { AtividadeDrizzleRepository } from "./atividade.drizzle";

export const corredorRepository = new CorredorDrizzleRepository();
export const atividadeRepository = new AtividadeDrizzleRepository();
