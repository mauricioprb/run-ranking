export type DadosAtividade = {
  id: number;
  corredor_id: number;
  distancia: number;
  tempo: number | null;
  data_inicio: string;
  tipo: string;
};

export type AtividadeLocal = {
  id: number;
};

export interface AtividadeRepository {
  upsert(atividades: DadosAtividade | DadosAtividade[]): Promise<void>;
  removerPorIds(ids: string[]): Promise<void>;
  removerPorId(id: number): Promise<void>;
  listarPorCorredorDesde(corredorId: number, dataInicio: string): Promise<AtividadeLocal[]>;
}
