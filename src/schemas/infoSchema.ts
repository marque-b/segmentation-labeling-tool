import { z } from "zod";

export const infoSchema = z.object({
  description: z.string().min(1, "Description is required"),
  // url: z.string().url("Invalid URL"),
  url: z.string().optional(),
  version: z.string().min(1, "Version is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear()),
  contributor: z.string().min(1, "Contributor name is required"),
  date_created: z.string().datetime({ message: "Invalid date format" }),
});

export type Info = z.infer<typeof infoSchema>;
