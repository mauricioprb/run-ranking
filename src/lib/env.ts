import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
  STRAVA_VERIFY_TOKEN: z.string().default("STRAVA"),
  STRAVA_SUBSCRIPTION_ID: z.string().optional(),
  CRON_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  TOKEN_ENCRYPTION_KEY: z.string().length(64),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${formatted}`);
  }

  return parsed.data;
}

export const env = validateEnv();
