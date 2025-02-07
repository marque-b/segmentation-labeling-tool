import { useEffect } from "react";
import { Canvas, PencilBrush } from "fabric";
import { useAnnotationStore } from "@/store/useAnnotationStore";

export function useBrushTool(canvas: Canvas | null, active: boolean) {
  const { brushSize, selectedClassId, classes, saveHistory, saveMask } =
    useAnnotationStore();
  const activeClass = classes.find((cls) => cls.id === selectedClassId);
  const brushColor = activeClass ? activeClass.color : "#000000";

  useEffect(() => {
    if (!canvas) return;
    if (active) {
      if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = `${brushColor}70`;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, active, brushSize, brushColor]);

  useEffect(() => {
    if (!canvas || !active) return;

    const handlePathCreated = () => {
      saveHistory();
      const rleMask = generateRLE(canvas);
      saveMask(rleMask);
    };

    canvas.on("path:created", handlePathCreated);
    return () => {
      canvas.off("path:created", handlePathCreated);
    };
  }, [canvas, active, saveHistory, saveMask]);
}

function generateRLE(canvas: Canvas): number[] {
  const htmlCanvas = canvas.toCanvasElement();
  const ctx = htmlCanvas.getContext("2d")!;
  const width = canvas.width!;
  const height = canvas.height!;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const binaryMask = new Uint8Array(width * height);

  for (let i = 0; i < pixels.length; i += 4) {
    binaryMask[i / 4] = pixels[i + 3] > 0 ? 1 : 0;
  }

  return encodeRLE(binaryMask);
}

function encodeRLE(binaryMask: Uint8Array): number[] {
  const rle: number[] = [];
  let count = 0;
  let current = binaryMask[0];

  for (let i = 0; i < binaryMask.length; i++) {
    if (binaryMask[i] !== current) {
      rle.push(count);
      count = 1;
      current = binaryMask[i];
    } else {
      count++;
    }
  }
  rle.push(count);

  return rle;
}
