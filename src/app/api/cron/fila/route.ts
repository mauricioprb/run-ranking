import { ServicoAutenticacao } from "@/core/services/auth";
import { ServicoSincronizacao } from "@/core/services/sync";
import { ProcessadorFilaWebhook } from "@/core/services/processador-fila-webhook";
import { StravaGateway } from "@/infra/strava/gateway";
import {
  corredorRepository,
  atividadeRepository,
  eventoWebhookRepository,
} from "@/infra/db/repositories";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const LIMITE_POR_EXECUCAO = 50;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { success } = rateLimit("cron:fila", 30, 60_000);
  if (!success) {
    return NextResponse.json({ erro: "Rate limit excedido" }, { status: 429 });
  }

  try {
    const stravaGateway = new StravaGateway();
    const authService = new ServicoAutenticacao(corredorRepository, stravaGateway);
    const syncService = new ServicoSincronizacao(
      corredorRepository,
      atividadeRepository,
      authService,
      stravaGateway,
    );
    const processador = new ProcessadorFilaWebhook(eventoWebhookRepository, syncService);

    const resultado = await processador.drenar(LIMITE_POR_EXECUCAO);

    if (resultado.sucessos > 0) {
      revalidatePath("/");
    }

    return NextResponse.json(resultado);
  } catch (erro) {
    console.error("Erro ao drenar fila:", erro);
    return NextResponse.json({ erro: "Erro interno ao drenar fila" }, { status: 500 });
  }
}
