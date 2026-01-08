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
  distancia FLOAT NOT NULL,
  tempo INTEGER,
  data_inicio TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL
);

ALTER TABLE corredores ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública" ON corredores
  FOR SELECT
  USING (true);

CREATE POLICY "Leitura pública" ON atividades
  FOR SELECT
  USING (true);
