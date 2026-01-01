import { z } from "zod";

export const SchemaAtletaStrava = z.object({
  id: z.number(),
  firstname: z.string(),
  lastname: z.string(),
  profile: z.string().url().optional().or(z.literal("avatar/athlete/large.png")),
});

export const SchemaRespostaTokenStrava = z.object({
  token_type: z.literal("Bearer"),
  expires_at: z.number(),
  expires_in: z.number(),
  refresh_token: z.string(),
  access_token: z.string(),
  athlete: SchemaAtletaStrava,
});

export type AtletaStrava = z.infer<typeof SchemaAtletaStrava>;
export type RespostaTokenStrava = z.infer<typeof SchemaRespostaTokenStrava>;
