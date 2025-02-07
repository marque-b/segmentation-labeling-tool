import { z } from "zod";

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  supercategory: z.string().min(1, "Supercategory is required"),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid color format"),
});

export type Class = z.infer<typeof classSchema>;
