import { useEffect } from "react";
import { Canvas, Rect } from "fabric";
import { useCOCOStore } from "@/store/useCOCOStore";

export function useFixedAnnotations(
  canvas: Canvas | null,
  selectedImageId: number | null
) {
  const { datasets } = useCOCOStore();

  useEffect(() => {
    if (!canvas || !selectedImageId) return;

    const fixedObjs = canvas
      .getObjects()
      .filter((obj: any) => obj.fixedAnnotation === true);
    fixedObjs.forEach((obj) => canvas.remove(obj));

    const dataset = datasets.find((d) =>
      d.images.some((img) => img.id === selectedImageId)
    );
    if (!dataset) return;

    const fixedAnnotations = dataset.annotations.filter(
      (ann) => ann.imageId === selectedImageId
    );

    fixedAnnotations.forEach((ann) => {
      const [x, y, w, h] = ann.bbox;
      const category = dataset.categories.find((cat) => cat.id === ann.classId);
      const strokeColor = category ? category.color : "red";

      const rect = new Rect({
        left: x,
        top: y,
        width: w,
        height: h,
        fill: "transparent",
        stroke: strokeColor,
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      (rect as any).fixedAnnotation = true;
      canvas.add(rect);
    });

    canvas.renderAll();
  }, [canvas, datasets, selectedImageId]);
}
