import { SchemaRespostaTokenStrava, type RespostaTokenStrava } from "@/core/domain/runner";
import { SchemaAtividadeStrava, type AtividadeStrava } from "@/core/domain/activity";
import { z } from "zod";

export class StravaGateway {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl = "https://www.strava.com/api/v3";
  private readonly oauthUrl = "https://www.strava.com/oauth/token";

  constructor() {
    this.clientId = process.env.STRAVA_CLIENT_ID!;
    this.clientSecret = process.env.STRAVA_CLIENT_SECRET!;

    if (!this.clientId || !this.clientSecret) {
      throw new Error("Credenciais do Strava não configuradas (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET)");
    }
  }

  async trocarCodigoPorToken(codigo: string): Promise<RespostaTokenStrava> {
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
      throw new Error(`Falha ao trocar código por token no Strava: ${erro}`);
    }

    const dados = await resposta.json();
    return SchemaRespostaTokenStrava.parse(dados);
  }

  async atualizarToken(tokenAtualizacao: string): Promise<RespostaTokenStrava> {
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
      throw new Error(`Falha ao atualizar token no Strava: ${erro}`);
    }

    const dados = await resposta.json();
    
    return dados as RespostaTokenStrava; 
  }

  async buscarAtividades(tokenAcesso: string, apos: number): Promise<AtividadeStrava[]> {
    const url = `${this.baseUrl}/athlete/activities?after=${apos}&per_page=200`;
    const resposta = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokenAcesso}`,
      },
      cache: "no-store",
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      throw new Error(`Falha ao buscar atividades no Strava: ${erro}`);
    }

    const dados = await resposta.json();
    return z.array(SchemaAtividadeStrava).parse(dados);
  }
}
