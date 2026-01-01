import { ServicoSincronizacao } from "@/core/services/sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const servicoSync = new ServicoSincronizacao();
    const resultado = await servicoSync.sincronizarTudo();

    return NextResponse.json(resultado);
  } catch (erro) {
    console.error("Erro fatal na sincronização:", erro);
    return NextResponse.json({ erro: "Erro interno na sincronização" }, { status: 500 });
  }
}
