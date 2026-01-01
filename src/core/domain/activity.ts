import { z } from "zod";

export const SchemaAtividadeStrava = z.object({
  id: z.number(),
  name: z.string(),
  distance: z.number(),
  moving_time: z.number(),
  elapsed_time: z.number(),
  total_elevation_gain: z.number(),
  type: z.string(),
  start_date: z.string().datetime(),
  start_date_local: z.string().datetime(),
  timezone: z.string(),
  utc_offset: z.number(),
  map: z
    .object({
      id: z.string(),
      summary_polyline: z.string().nullable().optional(),
      resource_state: z.number().optional(),
    })
    .optional(),
  athlete: z
    .object({
      id: z.number(),
    })
    .optional(),
});

export type AtividadeStrava = z.infer<typeof SchemaAtividadeStrava>;
