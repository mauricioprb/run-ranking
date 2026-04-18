import { ServicoAutenticacao } from "@/core/services/auth";
import { ServicoSincronizacao } from "@/core/services/sync";
import { StravaGateway } from "@/infra/strava/gateway";
import { corredorRepository, atividadeRepository } from "@/infra/db/repositories";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  if (error) {
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("strava_oauth_state")?.value;

  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }

  cookieStore.delete("strava_oauth_state");

  try {
    const stravaGateway = new StravaGateway();
    const authService = new ServicoAutenticacao(corredorRepository, stravaGateway);
    const syncService = new ServicoSincronizacao(
      corredorRepository,
      atividadeRepository,
      authService,
      stravaGateway,
    );

    const resultado = await authService.loginComStrava(code);
    await syncService.sincronizarCorredor({ strava_id: resultado.corredor.id });

    return NextResponse.redirect(new URL(`/?success=true&new=${resultado.isNewUser}`, request.url));
  } catch (err) {
    console.error("Erro no callback de auth:", err);
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }
}
