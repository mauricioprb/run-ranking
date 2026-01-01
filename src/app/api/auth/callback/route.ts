import { NextResponse } from "next/server";
import { ServicoAutenticacao } from "@/core/services/auth";

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
    await authService.loginComStrava(code);

    return NextResponse.redirect(new URL("/?success=true", request.url));
  } catch (err: any) {
    console.error("Erro no callback de auth:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
