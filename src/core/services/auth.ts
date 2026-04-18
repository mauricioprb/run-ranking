import type { CorredorRepository } from "@/core/repositories/corredor.repository";
import type { StravaGateway } from "@/infra/strava/gateway";
import { CorredorNaoEncontradoError, TokenExpiradoError } from "@/core/errors";
import { encrypt, decrypt } from "@/lib/crypto";

export class ServicoAutenticacao {
  constructor(
    private corredorRepo: CorredorRepository,
    private stravaGateway: StravaGateway,
  ) {}

  async loginComStrava(codigo: string) {
    const dadosToken = await this.stravaGateway.trocarCodigoPorToken(codigo);
    const { athlete, access_token, refresh_token, expires_at } = dadosToken;

    const corredorExistente = await this.corredorRepo.buscarPorStravaId(athlete.id);

    if (corredorExistente) {
      await this.corredorRepo.atualizar(athlete.id, {
        nome: `${athlete.firstname} ${athlete.lastname}`,
        url_avatar: athlete.profile,
        token_acesso: encrypt(access_token),
        token_atualizacao: encrypt(refresh_token),
        expira_em: expires_at,
      });
    } else {
      await this.corredorRepo.inserir({
        strava_id: athlete.id,
        nome: `${athlete.firstname} ${athlete.lastname}`,
        url_avatar: athlete.profile,
        token_acesso: encrypt(access_token),
        token_atualizacao: encrypt(refresh_token),
        expira_em: expires_at,
        esta_ativo: false,
      });
    }

    return { sucesso: true, corredor: athlete, isNewUser: !corredorExistente };
  }

  async garantirTokenValido(stravaId: number): Promise<string> {
    const corredor = await this.corredorRepo.buscarPorStravaId(stravaId);

    if (!corredor) {
      throw new CorredorNaoEncontradoError(stravaId);
    }

    const agora = Math.floor(Date.now() / 1000);
    if (corredor.expira_em > agora + 300) {
      return decrypt(corredor.token_acesso);
    }

    try {
      const novosTokens = await this.stravaGateway.atualizarToken(
        decrypt(corredor.token_atualizacao),
      );

      await this.corredorRepo.atualizar(stravaId, {
        token_acesso: encrypt(novosTokens.access_token),
        token_atualizacao: encrypt(novosTokens.refresh_token),
        expira_em: novosTokens.expires_at,
      });

      return novosTokens.access_token;
    } catch (e) {
      console.error("Falha ao renovar token:", e);
      throw new TokenExpiradoError(stravaId);
    }
  }
}
