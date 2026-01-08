import { ServicoSincronizacao } from "@/core/services/sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hubMode = searchParams.get("hub.mode");
  const hubChallenge = searchParams.get("hub.challenge");
  const hubVerifyToken = searchParams.get("hub.verify_token");

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

    const service = new ServicoSincronizacao();

    await service.processarEventoWebhook(evento);

    return NextResponse.json({ status: "processed" });
  } catch (error) {
    console.error("Erro no manipulador do webhook:", error);

    return NextResponse.json({ status: "error_handled" });
  }
}
