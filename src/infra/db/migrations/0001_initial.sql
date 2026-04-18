CREATE TABLE IF NOT EXISTS corredores (
  strava_id BIGINT PRIMARY KEY,
  nome TEXT NOT NULL,
  url_avatar TEXT,
  token_acesso TEXT NOT NULL,
  token_atualizacao TEXT NOT NULL,
  expira_em BIGINT NOT NULL,
  esta_ativo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS atividades (
  id BIGINT PRIMARY KEY,
  corredor_id BIGINT REFERENCES corredores(strava_id) ON DELETE CASCADE,
  distancia DOUBLE PRECISION NOT NULL,
  tempo INTEGER,
  data_inicio TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_atividades_corredor_id ON atividades(corredor_id);
CREATE INDEX IF NOT EXISTS idx_atividades_data_inicio ON atividades(data_inicio);
CREATE INDEX IF NOT EXISTS idx_corredores_esta_ativo ON corredores(esta_ativo);
