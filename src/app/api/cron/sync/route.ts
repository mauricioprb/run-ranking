import { ServicoAutenticacao } from "@/core/services/auth";
import { ServicoSincronizacao } from "@/core/services/sync";
import { StravaGateway } from "@/infra/strava/gateway";
import { corredorRepository, atividadeRepository } from "@/infra/db/repositories";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { success } = rateLimit("cron:sync", 2, 60_000);
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

    const resultado = await syncService.sincronizarTudo();

    return NextResponse.json(resultado);
  } catch (erro) {
    console.error("Erro fatal na sincronização:", erro);
    return NextResponse.json({ erro: "Erro interno na sincronização" }, { status: 500 });
  }
}
