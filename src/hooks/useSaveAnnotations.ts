import { useCOCOStore } from "@/store/useCOCOStore";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { toast } from "sonner";

export function useSaveAnnotations() {
  const { datasets, updateDatasetAnnotations, updateDatasetCategories } =
    useCOCOStore();
  const { selectedImageId, annotations, classes } = useAnnotationStore();

  const saveAnnotations = () => {
    if (!selectedImageId) return;

    const dataset = datasets.find((d) =>
      d.images.some((img) => img.id === selectedImageId)
    );

    if (!dataset) {
      console.error("Dataset not found for selected image");
      return;
    }

    const existingAnnotations = dataset.annotations.filter(
      (ann) => ann.image_id === selectedImageId
    );
    const existingCategories = dataset.categories;

    const annotationIdsInDataset = new Set(
      existingAnnotations.map((ann) => ann.id)
    );
    const categoryIdsInDataset = new Set(
      existingCategories.map((cls) => cls.id)
    );

    const newOrUpdatedAnnotations = annotations.filter(
      (ann) =>
        !annotationIdsInDataset.has(ann.id) ||
        JSON.stringify(existingAnnotations.find((a) => a.id === ann.id)) !==
          JSON.stringify(ann)
    );

    const newOrUpdatedCategories = classes.filter(
      (cls) =>
        !categoryIdsInDataset.has(cls.id) ||
        JSON.stringify(existingCategories.find((c) => c.id === cls.id)) !==
          JSON.stringify(cls)
    );

    if (newOrUpdatedAnnotations.length > 0) {
      const image = dataset.images.find((img) => img.id === selectedImageId);

      const formattedAnnotations = newOrUpdatedAnnotations.map((ann) => ({
        image_id: selectedImageId,
        id: ann.id,
        category_id: ann.classId,
        segmentation:
          ann.segmentation && Array.isArray(ann.segmentation)
            ? {
                counts: ann.segmentation.flat(),
                size: image ? [image.width, image.height] : [0, 0],
              }
            : ann.segmentation ?? null,
        area: ann.area,
        iscrowd: ann.iscrowd,
        bbox: ann.bbox,
      }));

      updateDatasetAnnotations(
        dataset.id,
        selectedImageId,
        formattedAnnotations
      );
    }

    if (newOrUpdatedCategories.length > 0) {
      updateDatasetCategories(dataset.id, newOrUpdatedCategories);
    }

    if (
      newOrUpdatedAnnotations.length === 0 &&
      newOrUpdatedCategories.length === 0
    ) {
      toast("No changes to save.");
    } else {
      toast("Annotations saved!");
    }
  };

  return { saveAnnotations };
}
