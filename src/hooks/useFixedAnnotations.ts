import { useEffect } from "react";
import { Canvas, Control, FabricImage, Polygon, Rect } from "fabric";
import { useCOCOStore } from "@/store/useCOCOStore";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { createMaskCanvas, cropMaskCanvas } from "@/utils/maskUtils";
import { deleteObject } from "@/utils/canvasUtils";

export function useFixedAnnotations(
  canvas: Canvas | null,
  selectedImageId: number | null
) {
  const { datasets } = useCOCOStore();
  const allowAnnotationDelete = useAnnotationStore(
    (state) => state.allowAnnotationDelete
  );

  useEffect(() => {
    if (!canvas || !selectedImageId) return;
    canvas.clear();
    const dataset = datasets.find((d: any) =>
      d.images.some((img: any) => img.id === selectedImageId)
    );
    if (!dataset) return;
    const fixedAnnotations = dataset.annotations.filter(
      (ann: any) => ann.imageId === selectedImageId
    );
    fixedAnnotations.forEach((ann: any) => {
      const category = dataset.categories.find(
        (cat: any) => cat.id === ann.classId
      );
      const strokeColor = category ? `${category.color}60` : "red";
      if (
        ann.segmentation &&
        !Array.isArray(ann.segmentation) &&
        ann.segmentation.counts
      ) {
        const fullMaskCanvas = createMaskCanvas(ann.segmentation, strokeColor);
        const croppedCanvas = cropMaskCanvas(fullMaskCanvas, ann.bbox);
        const maskImage = new FabricImage(croppedCanvas, {
          left: ann.bbox[0],
          top: ann.bbox[1],
          selectable: allowAnnotationDelete,
          evented: allowAnnotationDelete,
          stroke: strokeColor,
          strokeWidth: 2,
          strokeUniform: true,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
        }) as FabricImage & {
          fixedAnnotation?: boolean;
          annotationId?: number;
          datasetId?: string;
          imageId?: number;
        };
        maskImage.setControlsVisibility({
          tl: false,
          tr: false,
          bl: false,
          br: false,
          mt: false,
          mb: false,
          ml: false,
          mr: false,
          mtr: false,
        });
        maskImage.fixedAnnotation = true;
        maskImage.annotationId = ann.id;
        maskImage.datasetId = dataset.id;
        maskImage.imageId = ann.imageId;
        if (allowAnnotationDelete) {
          maskImage.controls.deleteControl = new Control({
            x: 0.5,
            y: -0.5,
            offsetX: 0,
            offsetY: -6,
            cursorStyle: "pointer",
            actionName: "delete",
            actionHandler: (eventData, transform) => {
              deleteObject(eventData, transform);
              return true;
            },
          });
        }
        canvas.add(maskImage);
      } else if (ann.segmentation && Array.isArray(ann.segmentation)) {
        const coords: number[] = ann.segmentation[0];
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i < coords.length; i += 2) {
          points.push({ x: coords[i], y: coords[i + 1] });
        }
        const polygon = new Polygon(points, {
          fill: `${strokeColor.replace("60", "80")}`,
          stroke: strokeColor,
          strokeWidth: 2,
          selectable: allowAnnotationDelete,
          evented: allowAnnotationDelete,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
        }) as Polygon & {
          fixedAnnotation?: boolean;
          annotationId?: number;
          datasetId?: string;
          imageId?: number;
        };
        polygon.fixedAnnotation = true;
        polygon.annotationId = ann.id;
        polygon.datasetId = dataset.id;
        polygon.imageId = ann.imageId;
        if (allowAnnotationDelete) {
          polygon.controls.deleteControl = new Control({
            x: 0.5,
            y: -0.5,
            offsetY: -16,
            cursorStyle: "pointer",
            actionName: "delete",
            actionHandler: (eventData, transform) => {
              deleteObject(eventData, transform);
              return true;
            },
          });
        }
        canvas.add(polygon);
        const [bboxX, bboxY, bboxW, bboxH] = ann.bbox;
        const bboxRect = new Rect({
          left: bboxX,
          top: bboxY,
          width: bboxW,
          height: bboxH,
          fill: "transparent",
          stroke: strokeColor,
          strokeWidth: 2,
          selectable: false,
          evented: false,
          hasBorders: false,
        }) as Rect & { fixedAnnotation?: boolean };
        bboxRect.fixedAnnotation = true;
        canvas.add(bboxRect);
      }
    });
    canvas.renderAll();
  }, [canvas, datasets, selectedImageId, allowAnnotationDelete]);
}
