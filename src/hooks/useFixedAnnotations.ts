import { useEffect } from "react";
import { Canvas, Rect, Control, FabricImage } from "fabric";
import { useCOCOStore } from "@/store/useCOCOStore";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { createMaskCanvas } from "@/utils/maskUtils";

function cropMaskCanvas(
  sourceCanvas: HTMLCanvasElement,
  bbox: [number, number, number, number]
): HTMLCanvasElement {
  const [x, y, width, height] = bbox;
  const cropped = document.createElement("canvas");
  cropped.width = width;
  cropped.height = height;
  const ctx = cropped.getContext("2d");
  if (ctx) {
    ctx.drawImage(sourceCanvas, x, y, width, height, 0, 0, width, height);
  }
  return cropped;
}

const circleXSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="M15 9L9 15"/><path d="M9 9l6 6"/></svg>`;
let deleteIconImg: HTMLImageElement | null = null;

function getDeleteIconImg(callback: (img: HTMLImageElement) => void): void {
  if (deleteIconImg) {
    callback(deleteIconImg);
    return;
  }
  const svgBlob = new Blob([circleXSVG], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    deleteIconImg = img;
    URL.revokeObjectURL(url);
    callback(img);
  };
  img.src = url;
}

function renderDeleteIcon(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number
): void {
  getDeleteIconImg((img) => {
    const iconSize = 24;
    ctx.save();
    ctx.translate(left, top);
    ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
    ctx.restore();
  });
}

function deleteObject(_eventData: unknown, transform: any): boolean {
  const target = transform.target;
  if (target && target.canvas) {
    const annotationId = target.annotationId;
    const datasetId = target.datasetId;
    const imageId = target.imageId;
    const { updateDatasetAnnotations, datasets } = useCOCOStore.getState();
    const dataset = datasets.find((d: any) => d.id === datasetId);
    if (dataset) {
      const newAnnotations = dataset.annotations.filter(
        (ann: any) => ann.id !== annotationId
      );
      updateDatasetAnnotations(datasetId, imageId, newAnnotations);
    }
    target.canvas.remove(target);
  }
  return true;
}

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
      if (ann.segmentation && ann.segmentation.counts) {
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
              console.log("Delete control clicked", eventData, transform);
              deleteObject(eventData, transform);
              return true;
            },
            sizeX: 24,
            sizeY: 24,
            touchSizeX: 24,
            touchSizeY: 24,
          });
        }
        canvas.add(maskImage);
      } else {
        const [x, y, w, h] = ann.bbox;
        const rect = new Rect({
          left: x,
          top: y,
          width: w,
          height: h,
          fill: "transparent",
          stroke: strokeColor,
          strokeWidth: 2,
          selectable: allowAnnotationDelete,
          evented: allowAnnotationDelete,
        }) as Rect & {
          fixedAnnotation?: boolean;
          annotationId?: number;
          datasetId?: string;
          imageId?: number;
        };
        rect.fixedAnnotation = true;
        rect.annotationId = ann.id;
        rect.datasetId = dataset.id;
        rect.imageId = ann.imageId;
        if (allowAnnotationDelete) {
          rect.controls.deleteControl = new Control({
            x: 0.5,
            y: -0.5,
            offsetY: -16,
            cursorStyle: "pointer",
            mouseUpHandler: deleteObject,
            render: renderDeleteIcon,
          });
        }
        canvas.add(rect);
      }
    });
    canvas.renderAll();
  }, [canvas, datasets, selectedImageId, allowAnnotationDelete]);
}
