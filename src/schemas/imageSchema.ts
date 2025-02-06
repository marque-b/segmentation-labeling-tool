import { z } from "zod";

export const imageSchema = z.object({
  license: z.number().min(1),
  file_name: z.string().min(1, "File name is required"),
  coco_url: z.string().optional(),
  height: z.number().positive(),
  width: z.number().positive(),
  date_captured: z.string(),
  flickr_url: z.string().optional(),
});

export type Image = z.infer<typeof imageSchema>;
