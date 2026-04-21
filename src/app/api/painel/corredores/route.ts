import { auth } from "@/lib/auth";
import { corredorRepository } from "@/infra/db/repositories";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

async function verificarAdmin() {
  const session = await auth();
  if (!session?.user) return false;

  const admins = env.ADMIN_USERS.split(",").map((e: string) => e.trim().toLowerCase());
  const emailGithub = session.user.email?.toLowerCase() || "";
  const usernameGithub = session.user.username?.toLowerCase() || "";

  return admins.includes(emailGithub) || admins.includes(usernameGithub);
}

export async function GET() {
  if (!(await verificarAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const corredores = await corredorRepository.listarTodos();

  const corredoresSeguros = corredores.map((c) => ({
    strava_id: c.strava_id,
    nome: c.nome,
    url_avatar: c.url_avatar,
    esta_ativo: c.esta_ativo,
  }));

  return NextResponse.json(corredoresSeguros);
}

export async function PATCH(request: Request) {
  if (!(await verificarAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { strava_id, esta_ativo } = body;

  if (typeof strava_id !== "number" || typeof esta_ativo !== "boolean") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await corredorRepository.atualizar(strava_id, { esta_ativo });

  return NextResponse.json({ sucesso: true });
}

export async function DELETE(request: Request) {
  if (!(await verificarAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stravaId = searchParams.get("strava_id");

  if (!stravaId) {
    return NextResponse.json({ error: "strava_id obrigatório" }, { status: 400 });
  }

  const corredor = await corredorRepository.buscarPorStravaId(Number(stravaId));
  if (!corredor) {
    return NextResponse.json({ error: "Corredor não encontrado" }, { status: 404 });
  }

  await corredorRepository.atualizar(Number(stravaId), { esta_ativo: false });

  return NextResponse.json({ sucesso: true });
}
