import { StravaGateway } from "@/infra/strava/gateway";
import { criarClienteSupabase } from "@/infra/supabase/server";
import { createClient } from "@supabase/supabase-js";

export class ServicoAutenticacao {
  private stravaGateway: StravaGateway;

  constructor() {
    this.stravaGateway = new StravaGateway();
  }

  async loginComStrava(codigo: string) {
    const dadosToken = await this.stravaGateway.trocarCodigoPorToken(codigo);
    const { athlete, access_token, refresh_token, expires_at } = dadosToken;

    const supabaseAdmin = this.criarClienteAdmin();

    // Verifica se o corredor já existe
    const { data: corredorExistente } = await supabaseAdmin
      .from("corredores")
      .select("strava_id")
      .eq("strava_id", athlete.id)
      .single();

    if (corredorExistente) {
      // Se já existe, atualiza tokens e perfil, mantendo o status 'esta_ativo' atual
      const { error: erroUpdate } = await supabaseAdmin
        .from("corredores")
        .update({
          nome: `${athlete.firstname} ${athlete.lastname}`,
          url_avatar: athlete.profile,
          token_acesso: access_token,
          token_atualizacao: refresh_token,
          expira_em: expires_at,
        })
        .eq("strava_id", athlete.id);

      if (erroUpdate) {
        throw new Error(`Erro ao atualizar corredor: ${erroUpdate.message}`);
      }
    } else {
      // Se é novo, cria como INATIVO (aguardando aprovação)
      const { error: erroInsert } = await supabaseAdmin
        .from("corredores")
        .insert({
          strava_id: athlete.id,
          nome: `${athlete.firstname} ${athlete.lastname}`,
          url_avatar: athlete.profile,
          token_acesso: access_token,
          token_atualizacao: refresh_token,
          expira_em: expires_at,
          esta_ativo: false, // Precisa de aprovação manual
        });

      if (erroInsert) {
        throw new Error(`Erro ao cadastrar corredor: ${erroInsert.message}`);
      }
    }

    return { sucesso: true, corredor: athlete };
  }

  async garantirTokenValido(stravaId: number) {
    const supabaseAdmin = this.criarClienteAdmin();

    const { data: corredor, error } = await supabaseAdmin
      .from("corredores")
      .select("token_acesso, token_atualizacao, expira_em")
      .eq("strava_id", stravaId)
      .single();

    if (error || !corredor) {
      throw new Error("Corredor não encontrado para atualização de token");
    }

    const agora = Math.floor(Date.now() / 1000);
    if (corredor.expira_em > agora + 300) {
      return corredor.token_acesso;
    }

    try {
      const novosTokens = await this.stravaGateway.atualizarToken(corredor.token_atualizacao);

      await supabaseAdmin
        .from("corredores")
        .update({
          token_acesso: novosTokens.access_token,
          token_atualizacao: novosTokens.refresh_token,
          expira_em: novosTokens.expires_at,
        })
        .eq("strava_id", stravaId);

      return novosTokens.access_token;
    } catch (e) {
      console.error("Falha ao renovar token:", e);
      throw e;
    }
  }

  private criarClienteAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY não definida");
    }

    return createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}
