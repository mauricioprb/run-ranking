CREATE TABLE IF NOT EXISTS eventos_webhook (
  id BIGSERIAL PRIMARY KEY,
  object_type TEXT NOT NULL,
  object_id BIGINT NOT NULL,
  aspect_type TEXT NOT NULL,
  owner_id BIGINT NOT NULL,
  event_time BIGINT NOT NULL,
  subscription_id BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  tentativas INTEGER NOT NULL DEFAULT 0,
  ultimo_erro TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processar_apos TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_eventos_webhook_unicos
  ON eventos_webhook (object_id, aspect_type, event_time, owner_id);

CREATE INDEX IF NOT EXISTS idx_eventos_webhook_fila
  ON eventos_webhook (processar_apos)
  WHERE status IN ('pendente', 'falhado');
