import { z } from "zod";

export const SchemaAtletaStrava = z.object({
  id: z.number(),
  firstname: z.string(),
  lastname: z.string(),
  profile: z.url().optional().or(z.literal("avatar/athlete/large.png")),
});

export const SchemaRespostaLoginStrava = z.object({
  token_type: z.string(),
  expires_at: z.number(),
  expires_in: z.number(),
  refresh_token: z.string(),
  access_token: z.string(),
  athlete: SchemaAtletaStrava,
});

export const SchemaRespostaRefreshStrava = z.object({
  token_type: z.string(),
  expires_at: z.number(),
  expires_in: z.number(),
  refresh_token: z.string(),
  access_token: z.string(),
});

export type AtletaStrava = z.infer<typeof SchemaAtletaStrava>;
export type RespostaLoginStrava = z.infer<typeof SchemaRespostaLoginStrava>;
export type RespostaRefreshStrava = z.infer<typeof SchemaRespostaRefreshStrava>;
