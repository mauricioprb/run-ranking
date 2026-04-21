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

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { success } = rateLimit("cron:full-sync", 2, 60_000);
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

    const resultadoSync = await syncService.sincronizarTudo();
    const resultadoFila = await processador.drenar(200);

    revalidatePath("/");

    return NextResponse.json({ sync: resultadoSync, fila: resultadoFila });
  } catch (erro) {
    console.error("Erro fatal no full-sync:", erro);
    return NextResponse.json({ erro: "Erro interno no full-sync" }, { status: 500 });
  }
}
