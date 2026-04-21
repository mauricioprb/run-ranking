import {
  SchemaRespostaLoginStrava,
  SchemaRespostaRefreshStrava,
  type RespostaLoginStrava,
  type RespostaRefreshStrava,
} from "@/core/domain/runner";
import { SchemaAtividadeStrava, type AtividadeStrava } from "@/core/domain/activity";
import { AtividadeNaoEncontradaError, StravaApiError } from "@/core/errors";
import { env } from "@/lib/env";
import { z } from "zod";

export class StravaGateway {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl = "https://www.strava.com/api/v3";
  private readonly oauthUrl = "https://www.strava.com/oauth/token";

  constructor() {
    this.clientId = env.STRAVA_CLIENT_ID;
    this.clientSecret = env.STRAVA_CLIENT_SECRET;
  }

  async trocarCodigoPorToken(codigo: string): Promise<RespostaLoginStrava> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: codigo,
      grant_type: "authorization_code",
    });

    const resposta = await fetch(this.oauthUrl, {
      method: "POST",
      body: params,
      cache: "no-store",
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      throw new StravaApiError(`Falha ao trocar código por token: ${erro}`, resposta.status);
    }

    const dados = await resposta.json();
    return SchemaRespostaLoginStrava.parse(dados);
  }

  async atualizarToken(tokenAtualizacao: string): Promise<RespostaRefreshStrava> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: tokenAtualizacao,
      grant_type: "refresh_token",
    });

    const resposta = await fetch(this.oauthUrl, {
      method: "POST",
      body: params,
      cache: "no-store",
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      throw new StravaApiError(`Falha ao atualizar token: ${erro}`, resposta.status);
    }

    const dados = await resposta.json();
    return SchemaRespostaRefreshStrava.parse(dados);
  }

  async buscarAtividades(tokenAcesso: string, apos: number): Promise<AtividadeStrava[]> {
    let pagina = 1;
    let todasAtividades: AtividadeStrava[] = [];

    while (true) {
      const url = `${this.baseUrl}/athlete/activities?after=${apos}&per_page=200&page=${pagina}`;
      const resposta = await fetch(url, {
        headers: { Authorization: `Bearer ${tokenAcesso}` },
        cache: "no-store",
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new StravaApiError(`Falha ao buscar atividades: ${erro}`, resposta.status);
      }

      const dados = await resposta.json();
      const atividadesPagina = z.array(SchemaAtividadeStrava).parse(dados);

      if (atividadesPagina.length === 0) break;

      todasAtividades = [...todasAtividades, ...atividadesPagina];
      pagina++;
    }

    return todasAtividades;
  }

  async buscarAtividade(tokenAcesso: string, id: number): Promise<AtividadeStrava> {
    const url = `${this.baseUrl}/activities/${id}`;
    const resposta = await fetch(url, {
      headers: { Authorization: `Bearer ${tokenAcesso}` },
      cache: "no-store",
    });

    if (!resposta.ok) {
      if (resposta.status === 404) {
        throw new AtividadeNaoEncontradaError(id);
      }
      const erro = await resposta.text();
      throw new StravaApiError(`Falha ao buscar atividade: ${erro}`, resposta.status);
    }

    const dados = await resposta.json();
    return SchemaAtividadeStrava.parse(dados);
  }
}
