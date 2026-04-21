import { ServicoAutenticacao } from "@/core/services/auth";
import { ServicoSincronizacao } from "@/core/services/sync";
import { ProcessadorFilaWebhook } from "@/core/services/processador-fila-webhook";
import { StravaGateway } from "@/infra/strava/gateway";
import {
  corredorRepository,
  atividadeRepository,
  eventoWebhookRepository,
} from "@/infra/db/repositories";
import { SchemaEventoWebhook } from "@/core/domain/webhook-event";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hubMode = searchParams.get("hub.mode");
  const hubChallenge = searchParams.get("hub.challenge");
  const hubVerifyToken = searchParams.get("hub.verify_token");

  if (hubMode === "subscribe" && hubVerifyToken === env.STRAVA_VERIFY_TOKEN) {
    console.log("Webhook Strava verificado com sucesso!");
    return NextResponse.json({ "hub.challenge": hubChallenge });
  }

  return new NextResponse("Token de verificação inválido", { status: 403 });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = rateLimit(`webhook:${ip}`, 100, 60_000);

  if (!success) {
    return NextResponse.json({ status: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = SchemaEventoWebhook.safeParse(body);

  if (!parsed.success) {
    console.warn("Payload de webhook inválido:", parsed.error.issues);
    return NextResponse.json({ status: "invalid_payload" }, { status: 400 });
  }

  const evento = parsed.data;

  if (env.STRAVA_SUBSCRIPTION_ID && String(evento.subscription_id) !== env.STRAVA_SUBSCRIPTION_ID) {
    console.warn("subscription_id não confere:", evento.subscription_id);
    return NextResponse.json({ status: "invalid_subscription" }, { status: 403 });
  }

  const corredorExiste = await corredorRepository.existePorStravaId(evento.owner_id);
  if (!corredorExiste) {
    return NextResponse.json({ status: "unknown_athlete" });
  }

  const { id: eventoId, novo } = await eventoWebhookRepository.inserir({
    object_type: evento.object_type,
    object_id: evento.object_id,
    aspect_type: evento.aspect_type,
    owner_id: evento.owner_id,
    event_time: evento.event_time,
    subscription_id: evento.subscription_id,
  });

  after(async () => {
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
      const resultado = await processador.drenar(5);
      if (resultado.sucessos > 0 || resultado.falhas > 0) {
        revalidatePath("/");
      }
    } catch (erro) {
      console.error("Falha ao drenar fila em background:", erro);
    }
  });

  return NextResponse.json({ status: "accepted", evento_id: eventoId, novo }, { status: 202 });
}
