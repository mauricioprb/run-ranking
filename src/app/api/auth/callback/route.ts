import { ServicoAutenticacao } from "@/core/services/auth";
import { ServicoSincronizacao } from "@/core/services/sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", request.url));
  }

  try {
    const authService = new ServicoAutenticacao();
    const resultado = await authService.loginComStrava(code);

    // Sincroniza as atividades imediatamente após o login
    const syncService = new ServicoSincronizacao();
    // Executa em background para não travar o redirect
    syncService.sincronizarCorredor({ strava_id: resultado.corredor.id }).catch(console.error);

    return NextResponse.redirect(new URL("/?success=true", request.url));
  } catch (err: any) {
    console.error("Erro no callback de auth:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(message)}`, request.url));
  }
}
