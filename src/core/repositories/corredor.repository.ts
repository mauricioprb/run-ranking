export type CorredorComAtividades = {
  strava_id: number;
  nome: string;
  url_avatar: string | null;
  atividades: {
    distancia: number;
    tempo: number | null;
    data_inicio: Date;
  }[];
};

export type DadosCorredor = {
  strava_id: number;
  nome: string;
  url_avatar?: string | null;
  token_acesso: string;
  token_atualizacao: string;
  expira_em: number;
  esta_ativo?: boolean;
};

export type TokensCorredor = {
  token_acesso: string;
  token_atualizacao: string;
  expira_em: number;
};

export interface CorredorRepository {
  buscarPorStravaId(stravaId: number): Promise<DadosCorredor | null>;
  inserir(corredor: DadosCorredor): Promise<void>;
  atualizar(stravaId: number, dados: Partial<DadosCorredor>): Promise<void>;
  listarAtivos(): Promise<DadosCorredor[]>;
  listarAtivosComAtividades(): Promise<CorredorComAtividades[]>;
  existePorStravaId(stravaId: number): Promise<boolean>;
}
