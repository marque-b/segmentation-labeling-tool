import { useEffect } from "react";
import { Canvas, FabricImage, PencilBrush } from "fabric";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import { createMaskCanvas, cropMaskCanvas } from "@/utils/maskUtils";
import {
  hideFixedAnnotations,
  restoreHiddenAnnotations,
} from "@/utils/canvasUtils";
import { decodeRLE, encodeRLE } from "@/utils/rleUtils";

// ===== DISCLAIMER ==========
// The eraser tool has known issues, so these functions help inspect
// mask URLs to better understand what's going wrong.
// ============================

// function createMaskDataURL(mask: Uint8Array, w: number, h: number) {
//   const c = document.createElement("canvas");
//   c.width = w;
//   c.height = h;
//   const ctx = c.getContext("2d")!;
//   const imageData = ctx.getImageData(0, 0, w, h);
//   const data = imageData.data;

//   for (let i = 0; i < mask.length; i++) {
//     if (mask[i] === 1) {
//       data[i * 4 + 0] = 255;
//       data[i * 4 + 1] = 255;
//       data[i * 4 + 2] = 255;
//       data[i * 4 + 3] = 255;
//     } else {
//       data[i * 4 + 3] = 0;
//     }
//   }

//   ctx.putImageData(imageData, 0, 0);
//   return c.toDataURL();
// }

// function hideAllExceptStroke(canvas: Canvas, strokeObj: any) {
//   const hidden: any[] = [];
//   canvas.forEachObject((obj) => {
//     if (obj !== strokeObj) {
//       obj.visible = false;
//       hidden.push(obj);
//     }
//   });
//   canvas.renderAll();
//   return hidden;
// }

// function restoreHiddenObjects(objs: any[], canvas: Canvas) {
//   objs.forEach((obj) => {
//     obj.visible = true;
//   });
//   canvas.renderAll();
// }

// async function generateStrokeURL(canvas: Canvas, strokeObj: any) {
//   const hiddenObjs = hideAllExceptStroke(canvas, strokeObj);
//   const fabricCtx = canvas.getContext();
//   const w = canvas.width!;
//   const h = canvas.height!;
//   const imageData = fabricCtx.getImageData(0, 0, w, h);
//   const pixels = imageData.data;
//   const binaryMask = new Uint8Array(w * h);
//   for (let i = 0; i < pixels.length; i += 4) {
//     const alpha = pixels[i + 3];
//     if (alpha > 0) {
//       binaryMask[i >> 2] = 1;
//     }
//   }
//   restoreHiddenObjects(hiddenObjs, canvas);
//   const rle = encodeRLE(binaryMask);
//   const mask = decodeRLE(rle, w, h);
//   return createMaskDataURL(mask, w, h);
// }

async function generateEraseRLE(canvas: Canvas): Promise<number[]> {
  const hiddenObjs = hideFixedAnnotations(canvas);

  const nonEraseObjs = canvas
    .getObjects()
    .filter((obj) => obj !== canvas.getObjects().slice(-1)[0]);
  nonEraseObjs.forEach((obj) => (obj.visible = false));

  canvas.renderAll();

  const fabricCtx = canvas.getContext();
  const w = canvas.width!;
  const h = canvas.height!;
  const imageData = fabricCtx.getImageData(
    canvas.viewportTransform[4],
    canvas.viewportTransform[5],
    w,
    h
  );
  const pixels = imageData.data;
  const binaryMask = new Uint8Array(w * h);

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha > 0) {
      binaryMask[i >> 2] = 1;
    }
  }

  restoreHiddenAnnotations(hiddenObjs, canvas);

  return encodeRLE(binaryMask);
}

export function useEraserTool(canvas: Canvas | null, active: boolean) {
  const {
    brushSize,
    selectedImageId,
    annotations,
    saveBrushMaskToStage,
    removeAnnotationById,
  } = useAnnotationStore();

  useEffect(() => {
    if (!canvas) return;

    if (active) {
      canvas.isDrawingMode = true;
      if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = "#ffffff";
      canvas.skipTargetFind = true;
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    } else {
      canvas.isDrawingMode = false;
      canvas.skipTargetFind = false;
      canvas.selection = true;
    }
  }, [canvas, active, brushSize]);

  useEffect(() => {
    if (!canvas || !active || !selectedImageId) return;

    const handlePathCreated = async (e: any) => {
      const eraseRLE = await generateEraseRLE(canvas);
      annotations.forEach((ann) => {
        if (!ann.segmentation || Array.isArray(ann.segmentation)) return;
        const [h, w] = ann.segmentation.size;
        const maskAnn = decodeRLE(ann.segmentation.counts, w, h).map(
          (v) => 1 - v
        );

        const maskErase = new Uint8Array(w * h);
        const decoded = decodeRLE(eraseRLE, w, h);

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            maskErase[y * w + x] = decoded[y * w + x];
          }
        }
        const interMask = new Uint8Array(maskAnn.length);
        let hasOverlap = false;
        for (let i = 0; i < maskAnn.length; i++) {
          interMask[i] = ~maskAnn[i] & maskErase[i];
          if (interMask[i] === 1) hasOverlap = true;
        }
        if (hasOverlap) {
          removeAnnotationById(ann.id);
          const correctedMaskAnn = maskAnn.map((v) => 1 - v);
          const updatedMaskAnn = new Uint8Array(maskAnn.length);
          for (let i = 0; i < maskAnn.length; i++) {
            updatedMaskAnn[i] = correctedMaskAnn[i] & ~interMask[i];
          }
          const updatedRLE = encodeRLE(updatedMaskAnn);
          const { classes, selectedClassId } = useAnnotationStore.getState();
          const category = classes.find((cat) => cat.id === selectedClassId);
          const strokeColor = category ? `${category.color}60` : "red";

          canvas.getObjects().forEach((obj: any) => {
            if (obj.fixedAnnotation) {
              canvas.remove(obj);
            }
          });
          const fullMaskCanvas = createMaskCanvas(
            { counts: updatedRLE, size: [h, w] },
            strokeColor
          );
          const croppedCanvas = cropMaskCanvas(fullMaskCanvas, ann.bbox);
          const maskImage = new FabricImage(croppedCanvas, {
            left: ann.bbox[0],
            top: ann.bbox[1],
            selectable: true,
            evented: true,
            color: strokeColor,
            hasBorders: false,
            lockMovementX: true,
            lockMovementY: true,
          });

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

          canvas.add(maskImage);
          canvas.renderAll();
          removeAnnotationById(ann.id);

          saveBrushMaskToStage(updatedRLE, w, h, ann.imageId);
        }
      });
      canvas.remove(e.path);
      canvas.renderAll();
    };

    canvas.on("path:created", handlePathCreated);
    return () => {
      canvas.off("path:created", handlePathCreated);
    };
  }, [canvas, active, selectedImageId, annotations]);

  return null;
}
