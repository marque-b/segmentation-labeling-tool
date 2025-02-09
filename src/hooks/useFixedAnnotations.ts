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

    // Remove os objetos fixos existentes
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
      // Procura a categoria correspondente à anotação e usa sua cor para o stroke
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
      // Marca o objeto como uma fixed annotation
      (rect as any).fixedAnnotation = true;
      canvas.add(rect);
    });

    canvas.renderAll();
  }, [canvas, datasets, selectedImageId]);
}
