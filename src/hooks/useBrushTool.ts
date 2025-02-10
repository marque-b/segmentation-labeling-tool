import { useEffect } from "react";
import { Canvas, PencilBrush } from "fabric";
import { useAnnotationStore } from "@/store/useAnnotationStore";

export function useBrushTool(canvas: Canvas | null, active: boolean) {
  const {
    brushSize,
    selectedClassId,
    classes,
    saveHistory,
    saveBrushMaskToStage,
    selectedImageId,
  } = useAnnotationStore();
  const activeClass = classes.find((cls) => cls.id === selectedClassId);
  const brushColor = activeClass ? activeClass.color : "#000000";

  useEffect(() => {
    if (!canvas) return;
    if (active && selectedClassId !== null) {
      if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = `${brushColor}70`;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, active, brushSize, brushColor, selectedClassId]);

  useEffect(() => {
    if (!canvas || !active || selectedImageId === null) return;

    const handlePathCreated = async () => {
      saveHistory();
      const rleMask = await generateRLE(canvas);
      saveBrushMaskToStage(
        rleMask,
        canvas.width!,
        canvas.height!,
        selectedImageId
      );
    };

    canvas.on("path:created", handlePathCreated);
    return () => {
      canvas.off("path:created", handlePathCreated);
    };
  }, [canvas, active, saveHistory, saveBrushMaskToStage, selectedImageId]);
}

async function generateRLE(canvas: Canvas): Promise<number[]> {
  const fixedObjects = canvas
    .getObjects()
    .filter((obj: any) => obj.fixedAnnotation === true);
  fixedObjects.forEach((obj: any) => {
    obj.visible = false;
  });
  canvas.renderAll();

  const htmlCanvas = canvas.toCanvasElement();
  const ctx = htmlCanvas.getContext("2d")!;
  const width = canvas.width!;
  const height = canvas.height!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const binaryMask = new Uint8Array(width * height);

  const activeClass = useAnnotationStore
    .getState()
    .classes.find(
      (cls) => cls.id === useAnnotationStore.getState().selectedClassId
    );
  if (!activeClass) return [];

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const targetColor = hexToRgb(activeClass.color);
  if (!targetColor) return [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const isMatchingColor =
        Math.abs(pixels[index] - targetColor.r) < 5 &&
        Math.abs(pixels[index + 1] - targetColor.g) < 5 &&
        Math.abs(pixels[index + 2] - targetColor.b) < 5 &&
        pixels[index + 3] > 0;
      binaryMask[y * width + x] = isMatchingColor ? 1 : 0;
    }
  }

  fixedObjects.forEach((obj: any) => {
    obj.visible = true;
  });
  canvas.renderAll();

  return encodeRLE(binaryMask);
}

function encodeRLE(binaryMask: Uint8Array): number[] {
  if (binaryMask.length === 0) return [];
  const rle: number[] = [];
  let count = 1;
  let current = binaryMask[0];
  for (let i = 1; i < binaryMask.length; i++) {
    if (binaryMask[i] === current) {
      count++;
    } else {
      rle.push(count);
      count = 1;
      current = binaryMask[i];
    }
  }
  rle.push(count);
  return rle;
}
