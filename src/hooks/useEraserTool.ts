import { useEffect } from "react";
import { Canvas, FabricImage, PencilBrush } from "fabric";
import {
  useAnnotationStore,
  decodeRLE,
  encodeRLE,
} from "@/store/useAnnotationStore";
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

function createMaskDataURL(mask: Uint8Array, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 1) {
      data[i * 4 + 0] = 255;
      data[i * 4 + 1] = 255;
      data[i * 4 + 2] = 255;
      data[i * 4 + 3] = 255;
    } else {
      data[i * 4 + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return c.toDataURL();
}

function hideFixedAnnotations(canvas: Canvas) {
  const hidden: any[] = [];
  canvas.forEachObject((obj) => {
    const hasFixed = (obj as any).fixedAnnotation === true;
    if (hasFixed) {
      console.log("hideFixedAnnotations: Escondendo obj:", obj);
      obj.visible = false;
      hidden.push(obj);
    } else {
      console.log("hideFixedAnnotations: Objeto não fixado:", obj);
    }
  });
  canvas.renderAll();
  return hidden;
}

function restoreHiddenAnnotations(objs: any[], canvas: Canvas) {
  objs.forEach((obj) => {
    console.log("restoreHiddenAnnotations: Restaurando obj:", obj);
    obj.visible = true;
  });
  canvas.renderAll();
}

function hideAllExceptStroke(canvas: Canvas, strokeObj: any) {
  const hidden: any[] = [];
  canvas.forEachObject((obj) => {
    if (obj !== strokeObj) {
      obj.visible = false;
      hidden.push(obj);
    }
  });
  canvas.renderAll();
  return hidden;
}

function restoreHiddenObjects(objs: any[], canvas: Canvas) {
  objs.forEach((obj) => {
    obj.visible = true;
  });
  canvas.renderAll();
}

async function generateStrokeURL(canvas: Canvas, strokeObj: any) {
  const hiddenObjs = hideAllExceptStroke(canvas, strokeObj);
  const fabricCtx = canvas.getContext();
  const w = canvas.width!;
  const h = canvas.height!;
  const imageData = fabricCtx.getImageData(0, 0, w, h);
  const pixels = imageData.data;
  const binaryMask = new Uint8Array(w * h);
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha > 0) {
      binaryMask[i >> 2] = 1;
    }
  }
  restoreHiddenObjects(hiddenObjs, canvas);
  const rle = encodeRLE(binaryMask);
  console.log("Stroke RLE gerado:", rle);
  const mask = decodeRLE(rle, w, h);
  return createMaskDataURL(mask, w, h);
}

async function generateEraseRLE(canvas: Canvas): Promise<number[]> {
  const hiddenObjs = hideFixedAnnotations(canvas);

  const nonEraseObjs = canvas
    .getObjects()
    .filter((obj) => obj !== canvas.getObjects().slice(-1)[0]);
  nonEraseObjs.forEach((obj) => (obj.visible = false));

  canvas.renderAll();
  canvas.getObjects().forEach((obj: any) => {
    console.log("Objeto no canvas:", obj, "Posição:", obj.left, obj.top);
  });
  const fabricCtx = canvas.getContext();
  const w = canvas.width!;
  const h = canvas.height!;
  console.log("w: ", w);
  console.log("h: ", h);
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
    if (!canvas || !active) return;
    (async () => {
      const rle = await generateEraseRLE(canvas);
      console.log("Canvas RLE ao ativar a borracha:", rle); // RLE foto dos strokes que nao sao fixados
      const w = canvas.width!;
      const h = canvas.height!;
      const mask = decodeRLE(rle, w, h);
      const url = createMaskDataURL(mask, w, h);
      console.log("URL do mask do canvas ao ativar a borracha:", url);
    })();
  }, [canvas, active]);

  useEffect(() => {
    if (!canvas || !active || !selectedImageId) return;

    const handlePathCreated = async (e: any) => {
      console.log("Eraser path criado:", e.path);
      const strokeURL = await generateStrokeURL(canvas, e.path);
      console.log("URL do stroke da borracha:", strokeURL);

      const eraseRLE = await generateEraseRLE(canvas);
      console.log("eraseRLE gerado:", eraseRLE); // RLE foto do stroke da borracha

      annotations.forEach((ann) => {
        if (!ann.segmentation || Array.isArray(ann.segmentation)) return;

        const [h, w] = ann.segmentation.size;
        console.log(
          "Checando anotação",
          ann.id,
          "RLE:",
          ann.segmentation.counts
        );

        const maskAnn = decodeRLE(ann.segmentation.counts, w, h).map(
          (v) => 1 - v
        );
        console.log("maskAnn (bin) para anotação", ann.id, maskAnn);

        const maskErase = new Uint8Array(w * h);
        const decoded = decodeRLE(eraseRLE, w, h);

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            maskErase[y * w + x] = decoded[y * w + x];
          }
        }
        console.log("maskErase (bin) corrigido:", maskErase);
        const interMask = new Uint8Array(maskAnn.length);
        let hasOverlap = false;
        for (let i = 0; i < maskAnn.length; i++) {
          interMask[i] = ~maskAnn[i] & maskErase[i];
          if (interMask[i] === 1) hasOverlap = true;
        }
        console.log("interMask (bitwise AND):", interMask);

        console.log("Overlap detectado?", hasOverlap);

        if (hasOverlap) {
          console.log("Anotação", ann.id, "removida, overlap =", hasOverlap);
          removeAnnotationById(ann.id);

          const dataURL = createMaskDataURL(interMask, w, h);
          console.log("URL da interseção:", dataURL);

          const correctedMaskAnn = maskAnn.map((v) => 1 - v);
          const updatedMaskAnn = new Uint8Array(maskAnn.length);
          for (let i = 0; i < maskAnn.length; i++) {
            updatedMaskAnn[i] = correctedMaskAnn[i] & ~interMask[i];
          }
          console.log("updatedMaskAnn (bin):", updatedMaskAnn);

          const updatedRLE = encodeRLE(updatedMaskAnn);
          console.log("updatedMaskAnn (RLE):", updatedRLE);

          const updatedDataURL = createMaskDataURL(updatedMaskAnn, w, h);
          console.log("URL da anotação atualizada:", updatedDataURL);
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
        } else {
          console.log("Sem overlap para anotação", ann.id);
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
