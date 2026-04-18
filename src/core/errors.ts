export class CorredorNaoEncontradoError extends Error {
  constructor(stravaId: number) {
    super(`Corredor não encontrado: ${stravaId}`);
    this.name = "CorredorNaoEncontradoError";
  }
}

export class TokenExpiradoError extends Error {
  constructor(stravaId: number) {
    super(`Falha ao renovar token para corredor: ${stravaId}`);
    this.name = "TokenExpiradoError";
  }
}

export class StravaApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "StravaApiError";
  }
}

export class AtividadeNaoEncontradaError extends Error {
  constructor(activityId: number) {
    super(`Atividade não encontrada: ${activityId}`);
    this.name = "AtividadeNaoEncontradaError";
  }
}
