import { ServicoSincronizacao } from "@/core/services/sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hubMode = searchParams.get("hub.mode");
  const hubChallenge = searchParams.get("hub.challenge");
  const hubVerifyToken = searchParams.get("hub.verify_token");

  // Defina este token no seu .env ou use um valor fixo
  const verifyToken = process.env.STRAVA_VERIFY_TOKEN || "STRAVA";

  if (hubMode === "subscribe" && hubVerifyToken === verifyToken) {
    console.log("Webhook Strava verificado com sucesso!");
    return NextResponse.json({ "hub.challenge": hubChallenge });
  }

  return new NextResponse("Token de verificação inválido", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const evento = await request.json();
    console.log("Evento recebido do Strava:", evento);

    // O Strava espera uma resposta rápida (200 OK dentro de 2 segundos)
    // Então respondemos primeiro e processamos em "background" (dentro do possível no serverless)
    
    // NOTA: Em ambientes serverless puros (como Vercel Deployment padrão), 
    // a execução pode ser congelada após o return. 
    // O ideal seria usar uma fila (QStash, SQS) ou Vercel Functions com `waitUntil`.
    // Como estamos num ambiente controlado ou projeto menor, vamos tentar await rápido
    // ou "Fire and Forget" assumindo que o container sobreviva por alguns segundos.
    
    const service = new ServicoSincronizacao();
    
    // Vamos aguardar o processamento para garantir que rodou, 
    // torcendo para ser < 2s. Buscar 1 atividade é rápido.
    await service.processarEventoWebhook(evento);

    return NextResponse.json({ status: "processed" });
  } catch (error) {
    console.error("Erro no manipulador do webhook:", error);
    // Retornar 200 mesmo com erro para evitar retentativas infinitas do Strava 
    // se for um erro de lógica nosso. Se for timeout, o Strava tenta de novo sozinho.
    return NextResponse.json({ status: "error_handled" });
  }
}
