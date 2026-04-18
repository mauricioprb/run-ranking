import { z } from "zod";

export const SchemaEventoWebhook = z.object({
  object_type: z.enum(["activity", "athlete"]),
  object_id: z.number().positive(),
  aspect_type: z.enum(["create", "update", "delete"]),
  owner_id: z.number().positive(),
  subscription_id: z.number(),
  event_time: z.number(),
});

export type EventoWebhook = z.infer<typeof SchemaEventoWebhook>;
