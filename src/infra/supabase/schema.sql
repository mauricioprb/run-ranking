-- Criar tabela de corredores
CREATE TABLE IF NOT EXISTS corredores (
  strava_id BIGINT PRIMARY KEY,
  nome TEXT NOT NULL,
  url_avatar TEXT,
  token_acesso TEXT NOT NULL,
  token_atualizacao TEXT NOT NULL,
  expira_em BIGINT NOT NULL,
  esta_ativo BOOLEAN DEFAULT true
);

-- Criar tabela de atividades
CREATE TABLE IF NOT EXISTS atividades (
  id BIGINT PRIMARY KEY,
  corredor_id BIGINT REFERENCES corredores(strava_id) ON DELETE CASCADE,
  distancia FLOAT NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE corredores ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;

-- Criar Políticas
-- Permitir leitura pública para corredores (necessário para o ranking)
CREATE POLICY "Leitura pública" ON corredores
  FOR SELECT
  USING (true);

-- Permitir leitura pública para atividades (necessário para o ranking)
CREATE POLICY "Leitura pública" ON atividades
  FOR SELECT
  USING (true);

-- Nota: Nenhuma política criada para INSERT, UPDATE ou DELETE para roles 'anon' ou 'authenticated'.
-- Isso implicitamente nega escrita para essas roles.
-- A 'service_role' (usada pelo backend) ignora RLS e pode escrever.
