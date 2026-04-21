import { Pool } from "pg";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR || "/app/migrations";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        nome TEXT PRIMARY KEY,
        aplicada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const arquivos = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const { rows } = await client.query("SELECT nome FROM _migrations");
    const aplicadas = new Set(rows.map((r) => r.nome));

    let aplicou = 0;

    for (const arquivo of arquivos) {
      if (aplicadas.has(arquivo)) continue;

      const sql = readFileSync(join(MIGRATIONS_DIR, arquivo), "utf8");
      console.log(`[migrate] aplicando ${arquivo}`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (nome) VALUES ($1)", [arquivo]);
        await client.query("COMMIT");
        aplicou++;
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Falha em ${arquivo}: ${err.message}`);
      }
    }

    console.log(
      aplicou === 0
        ? "[migrate] nenhuma migração pendente"
        : `[migrate] ${aplicou} migração(ões) aplicada(s)`,
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("[migrate] falha:", e);
  process.exit(1);
});
