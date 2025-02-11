import { useAnnotationStore } from "@/store/useAnnotationStore";
import { z } from "zod";

export const classSchema = z
  .object({
    name: z.string().min(1, "Class name is required"),
    supercategory: z.string().min(1, "Supercategory is required"),
    color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid color format"),
  })
  .refine(
    (data) => {
      const { classes } = useAnnotationStore.getState();
      return !classes.some(
        (cls) => cls.color.toLowerCase() === data.color.toLowerCase()
      );
    },
    {
      path: ["color"],
      message: "Color must be unique",
    }
  );

export type Class = z.infer<typeof classSchema>;
